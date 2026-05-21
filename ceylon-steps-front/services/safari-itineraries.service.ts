import apiClient from "./api-client"
import type {
  ItineraryDay,
  ItineraryInclusion,
  ItineraryImage,
  ItineraryDesignType,
  ItineraryPriceScope,
  SaveItineraryPayload,
} from "./guide-itineraries.service"

export type {
  ItineraryDay,
  ItineraryInclusion,
  ItineraryImage,
  ItineraryDesignType,
  ItineraryInclusionKind,
  ItineraryPriceScope,
  SaveItineraryPayload,
} from "./guide-itineraries.service"

/** Mirror of the backend `Itinerary` shape when owned by a safari jeep. The
 * `safariJeep` field is the lightweight reference the API includes on every
 * safari-itinerary response — used to group itineraries by jeep in the UI. */
export interface SafariItinerary {
  id: string
  safariJeepId: string

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

  /** Lightweight owner reference the backend includes on safari-itinerary
   * responses so the UI can show "from <jeep>" without an extra fetch. */
  safariJeep: {
    id: string
    title: string
    driverName: string
  } | null
}

const BASE = "/partner/transport-provider"

export const safariItinerariesService = {
  async list(): Promise<SafariItinerary[]> {
    const res = await apiClient.get<SafariItinerary[]>(
      `${BASE}/safari-itineraries`,
    )
    return res.data
  },

  async get(id: string): Promise<SafariItinerary> {
    const res = await apiClient.get<SafariItinerary>(
      `${BASE}/safari-itineraries/${id}`,
    )
    return res.data
  },

  /** Snapshot the safari jeep into a fresh itinerary draft. The backend
   * pre-fills languages, cover image, gallery, inclusions / exclusions,
   * price (cheapest charge), transportation (jeep facilities + driver),
   * and starts the draft hidden (`isActive: false`) so the operator can
   * complete it before publishing.
   *
   * `overrides.title` / `overrides.subtitle` come from the template picker
   * — the operator picked one of the generated suggestions or typed their
   * own. When absent, the backend falls back to the jeep title and a
   * "with <driver>" subtitle. */
  async createFromJeep(
    jeepId: string,
    overrides?: { title?: string; subtitle?: string | null },
  ): Promise<SafariItinerary> {
    const res = await apiClient.post<SafariItinerary>(
      `${BASE}/safari-jeeps/${jeepId}/create-itinerary`,
      overrides ?? {},
    )
    return res.data
  },

  async update(
    id: string,
    payload: SaveItineraryPayload,
  ): Promise<SafariItinerary> {
    const res = await apiClient.put<SafariItinerary>(
      `${BASE}/safari-itineraries/${id}`,
      payload,
    )
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/safari-itineraries/${id}`)
  },
}
