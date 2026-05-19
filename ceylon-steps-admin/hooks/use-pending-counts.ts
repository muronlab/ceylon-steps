"use client"

import { useEffect, useRef, useState } from "react"
import {
  getPendingApplicationCounts,
  type PendingApplicationCounts,
  type PendingCountsChangedDetail,
  PENDING_COUNTS_CHANGED_EVENT,
} from "@/lib/pending-counts-api"

const POLL_INTERVAL_MS = 60_000

/**
 * Polls the pending-applications counts endpoint every minute. Whenever the
 * numbers change between polls, dispatches a window CustomEvent so the
 * applications list pages can refetch with their current filters. The sidebar
 * itself just renders the latest counts to show a red badge.
 */
export function usePendingCounts(): PendingApplicationCounts | null {
  const [counts, setCounts] = useState<PendingApplicationCounts | null>(null)
  // Keep last successful value in a ref so the polling effect doesn't re-run
  // when state updates trigger a render.
  const lastRef = useRef<PendingApplicationCounts | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const next = await getPendingApplicationCounts()
        if (cancelled) return

        const prev = lastRef.current
        const changedGuides = prev === null || prev.guides !== next.guides
        const changedTransport =
          prev === null || prev.transport !== next.transport

        // First load is not treated as a "change" for refetch purposes —
        // the list pages already do their own initial fetch on mount.
        const hasRealChange =
          prev !== null && (changedGuides || changedTransport)

        lastRef.current = next
        setCounts(next)

        if (hasRealChange) {
          const detail: PendingCountsChangedDetail = {
            previous: prev,
            current: next,
            changed: {
              guides: changedGuides,
              transport: changedTransport,
            },
          }
          window.dispatchEvent(
            new CustomEvent(PENDING_COUNTS_CHANGED_EVENT, { detail }),
          )
        }
      } catch {
        // Silently ignore — likely a transient auth/network blip. The next
        // tick will retry.
      }
    }

    void poll()
    const id = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return counts
}
