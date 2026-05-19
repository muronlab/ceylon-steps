import apiClient from "./api-client"

export type PendingApplicationCounts = {
  guides: number
  transport: number
}

export async function getPendingApplicationCounts(): Promise<PendingApplicationCounts> {
  const res = await apiClient.get<PendingApplicationCounts>(
    "/partner/applications/pending-counts",
  )
  return res.data
}

/**
 * Custom event fired on `window` whenever the polled pending counts change
 * (a new application appeared or one was reviewed). Application list pages
 * listen for this to refetch with their current filters.
 */
export const PENDING_COUNTS_CHANGED_EVENT = "ceylon:pending-counts-changed"

export type PendingCountsChangedDetail = {
  previous: PendingApplicationCounts | null
  current: PendingApplicationCounts
  /** Which buckets actually changed since the last poll. */
  changed: { guides: boolean; transport: boolean }
}
