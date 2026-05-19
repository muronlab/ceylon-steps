import apiClient from "./api-client"

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export type TransportProviderType =
  | "SAFARI_JEEP"
  | "VEHICLE_WITH_DRIVER"
  | "VEHICLE_FLEET"

export interface TransportApplicationStatusHistoryEntry {
  id: string
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedByUser: { id: string; email: string; name: string | null } | null
}

export interface TransportApplication {
  id: string
  partnerType?: "TRANSPORT_PROVIDER"
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
  statusHistory?: TransportApplicationStatusHistoryEntry[]
  transportProfile?: {
    id: string
    isActive: boolean
    approvedAt: string
  } | null
}

export interface ListTransportApplicationsResponse {
  total: number
  take: number
  skip: number
  items: TransportApplication[]
}

export async function listTransportApplications(params: {
  status?: ApplicationStatus
  search?: string
  take?: number
  skip?: number
}): Promise<ListTransportApplicationsResponse> {
  const res = await apiClient.get<ListTransportApplicationsResponse>(
    "/partner/applications/transport-providers",
    { params },
  )
  return res.data
}

export async function getTransportApplication(
  id: string,
): Promise<TransportApplication> {
  const res = await apiClient.get<TransportApplication>(
    `/partner/transport-provider/${id}`,
  )
  return res.data
}

export async function updateTransportApplicationStatus(
  id: string,
  payload: { status: ApplicationStatus; remark?: string },
): Promise<TransportApplication> {
  const res = await apiClient.patch<TransportApplication>(
    `/partner/transport-provider/${id}/status`,
    payload,
  )
  return res.data
}

/* ─────────────── Provider type change requests ─────────────── */

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
  profile?: {
    id: string
    userId: string
    fullName: string
    contactEmail: string
    mobileNumber?: string
    providerType: TransportProviderType
    hasBusiness: boolean
    businessName: string | null
    safariJeepLicenseUrl?: string | null
    brdDocumentUrl?: string | null
  }
  createdByUser?: { id: string; email: string; name: string | null } | null
  reviewedByUser?: { id: string; email: string; name: string | null } | null
}

export async function listTransportTypeChangeRequests(params: {
  status?: ApplicationStatus
}): Promise<TransportTypeChangeRequest[]> {
  const res = await apiClient.get<TransportTypeChangeRequest[]>(
    "/partner/transport-provider/type-change-requests",
    { params },
  )
  return res.data
}

export async function getTransportTypeChangeRequest(
  id: string,
): Promise<TransportTypeChangeRequest> {
  const res = await apiClient.get<TransportTypeChangeRequest>(
    `/partner/transport-provider/type-change-requests/${id}`,
  )
  return res.data
}

export async function reviewTransportTypeChangeRequest(
  id: string,
  payload: { status: "APPROVED" | "REJECTED"; remark?: string },
): Promise<TransportTypeChangeRequest> {
  const res = await apiClient.patch<TransportTypeChangeRequest>(
    `/partner/transport-provider/type-change-requests/${id}/status`,
    payload,
  )
  return res.data
}
