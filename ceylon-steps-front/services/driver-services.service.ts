import apiClient from "./api-client"

export type DriverServiceCategory =
  | "AIRPORT_PICKUP"
  | "AIRPORT_DROPOFF"
  | "CITY_TOUR"
  | "DAY_TOUR"
  | "ROUND_TOUR"
  | "TRANSFER"
  | "OTHER"

export type DriverServicePriceUnit =
  | "PER_TRIP"
  | "PER_KM"
  | "PER_DAY"
  | "PER_HOUR"
  | "PER_PERSON"
  | "FLAT"

export interface DriverService {
  id: string
  profileId: string
  title: string
  category: DriverServiceCategory
  description: string | null
  coverImageUrl: string | null
  /** Server returns as string (Prisma Decimal). Parse on display. */
  basePrice: string
  currency: string
  priceUnit: DriverServicePriceUnit
  priceNotes: string | null
  inclusions: string[]
  exclusions: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SaveDriverServicePayload {
  title: string
  category?: DriverServiceCategory
  description?: string | null
  coverImageUrl?: string | null
  basePrice: number
  currency?: string
  priceUnit: DriverServicePriceUnit
  priceNotes?: string | null
  inclusions?: string[]
  exclusions?: string[]
  isActive?: boolean
}

export const driverServicesService = {
  async list(): Promise<DriverService[]> {
    const res = await apiClient.get<DriverService[]>(
      "/partner/transport-provider/driver-services",
    )
    return res.data
  },

  async get(id: string): Promise<DriverService> {
    const res = await apiClient.get<DriverService>(
      `/partner/transport-provider/driver-services/${id}`,
    )
    return res.data
  },

  async create(payload: SaveDriverServicePayload): Promise<DriverService> {
    const res = await apiClient.post<DriverService>(
      "/partner/transport-provider/driver-services",
      payload,
    )
    return res.data
  },

  async update(
    id: string,
    payload: SaveDriverServicePayload,
  ): Promise<DriverService> {
    const res = await apiClient.put<DriverService>(
      `/partner/transport-provider/driver-services/${id}`,
      payload,
    )
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/partner/transport-provider/driver-services/${id}`)
  },
}

export const DRIVER_SERVICE_CATEGORY_LABELS: Record<
  DriverServiceCategory,
  string
> = {
  AIRPORT_PICKUP: "Airport pickup",
  AIRPORT_DROPOFF: "Airport dropoff",
  CITY_TOUR: "City tour",
  DAY_TOUR: "Day tour",
  ROUND_TOUR: "Round / multi-day tour",
  TRANSFER: "Point-to-point transfer",
  OTHER: "Other",
}

export const DRIVER_SERVICE_PRICE_UNIT_LABELS: Record<
  DriverServicePriceUnit,
  string
> = {
  PER_TRIP: "Per trip",
  PER_KM: "Per kilometre",
  PER_DAY: "Per day",
  PER_HOUR: "Per hour",
  PER_PERSON: "Per person",
  FLAT: "Flat rate",
}
