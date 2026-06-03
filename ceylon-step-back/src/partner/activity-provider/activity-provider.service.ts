import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ApplyActivityProviderDto } from './dto/apply-activity-provider.dto';
import { UpdateActivityApplicationStatusDto } from './dto/update-activity-application-status.dto';
import { UpdateActivityProviderProfileDto } from './dto/update-activity-provider-profile.dto';
import { SetActivityGalleryDto } from './dto/set-activity-gallery.dto';
import { SetActivityLanguagesDto } from './dto/set-activity-languages.dto';

type ApplyFiles = {
  nicFront?: Express.Multer.File[];
  nicBack?: Express.Multer.File[];
  brdDocument?: Express.Multer.File[];
};

const INCLUDE_LIST = {
  createdByUser: { select: { id: true, email: true, name: true } },
  statusUpdatedByUser: { select: { id: true, email: true, name: true } },
} satisfies Prisma.ActivityProviderApplicationInclude;

const INCLUDE_DETAIL = {
  ...INCLUDE_LIST,
  statusHistory: {
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      updatedByUser: { select: { id: true, email: true, name: true } },
    },
  },
  activityProfile: {
    select: {
      id: true,
      isActive: true,
      adminEnabled: true,
      approvedAt: true,
      profilePhotoUrl: true,
      coverPhotoUrl: true,
      fullName: true,
      mobileNumber: true,
      whatsappAvailable: true,
      contactEmail: true,
      businessName: true,
      natureOfBusiness: true,
    },
  },
} satisfies Prisma.ActivityProviderApplicationInclude;

/** Owner-curated profile relations returned to the provider's own edit view. */
const PROFILE_INCLUDE = {
  languages: { orderBy: { language: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
} satisfies Prisma.ActivityProviderProfileInclude;

@Injectable()
export class ActivityProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async apply(dto: ApplyActivityProviderDto, files: ApplyFiles, userId: string) {
    const existing = userId
      ? await this.prisma.activityProviderApplication.findFirst({
          where: { createdBy: userId },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    if (existing) {
      if (existing.status === ApplicationStatus.PENDING) {
        throw new BadRequestException(
          'You already have an activity provider application under review.',
        );
      }
      if (existing.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException(
          'Your activity provider application has already been approved.',
        );
      }
    }

    // NIC required (either fresh upload or kept from a previous attempt).
    if (!files.nicFront?.[0] && !existing?.nicFrontUrl) {
      throw new BadRequestException('NIC front image is required.');
    }
    if (!files.nicBack?.[0] && !existing?.nicBackUrl) {
      throw new BadRequestException('NIC back image is required.');
    }

    const ts = Date.now();
    const uploadFile = async (file: Express.Multer.File, type: string) => {
      const ext = file.originalname.split('.').pop() ?? 'bin';
      const path = `activity-applications/${userId}/${ts}-${type}.${ext}`;
      const r = await this.storage.uploadFile(file, path);
      return r.url;
    };

    const nicFrontUrl = files.nicFront?.[0]
      ? await uploadFile(files.nicFront[0], 'nic-front')
      : existing!.nicFrontUrl;
    const nicBackUrl = files.nicBack?.[0]
      ? await uploadFile(files.nicBack[0], 'nic-back')
      : existing!.nicBackUrl;
    const brdDocumentUrl = files.brdDocument?.[0]
      ? await uploadFile(files.brdDocument[0], 'brd')
      : (existing?.brdDocumentUrl ?? null);

    const baseData = {
      fullName: dto.fullName,
      mobileNumber: dto.mobileNumber,
      whatsappAvailable: dto.whatsappAvailable === true,
      contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
      usesAccountEmail: dto.usesAccountEmail !== false,
      nicNumber: dto.nicNumber.trim().toUpperCase(),
      businessName: dto.businessName.trim(),
      natureOfBusiness: dto.natureOfBusiness.trim(),
      description: dto.description?.trim() || null,
      address: dto.address.trim(),
      nicFrontUrl,
      nicBackUrl,
      brdDocumentUrl,
      status: ApplicationStatus.PENDING,
      remark: null,
      updatedBy: userId,
    } as const;

    return this.prisma.$transaction(async (tx) => {
      const application = existing
        ? await tx.activityProviderApplication.update({
            where: { id: existing.id },
            data: baseData,
          })
        : await tx.activityProviderApplication.create({
            data: { ...baseData, createdBy: userId },
          });

      await tx.activityApplicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.PENDING,
          remark: existing
            ? 'Application resubmitted after rejection'
            : 'Application submitted',
          updatedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: existing
            ? 'RESUBMIT_ACTIVITY_APPLICATION'
            : 'CREATE_ACTIVITY_APPLICATION',
          userId,
        },
      });

      return application;
    });
  }

  async getCurrentByUser(userId: string) {
    return this.prisma.activityProviderApplication.findFirst({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_DETAIL,
    });
  }

  /** Owner-curated profile (created on approval). Editable from /profile/activity. */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException(
        'Activity provider profile not found. Your application must be approved first.',
      );
    }
    return profile;
  }

  /** Patch the owner-curated profile. Admin-controlled flags (adminEnabled)
   * and KYC docs are untouched here. */
  async updateMyProfile(userId: string, dto: UpdateActivityProviderProfileDto) {
    const existing = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Activity provider profile not found. Your application must be approved first.',
      );
    }

    const data: Prisma.ActivityProviderProfileUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.whatsappAvailable !== undefined)
      data.whatsappAvailable = dto.whatsappAvailable;
    if (dto.contactEmail !== undefined)
      data.contactEmail = dto.contactEmail
        ? dto.contactEmail.trim().toLowerCase()
        : null;
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.natureOfBusiness !== undefined)
      data.natureOfBusiness = dto.natureOfBusiness;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.profilePhotoUrl !== undefined)
      data.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.coverPhotoUrl !== undefined)
      data.coverPhotoUrl = dto.coverPhotoUrl;
    if (dto.businessNameColor !== undefined)
      data.businessNameColor = dto.businessNameColor;
    if (dto.displayBusinessName !== undefined)
      data.displayBusinessName = dto.displayBusinessName;
    if (dto.businessEmail !== undefined)
      data.businessEmail = dto.businessEmail
        ? dto.businessEmail.trim().toLowerCase()
        : null;
    if (dto.businessPhone !== undefined)
      data.businessPhone = dto.businessPhone
        ? dto.businessPhone.trim()
        : null;
    if (dto.businessAddress !== undefined)
      data.businessAddress = dto.businessAddress
        ? dto.businessAddress.trim()
        : null;
    if (dto.yearsOfExperience !== undefined)
      data.yearsOfExperience = dto.yearsOfExperience;
    if (dto.currency !== undefined)
      data.currency = dto.currency ? dto.currency.trim().toUpperCase() : null;
    if (dto.pricePerHour !== undefined) data.pricePerHour = dto.pricePerHour;
    if (dto.pricePerDay !== undefined) data.pricePerDay = dto.pricePerDay;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.activityProviderProfile.update({
      where: { userId },
      data,
      include: PROFILE_INCLUDE,
    });

    await this.prisma.auditLog.create({
      data: { action: 'UPDATE_ACTIVITY_PROFILE', userId },
    });

    return updated;
  }

  /** Replace the owner's spoken/service languages. Owner-scoped via userId. */
  async setLanguages(userId: string, dto: SetActivityLanguagesDto) {
    const existing = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'Activity provider profile not found. Your application must be approved first.',
      );
    }

    // Deduplicate by language name (case-insensitive); last entry wins.
    type Entry = {
      language: string;
      level: SetActivityLanguagesDto['languages'][number]['level'];
      countryCode: string | null;
    };
    const seen = new Map<string, Entry>();
    for (const entry of dto.languages) {
      const key = entry.language.trim().toLowerCase();
      if (!key) continue;
      const code = entry.countryCode
        ? entry.countryCode.trim().toUpperCase()
        : null;
      seen.set(key, {
        language: entry.language.trim(),
        level: entry.level,
        countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
      });
    }
    const entries = [...seen.values()];

    await this.prisma.$transaction([
      this.prisma.activityProviderLanguage.deleteMany({
        where: { activityProviderProfileId: existing.id },
      }),
      ...(entries.length
        ? [
            this.prisma.activityProviderLanguage.createMany({
              data: entries.map((e) => ({
                activityProviderProfileId: existing.id,
                language: e.language,
                level: e.level,
                countryCode: e.countryCode,
              })),
            }),
          ]
        : []),
      this.prisma.auditLog.create({
        data: { action: 'UPDATE_ACTIVITY_LANGUAGES', userId },
      }),
    ]);

    return this.getMyProfile(userId);
  }

  /** Replace the owner's gallery images. Owner-scoped via userId. */
  async setGallery(userId: string, dto: SetActivityGalleryDto) {
    const existing = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'Activity provider profile not found. Your application must be approved first.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.activityProviderGalleryImage.deleteMany({
        where: { activityProviderProfileId: existing.id },
      }),
      ...(dto.images.length
        ? [
            this.prisma.activityProviderGalleryImage.createMany({
              data: dto.images.map((img, index) => ({
                activityProviderProfileId: existing.id,
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: img.sortOrder ?? index,
              })),
            }),
          ]
        : []),
      this.prisma.auditLog.create({
        data: { action: 'UPDATE_ACTIVITY_GALLERY', userId },
      }),
    ]);

    return this.getMyProfile(userId);
  }

  // ── Admin endpoints ────────────────────────────────────────────────

  async findOne(id: string) {
    const app = await this.prisma.activityProviderApplication.findUnique({
      where: { id },
      include: INCLUDE_DETAIL,
    });
    if (!app) throw new NotFoundException('Activity application not found');
    return app;
  }

  async findAll() {
    return this.prisma.activityProviderApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_LIST,
    });
  }

  /** Approve / reject. Approving creates the ActivityProviderProfile and grants
   * the ACTIVITY_PROVIDER role. Rejecting requires a remark and revokes the
   * role + hides the profile if one existed. */
  async updateStatus(
    id: string,
    dto: UpdateActivityApplicationStatusDto,
    adminId: string,
  ) {
    const application = await this.prisma.activityProviderApplication.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('Activity application not found');
    }

    if (dto.status === ApplicationStatus.REJECTED && !dto.remark) {
      throw new BadRequestException(
        'A remark is required when rejecting an application.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.activityProviderApplication.update({
        where: { id },
        data: {
          status: dto.status,
          remark: dto.remark,
          statusUpdatedBy: adminId,
          updatedBy: adminId,
        },
      });

      await tx.activityApplicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: dto.status,
          remark: dto.remark,
          updatedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `UPDATE_ACTIVITY_APPLICATION_STATUS_${dto.status}`,
          userId: adminId,
        },
      });

      if (application.createdBy) {
        const role = await tx.role.upsert({
          where: { name: 'ACTIVITY_PROVIDER' },
          update: {},
          create: { name: 'ACTIVITY_PROVIDER' },
        });

        if (dto.status === ApplicationStatus.APPROVED) {
          await tx.userRole.upsert({
            where: {
              userId_roleId: { userId: application.createdBy, roleId: role.id },
            },
            update: {},
            create: { userId: application.createdBy, roleId: role.id },
          });

          await tx.activityProviderProfile.upsert({
            where: { userId: application.createdBy },
            update: {
              applicationId: updated.id,
              fullName: updated.fullName,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              contactEmail: updated.contactEmail,
              nicNumber: updated.nicNumber,
              businessName: updated.businessName,
              natureOfBusiness: updated.natureOfBusiness,
              description: updated.description,
              address: updated.address,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              brdDocumentUrl: updated.brdDocumentUrl,
              approvedAt: new Date(),
            },
            create: {
              userId: application.createdBy,
              applicationId: updated.id,
              fullName: updated.fullName,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              contactEmail: updated.contactEmail,
              nicNumber: updated.nicNumber,
              businessName: updated.businessName,
              natureOfBusiness: updated.natureOfBusiness,
              description: updated.description,
              address: updated.address,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              brdDocumentUrl: updated.brdDocumentUrl,
            },
          });
        } else {
          await tx.userRole.deleteMany({
            where: { userId: application.createdBy, roleId: role.id },
          });
          await tx.activityProviderProfile.updateMany({
            where: { userId: application.createdBy },
            data: { isActive: false },
          });
        }
      }

      return updated;
    });
  }
}
