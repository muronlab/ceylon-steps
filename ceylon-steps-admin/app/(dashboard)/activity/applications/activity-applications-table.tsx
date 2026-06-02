"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  listActivityApplications,
  type ApplicationStatus,
  type ActivityApplication,
} from "@/lib/activity-applications-api"
import {
  PENDING_COUNTS_CHANGED_EVENT,
  type PendingCountsChangedDetail,
} from "@/lib/pending-counts-api"
import { ActivityApplicationDetailSheet } from "./activity-application-detail-sheet"

type StatusFilter = "ALL" | ApplicationStatus

const PAGE_SIZE = 20

export function ActivityApplicationsTable() {
  const [items, setItems] = useState<ActivityApplication[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listActivityApplications({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
        take: PAGE_SIZE,
        skip,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load applications."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [skip, search, statusFilter])

  useEffect(() => {
    const t = setTimeout(refresh, 200)
    return () => clearTimeout(t)
  }, [refresh])

  useEffect(() => {
    setSkip(0)
  }, [search, statusFilter])

  useEffect(() => {
    function onChanged(e: Event) {
      const detail = (e as CustomEvent<PendingCountsChangedDetail>).detail
      if (detail?.changed.activity) void refresh()
    }
    window.addEventListener(PENDING_COUNTS_CHANGED_EVENT, onChanged)
    return () =>
      window.removeEventListener(PENDING_COUNTS_CHANGED_EVENT, onChanged)
  }, [refresh])

  function onApplicationChanged(updated: ActivityApplication) {
    setItems((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    )
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, mobile, or business"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-80 pl-7"
          />
        </div>
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
            : `${total} application${total === 1 ? "" : "s"}`}
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
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-0">{""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(a.id)}
                >
                  <TableCell>
                    <span className="font-medium">{a.fullName}</span>
                  </TableCell>
                  <TableCell>{a.contactEmail ?? "—"}</TableCell>
                  <TableCell>{a.mobileNumber}</TableCell>
                  <TableCell>
                    <span className="text-xs">{a.businessName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {a.natureOfBusiness}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(a.id)
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={skip === 0 || loading}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
          >
            <ChevronLeft className="size-3" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={skip + PAGE_SIZE >= total || loading}
            onClick={() => setSkip(skip + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>

      <ActivityApplicationDetailSheet
        applicationId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onChanged={onApplicationChanged}
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
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
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
