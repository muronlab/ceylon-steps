import apiClient from "./api-client"
import type {
  PublicGuideDetailItineraryDay,
  PublicGuideDetailItineraryInclusion,
  PublicGuideDetailItineraryImage,
} from "./public-guides.service"

export type ItinerarySort =
  | "relevance"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "duration-asc"
  | "duration-desc"

export type ItineraryOwnerType = "GUIDE" | "ACTIVITY_PROVIDER" | "SAFARI_JEEP"

/** Owner attribution shown on the card ("with <name>") and used to link out. */
export interface PublicItineraryOwner {
  type: ItineraryOwnerType
  /** Profile id (guide/activity) or safari jeep id. */
  id: string
  /**
   * For safari itineraries, the owning transport-provider profile id (distinct
   * from the jeep id). Equals `id` for guide/activity owners.
   */
  profileId: string | null
  name: string
  photoUrl: string | null
}

/**
 * Slim card payload from `GET /public/itineraries`. Has only the fields the
 * search grid renders — open one to fetch its full detail.
 */
export interface PublicItineraryCard {
  id: string
  title: string
  subtitle: string | null
  designType: "DAYS" | "TIME" | "DURATION"
  durationDays: number | null
  /** Total minutes — set only when designType is DURATION. */
  durationMinutes: number | null
  durationLabel: string | null
  /** Decimal serialised as string. */
  price: string | null
  currency: string | null
  priceScope: "PER_PERSON" | "PER_GROUP" | "PER_DAY"
  imageGradient: string | null
  coverImageUrl: string | null
  tags: string[]
  languagesOffered: string[]
  sortOrder: number
  createdAt: string
  owner: PublicItineraryOwner | null
}

export interface PublicItineraryListResponse {
  total: number
  take: number
  skip: number
  items: PublicItineraryCard[]
}

export interface PublicItineraryFacets {
  tags: string[]
  languages: string[]
  currencies: string[]
}

/** A tag plus how many visible itineraries use it (for popular-tag chips). */
export interface TopTag {
  tag: string
  count: number
}

export interface TopTagsResponse {
  tags: TopTag[]
}

/** Full itinerary payload from `GET /public/itineraries/:id`. */
export interface PublicItineraryDetail {
  id: string
  title: string
  subtitle: string | null
  designType: "DAYS" | "TIME" | "DURATION"
  languagesOffered: string[]
  tags: string[]
  durationDays: number | null
  /** Total minutes — set only when designType is DURATION. */
  durationMinutes: number | null
  durationLabel: string | null
  price: string | null
  currency: string | null
  priceScope: "PER_PERSON" | "PER_GROUP" | "PER_DAY"
  overview: string | null
  transportation: string | null
  meetingLocation: string | null
  imageGradient: string | null
  coverImageUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  days: PublicGuideDetailItineraryDay[]
  inclusions: PublicGuideDetailItineraryInclusion[]
  galleryImages: PublicGuideDetailItineraryImage[]
  owner: PublicItineraryOwner | null
}

export interface SearchPublicItinerariesParams {
  search?: string
  ownerType?: ItineraryOwnerType
  tags?: string[]
  languages?: string[]
  designType?: "DAYS" | "TIME" | "DURATION"
  minDays?: number
  maxDays?: number
  currency?: string
  minPrice?: number
  maxPrice?: number
  sort?: ItinerarySort
  take?: number
  skip?: number
}

function csv(values?: string[]) {
  if (!values || values.length === 0) return undefined
  return values.join(",")
}

export const publicItinerariesService = {
  async search(
    params: SearchPublicItinerariesParams,
  ): Promise<PublicItineraryListResponse> {
    const res = await apiClient.get<PublicItineraryListResponse>(
      "/public/itineraries",
      {
        params: {
          search: params.search,
          ownerType: params.ownerType,
          tags: csv(params.tags),
          languages: csv(params.languages),
          designType: params.designType,
          minDays: params.minDays,
          maxDays: params.maxDays,
          currency: params.currency,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          sort: params.sort,
          take: params.take,
          skip: params.skip,
        },
      },
    )
    return res.data
  },

  async facets(): Promise<PublicItineraryFacets> {
    const res = await apiClient.get<PublicItineraryFacets>(
      "/public/itineraries/facets",
    )
    return res.data
  },

  /** Most-used tags across all visible itineraries (top 20, with counts). */
  async topTags(): Promise<TopTag[]> {
    const res = await apiClient.get<TopTagsResponse>(
      "/public/itineraries/top-tags",
    )
    return res.data.tags
  },

  async findOne(id: string): Promise<PublicItineraryDetail> {
    const res = await apiClient.get<PublicItineraryDetail>(
      `/public/itineraries/${id}`,
    )
    return res.data
  },
}
