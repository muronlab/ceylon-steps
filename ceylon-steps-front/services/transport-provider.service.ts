import apiClient from "./api-client"

export type TransportProviderType =
  | "SAFARI_JEEP"
  | "VEHICLE_WITH_DRIVER"
  | "VEHICLE_FLEET"

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface TransportApplicationStatusHistory {
  id: string
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedByUser?: { id: string; email: string; name: string | null } | null
}

export interface TransportProviderProfileSummary {
  id: string
  isActive: boolean
  adminEnabled: boolean
  approvedAt: string
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string
  providerType: TransportProviderType
  hasBusiness: boolean
  businessName: string | null
  businessDescription: string | null
}

export interface TransportProviderProfile {
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
  businessDescription: string | null
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  safariJeepLicenseUrl: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  isActive: boolean
  adminEnabled: boolean
  approvedAt: string
  createdAt: string
  updatedAt: string
}

export interface TransportProviderApplication {
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
  createdByUser?: { id: string; email: string; name: string | null } | null
  statusUpdatedByUser?: { id: string; email: string; name: string | null } | null
  statusHistory?: TransportApplicationStatusHistory[]
  transportProfile?: TransportProviderProfileSummary | null
}

export interface UpdateTransportProviderProfilePayload {
  fullName?: string
  providerType?: TransportProviderType
  mobileNumber?: string
  whatsappAvailable?: boolean
  contactEmail?: string
  hasBusiness?: boolean
  businessName?: string | null
  businessDescription?: string | null
  profilePhotoUrl?: string | null
  coverPhotoUrl?: string | null
  isActive?: boolean
}

export interface TransportTypeChangeRequest {
  id: string
  profileId: string
  currentType: TransportProviderType
  requestedType: TransportProviderType
  providerNotes: string | null
  safariJeepLicenseUrl: string | null
  brdDocumentUrl: string | null
  status: ApplicationStatus
  remark: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  reviewedByUser?: { id: string; email: string; name: string | null } | null
}

export const transportProviderService = {
  async getMine(): Promise<TransportProviderApplication | null> {
    const res = await apiClient.get<TransportProviderApplication | null>(
      "/partner/transport-provider/me",
    )
    return res.data
  },

  async apply(formData: FormData): Promise<TransportProviderApplication> {
    const res = await apiClient.post<TransportProviderApplication>(
      "/partner/transport-provider/apply",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return res.data
  },

  async getMyProfile(): Promise<TransportProviderProfile> {
    const res = await apiClient.get<TransportProviderProfile>(
      "/partner/transport-provider/profile/me",
    )
    return res.data
  },

  async updateMyProfile(
    payload: UpdateTransportProviderProfilePayload,
  ): Promise<TransportProviderProfile> {
    const res = await apiClient.patch<TransportProviderProfile>(
      "/partner/transport-provider/profile/me",
      payload,
    )
    return res.data
  },

  async getMyTypeChangeRequest(): Promise<TransportTypeChangeRequest | null> {
    const res = await apiClient.get<TransportTypeChangeRequest | null>(
      "/partner/transport-provider/profile/me/type-change-request",
    )
    return res.data
  },

  async submitTypeChangeRequest(
    formData: FormData,
  ): Promise<TransportTypeChangeRequest> {
    const res = await apiClient.post<TransportTypeChangeRequest>(
      "/partner/transport-provider/profile/me/type-change-request",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return res.data
  },

  async cancelMyTypeChangeRequest(id: string): Promise<void> {
    await apiClient.delete(
      `/partner/transport-provider/profile/me/type-change-request/${id}`,
    )
  },
}
