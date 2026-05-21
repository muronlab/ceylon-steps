import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransportProviderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TransportProviderSort = 'newest' | 'oldest' | 'name-asc';

export interface SearchTransportProvidersQuery {
  search?: string;
  providerType?: TransportProviderType;
  /** "active" | "inactive" | undefined (any) */
  status?: 'active' | 'inactive';
  hasBusiness?: boolean;
  sort?: TransportProviderSort;
  take?: number;
  skip?: number;
}

const LIST_SELECT = {
  id: true,
  userId: true,
  applicationId: true,
  fullName: true,
  mobileNumber: true,
  whatsappAvailable: true,
  contactEmail: true,
  providerType: true,
  hasBusiness: true,
  businessName: true,
  isActive: true,
  adminEnabled: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, name: true, status: true } },
} satisfies Prisma.TransportProviderProfileSelect;

const DETAIL_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  },
  application: {
    include: {
      statusHistory: {
        orderBy: { createdAt: Prisma.SortOrder.desc },
        include: {
          updatedByUser: { select: { id: true, email: true, name: true } },
        },
      },
      createdByUser: { select: { id: true, email: true, name: true } },
      statusUpdatedByUser: { select: { id: true, email: true, name: true } },
    },
  },
  vehicles: {
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
    },
  },
  driverServices: {
    orderBy: [
      { sortOrder: Prisma.SortOrder.asc },
      { createdAt: Prisma.SortOrder.desc },
    ],
  },
  safariJeeps: {
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      charges: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      itineraries: {
        orderBy: [
          { sortOrder: Prisma.SortOrder.asc },
          { createdAt: Prisma.SortOrder.desc },
        ],
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
      },
    },
  },
  typeChangeRequests: {
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      reviewedByUser: { select: { id: true, email: true, name: true } },
    },
  },
} satisfies Prisma.TransportProviderProfileInclude;

@Injectable()
export class TransportProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchTransportProvidersQuery) {
    const where: Prisma.TransportProviderProfileWhereInput = {};

    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    if (query.providerType) where.providerType = query.providerType;
    if (typeof query.hasBusiness === 'boolean') {
      where.hasBusiness = query.hasBusiness;
    }

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { fullName: { contains: term, mode: 'insensitive' } },
          { contactEmail: { contains: term, mode: 'insensitive' } },
          { mobileNumber: { contains: term, mode: 'insensitive' } },
          { businessName: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const orderBy: Prisma.TransportProviderProfileOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case 'oldest':
          return [{ approvedAt: 'asc' }];
        case 'name-asc':
          return [{ fullName: 'asc' }];
        case 'newest':
        default:
          return [{ approvedAt: 'desc' }];
      }
    })();

    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportProviderProfile.findMany({
        where,
        select: LIST_SELECT,
        orderBy,
        take,
        skip,
      }),
      this.prisma.transportProviderProfile.count({ where }),
    ]);

    return { total, take, skip, items };
  }

  /** Distinct values currently in use, for filter dropdowns. */
  async facets() {
    const profiles = await this.prisma.transportProviderProfile.findMany({
      select: { providerType: true, hasBusiness: true },
    });
    const providerTypes = new Set<TransportProviderType>();
    let withBusiness = 0;
    for (const p of profiles) {
      providerTypes.add(p.providerType);
      if (p.hasBusiness) withBusiness++;
    }
    return {
      providerTypes: [...providerTypes],
      hasBusinessCount: withBusiness,
      total: profiles.length,
    };
  }

  async detail(id: string) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Transport profile not found');
    return profile;
  }

  async detailByUserId(userId: string) {
    const profile = await this.prisma.transportProviderProfile.findUnique({
      where: { userId },
      include: DETAIL_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Transport profile not found');
    return profile;
  }

  /**
   * Admin-only visibility toggle. Writes the `adminEnabled` flag and audit-logs
   * the action. Independent of the owner-controlled `isActive` flag — the
   * profile is only public when both are true.
   */
  async setAdminEnabled(actorId: string, id: string, adminEnabled: boolean) {
    if (typeof adminEnabled !== 'boolean') {
      throw new BadRequestException('adminEnabled must be a boolean.');
    }
    const existing = await this.prisma.transportProviderProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Transport profile not found');

    await this.prisma.$transaction([
      this.prisma.transportProviderProfile.update({
        where: { id },
        data: { adminEnabled },
      }),
      this.prisma.auditLog.create({
        data: {
          action: adminEnabled
            ? 'ADMIN_ENABLE_TRANSPORT_PROVIDER'
            : 'ADMIN_DISABLE_TRANSPORT_PROVIDER',
          userId: actorId,
        },
      }),
    ]);
    return this.detail(id);
  }
}
