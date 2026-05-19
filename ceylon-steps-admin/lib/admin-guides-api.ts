import apiClient from "./api-client"

export type GuideSort =
  | "relevance"
  | "newest"
  | "experience-desc"
  | "price-asc"
  | "price-desc"

export type GuideStatusFilter = "active" | "inactive"

export interface AdminGuideListLanguage {
  id: string
  language: string
  level: "CONVERSATIONAL" | "FLUENT" | "NATIVE"
  countryCode: string | null
}

export interface AdminGuideListItem {
  id: string
  userId: string
  displayName: string
  fullName: string
  category: string | null
  tagline: string | null
  regionsSpecialized: string[]
  email: string
  mobileNumber: string
  whatsappNumber: string | null
  whatsappAvailable: boolean
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  yearsOfExperience: number | null
  currency: string | null
  pricePerHour: string | null
  pricePerDay: string | null
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
  languages: AdminGuideListLanguage[]
  galleryCount: number
  languageCount: number
  itineraryCount: number
}

export interface AdminGuideListResponse {
  total: number
  take: number
  skip: number
  items: AdminGuideListItem[]
}

export interface AdminGuideFacets {
  categories: string[]
  regions: string[]
  languages: string[]
  currencies: string[]
}

export interface SearchAdminGuidesParams {
  search?: string
  category?: string
  regions?: string[]
  languages?: string[]
  minExperience?: number
  currency?: string
  minPrice?: number
  maxPrice?: number
  status?: GuideStatusFilter
  sort?: GuideSort
  take?: number
  skip?: number
}

const csv = (v?: string[]) =>
  v && v.length > 0 ? v.join(",") : undefined

export interface AdminGuideDetailDay {
  id: string
  dayNumber: number
  title: string
  description: string | null
  sortOrder: number
}

export interface AdminGuideDetailInclusion {
  id: string
  kind: "INCLUDED" | "EXCLUDED"
  text: string
  sortOrder: number
}

export interface AdminGuideDetailGalleryImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface AdminGuideDetailItinerary {
  id: string
  title: string
  subtitle: string | null
  durationDays: number | null
  durationLabel: string | null
  price: string | null
  currency: string | null
  overview: string | null
  transportation: string | null
  meetingLocation: string | null
  imageGradient: string | null
  coverImageUrl: string | null
  isActive: boolean
  sortOrder: number
  days: AdminGuideDetailDay[]
  inclusions: AdminGuideDetailInclusion[]
  galleryImages: AdminGuideDetailGalleryImage[]
}

export interface AdminGuideApplicationStatusHistoryEntry {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  remark: string | null
  createdAt: string
  updatedByUser: { id: string; email: string; name: string | null } | null
}

export interface AdminGuideApplication {
  id: string
  fullName: string
  displayName: string
  category: string | null
  mobileNumber: string
  whatsappAvailable: boolean
  address: string
  nicNumber: string
  registrationNo: string | null
  email: string
  guideLicenseExpiryDate: string | null
  nicFrontUrl: string
  nicBackUrl: string
  guideLicenseFrontUrl: string | null
  guideLicenseBackUrl: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  remark: string | null
  createdAt: string
  updatedAt: string
  statusHistory: AdminGuideApplicationStatusHistoryEntry[]
  createdByUser: { id: string; email: string; name: string | null } | null
  statusUpdatedByUser: { id: string; email: string; name: string | null } | null
}

export interface AdminGuideDetail {
  id: string
  userId: string
  applicationId: string

  fullName: string
  displayName: string
  category: string | null
  tagline: string | null
  regionsSpecialized: string[]

  email: string
  mobileNumber: string
  whatsappNumber: string | null
  whatsappAvailable: boolean
  address: string

  nicNumber: string
  registrationNo: string | null
  guideLicenseExpiryDate: string | null
  nicFrontUrl: string
  nicBackUrl: string
  guideLicenseFrontUrl: string | null
  guideLicenseBackUrl: string | null

  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  bio: string | null

  yearsOfExperience: number | null
  currency: string | null
  pricePerHour: string | null
  pricePerDay: string | null

  isActive: boolean
  adminEnabled: boolean
  approvedAt: string
  createdAt: string
  updatedAt: string

  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    status: "ACTIVE" | "DISABLED"
    emailVerifiedAt: string | null
    createdAt: string
  }
  application: AdminGuideApplication
  languages: AdminGuideListLanguage[]
  galleryImages: AdminGuideDetailGalleryImage[]
  itineraries: AdminGuideDetailItinerary[]
}

export const adminGuidesApi = {
  async detail(id: string): Promise<AdminGuideDetail> {
    const res = await apiClient.get<AdminGuideDetail>(`/admin/guides/${id}`)
    return res.data
  },

  async setAdminEnabled(
    id: string,
    adminEnabled: boolean,
  ): Promise<AdminGuideDetail> {
    const res = await apiClient.patch<AdminGuideDetail>(
      `/admin/guides/${id}/admin-enabled`,
      { adminEnabled },
    )
    return res.data
  },

  async search(params: SearchAdminGuidesParams): Promise<AdminGuideListResponse> {
    const res = await apiClient.get<AdminGuideListResponse>("/admin/guides", {
      params: {
        search: params.search,
        category: params.category,
        regions: csv(params.regions),
        languages: csv(params.languages),
        minExperience: params.minExperience,
        currency: params.currency,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        status: params.status,
        sort: params.sort,
        take: params.take,
        skip: params.skip,
      },
    })
    return res.data
  },

  async facets(): Promise<AdminGuideFacets> {
    const res = await apiClient.get<AdminGuideFacets>("/admin/guides/facets")
    return res.data
  },
}
