import apiClient from "./api-client"
import type { TopTag, TopTagsResponse } from "./public-itineraries.service"

export type ActivityPackageScope = "PER_PERSON" | "PER_GROUP"

/** Minimal spoken-language shape shared by partner profiles. */
export interface ProfileLanguage {
  id: string
  language: string
  level: "CONVERSATIONAL" | "FLUENT" | "NATIVE"
  countryCode: string | null
}

/**
 * Slim itinerary card returned inside a partner profile. Same fields as the
 * public search card, minus owner attribution (the owner is the profile).
 */
export interface PartnerItineraryCard {
  id: string
  title: string
  subtitle: string | null
  designType: "DAYS" | "TIME" | "DURATION"
  durationDays: number | null
  /** Total minutes — set only when designType is DURATION. */
  durationMinutes: number | null
  durationLabel: string | null
  price: string | null
  currency: string | null
  priceScope: "PER_PERSON" | "PER_GROUP" | "PER_DAY"
  imageGradient: string | null
  coverImageUrl: string | null
  tags: string[]
  languagesOffered: string[]
  sortOrder: number
  createdAt: string
}

export interface PartnerGalleryImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface PublicActivityProviderProfile {
  id: string
  type: "ACTIVITY_PROVIDER"
  displayName: string
  fullName: string
  businessName: string
  businessNameColor: string | null
  displayBusinessName: boolean
  natureOfBusiness: string
  description: string | null
  email: string
  mobileNumber: string
  whatsappAvailable: boolean
  address: string
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  yearsOfExperience: number | null
  currency: string | null
  pricePerHour: string | null
  pricePerDay: string | null
  packagePrice: string | null
  packagePriceScope: ActivityPackageScope | null
  approvedAt: string
  createdAt: string
  updatedAt: string
  languages: ProfileLanguage[]
  galleryImages: PartnerGalleryImage[]
  itineraries: PartnerItineraryCard[]
}

export type TransportProviderType =
  | "SAFARI_JEEP"
  | "VEHICLE_WITH_DRIVER"
  | "VEHICLE_FLEET"

export interface PartnerVehicleImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

export interface PublicSafariJeep {
  id: string
  title: string
  vehicleType: string
  condition: string
  passengerCapacity: number | null
  nationalParks: string[]
  pickupLocation: string | null
  images: PartnerVehicleImage[]
}

export interface PublicTransportVehicle {
  id: string
  title: string
  vehicleType: string
  fuelType: string
  condition: string
  pickupLocation: string | null
  images: PartnerVehicleImage[]
}

export interface PublicDriverService {
  id: string
  title: string
  category: string
  description: string | null
  coverImageUrl: string | null
  basePrice: string
  currency: string
  priceUnit: string
}

export interface PublicTransportProviderProfile {
  id: string
  type: "TRANSPORT_PROVIDER"
  displayName: string
  fullName: string
  providerType: TransportProviderType
  hasBusiness: boolean
  businessName: string | null
  businessDescription: string | null
  email: string
  mobileNumber: string
  whatsappAvailable: boolean
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  approvedAt: string
  createdAt: string
  updatedAt: string
  safariJeeps: PublicSafariJeep[]
  vehicles: PublicTransportVehicle[]
  driverServices: PublicDriverService[]
  itineraries: PartnerItineraryCard[]
}

export type ActivityProviderSort =
  | "relevance"
  | "newest"
  | "experience-desc"
  | "price-asc"
  | "price-desc"

export interface ActivityProviderListItem {
  id: string
  displayName: string
  businessName: string
  businessNameColor: string | null
  natureOfBusiness: string
  description: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  yearsOfExperience: number | null
  currency: string | null
  pricePerHour: string | null
  pricePerDay: string | null
  packagePrice: string | null
  packagePriceScope: ActivityPackageScope | null
  languages: ProfileLanguage[]
}

export interface ActivityProviderListResponse {
  total: number
  take: number
  skip: number
  items: ActivityProviderListItem[]
}

export interface SearchActivityProvidersParams {
  search?: string
  languages?: string[]
  minExperience?: number
  currency?: string
  minPrice?: number
  maxPrice?: number
  sort?: ActivityProviderSort
  take?: number
  skip?: number
}

function csv(values?: string[]) {
  if (!values || values.length === 0) return undefined
  return values.join(",")
}

export const publicPartnersService = {
  async searchActivityProviders(
    params: SearchActivityProvidersParams,
  ): Promise<ActivityProviderListResponse> {
    const res = await apiClient.get<ActivityProviderListResponse>(
      "/public/activity-providers",
      {
        params: {
          search: params.search,
          languages: csv(params.languages),
          minExperience: params.minExperience,
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

  /** Most-used itinerary tags among visible activity providers (top 20). */
  async activityProviderTopTags(): Promise<TopTag[]> {
    const res = await apiClient.get<TopTagsResponse>(
      "/public/activity-providers/top-tags",
    )
    return res.data.tags
  },

  async getActivityProvider(
    id: string,
  ): Promise<PublicActivityProviderProfile> {
    const res = await apiClient.get<PublicActivityProviderProfile>(
      `/public/activity-providers/${id}`,
    )
    return res.data
  },

  async getTransportProvider(
    id: string,
  ): Promise<PublicTransportProviderProfile> {
    const res = await apiClient.get<PublicTransportProviderProfile>(
      `/public/transport-providers/${id}`,
    )
    return res.data
  },
}
