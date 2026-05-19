import apiClient from "./api-client"

export type GuideSort =
  | "relevance"
  | "newest"
  | "experience-desc"
  | "price-asc"
  | "price-desc"

export interface PublicGuideListLanguage {
  id: string
  language: string
  level: "CONVERSATIONAL" | "FLUENT" | "NATIVE"
  countryCode: string | null
}

export interface PublicGuideListItem {
  id: string
  displayName: string
  /** Falls back to "Other" on the backend when category is null. */
  category: string
  tagline: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  yearsOfExperience: number | null
  currency: string | null
  /** Decimal serialised as string. */
  pricePerHour: string | null
  pricePerDay: string | null
  regionsSpecialized: string[]
  languages: PublicGuideListLanguage[]
}

export interface PublicGuideListResponse {
  total: number
  take: number
  skip: number
  items: PublicGuideListItem[]
}

export interface PublicGuideFacets {
  categories: string[]
  regions: string[]
  languages: string[]
  currencies: string[]
}

export interface PublicGuideDetailLanguage extends PublicGuideListLanguage {
  guideProfileId: string
}

export interface PublicGuideDetailGalleryImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface PublicGuideDetailItineraryDay {
  id: string
  dayNumber: number
  title: string
  description: string | null
  /** "HH:mm" — only set when the parent itinerary's designType is TIME. */
  startTime: string | null
  endTime: string | null
  sortOrder: number
}

export interface PublicGuideDetailItineraryInclusion {
  id: string
  kind: "INCLUDED" | "EXCLUDED"
  text: string
  sortOrder: number
}

export interface PublicGuideDetailItineraryImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

/**
 * Slim card payload returned by `GET /public/guides/:id`. Has only the fields
 * the card grid renders — no overview HTML, no days, no inclusions, no
 * gallery. Open an itinerary to fetch the full detail.
 */
export interface PublicGuideItineraryCard {
  id: string
  title: string
  subtitle: string | null
  designType: "DAYS" | "TIME"
  durationDays: number | null
  durationLabel: string | null
  price: string | null
  currency: string | null
  priceScope: "PER_PERSON" | "PER_GROUP" | "PER_DAY"
  imageGradient: string | null
  coverImageUrl: string | null
  sortOrder: number
}

/**
 * Full itinerary payload from `GET /public/guides/:guideId/itineraries/:itineraryId`.
 * Loaded on demand when the user opens an itinerary.
 */
export interface PublicGuideDetailItinerary {
  id: string
  title: string
  subtitle: string | null
  designType: "DAYS" | "TIME"
  languagesOffered: string[]
  tags: string[]
  durationDays: number | null
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
}

export interface PublicGuideDetail {
  id: string
  fullName: string
  displayName: string
  category: string | null
  email: string
  mobileNumber: string
  whatsappNumber: string | null
  whatsappAvailable: boolean
  address: string
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  bio: string | null
  tagline: string | null
  regionsSpecialized: string[]
  yearsOfExperience: number | null
  currency: string | null
  pricePerHour: string | null
  pricePerDay: string | null
  isActive: boolean
  approvedAt: string
  createdAt: string
  updatedAt: string
  languages: PublicGuideDetailLanguage[]
  galleryImages: PublicGuideDetailGalleryImage[]
  /** Slim itinerary cards — open one to fetch its full detail. */
  itineraries: PublicGuideItineraryCard[]
}

export interface SearchPublicGuidesParams {
  search?: string
  category?: string
  regions?: string[]
  languages?: string[]
  minExperience?: number
  currency?: string
  minPrice?: number
  maxPrice?: number
  sort?: GuideSort
  take?: number
  skip?: number
}

function csv(values?: string[]) {
  if (!values || values.length === 0) return undefined
  return values.join(",")
}

export const publicGuidesService = {
  async search(params: SearchPublicGuidesParams): Promise<PublicGuideListResponse> {
    const res = await apiClient.get<PublicGuideListResponse>("/public/guides", {
      params: {
        search: params.search,
        category: params.category,
        regions: csv(params.regions),
        languages: csv(params.languages),
        minExperience: params.minExperience,
        currency: params.currency,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        sort: params.sort,
        take: params.take,
        skip: params.skip,
      },
    })
    return res.data
  },

  async facets(): Promise<PublicGuideFacets> {
    const res = await apiClient.get<PublicGuideFacets>("/public/guides/facets")
    return res.data
  },

  async findOne(id: string): Promise<PublicGuideDetail> {
    const res = await apiClient.get<PublicGuideDetail>(`/public/guides/${id}`)
    return res.data
  },

  async getItinerary(
    guideId: string,
    itineraryId: string,
  ): Promise<PublicGuideDetailItinerary> {
    const res = await apiClient.get<PublicGuideDetailItinerary>(
      `/public/guides/${guideId}/itineraries/${itineraryId}`,
    )
    return res.data
  },
}
