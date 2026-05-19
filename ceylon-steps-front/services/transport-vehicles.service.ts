import apiClient from "./api-client"

export type VehicleType =
  | "SEDAN"
  | "HATCHBACK"
  | "SUV"
  | "VAN"
  | "JEEP"
  | "PICKUP"
  | "MINIBUS"
  | "COACH"
  | "MOTORBIKE"
  | "TUKTUK"
  | "OTHER"

export type VehicleFuelType =
  | "PETROL"
  | "DIESEL"
  | "HYBRID"
  | "ELECTRIC"
  | "LPG"
  | "CNG"

export type VehicleCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR"

export type VehicleChargeType =
  | "PER_KM"
  | "PER_DAY"
  | "PER_HOUR"
  | "PER_WEEK"
  | "PER_MONTH"
  | "PER_TRIP"
  | "FLAT"

export interface TransportVehicleImage {
  id: string
  vehicleId: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface TransportVehicleCharge {
  id: string
  vehicleId: string
  chargeType: VehicleChargeType
  /** Server returns as string (Prisma Decimal). Parse on display. */
  amount: string
  currency: string
  includesFuel: boolean
  nightSurcharge: string | null
  minimumUnits: number | null
  label: string | null
  notes: string | null
  sortOrder: number
}

export interface TransportVehicle {
  id: string
  profileId: string
  title: string
  vehicleType: VehicleType
  manufacturedYear: number | null
  fuelType: VehicleFuelType
  fuelConsumption: string | null
  condition: VehicleCondition
  facilities: string[]
  extraFacilities: string[]
  inclusions: string[]
  exclusions: string[]
  description: string | null
  pickupLocation: string | null
  dropoffLocation: string | null
  sameDropoffAsPickup: boolean
  allowsAnyLocation: boolean
  fuelPolicy: string | null
  plateNumber: string | null
  plateNumberVisible: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  images: TransportVehicleImage[]
  charges: TransportVehicleCharge[]
}

export interface SaveVehicleImagePayload {
  imageUrl: string
  caption?: string | null
}

export interface SaveVehicleChargePayload {
  chargeType: VehicleChargeType
  amount: number
  currency?: string
  includesFuel?: boolean
  nightSurcharge?: number | null
  minimumUnits?: number | null
  label?: string | null
  notes?: string | null
}

export interface SaveVehiclePayload {
  title: string
  vehicleType: VehicleType
  manufacturedYear?: number | null
  fuelType: VehicleFuelType
  fuelConsumption?: string | null
  condition?: VehicleCondition
  facilities?: string[]
  extraFacilities?: string[]
  inclusions?: string[]
  exclusions?: string[]
  description?: string | null
  pickupLocation?: string | null
  dropoffLocation?: string | null
  sameDropoffAsPickup?: boolean
  allowsAnyLocation?: boolean
  fuelPolicy?: string | null
  plateNumber?: string | null
  plateNumberVisible?: boolean
  isActive?: boolean
  images?: SaveVehicleImagePayload[]
  charges?: SaveVehicleChargePayload[]
}

export const transportVehiclesService = {
  async list(): Promise<TransportVehicle[]> {
    const res = await apiClient.get<TransportVehicle[]>(
      "/partner/transport-provider/vehicles",
    )
    return res.data
  },

  async get(id: string): Promise<TransportVehicle> {
    const res = await apiClient.get<TransportVehicle>(
      `/partner/transport-provider/vehicles/${id}`,
    )
    return res.data
  },

  async create(payload: SaveVehiclePayload): Promise<TransportVehicle> {
    const res = await apiClient.post<TransportVehicle>(
      "/partner/transport-provider/vehicles",
      payload,
    )
    return res.data
  },

  async update(
    id: string,
    payload: SaveVehiclePayload,
  ): Promise<TransportVehicle> {
    const res = await apiClient.put<TransportVehicle>(
      `/partner/transport-provider/vehicles/${id}`,
      payload,
    )
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/partner/transport-provider/vehicles/${id}`)
  },
}

/* ─────────────── UI helpers ─────────────── */

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  SUV: "SUV",
  VAN: "Van",
  JEEP: "Jeep",
  PICKUP: "Pickup",
  MINIBUS: "Minibus",
  COACH: "Coach / Bus",
  MOTORBIKE: "Motorbike",
  TUKTUK: "Tuk-tuk",
  OTHER: "Other",
}

export const FUEL_TYPE_LABELS: Record<VehicleFuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  ELECTRIC: "Electric",
  LPG: "LPG",
  CNG: "CNG",
}

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  NEW: "Brand new",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
}

export const CHARGE_TYPE_LABELS: Record<VehicleChargeType, string> = {
  PER_KM: "Per kilometre",
  PER_DAY: "Per day",
  PER_HOUR: "Per hour",
  PER_WEEK: "Per week",
  PER_MONTH: "Per month",
  PER_TRIP: "Per trip",
  FLAT: "Flat rate",
}

/** Curated fuel-policy options for the dropdown. Stored as the option's
 * `value` (a short canonical phrase) and rendered in the description's
 * `[add fuel policy]` placeholder. Provider can still pick "Other" and type
 * a custom policy. */
export const FUEL_POLICY_OPTIONS: ReadonlyArray<{
  value: string
  label: string
}> = [
  { value: "Full to full", label: "Full to full" },
  { value: "Empty to empty", label: "Empty to empty" },
  { value: "Petrol included in rental price", label: "Petrol included" },
  {
    value: "Petrol not included — customer responsible for fuel",
    label: "Petrol not included (customer pays)",
  },
  {
    value: "Pre-paid fuel — flat fuel fee at pickup",
    label: "Pre-paid fuel (flat fee)",
  },
]

/** Curated facility checklist for the predefined toggle UI. */
export const PREDEFINED_FACILITIES = [
  "Air conditioning",
  "GPS navigation",
  "Bluetooth",
  "Audio system",
  "USB charging",
  "Sunroof",
  "Roof rack",
  "Child seat",
  "Reverse camera",
  "ABS brakes",
  "Airbags",
  "Power windows",
  "Power steering",
  "Spare tyre",
  "First-aid kit",
] as const
