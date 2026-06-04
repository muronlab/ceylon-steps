import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sort options accepted by the public itinerary search endpoint.
 *
 * - `relevance` / `newest`: newest-first (createdAt desc).
 * - `price-asc` / `price-desc`: by price (NULLs last). Currency-agnostic —
 *   clients should also filter by currency when sorting by price to compare
 *   like with like.
 * - `duration-asc` / `duration-desc`: by `durationDays` (NULLs last).
 */
export type ItinerarySort =
  | 'relevance'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'duration-desc';

/**
 * An itinerary is owned by exactly one of three partner kinds. The public API
 * surfaces this so the card can attribute the trip ("with <name>") and link to
 * the right profile.
 */
export type ItineraryOwnerType = 'GUIDE' | 'ACTIVITY_PROVIDER' | 'SAFARI_JEEP';

/** A tag plus how many distinct visible itineraries currently use it. */
export interface TopTag {
  tag: string;
  count: number;
}

export interface SearchPublicItinerariesQuery {
  search?: string;
  /** Restrict to one owner kind. */
  ownerType?: ItineraryOwnerType;
  /** Match itineraries carrying ANY of these tags (stored lowercase, no '#'). */
  tags?: string[];
  /** Match itineraries offered in ANY of these languages. */
  languages?: string[];
  designType?: 'DAYS' | 'TIME' | 'DURATION';
  minDays?: number;
  maxDays?: number;
  /** ISO 4217 currency code — required when filtering by price range. */
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ItinerarySort;
  take?: number;
  skip?: number;
}

// ── Visibility gates ──────────────────────────────────────────────────────
// A profile is publicly visible only when the owner has not hidden it
// (`isActive`), an admin has not disabled it (`adminEnabled`), and the
// underlying account is ACTIVE. Mirrors PublicGuidesService exactly.
const VISIBLE_PROFILE = {
  isActive: true,
  adminEnabled: true,
  user: { status: 'ACTIVE' },
} as const;

const VISIBLE_GUIDE: Prisma.GuideProfileWhereInput = VISIBLE_PROFILE;
const VISIBLE_ACTIVITY: Prisma.ActivityProviderProfileWhereInput =
  VISIBLE_PROFILE;
// Safari jeeps have no adminEnabled of their own — visibility cascades from the
// parent transport-provider profile.
const VISIBLE_SAFARI: Prisma.SafariJeepWhereInput = {
  isActive: true,
  profile: { is: VISIBLE_PROFILE },
};

/** The three relation filters that make an itinerary publicly eligible. */
const ELIGIBLE_OWNER_OR: Prisma.ItineraryWhereInput[] = [
  { guideProfile: { is: VISIBLE_GUIDE } },
  { activityProviderProfile: { is: VISIBLE_ACTIVITY } },
  { safariJeep: { is: VISIBLE_SAFARI } },
];

// Slim owner projections — only the public attribution fields. KYC, contact,
// and admin-only columns are never selected here.
const OWNER_SELECT = {
  guideProfile: {
    select: {
      id: true,
      displayName: true,
      fullName: true,
      profilePhotoUrl: true,
    },
  },
  activityProviderProfile: {
    select: {
      id: true,
      fullName: true,
      businessName: true,
      displayBusinessName: true,
      profilePhotoUrl: true,
    },
  },
  safariJeep: {
    select: {
      id: true,
      profile: {
        select: {
          id: true,
          fullName: true,
          businessName: true,
          hasBusiness: true,
          profilePhotoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.ItineraryInclude;

/** Card fields — what the search grid renders. No heavy detail. */
const CARD_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  designType: true,
  durationDays: true,
  durationMinutes: true,
  durationLabel: true,
  price: true,
  currency: true,
  priceScope: true,
  imageGradient: true,
  coverImageUrl: true,
  tags: true,
  languagesOffered: true,
  sortOrder: true,
  createdAt: true,
  ...OWNER_SELECT,
} satisfies Prisma.ItinerarySelect;

const DETAIL_INCLUDE = {
  days: {
    orderBy: [
      { dayNumber: Prisma.SortOrder.asc },
      { sortOrder: Prisma.SortOrder.asc },
    ],
  },
  inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  ...OWNER_SELECT,
} satisfies Prisma.ItineraryInclude;

type ItineraryWithOwner = {
  guideProfile: {
    id: string;
    displayName: string;
    fullName: string;
    profilePhotoUrl: string | null;
  } | null;
  activityProviderProfile: {
    id: string;
    fullName: string;
    businessName: string;
    displayBusinessName: boolean;
    profilePhotoUrl: string | null;
  } | null;
  safariJeep: {
    id: string;
    profile: {
      id: string;
      fullName: string;
      businessName: string | null;
      hasBusiness: boolean;
      profilePhotoUrl: string | null;
    };
  } | null;
};

export interface PublicItineraryOwner {
  type: ItineraryOwnerType;
  /** The id to display/attribute against — profile id, or safari jeep id. */
  id: string;
  /**
   * For safari itineraries, the owning transport-provider profile id (distinct
   * from the jeep id). Null for guide/activity owners where `id` is already the
   * profile.
   */
  profileId: string | null;
  name: string;
  photoUrl: string | null;
}

function resolveOwner(it: ItineraryWithOwner): PublicItineraryOwner | null {
  if (it.guideProfile) {
    const g = it.guideProfile;
    return {
      type: 'GUIDE',
      id: g.id,
      profileId: g.id,
      name: g.displayName || g.fullName,
      photoUrl: g.profilePhotoUrl,
    };
  }
  if (it.activityProviderProfile) {
    const a = it.activityProviderProfile;
    return {
      type: 'ACTIVITY_PROVIDER',
      id: a.id,
      profileId: a.id,
      // Activity identity is always the business name (provider-name option removed).
      name: a.businessName.trim() ? a.businessName : a.fullName,
      photoUrl: a.profilePhotoUrl,
    };
  }
  if (it.safariJeep) {
    const p = it.safariJeep.profile;
    return {
      type: 'SAFARI_JEEP',
      id: it.safariJeep.id,
      profileId: p.id,
      name: p.hasBusiness && p.businessName ? p.businessName : p.fullName,
      photoUrl: p.profilePhotoUrl,
    };
  }
  return null;
}

/**
 * Replace the three raw owner relations on a row with a single resolved
 * `owner` attribution object, leaving every other field intact.
 */
function withOwner<T extends ItineraryWithOwner>(row: T) {
  const { guideProfile, activityProviderProfile, safariJeep, ...rest } = row;
  return {
    ...rest,
    owner: resolveOwner({ guideProfile, activityProviderProfile, safariJeep }),
  };
}

@Injectable()
export class PublicItinerariesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchPublicItinerariesQuery) {
    const and: Prisma.ItineraryWhereInput[] = [
      // Eligibility: the itinerary's owner must be publicly visible.
      { OR: ELIGIBLE_OWNER_OR },
    ];

    if (query.ownerType) {
      // Narrow to a single owner kind by requiring its FK be set. The
      // eligibility OR above still enforces that owner is visible.
      const fk: keyof Prisma.ItineraryWhereInput =
        query.ownerType === 'GUIDE'
          ? 'guideProfileId'
          : query.ownerType === 'ACTIVITY_PROVIDER'
            ? 'activityProviderProfileId'
            : 'safariJeepId';
      and.push({ [fk]: { not: null } });
    }

    if (query.designType) {
      and.push({ designType: query.designType });
    }

    const hasMinDays = query.minDays !== undefined && query.minDays >= 0;
    const hasMaxDays = query.maxDays !== undefined && query.maxDays >= 0;
    if (hasMinDays || hasMaxDays) {
      const f: { gte?: number; lte?: number } = {};
      if (hasMinDays) f.gte = query.minDays;
      if (hasMaxDays) f.lte = query.maxDays;
      and.push({ durationDays: f });
    }

    if (query.tags && query.tags.length > 0) {
      and.push({ tags: { hasSome: query.tags } });
    }

    if (query.languages && query.languages.length > 0) {
      and.push({ languagesOffered: { hasSome: query.languages } });
    }

    const usesCurrency = !!query.currency;
    const hasMinPrice = query.minPrice !== undefined && query.minPrice >= 0;
    const hasMaxPrice = query.maxPrice !== undefined && query.maxPrice >= 0;
    if (usesCurrency && (hasMinPrice || hasMaxPrice)) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (hasMinPrice) priceFilter.gte = query.minPrice;
      if (hasMaxPrice) priceFilter.lte = query.maxPrice;
      and.push({ currency: query.currency!.toUpperCase(), price: priceFilter });
    }

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        const contains = { contains: term, mode: Prisma.QueryMode.insensitive };
        // Tags are stored lowercase without the leading '#', so match the
        // normalised term exactly against the array.
        const tagTerm = term.replace(/^#+/, '').toLowerCase();
        and.push({
          OR: [
            { title: contains },
            { subtitle: contains },
            { tags: { has: tagTerm } },
            { languagesOffered: { has: term } },
            {
              guideProfile: {
                is: { OR: [{ displayName: contains }, { fullName: contains }] },
              },
            },
            {
              activityProviderProfile: {
                is: {
                  OR: [{ businessName: contains }, { fullName: contains }],
                },
              },
            },
            {
              safariJeep: {
                is: {
                  OR: [
                    { title: contains },
                    {
                      profile: {
                        is: {
                          OR: [
                            { businessName: contains },
                            { fullName: contains },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        });
      }
    }

    const where: Prisma.ItineraryWhereInput = { isActive: true, AND: and };
    const orderBy = this.buildOrderBy(query.sort);
    const take = Math.min(Math.max(query.take ?? 12, 1), 60);
    const skip = Math.max(query.skip ?? 0, 0);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where,
        select: CARD_SELECT,
        orderBy,
        take,
        skip,
      }),
      this.prisma.itinerary.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: rows.map((row) => withOwner(row)),
    };
  }

  /** Filter values currently in use across publicly-visible itineraries. */
  async facets() {
    const rows = await this.prisma.itinerary.findMany({
      where: { isActive: true, AND: [{ OR: ELIGIBLE_OWNER_OR }] },
      select: { tags: true, languagesOffered: true, currency: true },
    });

    const tags = new Set<string>();
    const languages = new Set<string>();
    const currencies = new Set<string>();
    for (const r of rows) {
      for (const t of r.tags) tags.add(t);
      for (const l of r.languagesOffered) languages.add(l);
      if (r.currency) currencies.add(r.currency);
    }

    return {
      tags: [...tags].sort(),
      languages: [...languages].sort(),
      currencies: [...currencies].sort(),
    };
  }

  /**
   * The most-used tags across publicly-visible itineraries, with usage counts,
   * highest first. Powers the "popular tags" chip row on the listings.
   *
   * `ownerType` narrows the pool to one owner kind so each directory shows tags
   * relevant to it.
   *
   * The count reflects what the directory actually lists:
   * - GUIDE: the number of distinct **guides** using the tag. The guides
   *   directory lists guides, so a guide with two itineraries that share a tag
   *   counts once — not twice.
   * - otherwise (all / activity providers): the number of itineraries carrying
   *   the tag, since those directories surface itineraries.
   */
  async topTags(
    ownerType?: ItineraryOwnerType,
    limit = 20,
  ): Promise<{ tags: TopTag[] }> {
    const and: Prisma.ItineraryWhereInput[] = [{ OR: ELIGIBLE_OWNER_OR }];
    if (ownerType) {
      const fk: keyof Prisma.ItineraryWhereInput =
        ownerType === 'GUIDE'
          ? 'guideProfileId'
          : ownerType === 'ACTIVITY_PROVIDER'
            ? 'activityProviderProfileId'
            : 'safariJeepId';
      and.push({ [fk]: { not: null } });
    }

    // The guides directory counts distinct guides per tag, so we need each
    // itinerary's owning guide to de-duplicate. Other scopes count itineraries.
    const dedupeByGuide = ownerType === 'GUIDE';

    const rows = await this.prisma.itinerary.findMany({
      where: { isActive: true, AND: and },
      select: dedupeByGuide
        ? { tags: true, guideProfileId: true }
        : { tags: true },
    });

    let counts: Map<string, number>;
    if (dedupeByGuide) {
      // tag -> set of guide ids; the count is the set size (distinct guides).
      const byTag = new Map<string, Set<string>>();
      for (const r of rows) {
        const guideId = (r as { guideProfileId?: string | null })
          .guideProfileId;
        if (!guideId) continue;
        for (const t of r.tags) {
          let owners = byTag.get(t);
          if (!owners) {
            owners = new Set<string>();
            byTag.set(t, owners);
          }
          owners.add(guideId);
        }
      }
      counts = new Map([...byTag].map(([tag, owners]) => [tag, owners.size]));
    } else {
      counts = new Map<string, number>();
      for (const r of rows) {
        for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const tags = [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      // Most-used first; ties broken alphabetically for a stable order.
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, safeLimit);

    return { tags };
  }

  /**
   * Full itinerary payload — verifies the itinerary is active AND its owner is
   * publicly visible before exposing days / inclusions / gallery / overview.
   */
  async findOne(id: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, isActive: true, AND: [{ OR: ELIGIBLE_OWNER_OR }] },
      include: DETAIL_INCLUDE,
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');

    return withOwner(itinerary);
  }

  private buildOrderBy(
    sort: ItinerarySort | undefined,
  ): Prisma.ItineraryOrderByWithRelationInput[] {
    switch (sort) {
      case 'price-asc':
        return [
          { price: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'desc' },
        ];
      case 'price-desc':
        return [
          { price: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ];
      case 'duration-asc':
        return [
          { durationDays: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'desc' },
        ];
      case 'duration-desc':
        return [
          { durationDays: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ];
      case 'newest':
      case 'relevance':
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
