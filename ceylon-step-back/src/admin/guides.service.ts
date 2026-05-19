import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { SetGuideLanguagesDto } from './dto/set-guide-languages.dto';
import { SetGuideGalleryDto } from './dto/set-guide-gallery.dto';

const GUIDE_LIST_SELECT = {
  id: true,
  userId: true,
  displayName: true,
  fullName: true,
  category: true,
  email: true,
  mobileNumber: true,
  whatsappNumber: true,
  whatsappAvailable: true,
  profilePhotoUrl: true,
  coverPhotoUrl: true,
  isActive: true,
  adminEnabled: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { galleryImages: true, languages: true } },
} satisfies Prisma.GuideProfileSelect;

const ADMIN_SEARCH_SELECT = {
  id: true,
  userId: true,
  displayName: true,
  fullName: true,
  category: true,
  tagline: true,
  regionsSpecialized: true,
  email: true,
  mobileNumber: true,
  whatsappNumber: true,
  whatsappAvailable: true,
  profilePhotoUrl: true,
  coverPhotoUrl: true,
  yearsOfExperience: true,
  currency: true,
  pricePerHour: true,
  pricePerDay: true,
  isActive: true,
  adminEnabled: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, name: true, status: true } },
  languages: {
    select: { id: true, language: true, level: true, countryCode: true },
    orderBy: { language: Prisma.SortOrder.asc },
  },
  _count: {
    select: { galleryImages: true, languages: true, itineraries: true },
  },
} satisfies Prisma.GuideProfileSelect;

const GUIDE_DETAIL_INCLUDE = {
  languages: { orderBy: { language: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  itineraries: {
    orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }],
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
} satisfies Prisma.GuideProfileInclude;

@Injectable()
export class GuidesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { search?: string; take?: number; skip?: number }) {
    const where: Prisma.GuideProfileWhereInput = {};
    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { displayName: { contains: term, mode: 'insensitive' } },
          { fullName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { mobileNumber: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.guideProfile.findMany({
        where,
        select: GUIDE_LIST_SELECT,
        orderBy: { approvedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.guideProfile.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: items.map((g) => ({
        ...g,
        galleryCount: g._count.galleryImages,
        languageCount: g._count.languages,
        _count: undefined,
      })),
    };
  }

  /**
   * Admin search — same shape as the public search but with no `isActive`
   * filter (admins see everyone), and additional fields are projected.
   * Owner email + status are included; KYC docs are not — those live on the
   * detail endpoint only.
   */
  async search(query: {
    search?: string;
    category?: string;
    regions?: string[];
    languages?: string[];
    minExperience?: number;
    currency?: string;
    minPrice?: number;
    maxPrice?: number;
    /** "active" | "inactive" | undefined (any) */
    status?: 'active' | 'inactive';
    sort?:
      | 'relevance'
      | 'newest'
      | 'experience-desc'
      | 'price-asc'
      | 'price-desc';
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.GuideProfileWhereInput = {};

    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.minExperience !== undefined && query.minExperience > 0) {
      where.yearsOfExperience = { gte: query.minExperience };
    }

    if (query.regions && query.regions.length > 0) {
      where.regionsSpecialized = { hasSome: query.regions };
    }

    if (query.languages && query.languages.length > 0) {
      where.languages = { some: { language: { in: query.languages } } };
    }

    const andClauses: Prisma.GuideProfileWhereInput[] = [];

    const usesCurrency = !!query.currency;
    const hasMinPrice = query.minPrice !== undefined && query.minPrice >= 0;
    const hasMaxPrice = query.maxPrice !== undefined && query.maxPrice >= 0;
    if (usesCurrency && (hasMinPrice || hasMaxPrice)) {
      where.currency = query.currency!.toUpperCase();
      const priceFilter: { gte?: number; lte?: number } = {};
      if (hasMinPrice) priceFilter.gte = query.minPrice;
      if (hasMaxPrice) priceFilter.lte = query.maxPrice;
      andClauses.push({
        OR: [{ pricePerDay: priceFilter }, { pricePerHour: priceFilter }],
      });
    }

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        andClauses.push({
          OR: [
            { displayName: { contains: term, mode: 'insensitive' } },
            { fullName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { mobileNumber: { contains: term, mode: 'insensitive' } },
            { tagline: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
            { regionsSpecialized: { has: term } },
            {
              languages: {
                some: { language: { contains: term, mode: 'insensitive' } },
              },
            },
          ],
        });
      }
    }

    if (andClauses.length > 0) where.AND = andClauses;

    const orderBy: Prisma.GuideProfileOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case 'experience-desc':
          return [
            { yearsOfExperience: { sort: 'desc', nulls: 'last' } },
            { approvedAt: 'desc' },
          ];
        case 'price-asc':
          return [
            { pricePerDay: { sort: 'asc', nulls: 'last' } },
            { pricePerHour: { sort: 'asc', nulls: 'last' } },
          ];
        case 'price-desc':
          return [
            { pricePerDay: { sort: 'desc', nulls: 'last' } },
            { pricePerHour: { sort: 'desc', nulls: 'last' } },
          ];
        case 'newest':
          return [{ createdAt: 'desc' }];
        case 'relevance':
        default:
          return [{ approvedAt: 'desc' }];
      }
    })();

    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.guideProfile.findMany({
        where,
        select: ADMIN_SEARCH_SELECT,
        orderBy,
        take,
        skip,
      }),
      this.prisma.guideProfile.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: items.map((g) => ({
        ...g,
        galleryCount: g._count.galleryImages,
        languageCount: g._count.languages,
        itineraryCount: g._count.itineraries,
        _count: undefined,
      })),
    };
  }

  /** Filter values currently in use across all guide profiles (active + inactive). */
  async facets() {
    const profiles = await this.prisma.guideProfile.findMany({
      select: {
        category: true,
        regionsSpecialized: true,
        currency: true,
        languages: { select: { language: true } },
      },
    });

    const categories = new Set<string>();
    const regions = new Set<string>();
    const languages = new Set<string>();
    const currencies = new Set<string>();
    for (const p of profiles) {
      if (p.category) categories.add(p.category);
      for (const r of p.regionsSpecialized ?? []) regions.add(r);
      for (const l of p.languages) languages.add(l.language);
      if (p.currency) currencies.add(p.currency);
    }

    return {
      categories: [...categories].sort(),
      regions: [...regions].sort(),
      languages: [...languages].sort(),
      currencies: [...currencies].sort(),
    };
  }

  async detail(id: string) {
    const guide = await this.prisma.guideProfile.findUnique({
      where: { id },
      include: GUIDE_DETAIL_INCLUDE,
    });
    if (!guide) throw new NotFoundException('Guide profile not found');
    return guide;
  }

  async detailByUserId(userId: string) {
    const guide = await this.prisma.guideProfile.findUnique({
      where: { userId },
      include: GUIDE_DETAIL_INCLUDE,
    });
    if (!guide) throw new NotFoundException('Guide profile not found');
    return guide;
  }

  async updateProfile(id: string, dto: UpdateGuideProfileDto) {
    const existing = await this.prisma.guideProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Guide profile not found');

    const data: Prisma.GuideProfileUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.whatsappNumber !== undefined) data.whatsappNumber = dto.whatsappNumber;
    if (dto.whatsappAvailable !== undefined) data.whatsappAvailable = dto.whatsappAvailable;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.profilePhotoUrl !== undefined) data.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.coverPhotoUrl !== undefined) data.coverPhotoUrl = dto.coverPhotoUrl;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.regionsSpecialized !== undefined) {
      data.regionsSpecialized = dto.regionsSpecialized
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.yearsOfExperience !== undefined) data.yearsOfExperience = dto.yearsOfExperience;
    if (dto.currency !== undefined) {
      data.currency = dto.currency ? dto.currency.toUpperCase() : null;
    }
    if (dto.pricePerHour !== undefined) data.pricePerHour = dto.pricePerHour;
    if (dto.pricePerDay !== undefined) data.pricePerDay = dto.pricePerDay;

    await this.prisma.guideProfile.update({ where: { id }, data });
    return this.detail(id);
  }

  /**
   * Admin-only visibility toggle. Writes the `adminEnabled` flag and audit-logs
   * the action. Independent of the owner-controlled `isActive` flag — the
   * profile is only public when both are true (see PublicGuidesService).
   */
  async setAdminEnabled(actorId: string, id: string, adminEnabled: boolean) {
    const existing = await this.prisma.guideProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Guide profile not found');

    await this.prisma.$transaction([
      this.prisma.guideProfile.update({
        where: { id },
        data: { adminEnabled },
      }),
      this.prisma.auditLog.create({
        data: {
          action: adminEnabled ? 'ADMIN_ENABLE_GUIDE' : 'ADMIN_DISABLE_GUIDE',
          userId: actorId,
        },
      }),
    ]);

    return this.detail(id);
  }

  async setLanguages(id: string, dto: SetGuideLanguagesDto) {
    const existing = await this.prisma.guideProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Guide profile not found');

    // Deduplicate by language name (case-insensitive); last entry wins.
    type Entry = {
      language: string;
      level: SetGuideLanguagesDto['languages'][number]['level'];
      countryCode: string | null;
    };
    const seen = new Map<string, Entry>();
    for (const entry of dto.languages) {
      const key = entry.language.trim().toLowerCase();
      if (!key) continue;
      const code = entry.countryCode ? entry.countryCode.trim().toUpperCase() : null;
      seen.set(key, {
        language: entry.language.trim(),
        level: entry.level,
        countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
      });
    }
    const entries = [...seen.values()];

    await this.prisma.$transaction([
      this.prisma.guideLanguage.deleteMany({ where: { guideProfileId: id } }),
      ...(entries.length
        ? [
            this.prisma.guideLanguage.createMany({
              data: entries.map((e) => ({
                guideProfileId: id,
                language: e.language,
                level: e.level,
                countryCode: e.countryCode,
              })),
            }),
          ]
        : []),
    ]);

    return this.detail(id);
  }

  async setGallery(id: string, dto: SetGuideGalleryDto) {
    const existing = await this.prisma.guideProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Guide profile not found');

    await this.prisma.$transaction([
      this.prisma.guideGalleryImage.deleteMany({ where: { guideProfileId: id } }),
      ...(dto.images.length
        ? [
            this.prisma.guideGalleryImage.createMany({
              data: dto.images.map((img, index) => ({
                guideProfileId: id,
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: img.sortOrder ?? index,
              })),
            }),
          ]
        : []),
    ]);

    return this.detail(id);
  }
}
