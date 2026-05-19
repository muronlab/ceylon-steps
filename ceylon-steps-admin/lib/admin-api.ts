import apiClient from "./api-client"

export type UserStatus = "ACTIVE" | "DISABLED"

export type AdminUserListItem = {
    id: string
    email: string
    name: string | null
    phone: string | null
    emailVerifiedAt: string | null
    sessionInvalidBefore: string | null
    status: UserStatus
    createdAt: string
    updatedAt: string
    roles: string[]
    identities: Array<{ id: string; provider: string; createdAt: string }>
    guideApplicationsCount: number
}

export type AdminUserDetail = AdminUserListItem & {
    recentGuideApplications: Array<{
        id: string
        status: string
        displayName: string
        createdAt: string
        updatedAt: string
    }>
    guideProfile: {
        id: string
        displayName: string
        category: string | null
        approvedAt: string
    } | null
}

export type ListUsersResponse = {
    total: number
    take: number
    skip: number
    users: AdminUserListItem[]
}

export async function listUsers(params: {
    search?: string
    status?: UserStatus
    take?: number
    skip?: number
}): Promise<ListUsersResponse> {
    const res = await apiClient.get<ListUsersResponse>("/admin/users", { params })
    return res.data
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
    const res = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`)
    return res.data
}

export async function setUserStatus(id: string, status: UserStatus): Promise<AdminUserListItem> {
    const res = await apiClient.patch<AdminUserListItem>(`/admin/users/${id}/status`, { status })
    return res.data
}

export async function setUserRoles(
    id: string,
    roles: Array<"ADMIN" | "GUIDE">,
): Promise<AdminUserDetail> {
    const res = await apiClient.patch<AdminUserDetail>(`/admin/users/${id}/roles`, { roles })
    return res.data
}
