"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  adminActivityProvidersApi,
  type AdminActivityProviderListItem,
  type ActivityProviderSort,
} from "@/lib/admin-activity-providers-api"
import { ActivityProviderDetailSheet } from "./activity-provider-detail-sheet"

const PAGE_SIZE = 20

const SORT_OPTIONS: Array<{ value: ActivityProviderSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name (A → Z)" },
]

type StatusTab = "all" | "active" | "inactive"

export function ActivityProvidersTable() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [sort, setSort] = useState<ActivityProviderSort>("newest")
  const [skip, setSkip] = useState(0)

  const [items, setItems] = useState<AdminActivityProviderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status:
        statusTab === "all" ? undefined : (statusTab as "active" | "inactive"),
      sort,
    }),
    [debouncedSearch, statusTab, sort],
  )

  useEffect(() => {
    setSkip(0)
  }, [queryParams])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminActivityProvidersApi.search({
        ...queryParams,
        take: PAGE_SIZE,
        skip,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load activity providers."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [queryParams, skip])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function resetFilters() {
    setSearch("")
    setStatusTab("all")
    setSort("newest")
  }

  function onProviderChanged(updated: AdminActivityProviderListItem) {
    setItems((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    )
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeFilterCount = statusTab !== "all" ? 1 : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, mobile, business"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-72 pl-7"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive"] as StatusTab[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusTab === s ? "default" : "outline"}
              onClick={() => setStatusTab(s)}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : "Hidden"}
            </Button>
          ))}
        </div>

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as ActivityProviderSort)}
        >
          <SelectTrigger className="h-7 w-40 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="size-3" />
            Clear {activeFilterCount}
          </Button>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {loading
            ? "Loading…"
            : `${total} provider${total === 1 ? "" : "s"}`}
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
              <TableHead>Mobile</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved</TableHead>
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
                  No activity providers match these filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(p.id)}
                >
                  <TableCell>
                    <div className="font-medium">{p.fullName}</div>
                    <div className="text-[0.7rem] text-muted-foreground">
                      {p.user.email}
                    </div>
                  </TableCell>
                  <TableCell>{p.contactEmail ?? "—"}</TableCell>
                  <TableCell>{p.mobileNumber}</TableCell>
                  <TableCell>
                    <span className="text-xs">{p.businessName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.natureOfBusiness}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.isActive &&
                    p.adminEnabled &&
                    p.user.status === "ACTIVE" ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Listed
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        Hidden
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.approvedAt).toLocaleDateString()}
                    </span>
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

      <ActivityProviderDetailSheet
        providerId={selectedId}
        open={selectedId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null)
        }}
        onChanged={onProviderChanged}
      />
    </div>
  )
}
