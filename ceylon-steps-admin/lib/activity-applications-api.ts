import apiClient from "./api-client"

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface ActivityApplicationStatusHistoryEntry {
  id: string
  status: ApplicationStatus
  remark: string | null
  createdAt: string
  updatedByUser: { id: string; email: string; name: string | null } | null
}

export interface ActivityApplication {
  id: string
  partnerType?: "ACTIVITY_PROVIDER"
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string | null
  usesAccountEmail: boolean
  nicNumber: string
  businessName: string
  natureOfBusiness: string
  description: string | null
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
  statusHistory?: ActivityApplicationStatusHistoryEntry[]
  activityProfile?: {
    id: string
    isActive: boolean
    approvedAt: string
  } | null
}

export interface ListActivityApplicationsResponse {
  total: number
  take: number
  skip: number
  items: ActivityApplication[]
}

export async function listActivityApplications(params: {
  status?: ApplicationStatus
  search?: string
  take?: number
  skip?: number
}): Promise<ListActivityApplicationsResponse> {
  const res = await apiClient.get<ListActivityApplicationsResponse>(
    "/partner/applications/activity-providers",
    { params },
  )
  return res.data
}

export async function getActivityApplication(
  id: string,
): Promise<ActivityApplication> {
  const res = await apiClient.get<ActivityApplication>(
    `/partner/activity-provider/${id}`,
  )
  return res.data
}

export async function updateActivityApplicationStatus(
  id: string,
  payload: { status: ApplicationStatus; remark?: string },
): Promise<ActivityApplication> {
  const res = await apiClient.patch<ActivityApplication>(
    `/partner/activity-provider/${id}/status`,
    payload,
  )
  return res.data
}
