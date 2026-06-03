import apiClient from "./api-client"

export type ItineraryInclusionKind = "INCLUDED" | "EXCLUDED"
export type ItineraryDesignType = "DAYS" | "TIME"
export type ItineraryPriceScope = "PER_PERSON" | "PER_GROUP" | "PER_DAY"

export interface ItineraryDay {
  id: string
  itineraryId: string
  dayNumber: number
  title: string
  description: string | null
  /** "HH:mm" — present only when the parent itinerary's designType is TIME. */
  startTime: string | null
  /** "HH:mm" — present only when the parent itinerary's designType is TIME. */
  endTime: string | null
  sortOrder: number
}

export interface ItineraryInclusion {
  id: string
  itineraryId: string
  kind: ItineraryInclusionKind
  text: string
  sortOrder: number
}

export interface ItineraryImage {
  id: string
  itineraryId: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface GuideItinerary {
  id: string
  // An itinerary is owned by exactly one of these (the other is null).
  guideProfileId: string | null
  activityProviderProfileId?: string | null

  title: string
  subtitle: string | null
  designType: ItineraryDesignType
  languagesOffered: string[]
  tags: string[]
  durationDays: number | null
  durationLabel: string | null
  /** Prisma serialises Decimal as a string over JSON. */
  price: string | null
  currency: string | null
  priceScope: ItineraryPriceScope
  overview: string | null
  transportation: string | null
  meetingLocation: string | null

  imageGradient: string | null
  coverImageUrl: string | null

  isActive: boolean
  sortOrder: number

  createdAt: string
  updatedAt: string

  days: ItineraryDay[]
  inclusions: ItineraryInclusion[]
  galleryImages: ItineraryImage[]
}

export interface SaveItineraryPayload {
  title: string
  subtitle?: string | null
  designType?: ItineraryDesignType
  languagesOffered?: string[]
  tags?: string[]
  durationDays?: number | null
  durationLabel?: string | null
  price?: number | null
  currency?: string | null
  priceScope?: ItineraryPriceScope
  overview?: string | null
  transportation?: string | null
  meetingLocation?: string | null
  imageGradient?: string | null
  coverImageUrl?: string | null
  isActive?: boolean
  sortOrder?: number
  days?: Array<{
    dayNumber: number
    title: string
    description?: string | null
    startTime?: string | null
    endTime?: string | null
  }>
  inclusions?: Array<{ kind: ItineraryInclusionKind; text: string }>
  galleryImages?: Array<{ imageUrl: string; caption?: string | null }>
}

/**
 * CRUD surface shared by every itinerary owner (guide, activity provider).
 * The editor components are parameterised over this so the same UI drives any
 * owner's `/me/itineraries` endpoints.
 */
export interface ItineraryCrudService {
  list: () => Promise<GuideItinerary[]>
  get: (id: string) => Promise<GuideItinerary>
  create: (payload: SaveItineraryPayload) => Promise<GuideItinerary>
  update: (id: string, payload: SaveItineraryPayload) => Promise<GuideItinerary>
  remove: (id: string) => Promise<void>
}

const BASE = "/partner/guide-profile/me/itineraries"

export const guideItinerariesService: ItineraryCrudService = {
  async list(): Promise<GuideItinerary[]> {
    const res = await apiClient.get<GuideItinerary[]>(BASE)
    return res.data
  },

  async get(id: string): Promise<GuideItinerary> {
    const res = await apiClient.get<GuideItinerary>(`${BASE}/${id}`)
    return res.data
  },

  async create(payload: SaveItineraryPayload): Promise<GuideItinerary> {
    const res = await apiClient.post<GuideItinerary>(BASE, payload)
    return res.data
  },

  async update(id: string, payload: SaveItineraryPayload): Promise<GuideItinerary> {
    const res = await apiClient.put<GuideItinerary>(`${BASE}/${id}`, payload)
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}
