import apiClient from "./api-client"
import type {
  VehicleType,
  VehicleCondition,
} from "./transport-vehicles.service"

export type SafariChargeType =
  | "PER_PERSON"
  | "PER_JEEP"
  | "PER_TRIP"
  | "PER_HOUR"
  | "PER_DAY"
  | "FLAT"

export interface SafariJeepImage {
  id: string
  safariJeepId: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface SafariJeepCharge {
  id: string
  safariJeepId: string
  chargeType: SafariChargeType
  /** Server returns as string (Prisma Decimal). Parse on display. */
  amount: string
  currency: string
  includesParkFee: boolean
  minimumUnits: number | null
  label: string | null
  notes: string | null
  sortOrder: number
}

export interface SafariJeep {
  id: string
  profileId: string

  title: string
  vehicleType: VehicleType
  condition: VehicleCondition
  passengerCapacity: number | null

  driverName: string
  driverPhotoUrl: string | null
  driverYearsExperience: number | null
  driverBio: string | null
  driverLanguages: string[]
  driverGuidesAtParks: boolean

  nationalParks: string[]
  experiences: string[]
  durationNotes: string | null

  facilities: string[]
  extraFacilities: string[]
  inclusions: string[]
  exclusions: string[]

  description: string | null
  pickupLocation: string | null
  isActive: boolean

  createdAt: string
  updatedAt: string
  images: SafariJeepImage[]
  charges: SafariJeepCharge[]
}

export interface SaveSafariJeepImagePayload {
  imageUrl: string
  caption?: string | null
}

export interface SaveSafariJeepChargePayload {
  chargeType: SafariChargeType
  amount: number
  currency?: string
  includesParkFee?: boolean
  minimumUnits?: number | null
  label?: string | null
  notes?: string | null
}

export interface SaveSafariJeepPayload {
  title: string
  vehicleType?: VehicleType
  condition?: VehicleCondition
  passengerCapacity?: number | null

  driverName: string
  driverPhotoUrl?: string | null
  driverYearsExperience?: number | null
  driverBio?: string | null
  driverLanguages?: string[]
  driverGuidesAtParks?: boolean

  nationalParks?: string[]
  experiences?: string[]
  durationNotes?: string | null

  facilities?: string[]
  extraFacilities?: string[]
  inclusions?: string[]
  exclusions?: string[]

  description?: string | null
  pickupLocation?: string | null
  isActive?: boolean
  images?: SaveSafariJeepImagePayload[]
  charges?: SaveSafariJeepChargePayload[]
}

export const safariJeepsService = {
  async list(): Promise<SafariJeep[]> {
    const res = await apiClient.get<SafariJeep[]>(
      "/partner/transport-provider/safari-jeeps",
    )
    return res.data
  },

  async get(id: string): Promise<SafariJeep> {
    const res = await apiClient.get<SafariJeep>(
      `/partner/transport-provider/safari-jeeps/${id}`,
    )
    return res.data
  },

  async create(payload: SaveSafariJeepPayload): Promise<SafariJeep> {
    const res = await apiClient.post<SafariJeep>(
      "/partner/transport-provider/safari-jeeps",
      payload,
    )
    return res.data
  },

  async update(
    id: string,
    payload: SaveSafariJeepPayload,
  ): Promise<SafariJeep> {
    const res = await apiClient.put<SafariJeep>(
      `/partner/transport-provider/safari-jeeps/${id}`,
      payload,
    )
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/partner/transport-provider/safari-jeeps/${id}`)
  },
}

export const SAFARI_CHARGE_TYPE_LABELS: Record<SafariChargeType, string> = {
  PER_PERSON: "Per person",
  PER_JEEP: "Per jeep",
  PER_TRIP: "Per trip",
  PER_HOUR: "Per hour",
  PER_DAY: "Per day",
  FLAT: "Flat rate",
}

/** Common Sri Lankan national parks where safari operators run trips. Used
 * as suggestion chips in the editor. Operators can still add anything. */
export const COMMON_NATIONAL_PARKS = [
  "Yala National Park",
  "Udawalawe National Park",
  "Wilpattu National Park",
  "Minneriya National Park",
  "Kaudulla National Park",
  "Bundala National Park",
  "Kumana National Park",
  "Wasgamuwa National Park",
  "Lahugala Kitulana National Park",
  "Lunugamvehera National Park",
] as const

/** Predefined facility chips tailored to what a traveler actually cares
 * about on a Sri Lankan safari — viewing comfort + on-board kit. Operators
 * can still add anything else as a free-form chip. */
export const SAFARI_PREDEFINED_FACILITIES = [
  "Open-top viewing",
  "Padded raised seats",
  "Canopy / shade roof",
  "Binoculars provided",
  "Cooler box / cold water",
  "Bottled water included",
  "Wildlife spotting guide",
  "Camera mount / bean bag",
  "Driver-guide commentary",
  "First-aid kit",
  "Insect repellent",
  "Rain ponchos",
  "Phone / camera charging",
  "Insurance covered",
] as const

export const COMMON_SAFARI_EXPERIENCES = [
  "Sunrise safari",
  "Sunset safari",
  "Half-day safari",
  "Full-day safari",
  "Night safari",
  "Photographic safari",
  "Birdwatching tour",
  "Leopard tracking",
  "Elephant gathering tour",
] as const
