import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ApplyGuideDto } from './dto/apply-guide.dto';
import { UpdateGuideStatusDto } from './dto/update-guide-status.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class GuideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async apply(
    dto: ApplyGuideDto,
    files: {
      nicFront?: Express.Multer.File[];
      nicBack?: Express.Multer.File[];
      guideLicenseFront?: Express.Multer.File[];
      guideLicenseBack?: Express.Multer.File[];
    },
    userId?: string, // The user submitting (if logged in)
  ) {
    const existingApplication = userId
      ? await this.prisma.guideApplication.findFirst({
          where: { createdBy: userId },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    if (existingApplication) {
      if (existingApplication.status === ApplicationStatus.PENDING) {
        throw new BadRequestException('You already have a pending guide application under review.');
      }
      if (existingApplication.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException('Your guide application has already been approved.');
      }
    }

    const timestamp = Date.now();

    const uploadFile = async (file: Express.Multer.File, type: string) => {
      const ext = file.originalname.split('.').pop();
      const path = `guide-applications/${dto.nicNumber}/${timestamp}-${type}.${ext}`;
      const result = await this.storage.uploadFile(file, path);
      return result.url;
    };

    const nicFrontUrl = files.nicFront?.[0]
      ? await uploadFile(files.nicFront[0], 'nic-front')
      : existingApplication?.nicFrontUrl;
    const nicBackUrl = files.nicBack?.[0]
      ? await uploadFile(files.nicBack[0], 'nic-back')
      : existingApplication?.nicBackUrl;

    if (!nicFrontUrl || !nicBackUrl) {
      throw new BadRequestException('NIC front and back images are required.');
    }

    let guideLicenseFrontUrl: string | null = files.guideLicenseFront?.[0]
      ? await uploadFile(files.guideLicenseFront[0], 'license-front')
      : existingApplication?.guideLicenseFrontUrl ?? null;
    let guideLicenseBackUrl: string | null = files.guideLicenseBack?.[0]
      ? await uploadFile(files.guideLicenseBack[0], 'license-back')
      : existingApplication?.guideLicenseBackUrl ?? null;

    let expiryDate: Date | null = null;
    if (dto.guideLicenseExpiryDate) {
      expiryDate = new Date(dto.guideLicenseExpiryDate);
    }

    const applicationData = {
      fullName: dto.fullName,
      displayName: dto.displayName,
      category: dto.category,
      mobileNumber: dto.mobileNumber,
      whatsappAvailable: dto.whatsappAvailable || false,
      address: dto.address,
      nicNumber: dto.nicNumber,
      registrationNo: dto.registrationNo,
      email: dto.email,
      guideLicenseExpiryDate: expiryDate ?? existingApplication?.guideLicenseExpiryDate ?? null,
      nicFrontUrl,
      nicBackUrl,
      guideLicenseFrontUrl,
      guideLicenseBackUrl,
      status: ApplicationStatus.PENDING,
      remark: null,
      updatedBy: userId,
    } as const;

    const application = existingApplication
      ? await this.prisma.guideApplication.update({
          where: { id: existingApplication.id },
          data: {
            ...applicationData,
            status: ApplicationStatus.PENDING,
            remark: null,
          },
        })
      : await this.prisma.guideApplication.create({
          data: {
            ...applicationData,
            createdBy: userId,
          },
        });

    // Create initial or resubmission status history
    await this.prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        status: ApplicationStatus.PENDING,
        remark: existingApplication ? 'Application resubmitted after rejection' : 'Application submitted',
        updatedBy: userId,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: existingApplication ? 'RESUBMIT_GUIDE_APPLICATION' : 'CREATE_GUIDE_APPLICATION',
        userId: userId,
      },
    });

    return application;
  }

  async updateStatus(id: string, dto: UpdateGuideStatusDto, adminId: string) {
    const application = await this.prisma.guideApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Guide application not found');

    if (dto.status === ApplicationStatus.REJECTED && !dto.remark) {
      throw new BadRequestException('A remark is required when rejecting an application.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.guideApplication.update({
        where: { id },
        data: {
          status: dto.status,
          remark: dto.remark,
          statusUpdatedBy: adminId,
          updatedBy: adminId,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: dto.status,
          remark: dto.remark,
          updatedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `UPDATE_GUIDE_APPLICATION_STATUS_${dto.status}`,
          userId: adminId,
        },
      });

      if (application.createdBy) {
        const guideRole = await tx.role.upsert({
          where: { name: 'GUIDE' },
          update: {},
          create: { name: 'GUIDE' },
        });

        if (dto.status === ApplicationStatus.APPROVED) {
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: application.createdBy, roleId: guideRole.id } },
            update: {},
            create: { userId: application.createdBy, roleId: guideRole.id },
          });

          // On re-approval, only refresh KYC + identity from the application.
          // Profile-only fields (profilePhotoUrl, coverPhotoUrl, bio,
          // whatsappNumber) are admin/guide-curated and must not be wiped.
          await tx.guideProfile.upsert({
            where: { userId: application.createdBy },
            update: {
              applicationId: updated.id,
              fullName: updated.fullName,
              displayName: updated.displayName,
              category: updated.category,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              address: updated.address,
              nicNumber: updated.nicNumber,
              registrationNo: updated.registrationNo,
              email: updated.email,
              guideLicenseExpiryDate: updated.guideLicenseExpiryDate,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              guideLicenseFrontUrl: updated.guideLicenseFrontUrl,
              guideLicenseBackUrl: updated.guideLicenseBackUrl,
              approvedAt: new Date(),
            },
            create: {
              userId: application.createdBy,
              applicationId: updated.id,
              fullName: updated.fullName,
              displayName: updated.displayName,
              category: updated.category,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              whatsappNumber: updated.whatsappAvailable ? updated.mobileNumber : null,
              address: updated.address,
              nicNumber: updated.nicNumber,
              registrationNo: updated.registrationNo,
              email: updated.email,
              guideLicenseExpiryDate: updated.guideLicenseExpiryDate,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              guideLicenseFrontUrl: updated.guideLicenseFrontUrl,
              guideLicenseBackUrl: updated.guideLicenseBackUrl,
              profilePhotoUrl: null,
              coverPhotoUrl: null,
              bio: null,
            },
          });
        } else {
          await tx.userRole.deleteMany({
            where: { userId: application.createdBy, roleId: guideRole.id },
          });
        }
      }

      return updated;
    });
  }

  async update(id: string, dto: ApplyGuideDto, files: any, adminId: string) {
    const existingApplication = await this.prisma.guideApplication.findUnique({ where: { id } });
    if (!existingApplication) throw new NotFoundException('Guide application not found');

    const timestamp = Date.now();
    const uploadFile = async (file: Express.Multer.File, type: string) => {
      const ext = file.originalname.split('.').pop();
      const path = `guide-applications/${dto.nicNumber}/${timestamp}-${type}.${ext}`;
      const result = await this.storage.uploadFile(file, path);
      return result.url;
    };

    const nicFrontUrl = files.nicFront?.[0]
      ? await uploadFile(files.nicFront[0], 'nic-front')
      : existingApplication.nicFrontUrl;
    const nicBackUrl = files.nicBack?.[0]
      ? await uploadFile(files.nicBack[0], 'nic-back')
      : existingApplication.nicBackUrl;

    const guideLicenseFrontUrl = files.guideLicenseFront?.[0]
      ? await uploadFile(files.guideLicenseFront[0], 'license-front')
      : existingApplication.guideLicenseFrontUrl;
    const guideLicenseBackUrl = files.guideLicenseBack?.[0]
      ? await uploadFile(files.guideLicenseBack[0], 'license-back')
      : existingApplication.guideLicenseBackUrl;

    let expiryDate: Date | null = null;
    if (dto.guideLicenseExpiryDate) {
      expiryDate = new Date(dto.guideLicenseExpiryDate);
    }

    const updated = await this.prisma.guideApplication.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        displayName: dto.displayName,
        category: dto.category,
        mobileNumber: dto.mobileNumber,
        whatsappAvailable: dto.whatsappAvailable || false,
        address: dto.address,
        nicNumber: dto.nicNumber,
        registrationNo: dto.registrationNo,
        email: dto.email,
        guideLicenseExpiryDate: expiryDate ?? existingApplication.guideLicenseExpiryDate,
        nicFrontUrl,
        nicBackUrl,
        guideLicenseFrontUrl,
        guideLicenseBackUrl,
        status: ApplicationStatus.PENDING, // Reset to pending after admin/user update
        remark: null,
        updatedBy: adminId,
      },
    });

    await this.prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        status: ApplicationStatus.PENDING,
        remark: 'Application updated and resubmitted by Admin',
        updatedBy: adminId,
      },
    });

    return updated;
  }

  async findAll() {
    return this.prisma.guideApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: { select: { id: true, email: true, name: true } },
        statusUpdatedByUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.guideApplication.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            updatedByUser: { select: { id: true, email: true, name: true } },
          },
        },
        createdByUser: { select: { id: true, email: true, name: true } },
      },
    });

    if (!application) throw new NotFoundException('Guide application not found');
    return application;
  }
  async getCurrentByUser(userId: string) {
    const application = await this.prisma.guideApplication.findFirst({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            updatedByUser: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    return application;
  }
}
