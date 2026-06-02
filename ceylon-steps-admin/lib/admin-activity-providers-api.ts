import apiClient from "./api-client"
import type {
  ApplicationStatus,
  ActivityApplicationStatusHistoryEntry,
} from "./activity-applications-api"

export type ActivityProviderSort = "newest" | "oldest" | "name-asc"

export interface AdminActivityProviderListItem {
  id: string
  userId: string
  applicationId: string
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  contactEmail: string | null
  businessName: string
  natureOfBusiness: string
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

export interface AdminActivityProviderListResponse {
  total: number
  take: number
  skip: number
  items: AdminActivityProviderListItem[]
}

export interface AdminActivityProviderApplication {
  id: string
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
  statusHistory: ActivityApplicationStatusHistoryEntry[]
  createdByUser: { id: string; email: string; name: string | null } | null
  statusUpdatedByUser: { id: string; email: string; name: string | null } | null
}

export interface AdminActivityProviderDetail
  extends AdminActivityProviderListItem {
  nicNumber: string
  description: string | null
  address: string
  nicFrontUrl: string
  nicBackUrl: string
  brdDocumentUrl: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  user: AdminActivityProviderListItem["user"] & {
    phone: string | null
    emailVerifiedAt: string | null
    createdAt: string
  }
  application: AdminActivityProviderApplication
}

export interface SearchActivityProvidersParams {
  search?: string
  status?: "active" | "inactive"
  sort?: ActivityProviderSort
  take?: number
  skip?: number
}

export const adminActivityProvidersApi = {
  async search(
    params: SearchActivityProvidersParams,
  ): Promise<AdminActivityProviderListResponse> {
    const res = await apiClient.get<AdminActivityProviderListResponse>(
      "/admin/activity-providers",
      {
        params: {
          search: params.search,
          status: params.status,
          sort: params.sort,
          take: params.take,
          skip: params.skip,
        },
      },
    )
    return res.data
  },

  async detail(id: string): Promise<AdminActivityProviderDetail> {
    const res = await apiClient.get<AdminActivityProviderDetail>(
      `/admin/activity-providers/${id}`,
    )
    return res.data
  },

  async setAdminEnabled(
    id: string,
    adminEnabled: boolean,
  ): Promise<AdminActivityProviderDetail> {
    const res = await apiClient.patch<AdminActivityProviderDetail>(
      `/admin/activity-providers/${id}/admin-enabled`,
      { adminEnabled },
    )
    return res.data
  },
}
