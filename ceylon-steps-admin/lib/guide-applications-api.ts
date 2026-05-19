import apiClient from "./api-client"

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export type GuideApplication = {
    id: string
    partnerType: "GUIDE"
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
    status: ApplicationStatus
    remark: string | null
    createdAt: string
    updatedAt: string
    createdByUser?: { id: string; email: string; name: string | null } | null
    statusUpdatedByUser?: { id: string; email: string; name: string | null } | null
}

export type ListGuideApplicationsResponse = {
    total: number
    take: number
    skip: number
    items: GuideApplication[]
}

export async function listGuideApplications(params: {
    status?: ApplicationStatus
    search?: string
    take?: number
    skip?: number
}): Promise<ListGuideApplicationsResponse> {
    const res = await apiClient.get<ListGuideApplicationsResponse>(
        "/partner/applications/guides",
        { params },
    )
    return res.data
}

export async function updateGuideApplicationStatus(
    id: string,
    payload: { status: ApplicationStatus; remark?: string },
): Promise<GuideApplication> {
    const res = await apiClient.patch<GuideApplication>(
        `/partner/guide/${id}/status`,
        payload,
    )
    return res.data
}

export async function getGuideApplication(id: string): Promise<GuideApplication> {
    const res = await apiClient.get<GuideApplication>(`/partner/guide/${id}`)
    return res.data
}
