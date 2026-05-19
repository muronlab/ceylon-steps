"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import {
  listTransportTypeChangeRequests,
  type ApplicationStatus,
  type TransportProviderType,
  type TransportTypeChangeRequest,
} from "@/lib/transport-applications-api"
import { TypeChangeRequestDetailSheet } from "./type-change-request-detail-sheet"

type StatusFilter = "ALL" | ApplicationStatus

const PROVIDER_LABELS: Record<TransportProviderType, string> = {
  SAFARI_JEEP: "Safari Jeep",
  VEHICLE_WITH_DRIVER: "Driver + Vehicle",
  VEHICLE_FLEET: "Vehicle Fleet",
}

export function TypeChangeRequestsTable() {
  const [items, setItems] = useState<TransportTypeChangeRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listTransportTypeChangeRequests({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      })
      setItems(res)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load requests."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function onRequestChanged(updated: TransportTypeChangeRequest) {
    setItems((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map(
            (s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "ALL" ? "All" : titleCase(s)}
              </Button>
            ),
          )}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {loading
            ? "Loading…"
            : `${items.length} request${items.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-0">{""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => {
                const docCount =
                  (r.safariJeepLicenseUrl ? 1 : 0) +
                  (r.brdDocumentUrl ? 1 : 0)
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedId(r.id)}
                  >
                    <TableCell>
                      <span className="font-medium">
                        {r.profile?.fullName ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>{r.profile?.contactEmail ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Badge variant="outline" className="font-normal">
                          {PROVIDER_LABELS[r.currentType]}
                        </Badge>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <Badge variant="outline" className="font-normal">
                          {PROVIDER_LABELS[r.requestedType]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {docCount > 0 ? (
                        <Badge variant="outline" className="font-normal">
                          {docCount} file{docCount === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(r.id)
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TypeChangeRequestDetailSheet
        requestId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onChanged={onRequestChanged}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Approved
      </Badge>
    )
  }
  if (status === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        Rejected
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-amber-700"
    >
      Pending
    </Badge>
  )
}

function titleCase(s: string) {
  return s[0] + s.slice(1).toLowerCase()
}
