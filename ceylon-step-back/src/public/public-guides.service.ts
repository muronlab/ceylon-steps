import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sort options accepted by the public search endpoint.
 *
 * - `relevance`: default newest-first ordering.
 * - `experience-desc`: most experienced first (NULLs last).
 * - `price-asc` / `price-desc`: by daily rate, then hourly as a tiebreaker
 *   (NULLs last). Currency-agnostic: clients should also filter by currency
 *   when sorting by price to compare like with like.
 */
export type GuideSort =
  | 'relevance'
  | 'newest'
  | 'experience-desc'
  | 'price-asc'
  | 'price-desc';

export interface SearchPublicGuidesQuery {
  search?: string;
  category?: string;
  /** Region names (matches if guide specialises in any of them). */
  regions?: string[];
  /** Language names (matches if guide speaks any of them). */
  languages?: string[];
  /** Minimum years of experience. */
  minExperience?: number;
  /** ISO 4217 currency code — required when filtering by price range. */
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: GuideSort;
  take?: number;
  skip?: number;
}

const PUBLIC_LIST_SELECT = {
  id: true,
  displayName: true,
  category: true,
  tagline: true,
  regionsSpecialized: true,
  profilePhotoUrl: true,
  coverPhotoUrl: true,
  yearsOfExperience: true,
  currency: true,
  pricePerHour: true,
  pricePerDay: true,
  languages: {
    select: { id: true, language: true, level: true, countryCode: true },
    orderBy: { language: Prisma.SortOrder.asc },
  },
} satisfies Prisma.GuideProfileSelect;

/**
 * Slim itinerary projection used on the guide-detail endpoint — only what the
 * card grid needs. The expensive fields (overview HTML, days, inclusions,
 * galleryImages) load on demand from `getItineraryDetail()` when the user
 * actually opens an itinerary.
 */
const PUBLIC_ITINERARY_CARD_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  designType: true,
  durationDays: true,
  durationLabel: true,
  price: true,
  currency: true,
  priceScope: true,
  imageGradient: true,
  coverImageUrl: true,
  sortOrder: true,
} satisfies Prisma.ItinerarySelect;

const PUBLIC_DETAIL_INCLUDE = {
  languages: { orderBy: { language: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  itineraries: {
    where: { isActive: true },
    orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }],
    select: PUBLIC_ITINERARY_CARD_SELECT,
  },
} satisfies Prisma.GuideProfileInclude;

const PUBLIC_ITINERARY_DETAIL_INCLUDE = {
  days: {
    orderBy: [
      { dayNumber: Prisma.SortOrder.asc },
      { sortOrder: Prisma.SortOrder.asc },
    ],
  },
  inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
} satisfies Prisma.ItineraryInclude;

@Injectable()
export class PublicGuidesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchPublicGuidesQuery) {
    const where: Prisma.GuideProfileWhereInput = {
      // Three independent gates. `isActive` is owner-controlled (guide can hide
      // themselves); `adminEnabled` is admin-controlled (cascades from user
      // status but admin can toggle independently); `user.status` is the
      // account-level switch. Public listing only shows the profile when all
      // three say yes.
      isActive: true,
      adminEnabled: true,
      user: { status: 'ACTIVE' },
    };

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
      // Include the guide if EITHER their daily rate OR their hourly rate
      // falls inside the range. `lte` / `gte` skip NULL columns, so a guide
      // with only a daily rate set still matches via the daily branch.
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

    const orderBy = this.buildOrderBy(query.sort);

    const take = Math.min(Math.max(query.take ?? 12, 1), 60);
    const skip = Math.max(query.skip ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.guideProfile.findMany({
        where,
        select: PUBLIC_LIST_SELECT,
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
        id: g.id,
        displayName: g.displayName,
        // Category fallback shown when the guide hasn't picked one.
        category: g.category ?? 'Other',
        tagline: g.tagline,
        profilePhotoUrl: g.profilePhotoUrl,
        coverPhotoUrl: g.coverPhotoUrl,
        yearsOfExperience: g.yearsOfExperience,
        currency: g.currency,
        pricePerHour: g.pricePerHour,
        pricePerDay: g.pricePerDay,
        regionsSpecialized: g.regionsSpecialized ?? [],
        languages: g.languages,
      })),
    };
  }

  /** Filters available to the UI — derived from currently-active profiles. */
  async facets() {
    const profiles = await this.prisma.guideProfile.findMany({
      where: { isActive: true, adminEnabled: true, user: { status: 'ACTIVE' } },
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

  async findOne(id: string) {
    const guide = await this.prisma.guideProfile.findFirst({
      where: {
        id,
        isActive: true,
        adminEnabled: true,
        user: { status: 'ACTIVE' },
      },
      include: PUBLIC_DETAIL_INCLUDE,
    });
    if (!guide) throw new NotFoundException('Guide not found');

    // Strip KYC + admin-only fields before returning publicly. Done by
    // explicit projection so the type stays stable even if upstream relations
    // shift around.
    const g = guide as typeof guide & {
      languages: unknown[];
      galleryImages: unknown[];
      itineraries: unknown[];
      tagline: string | null;
      regionsSpecialized: string[];
    };
    return {
      id: g.id,
      fullName: g.fullName,
      displayName: g.displayName,
      category: g.category,
      email: g.email,
      mobileNumber: g.mobileNumber,
      whatsappNumber: g.whatsappNumber,
      whatsappAvailable: g.whatsappAvailable,
      address: g.address,
      profilePhotoUrl: g.profilePhotoUrl,
      coverPhotoUrl: g.coverPhotoUrl,
      bio: g.bio,
      tagline: g.tagline,
      regionsSpecialized: g.regionsSpecialized ?? [],
      yearsOfExperience: g.yearsOfExperience,
      currency: g.currency,
      pricePerHour: g.pricePerHour,
      pricePerDay: g.pricePerDay,
      isActive: g.isActive,
      approvedAt: g.approvedAt,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      languages: g.languages,
      galleryImages: g.galleryImages,
      itineraries: g.itineraries,
    };
  }

  /**
   * Full itinerary payload — heavy fields (overview HTML, days, inclusions,
   * gallery) loaded only when the public guide page opens the dialog. The
   * `guideId` is required so we can verify the itinerary belongs to a
   * publicly-visible guide before exposing its contents.
   */
  async getItineraryDetail(guideId: string, itineraryId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        isActive: true,
        guideProfileId: guideId,
        guideProfile: {
          isActive: true,
          adminEnabled: true,
          user: { status: 'ACTIVE' },
        },
      },
      include: PUBLIC_ITINERARY_DETAIL_INCLUDE,
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    return itinerary;
  }

  private buildOrderBy(sort: GuideSort | undefined): Prisma.GuideProfileOrderByWithRelationInput[] {
    switch (sort) {
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
      case 'relevance':
      default:
        return [{ approvedAt: 'desc' }];
    }
  }
}
