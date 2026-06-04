import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public profile endpoints for the non-guide partner kinds. Guides already have
 * `PublicGuidesService`; these mirror its shape (header + contact + offerings +
 * itinerary cards) so the itinerary detail page can render "about the provider"
 * for whichever owner a trip belongs to.
 *
 * Every projection here is KYC-safe: NIC numbers, document URLs and licence
 * URLs are never selected.
 */

const VISIBLE_PROFILE = {
  isActive: true,
  adminEnabled: true,
  user: { status: 'ACTIVE' },
} as const;

/** Slim itinerary card — same fields as the public search card, minus owner
 * attribution (the owner is the profile being viewed). */
const ITINERARY_CARD_SELECT = {
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
  tags: true,
  languagesOffered: true,
  sortOrder: true,
  createdAt: true,
} satisfies Prisma.ItinerarySelect;

const ITINERARY_CARD_ORDER: Prisma.ItineraryOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { createdAt: 'desc' },
];

/**
 * Sort options for the public activity-provider listing. Mirrors the guide
 * listing so both partner directories behave the same.
 */
export type ActivityProviderSort =
  | 'relevance'
  | 'newest'
  | 'experience-desc'
  | 'price-asc'
  | 'price-desc';

export interface SearchActivityProvidersQuery {
  search?: string;
  /** Language names (matches if the provider speaks any of them). */
  languages?: string[];
  minExperience?: number;
  /** ISO 4217 currency code — required when filtering by price range. */
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ActivityProviderSort;
  take?: number;
  skip?: number;
}

const ACTIVITY_LIST_SELECT = {
  id: true,
  fullName: true,
  businessName: true,
  businessNameColor: true,
  displayBusinessName: true,
  natureOfBusiness: true,
  description: true,
  profilePhotoUrl: true,
  coverPhotoUrl: true,
  yearsOfExperience: true,
  currency: true,
  pricePerHour: true,
  pricePerDay: true,
  packagePrice: true,
  packagePriceScope: true,
  languages: {
    select: { id: true, language: true, level: true, countryCode: true },
    orderBy: { language: Prisma.SortOrder.asc },
  },
} satisfies Prisma.ActivityProviderProfileSelect;

@Injectable()
export class PublicPartnersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paginated, public search across visible activity-provider profiles. */
  async searchActivityProviders(query: SearchActivityProvidersQuery) {
    const where: Prisma.ActivityProviderProfileWhereInput = {
      isActive: true,
      adminEnabled: true,
      user: { status: 'ACTIVE' },
    };

    if (query.minExperience !== undefined && query.minExperience > 0) {
      where.yearsOfExperience = { gte: query.minExperience };
    }

    if (query.languages && query.languages.length > 0) {
      where.languages = { some: { language: { in: query.languages } } };
    }

    const and: Prisma.ActivityProviderProfileWhereInput[] = [];

    const usesCurrency = !!query.currency;
    const hasMinPrice = query.minPrice !== undefined && query.minPrice >= 0;
    const hasMaxPrice = query.maxPrice !== undefined && query.maxPrice >= 0;
    if (usesCurrency && (hasMinPrice || hasMaxPrice)) {
      where.currency = query.currency!.toUpperCase();
      const priceFilter: { gte?: number; lte?: number } = {};
      if (hasMinPrice) priceFilter.gte = query.minPrice;
      if (hasMaxPrice) priceFilter.lte = query.maxPrice;
      and.push({
        OR: [{ pricePerDay: priceFilter }, { pricePerHour: priceFilter }],
      });
    }

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        const contains = { contains: term, mode: Prisma.QueryMode.insensitive };
        and.push({
          OR: [
            { fullName: contains },
            { businessName: contains },
            { natureOfBusiness: contains },
            {
              languages: {
                some: { language: contains },
              },
            },
          ],
        });
      }
    }

    if (and.length > 0) where.AND = and;

    const orderBy = this.buildActivityOrderBy(query.sort);
    const take = Math.min(Math.max(query.take ?? 12, 1), 60);
    const skip = Math.max(query.skip ?? 0, 0);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.activityProviderProfile.findMany({
        where,
        select: ACTIVITY_LIST_SELECT,
        orderBy,
        take,
        skip,
      }),
      this.prisma.activityProviderProfile.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      items: rows.map((p) => ({
        id: p.id,
        displayName: p.businessName.trim() ? p.businessName : p.fullName,
        businessName: p.businessName,
        businessNameColor: p.businessNameColor,
        natureOfBusiness: p.natureOfBusiness,
        description: p.description,
        profilePhotoUrl: p.profilePhotoUrl,
        coverPhotoUrl: p.coverPhotoUrl,
        yearsOfExperience: p.yearsOfExperience,
        currency: p.currency,
        pricePerHour: p.pricePerHour,
        pricePerDay: p.pricePerDay,
        packagePrice: p.packagePrice,
        packagePriceScope: p.packagePriceScope,
        languages: p.languages,
      })),
    };
  }

  private buildActivityOrderBy(
    sort: ActivityProviderSort | undefined,
  ): Prisma.ActivityProviderProfileOrderByWithRelationInput[] {
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

  async getActivityProvider(id: string) {
    const profile = await this.prisma.activityProviderProfile.findFirst({
      where: { id, ...VISIBLE_PROFILE },
      include: {
        languages: { orderBy: { language: Prisma.SortOrder.asc } },
        galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
        itineraries: {
          where: { isActive: true },
          orderBy: ITINERARY_CARD_ORDER,
          select: ITINERARY_CARD_SELECT,
        },
      },
    });
    if (!profile) throw new NotFoundException('Activity provider not found');

    // Business-level contact details fall back to the provider's own values
    // when null (see schema comments on the *_business* fields).
    return {
      id: profile.id,
      type: 'ACTIVITY_PROVIDER' as const,
      // Activity identity is always the business name (the provider-name option
      // was removed from the editor); only fall back to the person if unset.
      displayName: profile.businessName.trim()
        ? profile.businessName
        : profile.fullName,
      fullName: profile.fullName,
      businessName: profile.businessName,
      businessNameColor: profile.businessNameColor,
      displayBusinessName: profile.displayBusinessName,
      natureOfBusiness: profile.natureOfBusiness,
      description: profile.description,
      email: profile.businessEmail ?? profile.contactEmail,
      mobileNumber: profile.businessPhone ?? profile.mobileNumber,
      whatsappAvailable: profile.whatsappAvailable,
      address: profile.businessAddress ?? profile.address,
      profilePhotoUrl: profile.profilePhotoUrl,
      coverPhotoUrl: profile.coverPhotoUrl,
      yearsOfExperience: profile.yearsOfExperience,
      currency: profile.currency,
      pricePerHour: profile.pricePerHour,
      pricePerDay: profile.pricePerDay,
      packagePrice: profile.packagePrice,
      packagePriceScope: profile.packagePriceScope,
      approvedAt: profile.approvedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      languages: profile.languages,
      galleryImages: profile.galleryImages,
      itineraries: profile.itineraries,
    };
  }

  async getTransportProvider(id: string) {
    const profile = await this.prisma.transportProviderProfile.findFirst({
      where: { id, ...VISIBLE_PROFILE },
      include: {
        safariJeeps: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            vehicleType: true,
            condition: true,
            passengerCapacity: true,
            nationalParks: true,
            pickupLocation: true,
            images: {
              orderBy: { sortOrder: Prisma.SortOrder.asc },
              select: {
                id: true,
                imageUrl: true,
                caption: true,
                sortOrder: true,
              },
            },
          },
        },
        vehicles: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            vehicleType: true,
            fuelType: true,
            condition: true,
            pickupLocation: true,
            images: {
              orderBy: { sortOrder: Prisma.SortOrder.asc },
              select: {
                id: true,
                imageUrl: true,
                caption: true,
                sortOrder: true,
              },
            },
          },
        },
        driverServices: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            coverImageUrl: true,
            basePrice: true,
            currency: true,
            priceUnit: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Transport provider not found');

    // A transport provider's itineraries hang off their safari jeeps, not the
    // profile directly — fetch them across all the provider's jeeps.
    const itineraries = await this.prisma.itinerary.findMany({
      where: {
        isActive: true,
        safariJeep: { is: { isActive: true, profileId: profile.id } },
      },
      orderBy: ITINERARY_CARD_ORDER,
      select: ITINERARY_CARD_SELECT,
    });

    return {
      id: profile.id,
      type: 'TRANSPORT_PROVIDER' as const,
      displayName:
        profile.hasBusiness && profile.businessName
          ? profile.businessName
          : profile.fullName,
      fullName: profile.fullName,
      providerType: profile.providerType,
      hasBusiness: profile.hasBusiness,
      businessName: profile.businessName,
      businessDescription: profile.businessDescription,
      email: profile.contactEmail,
      mobileNumber: profile.mobileNumber,
      whatsappAvailable: profile.whatsappAvailable,
      profilePhotoUrl: profile.profilePhotoUrl,
      coverPhotoUrl: profile.coverPhotoUrl,
      approvedAt: profile.approvedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      safariJeeps: profile.safariJeeps,
      vehicles: profile.vehicles,
      driverServices: profile.driverServices,
      itineraries,
    };
  }
}
