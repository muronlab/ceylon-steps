import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityProviderSort = 'newest' | 'oldest' | 'name-asc';

export interface SearchActivityProvidersQuery {
  search?: string;
  /** "active" | "inactive" | undefined (any) */
  status?: 'active' | 'inactive';
  sort?: ActivityProviderSort;
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
  businessName: true,
  natureOfBusiness: true,
  isActive: true,
  adminEnabled: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, name: true, status: true } },
} satisfies Prisma.ActivityProviderProfileSelect;

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
} satisfies Prisma.ActivityProviderProfileInclude;

@Injectable()
export class ActivityProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchActivityProvidersQuery) {
    const where: Prisma.ActivityProviderProfileWhereInput = {};

    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { fullName: { contains: term, mode: 'insensitive' } },
          { contactEmail: { contains: term, mode: 'insensitive' } },
          { mobileNumber: { contains: term, mode: 'insensitive' } },
          { businessName: { contains: term, mode: 'insensitive' } },
          { natureOfBusiness: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const orderBy: Prisma.ActivityProviderProfileOrderByWithRelationInput[] =
      (() => {
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
      this.prisma.activityProviderProfile.findMany({
        where,
        select: LIST_SELECT,
        orderBy,
        take,
        skip,
      }),
      this.prisma.activityProviderProfile.count({ where }),
    ]);

    return { total, take, skip, items };
  }

  async detail(id: string) {
    const profile = await this.prisma.activityProviderProfile.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Activity profile not found');
    return profile;
  }

  async detailByUserId(userId: string) {
    const profile = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
      include: DETAIL_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Activity profile not found');
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
    const existing = await this.prisma.activityProviderProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Activity profile not found');

    await this.prisma.$transaction([
      this.prisma.activityProviderProfile.update({
        where: { id },
        data: { adminEnabled },
      }),
      this.prisma.auditLog.create({
        data: {
          action: adminEnabled
            ? 'ADMIN_ENABLE_ACTIVITY_PROVIDER'
            : 'ADMIN_DISABLE_ACTIVITY_PROVIDER',
          userId: actorId,
        },
      }),
    ]);
    return this.detail(id);
  }
}
