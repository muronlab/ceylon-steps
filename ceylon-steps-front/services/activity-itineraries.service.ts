import apiClient from "./api-client"
import type {
  GuideItinerary,
  ItineraryCrudService,
  SaveItineraryPayload,
} from "./guide-itineraries.service"

// Itineraries share one shape across owners; the activity provider's are served
// from its own owner-scoped endpoints. Types are reused from the guide service.
export type {
  GuideItinerary as ActivityItinerary,
  SaveItineraryPayload,
} from "./guide-itineraries.service"

const BASE = "/partner/activity-provider/me/itineraries"

export const activityItinerariesService: ItineraryCrudService = {
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
