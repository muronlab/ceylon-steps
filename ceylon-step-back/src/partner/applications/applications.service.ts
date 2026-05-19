import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus, Prisma } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all partner applications across all types.
   * Currently covers GuideApplication; extend with joins/unions as new partner
   * types are added (e.g. TransportApplication, HotelApplication).
   */
  async findAll(status?: ApplicationStatus) {
    const guides = await this.prisma.guideApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: { select: { id: true, email: true, name: true } },
        statusUpdatedByUser: { select: { id: true, email: true, name: true } },
      },
    });

    return guides.map((app) => ({
      ...app,
      partnerType: 'GUIDE' as const,
    }));
  }

  /**
   * Paginated guide application list. Supports filter by status and free-text
   * search across name/email/mobile/NIC.
   */
  async findGuideApplications(query: {
    status?: ApplicationStatus;
    search?: string;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.GuideApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { fullName: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { mobileNumber: { contains: term, mode: 'insensitive' } },
          { nicNumber: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.guideApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: { select: { id: true, email: true, name: true } },
          statusUpdatedByUser: { select: { id: true, email: true, name: true } },
        },
        take,
        skip,
      }),
      this.prisma.guideApplication.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: items.map((a) => ({ ...a, partnerType: 'GUIDE' as const })),
    };
  }

  /**
   * Paginated transport-provider application list. Same filter/search shape
   * as findGuideApplications, used by the admin dashboard.
   */
  async findTransportApplications(query: {
    status?: ApplicationStatus;
    search?: string;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.TransportProviderApplicationWhereInput = {};
    if (query.status) where.status = query.status;
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

    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportProviderApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: { select: { id: true, email: true, name: true } },
          statusUpdatedByUser: { select: { id: true, email: true, name: true } },
        },
        take,
        skip,
      }),
      this.prisma.transportProviderApplication.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: items.map((a) => ({ ...a, partnerType: 'TRANSPORT_PROVIDER' as const })),
    };
  }

  /**
   * Get the full status history for a specific guide application.
   * Extend with a partnerType param when more types are added.
   */
  async getStatusHistory(id: string) {
    const application = await this.prisma.guideApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }

    return this.prisma.applicationStatusHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        updatedByUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Lightweight counts of PENDING applications by partner type. Used by the
   * admin sidebar to show "needs review" badges and poll every minute.
   */
  async getPendingCounts() {
    const [guides, transport] = await this.prisma.$transaction([
      this.prisma.guideApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.transportProviderApplication.count({
        where: { status: 'PENDING' },
      }),
    ]);
    return { guides, transport };
  }

  /**
   * Get a summary count grouped by status — useful for admin dashboards.
   */
  async getStatusSummary() {
    const counts = await this.prisma.guideApplication.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return counts.map((c) => ({
      status: c.status,
      count: c._count.id,
      partnerType: 'GUIDE' as const,
    }));
  }

  /**
   * Queries PostgreSQL's pg_enum catalog directly — the authoritative source.
   * This stays correct even if the enum changes in the DB without a code
   * rebuild, and works for any future enum additions without touching this file.
   */
  async getAllStatuses(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ value: string }[]>`
      SELECT e.enumlabel AS value
      FROM   pg_enum e
      JOIN   pg_type t ON e.enumtypid = t.oid
      WHERE  t.typname = 'ApplicationStatus'
      ORDER  BY e.enumsortorder
    `;
    return rows.map((r) => r.value);
  }
}
