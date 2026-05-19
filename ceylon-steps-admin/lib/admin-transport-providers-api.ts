import apiClient from "./api-client"
import type {
  TransportProviderType,
  ApplicationStatus,
  TransportApplicationStatusHistoryEntry,
} from "./transport-applications-api"

export type TransportProviderSort = "newest" | "oldest" | "name-asc"

export interface AdminTransportProviderListItem {
  id: string
  userId: string
  applicationId: string
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string
  providerType: TransportProviderType
  hasBusiness: boolean
  businessName: string | null
  isActive: boolean
  adminEnabled: boolean
  approvedAt: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string | null
    status: "ACTIVE" | "DISABLED"
  }
}

export interface AdminTransportProviderListResponse {
  total: number
  take: number
  skip: number
  items: AdminTransportProviderListItem[]
}

export interface AdminTransportProviderFacets {
  providerTypes: TransportProviderType[]
  hasBusinessCount: number
  total: number
}

export interface AdminTransportProviderApplication {
  id: string
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string
  usesAccountEmail: boolean
  providerType: TransportProviderType
  hasBusiness: boolean
  businessName: string | null
  businessDescription: string | null
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  safariJeepLicenseUrl: string | null
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedAt: string
  statusHistory: TransportApplicationStatusHistoryEntry[]
  createdByUser: { id: string; email: string; name: string | null } | null
  statusUpdatedByUser: { id: string; email: string; name: string | null } | null
}

/* ───────── Nested fleet + safari + service shapes (admin view) ───────── */

export type AdminVehicleType =
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

export type AdminFuelType =
  | "PETROL"
  | "DIESEL"
  | "HYBRID"
  | "ELECTRIC"
  | "LPG"
  | "CNG"

export type AdminCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR"

export type AdminVehicleChargeType =
  | "PER_KM"
  | "PER_DAY"
  | "PER_HOUR"
  | "PER_WEEK"
  | "PER_MONTH"
  | "PER_TRIP"
  | "FLAT"

export type AdminSafariChargeType =
  | "PER_PERSON"
  | "PER_JEEP"
  | "PER_TRIP"
  | "PER_HOUR"
  | "PER_DAY"
  | "FLAT"

export type AdminDriverServiceCategory =
  | "AIRPORT_PICKUP"
  | "AIRPORT_DROPOFF"
  | "CITY_TOUR"
  | "DAY_TOUR"
  | "ROUND_TOUR"
  | "TRANSFER"
  | "OTHER"

export type AdminDriverServicePriceUnit =
  | "PER_TRIP"
  | "PER_KM"
  | "PER_DAY"
  | "PER_HOUR"
  | "PER_PERSON"
  | "FLAT"

export interface AdminVehicleImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

export interface AdminVehicleCharge {
  id: string
  chargeType: AdminVehicleChargeType
  amount: string
  currency: string
  includesFuel: boolean
  nightSurcharge: string | null
  minimumUnits: number | null
  label: string | null
  notes: string | null
  sortOrder: number
}

export interface AdminTransportVehicle {
  id: string
  title: string
  vehicleType: AdminVehicleType
  manufacturedYear: number | null
  fuelType: AdminFuelType
  fuelConsumption: string | null
  condition: AdminCondition
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
  images: AdminVehicleImage[]
  charges: AdminVehicleCharge[]
}

export interface AdminDriverService {
  id: string
  title: string
  category: AdminDriverServiceCategory
  description: string | null
  coverImageUrl: string | null
  basePrice: string
  currency: string
  priceUnit: AdminDriverServicePriceUnit
  priceNotes: string | null
  inclusions: string[]
  exclusions: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminSafariJeepImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

export interface AdminSafariJeepCharge {
  id: string
  chargeType: AdminSafariChargeType
  amount: string
  currency: string
  includesParkFee: boolean
  minimumUnits: number | null
  label: string | null
  notes: string | null
  sortOrder: number
}

export interface AdminSafariJeep {
  id: string
  title: string
  vehicleType: AdminVehicleType
  condition: AdminCondition
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
  images: AdminSafariJeepImage[]
  charges: AdminSafariJeepCharge[]
}

export interface AdminTypeChangeRequest {
  id: string
  currentType: TransportProviderType
  requestedType: TransportProviderType
  providerNotes: string | null
  safariJeepLicenseUrl: string | null
  brdDocumentUrl: string | null
  status: ApplicationStatus
  remark: string | null
  reviewedAt: string | null
  createdAt: string
  reviewedByUser?: { id: string; email: string; name: string | null } | null
}

export interface AdminTransportProviderDetail
  extends AdminTransportProviderListItem {
  businessDescription: string | null
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  safariJeepLicenseUrl: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  user: AdminTransportProviderListItem["user"] & {
    phone: string | null
    emailVerifiedAt: string | null
    createdAt: string
  }
  application: AdminTransportProviderApplication
  vehicles?: AdminTransportVehicle[]
  driverServices?: AdminDriverService[]
  safariJeeps?: AdminSafariJeep[]
  typeChangeRequests?: AdminTypeChangeRequest[]
}

export interface SearchTransportProvidersParams {
  search?: string
  providerType?: TransportProviderType
  status?: "active" | "inactive"
  hasBusiness?: boolean
  sort?: TransportProviderSort
  take?: number
  skip?: number
}

export const adminTransportProvidersApi = {
  async search(
    params: SearchTransportProvidersParams,
  ): Promise<AdminTransportProviderListResponse> {
    const res = await apiClient.get<AdminTransportProviderListResponse>(
      "/admin/transport-providers",
      {
        params: {
          search: params.search,
          providerType: params.providerType,
          status: params.status,
          hasBusiness:
            params.hasBusiness === undefined
              ? undefined
              : String(params.hasBusiness),
          sort: params.sort,
          take: params.take,
          skip: params.skip,
        },
      },
    )
    return res.data
  },

  async facets(): Promise<AdminTransportProviderFacets> {
    const res = await apiClient.get<AdminTransportProviderFacets>(
      "/admin/transport-providers/facets",
    )
    return res.data
  },

  async detail(id: string): Promise<AdminTransportProviderDetail> {
    const res = await apiClient.get<AdminTransportProviderDetail>(
      `/admin/transport-providers/${id}`,
    )
    return res.data
  },

  async setAdminEnabled(
    id: string,
    adminEnabled: boolean,
  ): Promise<AdminTransportProviderDetail> {
    const res = await apiClient.patch<AdminTransportProviderDetail>(
      `/admin/transport-providers/${id}/admin-enabled`,
      { adminEnabled },
    )
    return res.data
  },
}
