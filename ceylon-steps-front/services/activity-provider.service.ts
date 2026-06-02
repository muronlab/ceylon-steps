import apiClient from "./api-client"

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface ActivityProviderApplicationStatusHistory {
  id: string
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedByUser?: { id: string; email: string; name: string | null } | null
}

export interface ActivityProviderApplication {
  id: string
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string | null
  usesAccountEmail: boolean
  nicNumber: string
  businessName: string
  description: string | null
  natureOfBusiness: string
  address: string
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedAt: string
  createdByUser?: { id: string; email: string; name: string | null } | null
  statusUpdatedByUser?: { id: string; email: string; name: string | null } | null
  statusHistory?: ActivityProviderApplicationStatusHistory[]
}

export interface ActivityProviderProfile {
  id: string
  userId: string
  applicationId: string
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string | null
  nicNumber: string
  businessName: string
  natureOfBusiness: string
  description: string | null
  address: string
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  isActive: boolean
  adminEnabled: boolean
  approvedAt: string
  createdAt: string
  updatedAt: string
}

export interface UpdateActivityProviderProfilePayload {
  fullName?: string
  mobileNumber?: string
  whatsappAvailable?: boolean
  contactEmail?: string | null
  businessName?: string
  natureOfBusiness?: string
  description?: string | null
  address?: string
  profilePhotoUrl?: string | null
  coverPhotoUrl?: string | null
  isActive?: boolean
}

export const activityProviderService = {
  async getMine(): Promise<ActivityProviderApplication | null> {
    const res = await apiClient.get<ActivityProviderApplication | null>(
      "/partner/activity-provider/me",
    )
    return res.data
  },

  async apply(formData: FormData): Promise<ActivityProviderApplication> {
    const res = await apiClient.post<ActivityProviderApplication>(
      "/partner/activity-provider/apply",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return res.data
  },

  async getMyProfile(): Promise<ActivityProviderProfile> {
    const res = await apiClient.get<ActivityProviderProfile>(
      "/partner/activity-provider/profile/me",
    )
    return res.data
  },

  async updateMyProfile(
    payload: UpdateActivityProviderProfilePayload,
  ): Promise<ActivityProviderProfile> {
    const res = await apiClient.patch<ActivityProviderProfile>(
      "/partner/activity-provider/profile/me",
      payload,
    )
    return res.data
  },
}
