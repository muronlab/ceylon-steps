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
  adminTransportProvidersApi,
  type AdminTransportProviderFacets,
  type AdminTransportProviderListItem,
  type TransportProviderSort,
} from "@/lib/admin-transport-providers-api"
import type { TransportProviderType } from "@/lib/transport-applications-api"
import { TransportProviderDetailSheet } from "./transport-provider-detail-sheet"

const PAGE_SIZE = 20

const SORT_OPTIONS: Array<{ value: TransportProviderSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name (A → Z)" },
]

const PROVIDER_LABELS: Record<TransportProviderType, string> = {
  SAFARI_JEEP: "Safari Jeep",
  VEHICLE_WITH_DRIVER: "Driver + Vehicle",
  VEHICLE_FLEET: "Vehicle Fleet",
}

type StatusTab = "all" | "active" | "inactive"

export function TransportProvidersTable() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [providerType, setProviderType] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("any")
  const [sort, setSort] = useState<TransportProviderSort>("newest")
  const [skip, setSkip] = useState(0)

  const [facets, setFacets] = useState<AdminTransportProviderFacets | null>(null)
  const [items, setItems] = useState<AdminTransportProviderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    adminTransportProvidersApi
      .facets()
      .then(setFacets)
      .catch(() => setFacets(null))
  }, [])

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      providerType:
        providerType === "all"
          ? undefined
          : (providerType as TransportProviderType),
      status:
        statusTab === "all" ? undefined : (statusTab as "active" | "inactive"),
      hasBusiness:
        businessFilter === "yes"
          ? true
          : businessFilter === "no"
            ? false
            : undefined,
      sort,
    }),
    [debouncedSearch, providerType, statusTab, businessFilter, sort],
  )

  useEffect(() => {
    setSkip(0)
  }, [queryParams])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminTransportProvidersApi.search({
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
        "Failed to load transport providers."
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
    setProviderType("all")
    setBusinessFilter("any")
    setSort("newest")
  }

  function onProviderChanged(updated: AdminTransportProviderListItem) {
    setItems((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    )
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeFilterCount =
    (statusTab !== "all" ? 1 : 0) +
    (providerType !== "all" ? 1 : 0) +
    (businessFilter !== "any" ? 1 : 0)

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

        <Select value={providerType} onValueChange={setProviderType}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue placeholder="Provider type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provider types</SelectItem>
            {(facets?.providerTypes ?? [
              "SAFARI_JEEP",
              "VEHICLE_WITH_DRIVER",
              "VEHICLE_FLEET",
            ]).map((t) => (
              <SelectItem key={t} value={t}>
                {PROVIDER_LABELS[t as TransportProviderType] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={businessFilter} onValueChange={setBusinessFilter}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue placeholder="Business" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any operator</SelectItem>
            <SelectItem value="yes">Business</SelectItem>
            <SelectItem value="no">Individual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as TransportProviderSort)}>
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
              <TableHead>Provider type</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved</TableHead>
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
                  No transport providers match these filters.
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
                  <TableCell>{p.contactEmail}</TableCell>
                  <TableCell>{p.mobileNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {PROVIDER_LABELS[p.providerType] ?? p.providerType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.hasBusiness ? (
                      <span className="text-xs">{p.businessName ?? "Yes"}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Individual
                      </span>
                    )}
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
                  <TableCell>{""}</TableCell>
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

      <TransportProviderDetailSheet
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
