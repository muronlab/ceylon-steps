import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ApplicationStatus,
  TransportProviderType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ApplyTransportProviderDto } from './dto/apply-transport-provider.dto';
import { UpdateTransportApplicationStatusDto } from './dto/update-transport-application-status.dto';
import { UpdateTransportProviderProfileDto } from './dto/update-transport-provider-profile.dto';
import { SaveVehicleDto } from './dto/save-vehicle.dto';
import { SaveDriverServiceDto } from './dto/save-driver-service.dto';
import { SaveSafariJeepDto } from './dto/save-safari-jeep.dto';
import {
  ReviewTypeChangeRequestDto,
  SubmitTypeChangeRequestDto,
} from './dto/submit-type-change-request.dto';

type TypeChangeFiles = {
  safariJeepLicense?: Express.Multer.File[];
  brdDocument?: Express.Multer.File[];
};

type ApplyFiles = {
  nicFront?: Express.Multer.File[];
  nicBack?: Express.Multer.File[];
  brdDocument?: Express.Multer.File[];
  safariJeepLicense?: Express.Multer.File[];
};

const INCLUDE_LIST = {
  createdByUser: { select: { id: true, email: true, name: true } },
  statusUpdatedByUser: { select: { id: true, email: true, name: true } },
} satisfies Prisma.TransportProviderApplicationInclude;

const INCLUDE_DETAIL = {
  ...INCLUDE_LIST,
  statusHistory: {
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      updatedByUser: { select: { id: true, email: true, name: true } },
    },
  },
  transportProfile: {
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
      providerType: true,
      hasBusiness: true,
      businessName: true,
      businessDescription: true,
    },
  },
} satisfies Prisma.TransportProviderApplicationInclude;

@Injectable()
export class TransportProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async apply(
    dto: ApplyTransportProviderDto,
    files: ApplyFiles,
    userId: string,
  ) {
    const existing = userId
      ? await this.prisma.transportProviderApplication.findFirst({
          where: { createdBy: userId },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    if (existing) {
      if (existing.status === ApplicationStatus.PENDING) {
        throw new BadRequestException(
          'You already have a transport provider application under review.',
        );
      }
      if (existing.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException(
          'Your transport provider application has already been approved.',
        );
      }
    }

    // NIC required (either fresh upload or kept from previous attempt)
    if (!files.nicFront?.[0] && !existing?.nicFrontUrl) {
      throw new BadRequestException('NIC front image is required.');
    }
    if (!files.nicBack?.[0] && !existing?.nicBackUrl) {
      throw new BadRequestException('NIC back image is required.');
    }

    const hasBusiness = dto.hasBusiness === true;
    const providerType = dto.providerType;
    const isSafari = providerType === TransportProviderType.SAFARI_JEEP;

    if (isSafari && !files.safariJeepLicense?.[0] && !existing?.safariJeepLicenseUrl) {
      throw new BadRequestException(
        'A government-issued safari jeep licence is required.',
      );
    }

    const ts = Date.now();
    const uploadFile = async (file: Express.Multer.File, type: string) => {
      const ext = file.originalname.split('.').pop() ?? 'bin';
      const path = `transport-applications/${userId}/${ts}-${type}.${ext}`;
      const r = await this.storage.uploadFile(file, path);
      return r.url;
    };

    const nicFrontUrl = files.nicFront?.[0]
      ? await uploadFile(files.nicFront[0], 'nic-front')
      : existing!.nicFrontUrl;
    const nicBackUrl = files.nicBack?.[0]
      ? await uploadFile(files.nicBack[0], 'nic-back')
      : existing!.nicBackUrl;

    const brdDocumentUrl = hasBusiness
      ? files.brdDocument?.[0]
        ? await uploadFile(files.brdDocument[0], 'brd')
        : existing?.brdDocumentUrl ?? null
      : null;

    const safariJeepLicenseUrl = isSafari
      ? files.safariJeepLicense?.[0]
        ? await uploadFile(files.safariJeepLicense[0], 'safari-license')
        : existing?.safariJeepLicenseUrl ?? null
      : null;

    const baseData = {
      fullName: dto.fullName,
      mobileNumber: dto.mobileNumber,
      whatsappAvailable: dto.whatsappAvailable === true,
      contactEmail: dto.contactEmail.trim().toLowerCase(),
      usesAccountEmail: dto.usesAccountEmail !== false,
      providerType,
      hasBusiness,
      businessName: hasBusiness ? dto.businessName ?? null : null,
      businessDescription: hasBusiness ? dto.businessDescription ?? null : null,
      nicFrontUrl,
      nicBackUrl,
      brdDocumentUrl,
      safariJeepLicenseUrl,
      status: ApplicationStatus.PENDING,
      remark: null,
      updatedBy: userId,
    } as const;

    const application = existing
      ? await this.prisma.transportProviderApplication.update({
          where: { id: existing.id },
          data: baseData,
        })
      : await this.prisma.transportProviderApplication.create({
          data: { ...baseData, createdBy: userId },
        });

    await this.prisma.transportApplicationStatusHistory.create({
      data: {
        applicationId: application.id,
        status: ApplicationStatus.PENDING,
        remark: existing
          ? 'Application resubmitted after rejection'
          : 'Application submitted',
        updatedBy: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: existing
          ? 'RESUBMIT_TRANSPORT_APPLICATION'
          : 'CREATE_TRANSPORT_APPLICATION',
        userId,
      },
    });

    return application;
  }

  async getCurrentByUser(userId: string) {
    return this.prisma.transportProviderApplication.findFirst({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_DETAIL,
    });
  }

  /** Owner-curated profile (created on approval). Editable from /profile/transport. */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }
    return profile;
  }

  /** Patch the owner-curated profile. Only the fields the provider can edit
   * from their own page — admin-controlled flags (adminEnabled) and KYC docs
   * are untouched here. */
  async updateMyProfile(
    userId: string,
    dto: UpdateTransportProviderProfileDto,
  ) {
    const existing = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }

    const data: Prisma.TransportProviderProfileUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    // providerType changes are NOT allowed via direct profile edit any more —
    // the provider must submit a type-change request which an admin reviews.
    // Silently ignore the field if it's the same value, otherwise reject.
    if (
      dto.providerType !== undefined &&
      dto.providerType !== existing.providerType
    ) {
      throw new BadRequestException(
        'Provider type changes must be requested via the type-change-request flow and approved by an admin.',
      );
    }
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.whatsappAvailable !== undefined)
      data.whatsappAvailable = dto.whatsappAvailable;
    if (dto.contactEmail !== undefined)
      data.contactEmail = dto.contactEmail.trim().toLowerCase();
    if (dto.hasBusiness !== undefined) {
      data.hasBusiness = dto.hasBusiness;
      // If the provider toggled off business mode, clear the related fields
      // so we don't keep stale data referencing a business they no longer run.
      if (dto.hasBusiness === false) {
        data.businessName = null;
        data.businessDescription = null;
      }
    }
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.businessDescription !== undefined)
      data.businessDescription = dto.businessDescription;
    if (dto.profilePhotoUrl !== undefined)
      data.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.coverPhotoUrl !== undefined)
      data.coverPhotoUrl = dto.coverPhotoUrl;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.transportProviderProfile.update({
      where: { userId },
      data,
    });

    await this.prisma.auditLog.create({
      data: { action: 'UPDATE_TRANSPORT_PROFILE', userId },
    });

    return updated;
  }

  // ────────────────────────────────────────────────────────────
  // Fleet vehicles (only meaningful for VEHICLE_FLEET providers)
  // ────────────────────────────────────────────────────────────

  /** Resolve the provider's profile id and confirm they're allowed to manage
   * vehicles. VEHICLE_FLEET providers have no cap; VEHICLE_WITH_DRIVER are
   * limited to 2 vehicles total. SAFARI_JEEP providers don't manage vehicles
   * through this endpoint and are rejected. */
  private async resolveVehicleOwnerProfile(userId: string): Promise<{
    id: string;
    providerType: TransportProviderType;
  }> {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: { id: true, providerType: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }
    if (
      profile.providerType !== TransportProviderType.VEHICLE_FLEET &&
      profile.providerType !== TransportProviderType.VEHICLE_WITH_DRIVER
    ) {
      throw new ForbiddenException(
        'Vehicles can only be managed by Fleet or Driver-with-Vehicle providers.',
      );
    }
    return profile;
  }

  /** Backward-compatible helper — most existing methods only need the id. */
  private async resolveFleetProfileId(userId: string): Promise<string> {
    const profile = await this.resolveVehicleOwnerProfile(userId);
    return profile.id;
  }

  /** Max vehicles allowed for the provider type. Drivers-with-vehicle cap at
   * 2 since they personally drive; fleet operators have no app-level cap. */
  private maxVehiclesFor(type: TransportProviderType): number | null {
    if (type === TransportProviderType.VEHICLE_WITH_DRIVER) return 2;
    return null;
  }

  async listMyVehicles(userId: string) {
    const profileId = await this.resolveFleetProfileId(userId);
    return this.prisma.transportVehicle.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
  }

  async getMyVehicle(userId: string, vehicleId: string) {
    const profileId = await this.resolveFleetProfileId(userId);
    const vehicle = await this.prisma.transportVehicle.findFirst({
      where: { id: vehicleId, profileId },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async createMyVehicle(userId: string, dto: SaveVehicleDto) {
    const owner = await this.resolveVehicleOwnerProfile(userId);
    const max = this.maxVehiclesFor(owner.providerType);
    if (max !== null) {
      const count = await this.prisma.transportVehicle.count({
        where: { profileId: owner.id },
      });
      if (count >= max) {
        throw new BadRequestException(
          `Driver-with-vehicle providers can list at most ${max} vehicles. Remove an existing one before adding a new vehicle.`,
        );
      }
    }
    const profileId = owner.id;
    const vehicle = await this.prisma.transportVehicle.create({
      data: {
        profileId,
        title: dto.title.trim(),
        vehicleType: dto.vehicleType,
        manufacturedYear: dto.manufacturedYear ?? null,
        fuelType: dto.fuelType,
        fuelConsumption: dto.fuelConsumption?.trim() || null,
        condition: dto.condition ?? 'GOOD',
        facilities: dto.facilities ?? [],
        extraFacilities: dto.extraFacilities ?? [],
        inclusions: dto.inclusions ?? [],
        exclusions: dto.exclusions ?? [],
        description: dto.description ?? null,
        pickupLocation: dto.pickupLocation?.trim() || null,
        dropoffLocation: dto.dropoffLocation?.trim() || null,
        sameDropoffAsPickup: dto.sameDropoffAsPickup ?? true,
        allowsAnyLocation: dto.allowsAnyLocation ?? false,
        fuelPolicy: dto.fuelPolicy?.trim() || null,
        plateNumber: dto.plateNumber?.trim() || null,
        plateNumberVisible: dto.plateNumberVisible ?? false,
        isActive: dto.isActive ?? true,
        images: dto.images
          ? {
              create: dto.images.map((img, i) => ({
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
        charges: dto.charges
          ? {
              create: dto.charges.map((c, i) => ({
                chargeType: c.chargeType,
                amount: new Prisma.Decimal(c.amount),
                currency: c.currency || 'LKR',
                includesFuel: c.includesFuel ?? false,
                nightSurcharge:
                  c.nightSurcharge !== undefined && c.nightSurcharge !== null
                    ? new Prisma.Decimal(c.nightSurcharge)
                    : null,
                minimumUnits: c.minimumUnits ?? null,
                label: c.label?.trim() || null,
                notes: c.notes?.trim() || null,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });

    await this.prisma.auditLog.create({
      data: { action: 'CREATE_TRANSPORT_VEHICLE', userId },
    });
    return vehicle;
  }

  async updateMyVehicle(
    userId: string,
    vehicleId: string,
    dto: SaveVehicleDto,
  ) {
    const profileId = await this.resolveFleetProfileId(userId);
    const existing = await this.prisma.transportVehicle.findFirst({
      where: { id: vehicleId, profileId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Vehicle not found');

    return this.prisma.$transaction(async (tx) => {
      // Replace nested images/charges wholesale — the client sends the full
      // desired ordered state on every save, same pattern as guide itineraries.
      await tx.transportVehicleImage.deleteMany({
        where: { vehicleId },
      });
      await tx.transportVehicleCharge.deleteMany({
        where: { vehicleId },
      });

      const updated = await tx.transportVehicle.update({
        where: { id: vehicleId },
        data: {
          title: dto.title.trim(),
          vehicleType: dto.vehicleType,
          manufacturedYear: dto.manufacturedYear ?? null,
          fuelType: dto.fuelType,
          fuelConsumption: dto.fuelConsumption?.trim() || null,
          condition: dto.condition ?? 'GOOD',
          facilities: dto.facilities ?? [],
          extraFacilities: dto.extraFacilities ?? [],
          inclusions: dto.inclusions ?? [],
          exclusions: dto.exclusions ?? [],
          description: dto.description ?? null,
          pickupLocation: dto.pickupLocation?.trim() || null,
          dropoffLocation: dto.dropoffLocation?.trim() || null,
          sameDropoffAsPickup: dto.sameDropoffAsPickup ?? true,
          allowsAnyLocation: dto.allowsAnyLocation ?? false,
          fuelPolicy: dto.fuelPolicy?.trim() || null,
          plateNumber: dto.plateNumber?.trim() || null,
          plateNumberVisible: dto.plateNumberVisible ?? false,
          isActive: dto.isActive ?? true,
          images: dto.images
            ? {
                create: dto.images.map((img, i) => ({
                  imageUrl: img.imageUrl,
                  caption: img.caption ?? null,
                  sortOrder: i,
                })),
              }
            : undefined,
          charges: dto.charges
            ? {
                create: dto.charges.map((c, i) => ({
                  chargeType: c.chargeType,
                  amount: new Prisma.Decimal(c.amount),
                  currency: c.currency || 'LKR',
                  includesFuel: c.includesFuel ?? false,
                  nightSurcharge:
                    c.nightSurcharge !== undefined && c.nightSurcharge !== null
                      ? new Prisma.Decimal(c.nightSurcharge)
                      : null,
                  minimumUnits: c.minimumUnits ?? null,
                  label: c.label?.trim() || null,
                  notes: c.notes?.trim() || null,
                  sortOrder: i,
                })),
              }
            : undefined,
        },
        include: {
          images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
          charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        },
      });

      await tx.auditLog.create({
        data: { action: 'UPDATE_TRANSPORT_VEHICLE', userId },
      });
      return updated;
    });
  }

  async deleteMyVehicle(userId: string, vehicleId: string) {
    const profileId = await this.resolveFleetProfileId(userId);
    const existing = await this.prisma.transportVehicle.findFirst({
      where: { id: vehicleId, profileId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Vehicle not found');

    await this.prisma.transportVehicle.delete({ where: { id: vehicleId } });
    await this.prisma.auditLog.create({
      data: { action: 'DELETE_TRANSPORT_VEHICLE', userId },
    });
    return { ok: true };
  }

  // ────────────────────────────────────────────────────────────
  // Driver services (VEHICLE_WITH_DRIVER providers)
  // ────────────────────────────────────────────────────────────

  /** Driver-services are only meaningful for the VEHICLE_WITH_DRIVER type —
   * the others don't sell driver-provided services. Throws otherwise. */
  private async resolveDriverServiceProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: { id: true, providerType: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }
    if (profile.providerType !== TransportProviderType.VEHICLE_WITH_DRIVER) {
      throw new ForbiddenException(
        'Driver services are only available for Driver-with-Vehicle providers.',
      );
    }
    return profile.id;
  }

  async listMyDriverServices(userId: string) {
    const profileId = await this.resolveDriverServiceProfileId(userId);
    return this.prisma.driverService.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { createdAt: 'desc' }],
    });
  }

  async getMyDriverService(userId: string, serviceId: string) {
    const profileId = await this.resolveDriverServiceProfileId(userId);
    const svc = await this.prisma.driverService.findFirst({
      where: { id: serviceId, profileId },
    });
    if (!svc) throw new NotFoundException('Driver service not found');
    return svc;
  }

  async createMyDriverService(userId: string, dto: SaveDriverServiceDto) {
    const profileId = await this.resolveDriverServiceProfileId(userId);
    const svc = await this.prisma.driverService.create({
      data: {
        profileId,
        title: dto.title.trim(),
        category: dto.category ?? 'OTHER',
        description: dto.description ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        basePrice: new Prisma.Decimal(dto.basePrice),
        currency: dto.currency || 'LKR',
        priceUnit: dto.priceUnit,
        priceNotes: dto.priceNotes?.trim() || null,
        inclusions: dto.inclusions ?? [],
        exclusions: dto.exclusions ?? [],
        isActive: dto.isActive ?? true,
      },
    });
    await this.prisma.auditLog.create({
      data: { action: 'CREATE_DRIVER_SERVICE', userId },
    });
    return svc;
  }

  async updateMyDriverService(
    userId: string,
    serviceId: string,
    dto: SaveDriverServiceDto,
  ) {
    const profileId = await this.resolveDriverServiceProfileId(userId);
    const existing = await this.prisma.driverService.findFirst({
      where: { id: serviceId, profileId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Driver service not found');

    const updated = await this.prisma.driverService.update({
      where: { id: serviceId },
      data: {
        title: dto.title.trim(),
        category: dto.category ?? 'OTHER',
        description: dto.description ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        basePrice: new Prisma.Decimal(dto.basePrice),
        currency: dto.currency || 'LKR',
        priceUnit: dto.priceUnit,
        priceNotes: dto.priceNotes?.trim() || null,
        inclusions: dto.inclusions ?? [],
        exclusions: dto.exclusions ?? [],
        isActive: dto.isActive ?? true,
      },
    });
    await this.prisma.auditLog.create({
      data: { action: 'UPDATE_DRIVER_SERVICE', userId },
    });
    return updated;
  }

  async deleteMyDriverService(userId: string, serviceId: string) {
    const profileId = await this.resolveDriverServiceProfileId(userId);
    const existing = await this.prisma.driverService.findFirst({
      where: { id: serviceId, profileId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Driver service not found');
    await this.prisma.driverService.delete({ where: { id: serviceId } });
    await this.prisma.auditLog.create({
      data: { action: 'DELETE_DRIVER_SERVICE', userId },
    });
    return { ok: true };
  }

  // ────────────────────────────────────────────────────────────
  // Safari jeeps (SAFARI_JEEP providers)
  // ────────────────────────────────────────────────────────────

  /** Safari jeeps are gated to SAFARI_JEEP providers only. Returns the
   * profile + fullName so create can default the driver name. */
  private async resolveSafariProfile(userId: string): Promise<{
    id: string;
    fullName: string;
  }> {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: { id: true, providerType: true, fullName: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }
    if (profile.providerType !== TransportProviderType.SAFARI_JEEP) {
      throw new ForbiddenException(
        'Safari jeeps are only available for Safari Jeep operators.',
      );
    }
    return { id: profile.id, fullName: profile.fullName };
  }

  async listMySafariJeeps(userId: string) {
    const profile = await this.resolveSafariProfile(userId);
    return this.prisma.safariJeep.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
  }

  async getMySafariJeep(userId: string, id: string) {
    const profile = await this.resolveSafariProfile(userId);
    const jeep = await this.prisma.safariJeep.findFirst({
      where: { id, profileId: profile.id },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
    if (!jeep) throw new NotFoundException('Safari jeep not found');
    return jeep;
  }

  async createMySafariJeep(userId: string, dto: SaveSafariJeepDto) {
    const profile = await this.resolveSafariProfile(userId);
    const jeep = await this.prisma.safariJeep.create({
      data: {
        profileId: profile.id,
        title: dto.title.trim(),
        vehicleType: dto.vehicleType ?? 'JEEP',
        condition: dto.condition ?? 'GOOD',
        passengerCapacity: dto.passengerCapacity ?? null,
        // Driver name defaults to the provider's own name if not supplied — a
        // solo safari operator typically IS the driver.
        driverName: dto.driverName?.trim() || profile.fullName,
        driverPhotoUrl: dto.driverPhotoUrl ?? null,
        driverYearsExperience: dto.driverYearsExperience ?? null,
        driverBio: dto.driverBio?.trim() || null,
        driverLanguages: dto.driverLanguages ?? [],
        driverGuidesAtParks: dto.driverGuidesAtParks ?? true,
        nationalParks: dto.nationalParks ?? [],
        experiences: dto.experiences ?? [],
        durationNotes: dto.durationNotes?.trim() || null,
        facilities: dto.facilities ?? [],
        extraFacilities: dto.extraFacilities ?? [],
        inclusions: dto.inclusions ?? [],
        exclusions: dto.exclusions ?? [],
        description: dto.description ?? null,
        pickupLocation: dto.pickupLocation?.trim() || null,
        isActive: dto.isActive ?? true,
        images: dto.images
          ? {
              create: dto.images.map((img, i) => ({
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
        charges: dto.charges
          ? {
              create: dto.charges.map((c, i) => ({
                chargeType: c.chargeType,
                amount: new Prisma.Decimal(c.amount),
                currency: c.currency || 'LKR',
                includesParkFee: c.includesParkFee ?? false,
                minimumUnits: c.minimumUnits ?? null,
                label: c.label?.trim() || null,
                notes: c.notes?.trim() || null,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
    await this.prisma.auditLog.create({
      data: { action: 'CREATE_SAFARI_JEEP', userId },
    });
    return jeep;
  }

  async updateMySafariJeep(
    userId: string,
    id: string,
    dto: SaveSafariJeepDto,
  ) {
    const profile = await this.resolveSafariProfile(userId);
    const existing = await this.prisma.safariJeep.findFirst({
      where: { id, profileId: profile.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Safari jeep not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.safariJeepImage.deleteMany({ where: { safariJeepId: id } });
      await tx.safariJeepCharge.deleteMany({ where: { safariJeepId: id } });

      const updated = await tx.safariJeep.update({
        where: { id },
        data: {
          title: dto.title.trim(),
          vehicleType: dto.vehicleType ?? 'JEEP',
          condition: dto.condition ?? 'GOOD',
          passengerCapacity: dto.passengerCapacity ?? null,
          driverName: dto.driverName?.trim() || profile.fullName,
          driverPhotoUrl: dto.driverPhotoUrl ?? null,
          driverYearsExperience: dto.driverYearsExperience ?? null,
          driverBio: dto.driverBio?.trim() || null,
          driverLanguages: dto.driverLanguages ?? [],
          driverGuidesAtParks: dto.driverGuidesAtParks ?? true,
          nationalParks: dto.nationalParks ?? [],
          experiences: dto.experiences ?? [],
          durationNotes: dto.durationNotes?.trim() || null,
          facilities: dto.facilities ?? [],
          extraFacilities: dto.extraFacilities ?? [],
          inclusions: dto.inclusions ?? [],
          exclusions: dto.exclusions ?? [],
          description: dto.description ?? null,
          pickupLocation: dto.pickupLocation?.trim() || null,
          isActive: dto.isActive ?? true,
          images: dto.images
            ? {
                create: dto.images.map((img, i) => ({
                  imageUrl: img.imageUrl,
                  caption: img.caption ?? null,
                  sortOrder: i,
                })),
              }
            : undefined,
          charges: dto.charges
            ? {
                create: dto.charges.map((c, i) => ({
                  chargeType: c.chargeType,
                  amount: new Prisma.Decimal(c.amount),
                  currency: c.currency || 'LKR',
                  includesParkFee: c.includesParkFee ?? false,
                  minimumUnits: c.minimumUnits ?? null,
                  label: c.label?.trim() || null,
                  notes: c.notes?.trim() || null,
                  sortOrder: i,
                })),
              }
            : undefined,
        },
        include: {
          images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
          charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        },
      });
      await tx.auditLog.create({
        data: { action: 'UPDATE_SAFARI_JEEP', userId },
      });
      return updated;
    });
  }

  // ────────────────────────────────────────────────────────────
  // Safari jeep itineraries (a safari jeep can become one or more itineraries)
  // ────────────────────────────────────────────────────────────

  /** Resolve that the given safari jeep belongs to this user. Returns the
   * jeep with the fields we need for pre-fill. */
  private async resolveOwnedSafariJeep(userId: string, jeepId: string) {
    const profile = await this.resolveSafariProfile(userId);
    const jeep = await this.prisma.safariJeep.findFirst({
      where: { id: jeepId, profileId: profile.id },
      include: {
        images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
    if (!jeep) throw new NotFoundException('Safari jeep not found');
    return jeep;
  }

  /** Snapshot a safari jeep into a fresh Itinerary. Fields the operator
   * almost always edits (days/time slots, overview text) are left blank for
   * them to fill in.
   *
   * Optional `overrides.title` / `overrides.subtitle` come from the operator —
   * the frontend generates template suggestions from the jeep's parks +
   * experiences and lets the operator pick one (or type their own) before
   * creating. When absent, we fall back to the jeep's own title and a
   * "with <driver>" subtitle. */
  async createItineraryFromSafariJeep(
    userId: string,
    jeepId: string,
    overrides?: { title?: string; subtitle?: string | null },
  ) {
    // Diagnostic — remove once title/subtitle override flow is verified end-to-end.
    // Lets us confirm in dev that the request body actually reaches the service.
    // eslint-disable-next-line no-console
    console.log('[createItineraryFromSafariJeep] overrides =', JSON.stringify(overrides));

    const jeep = await this.resolveOwnedSafariJeep(userId, jeepId);

    const titleOverride = overrides?.title?.trim();
    const titleToUse = titleOverride && titleOverride.length > 0
      ? titleOverride
      : jeep.title;

    // `subtitle: null` is intentional (operator explicitly cleared it) so we
    // distinguish "not provided" from "provided as null".
    const subtitleToUse =
      overrides && 'subtitle' in overrides
        ? overrides.subtitle === null
          ? null
          : (overrides.subtitle?.trim() || null)
        : jeep.driverName
          ? `with ${jeep.driverName}`
          : null;

    // Pick a starting price from the cheapest charge — operator can adjust.
    const cheapest = [...jeep.charges].sort(
      (a, b) => Number(a.amount) - Number(b.amount),
    )[0];

    // Map a safari per-jeep / per-person charge unit onto the itinerary's
    // priceScope (PER_PERSON / PER_GROUP / PER_DAY).
    const priceScope: 'PER_PERSON' | 'PER_GROUP' | 'PER_DAY' =
      cheapest?.chargeType === 'PER_PERSON'
        ? 'PER_PERSON'
        : cheapest?.chargeType === 'PER_DAY'
          ? 'PER_DAY'
          : 'PER_GROUP';

    // Auto-generate a transportation tagline from the jeep's vehicle details,
    // facilities, capacity and driver — the most useful 3–4 phrases joined
    // by " · ". Operator can edit freely afterwards.
    const transportationToUse = buildSafariTransportationTagline(jeep);

    const created = await this.prisma.itinerary.create({
      data: {
        safariJeepId: jeep.id,
        title: titleToUse,
        subtitle: subtitleToUse,
        designType: 'TIME',
        languagesOffered: jeep.driverLanguages ?? [],
        tags: ['safari'],
        price: cheapest?.amount ?? null,
        currency: cheapest?.currency ?? 'LKR',
        priceScope,
        overview: jeep.description ?? null,
        transportation: transportationToUse,
        meetingLocation: jeep.pickupLocation ?? null,
        coverImageUrl: jeep.images[0]?.imageUrl ?? null,
        isActive: false, // start hidden so operator can complete it first
        galleryImages: jeep.images.length
          ? {
              create: jeep.images.map((img, i) => ({
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
        inclusions: jeep.inclusions.length
          ? {
              create: jeep.inclusions.map((text, i) => ({
                kind: 'INCLUDED' as const,
                text,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: {
        days: {
          orderBy: [
            { dayNumber: Prisma.SortOrder.asc },
            { sortOrder: Prisma.SortOrder.asc },
          ],
        },
        inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });

    // Push the jeep's exclusions in as INCLUDED-kind=EXCLUDED entries. Done
    // in a second step so the createMany inside .create doesn't need two
    // different kinds in one array.
    if (jeep.exclusions.length) {
      await this.prisma.itineraryInclusion.createMany({
        data: jeep.exclusions.map((text, i) => ({
          itineraryId: created.id,
          kind: 'EXCLUDED' as const,
          text,
          sortOrder: i,
        })),
      });
    }

    await this.prisma.auditLog.create({
      data: { action: 'CREATE_SAFARI_ITINERARY_FROM_JEEP', userId },
    });

    return this.prisma.itinerary.findUnique({
      where: { id: created.id },
      include: {
        days: {
          orderBy: [
            { dayNumber: Prisma.SortOrder.asc },
            { sortOrder: Prisma.SortOrder.asc },
          ],
        },
        inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
  }

  /** List every itinerary owned by any of my safari jeeps. */
  async listMySafariItineraries(userId: string) {
    const profile = await this.resolveSafariProfile(userId);
    return this.prisma.itinerary.findMany({
      where: { safariJeep: { profileId: profile.id } },
      orderBy: [
        { sortOrder: Prisma.SortOrder.asc },
        { createdAt: Prisma.SortOrder.desc },
      ],
      include: {
        safariJeep: {
          select: { id: true, title: true, driverName: true },
        },
        days: {
          orderBy: [
            { dayNumber: Prisma.SortOrder.asc },
            { sortOrder: Prisma.SortOrder.asc },
          ],
        },
        inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
  }

  async getMySafariItinerary(userId: string, itineraryId: string) {
    const profile = await this.resolveSafariProfile(userId);
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        safariJeep: { profileId: profile.id },
      },
      include: {
        safariJeep: {
          select: { id: true, title: true, driverName: true },
        },
        days: {
          orderBy: [
            { dayNumber: Prisma.SortOrder.asc },
            { sortOrder: Prisma.SortOrder.asc },
          ],
        },
        inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      },
    });
    if (!itinerary) throw new NotFoundException('Safari itinerary not found');
    return itinerary;
  }

  async updateMySafariItinerary(
    userId: string,
    itineraryId: string,
    payload: {
      title: string;
      subtitle?: string | null;
      designType?: 'DAYS' | 'TIME' | 'DURATION';
      languagesOffered?: string[];
      tags?: string[];
      durationDays?: number | null;
      durationMinutes?: number | null;
      durationLabel?: string | null;
      price?: number | string | null;
      currency?: string | null;
      priceScope?: 'PER_PERSON' | 'PER_GROUP' | 'PER_DAY';
      overview?: string | null;
      transportation?: string | null;
      meetingLocation?: string | null;
      imageGradient?: string | null;
      coverImageUrl?: string | null;
      isActive?: boolean;
      days?: Array<{
        dayNumber: number;
        title: string;
        description?: string | null;
        startTime?: string | null;
        endTime?: string | null;
      }>;
      inclusions?: Array<{ kind: 'INCLUDED' | 'EXCLUDED'; text: string }>;
      galleryImages?: Array<{ imageUrl: string; caption?: string | null }>;
    },
  ) {
    await this.getMySafariItinerary(userId, itineraryId);

    return this.prisma.$transaction(async (tx) => {
      await tx.itinerary.update({
        where: { id: itineraryId },
        data: {
          title: payload.title.trim(),
          subtitle: payload.subtitle ?? null,
          designType: payload.designType ?? 'DAYS',
          languagesOffered: payload.languagesOffered ?? [],
          tags: payload.tags ?? [],
          durationDays: payload.durationDays ?? null,
          durationMinutes: payload.durationMinutes ?? null,
          durationLabel: payload.durationLabel ?? null,
          price:
            payload.price !== undefined && payload.price !== null
              ? new Prisma.Decimal(String(payload.price))
              : null,
          currency: payload.currency ? payload.currency.toUpperCase() : null,
          priceScope: payload.priceScope ?? 'PER_PERSON',
          overview: payload.overview ?? null,
          transportation: payload.transportation ?? null,
          meetingLocation: payload.meetingLocation ?? null,
          imageGradient: payload.imageGradient ?? null,
          coverImageUrl: payload.coverImageUrl ?? null,
          isActive: payload.isActive ?? true,
        },
      });

      if (payload.days !== undefined) {
        await tx.itineraryDay.deleteMany({ where: { itineraryId } });
        if (payload.days.length > 0) {
          await tx.itineraryDay.createMany({
            data: payload.days.map((d, i) => ({
              itineraryId,
              dayNumber: d.dayNumber,
              title: d.title,
              description: d.description ?? null,
              startTime: d.startTime ?? null,
              endTime: d.endTime ?? null,
              sortOrder: i,
            })),
          });
        }
      }

      if (payload.inclusions !== undefined) {
        await tx.itineraryInclusion.deleteMany({ where: { itineraryId } });
        if (payload.inclusions.length > 0) {
          await tx.itineraryInclusion.createMany({
            data: payload.inclusions.map((inc, i) => ({
              itineraryId,
              kind: inc.kind,
              text: inc.text,
              sortOrder: i,
            })),
          });
        }
      }

      if (payload.galleryImages !== undefined) {
        await tx.itineraryImage.deleteMany({ where: { itineraryId } });
        if (payload.galleryImages.length > 0) {
          await tx.itineraryImage.createMany({
            data: payload.galleryImages.map((img, i) => ({
              itineraryId,
              imageUrl: img.imageUrl,
              caption: img.caption ?? null,
              sortOrder: i,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: { action: 'UPDATE_SAFARI_ITINERARY', userId },
      });

      return tx.itinerary.findUnique({
        where: { id: itineraryId },
        include: {
          safariJeep: {
            select: { id: true, title: true, driverName: true },
          },
          days: {
            orderBy: [
              { dayNumber: Prisma.SortOrder.asc },
              { sortOrder: Prisma.SortOrder.asc },
            ],
          },
          inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
          galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        },
      });
    });
  }

  async deleteMySafariItinerary(userId: string, itineraryId: string) {
    await this.getMySafariItinerary(userId, itineraryId);
    await this.prisma.itinerary.delete({ where: { id: itineraryId } });
    await this.prisma.auditLog.create({
      data: { action: 'DELETE_SAFARI_ITINERARY', userId },
    });
    return { ok: true };
  }

  async deleteMySafariJeep(userId: string, id: string) {
    const profile = await this.resolveSafariProfile(userId);
    const existing = await this.prisma.safariJeep.findFirst({
      where: { id, profileId: profile.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Safari jeep not found');
    await this.prisma.safariJeep.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { action: 'DELETE_SAFARI_JEEP', userId },
    });
    return { ok: true };
  }

  // ────────────────────────────────────────────────────────────
  // Provider type change requests (provider submits, admin reviews)
  // ────────────────────────────────────────────────────────────

  /** Most recent type-change request for the current provider, or null. */
  async getMyTypeChangeRequest(userId: string) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return null;
    return this.prisma.transportProviderTypeChangeRequest.findFirst({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedByUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async submitTypeChangeRequest(
    userId: string,
    dto: SubmitTypeChangeRequestDto,
    files: TypeChangeFiles,
  ) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        providerType: true,
        hasBusiness: true,
        safariJeepLicenseUrl: true,
        brdDocumentUrl: true,
      },
    });
    if (!profile) {
      throw new NotFoundException(
        'Transport provider profile not found. Your application must be approved first.',
      );
    }

    if (dto.requestedType === profile.providerType) {
      throw new BadRequestException(
        'Your requested type is the same as your current type — nothing to change.',
      );
    }

    // Block stacking requests — they must wait for the current one.
    const pending =
      await this.prisma.transportProviderTypeChangeRequest.findFirst({
        where: { profileId: profile.id, status: ApplicationStatus.PENDING },
      });
    if (pending) {
      throw new BadRequestException(
        'You already have a type change request under review. Cancel it before submitting a new one.',
      );
    }

    // Required documents depend on the requested type.
    const needsSafariLicense =
      dto.requestedType === TransportProviderType.SAFARI_JEEP &&
      !profile.safariJeepLicenseUrl;
    if (needsSafariLicense && !files.safariJeepLicense?.[0]) {
      throw new BadRequestException(
        'A government-issued safari jeep licence is required to switch to Safari Jeep Operator.',
      );
    }

    const ts = Date.now();
    const uploadOne = async (file: Express.Multer.File, type: string) => {
      const ext = file.originalname.split('.').pop() ?? 'bin';
      const path = `transport-type-changes/${userId}/${ts}-${type}.${ext}`;
      const r = await this.storage.uploadFile(file, path);
      return r.url;
    };

    const safariJeepLicenseUrl = files.safariJeepLicense?.[0]
      ? await uploadOne(files.safariJeepLicense[0], 'safari-license')
      : null;
    const brdDocumentUrl = files.brdDocument?.[0]
      ? await uploadOne(files.brdDocument[0], 'brd')
      : null;

    const request =
      await this.prisma.transportProviderTypeChangeRequest.create({
        data: {
          profileId: profile.id,
          currentType: profile.providerType,
          requestedType: dto.requestedType,
          providerNotes: dto.providerNotes?.trim() || null,
          safariJeepLicenseUrl,
          brdDocumentUrl,
          createdBy: userId,
        },
      });

    await this.prisma.auditLog.create({
      data: { action: 'SUBMIT_TRANSPORT_TYPE_CHANGE_REQUEST', userId },
    });

    return request;
  }

  async cancelMyTypeChangeRequest(userId: string, requestId: string) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const request =
      await this.prisma.transportProviderTypeChangeRequest.findFirst({
        where: { id: requestId, profileId: profile.id },
      });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending requests can be cancelled.',
      );
    }
    await this.prisma.transportProviderTypeChangeRequest.delete({
      where: { id: requestId },
    });
    await this.prisma.auditLog.create({
      data: { action: 'CANCEL_TRANSPORT_TYPE_CHANGE_REQUEST', userId },
    });
    return { ok: true };
  }

  // ── Admin endpoints ────────────────────────────────────────────────

  async listAllTypeChangeRequests(status?: ApplicationStatus) {
    return this.prisma.transportProviderTypeChangeRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            contactEmail: true,
            providerType: true,
            hasBusiness: true,
            businessName: true,
          },
        },
        createdByUser: { select: { id: true, email: true, name: true } },
        reviewedByUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async getTypeChangeRequestById(id: string) {
    const request =
      await this.prisma.transportProviderTypeChangeRequest.findUnique({
        where: { id },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              contactEmail: true,
              mobileNumber: true,
              providerType: true,
              hasBusiness: true,
              businessName: true,
              safariJeepLicenseUrl: true,
              brdDocumentUrl: true,
            },
          },
          createdByUser: { select: { id: true, email: true, name: true } },
          reviewedByUser: { select: { id: true, email: true, name: true } },
        },
      });
    if (!request) throw new NotFoundException('Type change request not found');
    return request;
  }

  async reviewTypeChangeRequest(
    id: string,
    dto: ReviewTypeChangeRequestDto,
    adminId: string,
  ) {
    const request =
      await this.prisma.transportProviderTypeChangeRequest.findUnique({
        where: { id },
        include: { profile: true },
      });
    if (!request) throw new NotFoundException('Type change request not found');

    if (request.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'This request has already been reviewed.',
      );
    }

    if (dto.status === 'REJECTED' && !dto.remark) {
      throw new BadRequestException(
        'A remark is required when rejecting a request.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transportProviderTypeChangeRequest.update({
        where: { id },
        data: {
          status:
            dto.status === 'APPROVED'
              ? ApplicationStatus.APPROVED
              : ApplicationStatus.REJECTED,
          remark: dto.remark ?? null,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // On approval, actually flip the provider's type + carry over any new
      // documents that were uploaded with the request (e.g. safari licence
      // when switching to SAFARI_JEEP, BRD when going business).
      if (dto.status === 'APPROVED') {
        await tx.transportProviderProfile.update({
          where: { id: request.profileId },
          data: {
            providerType: request.requestedType,
            ...(request.safariJeepLicenseUrl
              ? { safariJeepLicenseUrl: request.safariJeepLicenseUrl }
              : {}),
            ...(request.brdDocumentUrl
              ? { brdDocumentUrl: request.brdDocumentUrl }
              : {}),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: `REVIEW_TRANSPORT_TYPE_CHANGE_${dto.status}`,
          userId: adminId,
        },
      });

      return updated;
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.transportProviderApplication.findUnique({
      where: { id },
      include: INCLUDE_DETAIL,
    });
    if (!app) throw new NotFoundException('Transport application not found');
    return app;
  }

  async findAll() {
    return this.prisma.transportProviderApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_LIST,
    });
  }

  /** Approve / reject. Approving creates the TransportProviderProfile and
   * grants the TRANSPORT_PROVIDER role. Rejecting requires a remark and
   * revokes the role + hides the profile if one existed. */
  async updateStatus(
    id: string,
    dto: UpdateTransportApplicationStatusDto,
    adminId: string,
  ) {
    const application = await this.prisma.transportProviderApplication.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('Transport application not found');
    }

    if (dto.status === ApplicationStatus.REJECTED && !dto.remark) {
      throw new BadRequestException(
        'A remark is required when rejecting an application.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transportProviderApplication.update({
        where: { id },
        data: {
          status: dto.status,
          remark: dto.remark,
          statusUpdatedBy: adminId,
          updatedBy: adminId,
        },
      });

      await tx.transportApplicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: dto.status,
          remark: dto.remark,
          updatedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `UPDATE_TRANSPORT_APPLICATION_STATUS_${dto.status}`,
          userId: adminId,
        },
      });

      if (application.createdBy) {
        const role = await tx.role.upsert({
          where: { name: 'TRANSPORT_PROVIDER' },
          update: {},
          create: { name: 'TRANSPORT_PROVIDER' },
        });

        if (dto.status === ApplicationStatus.APPROVED) {
          await tx.userRole.upsert({
            where: {
              userId_roleId: { userId: application.createdBy, roleId: role.id },
            },
            update: {},
            create: { userId: application.createdBy, roleId: role.id },
          });

          // Upsert the profile — on re-approval keep admin-curated extras,
          // but we currently have no curated fields here so the shape is flat.
          await tx.transportProviderProfile.upsert({
            where: { userId: application.createdBy },
            update: {
              applicationId: updated.id,
              fullName: updated.fullName,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              contactEmail: updated.contactEmail,
              providerType: updated.providerType,
              hasBusiness: updated.hasBusiness,
              businessName: updated.businessName,
              businessDescription: updated.businessDescription,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              brdDocumentUrl: updated.brdDocumentUrl,
              safariJeepLicenseUrl: updated.safariJeepLicenseUrl,
              approvedAt: new Date(),
            },
            create: {
              userId: application.createdBy,
              applicationId: updated.id,
              fullName: updated.fullName,
              mobileNumber: updated.mobileNumber,
              whatsappAvailable: updated.whatsappAvailable,
              contactEmail: updated.contactEmail,
              providerType: updated.providerType,
              hasBusiness: updated.hasBusiness,
              businessName: updated.businessName,
              businessDescription: updated.businessDescription,
              nicFrontUrl: updated.nicFrontUrl,
              nicBackUrl: updated.nicBackUrl,
              brdDocumentUrl: updated.brdDocumentUrl,
              safariJeepLicenseUrl: updated.safariJeepLicenseUrl,
            },
          });
        } else {
          await tx.userRole.deleteMany({
            where: { userId: application.createdBy, roleId: role.id },
          });
          // If a profile exists from a previous approval, hide it. We don't
          // hard-delete because admins may want to inspect it.
          await tx.transportProviderProfile.updateMany({
            where: { userId: application.createdBy },
            data: { isActive: false },
          });
        }
      }

      return updated;
    });
  }
}

/**
 * Build a short transportation tagline for a new safari itinerary from the
 * jeep's vehicle details. Joined with " · " to match the look of other
 * itinerary fields (subtitles, inclusions). Returns null when there's
 * literally nothing useful to say so the operator gets an empty field
 * instead of awkward filler.
 *
 * Examples:
 *   - "Open-top safari jeep · up to 6 guests · with Sunil (12 yrs exp.)"
 *   - "Mahindra Bolero · padded raised seats · canopy roof"
 *   - "Safari jeep with Sunil"
 */
function buildSafariTransportationTagline(jeep: {
  title: string;
  vehicleType: string;
  passengerCapacity: number | null;
  driverName: string;
  driverYearsExperience: number | null;
  facilities: string[];
  extraFacilities: string[];
}): string | null {
  const parts: string[] = [];

  // Lead with vehicle descriptor — prefer a facility-flavoured one if we
  // have it ("Open-top safari jeep" reads better than just "Jeep").
  const allFacilities = [...(jeep.facilities ?? []), ...(jeep.extraFacilities ?? [])];
  const leadFacility = allFacilities.find((f) =>
    /open-top|covered|canopy|raised seat/i.test(f),
  );
  if (leadFacility) {
    parts.push(`${leadFacility} safari jeep`);
  } else if (jeep.vehicleType === 'JEEP') {
    parts.push('Safari jeep');
  } else {
    // Fallback for the (rare) non-JEEP safari vehicle types — title is
    // usually descriptive enough.
    parts.push(jeep.title);
  }

  // Other notable facilities (up to 2) — skip the one we already led with.
  const remaining = allFacilities
    .filter((f) => f !== leadFacility)
    .slice(0, 2);
  for (const f of remaining) parts.push(f.toLowerCase());

  // Capacity for groups of 4+ (small groups already imply few guests).
  if (jeep.passengerCapacity && jeep.passengerCapacity >= 4) {
    parts.push(`up to ${jeep.passengerCapacity} guests`);
  }

  // Driver — only mention when we actually have a name; experience is a
  // nice-to-have suffix.
  const driver = jeep.driverName?.trim();
  if (driver) {
    const years = jeep.driverYearsExperience;
    parts.push(
      years && years > 0
        ? `with ${driver} (${years} yr${years === 1 ? '' : 's'} exp.)`
        : `with ${driver}`,
    );
  }

  if (parts.length === 0) return null;
  // Capitalise the first phrase; the rest stay lower-case (already done above)
  // so it reads like a single sentence-fragment.
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.join(' · ');
}
