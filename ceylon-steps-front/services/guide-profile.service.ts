import apiClient from "./api-client"

export type LanguageLevel = "CONVERSATIONAL" | "FLUENT" | "NATIVE"

export interface GuideLanguage {
  id: string
  guideProfileId: string
  language: string
  level: LanguageLevel
  countryCode: string | null
}

export interface GuideGalleryImage {
  id: string
  guideProfileId: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export interface GuideProfile {
  id: string
  userId: string
  applicationId: string

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
  // Prisma serialises Decimal as a string over JSON.
  pricePerHour: string | null
  pricePerDay: string | null

  isActive: boolean

  approvedAt: string
  createdAt: string
  updatedAt: string

  languages: GuideLanguage[]
  galleryImages: GuideGalleryImage[]
}

export interface UpdateGuideProfilePayload {
  fullName?: string
  displayName?: string
  category?: string | null
  email?: string
  mobileNumber?: string
  whatsappNumber?: string | null
  whatsappAvailable?: boolean
  address?: string
  profilePhotoUrl?: string | null
  coverPhotoUrl?: string | null
  bio?: string | null
  isActive?: boolean
  yearsOfExperience?: number | null
  currency?: string | null
  pricePerHour?: number | null
  pricePerDay?: number | null
  tagline?: string | null
  regionsSpecialized?: string[]
}

export interface SetLanguagesPayload {
  languages: Array<{
    language: string
    level: LanguageLevel
    countryCode?: string | null
  }>
}

export interface SetGalleryPayload {
  images: Array<{ imageUrl: string; caption?: string | null; sortOrder?: number }>
}

export const guideProfileService = {
  async getMe(): Promise<GuideProfile> {
    const res = await apiClient.get<GuideProfile>("/partner/guide-profile/me")
    return res.data
  },

  async updateMe(payload: UpdateGuideProfilePayload): Promise<GuideProfile> {
    const res = await apiClient.patch<GuideProfile>(
      "/partner/guide-profile/me",
      payload,
    )
    return res.data
  },

  async setLanguages(payload: SetLanguagesPayload): Promise<GuideProfile> {
    const res = await apiClient.put<GuideProfile>(
      "/partner/guide-profile/me/languages",
      payload,
    )
    return res.data
  },

  async setGallery(payload: SetGalleryPayload): Promise<GuideProfile> {
    const res = await apiClient.put<GuideProfile>(
      "/partner/guide-profile/me/gallery",
      payload,
    )
    return res.data
  },
}
