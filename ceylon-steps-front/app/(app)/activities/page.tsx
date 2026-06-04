"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Award,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Tent,
} from "lucide-react"
import { languageCountryCode } from "@/lib/language-flags"

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ROUTE_HERO_IMAGES } from "@/lib/route-hero-images"
import {
  publicItinerariesService,
  type ItinerarySort,
  type PublicItineraryCard,
  type PublicItineraryFacets,
  type TopTag,
} from "@/services/public-itineraries.service"
import { formatDurationMinutes } from "@/lib/itinerary-duration"
import { PopularTags } from "@/components/common/popular-tags"
import {
  publicPartnersService,
  type ActivityProviderListItem,
  type ActivityProviderSort,
} from "@/services/public-partners.service"

const wallpaper = ROUTE_HERO_IMAGES["/activities"]
const PAGE_SIZE = 9

// Shared sorts valid for BOTH the itinerary search and the provider listing, so
// the mixed feed sorts coherently.
const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

const DESIGN_OPTIONS: Array<{
  value: "any" | "DAYS" | "TIME" | "DURATION"
  label: string
}> = [
  { value: "any", label: "Any" },
  { value: "DAYS", label: "Multi-day" },
  { value: "TIME", label: "Single day" },
  { value: "DURATION", label: "By duration" },
]

const PRICE_SCOPE_SUFFIX: Record<string, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ group",
  PER_DAY: "/ day",
}

const DEFAULT_GRADIENT =
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]"

// One feed mixing host profiles and their experiences.
type FeedItem =
  | { kind: "host"; id: string; data: ActivityProviderListItem }
  | { kind: "experience"; id: string; data: PublicItineraryCard }

function interleave(
  hosts: ActivityProviderListItem[],
  experiences: PublicItineraryCard[],
): FeedItem[] {
  const out: FeedItem[] = []
  const max = Math.max(hosts.length, experiences.length)
  for (let i = 0; i < max; i++) {
    if (i < hosts.length) out.push({ kind: "host", id: `h-${hosts[i].id}`, data: hosts[i] })
    if (i < experiences.length) {
      out.push({ kind: "experience", id: `e-${experiences[i].id}`, data: experiences[i] })
    }
  }
  return out
}

function formatMoney(value: string | null, currency: string | null) {
  if (!value) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  const code = currency || "LKR"
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: code,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num)
  } catch {
    return `${num.toLocaleString()} ${code}`
  }
}

function deriveDurationLabel(it: PublicItineraryCard): string {
  if (it.durationLabel) return it.durationLabel
  if (it.designType === "DURATION") return formatDurationMinutes(it.durationMinutes)
  if (it.designType === "TIME") return "1 day"
  if (it.durationDays && it.durationDays > 0) {
    return `${it.durationDays} day${it.durationDays === 1 ? "" : "s"}`
  }
  return ""
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "C"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

function ActivitiesFiltersPanel({
  query,
  setQuery,
  design,
  setDesign,
  selectedLanguages,
  setSelectedLanguages,
  currency,
  setCurrency,
  maxPrice,
  setMaxPrice,
  facets,
  resetFilters,
}: {
  query: string
  setQuery: (v: string) => void
  design: "any" | "DAYS" | "TIME" | "DURATION"
  setDesign: (v: "any" | "DAYS" | "TIME" | "DURATION") => void
  selectedLanguages: string[]
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>
  currency: string
  setCurrency: (v: string) => void
  maxPrice: string
  setMaxPrice: (v: string) => void
  facets: PublicItineraryFacets | null
  resetFilters: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-950">Refine</div>
        <button
          type="button"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-700"
          onClick={resetFilters}
        >
          Reset all
        </button>
      </div>

      <InputGroup className="h-11 rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70">
        <InputGroupAddon className="text-zinc-500">
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search activities & hosts"
          className="h-11 text-[13px] sm:text-sm"
        />
      </InputGroup>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Trip length</div>
        <p className="mt-1 text-[0.7rem] text-zinc-500">Applies to experiences.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DESIGN_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDesign(o.value)}
              className={[
                "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
                design === o.value
                  ? "bg-zinc-950 text-white ring-zinc-950"
                  : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Languages</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="mt-2 h-11 w-full justify-between rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70"
            >
              <span className="truncate">
                {selectedLanguages.length
                  ? `${selectedLanguages.length} selected`
                  : "Any language"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
            <DropdownMenuLabel>Offered in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facets?.languages?.length ? (
              facets.languages.map((l) => (
                <DropdownMenuCheckboxItem
                  key={l}
                  checked={selectedLanguages.includes(l)}
                  onCheckedChange={(v) =>
                    setSelectedLanguages((prev) =>
                      v === true ? [...prev, l] : prev.filter((x) => x !== l),
                    )
                  }
                >
                  {l}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-500">No languages yet.</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Budget</div>
        <p className="mt-1 text-[0.7rem] text-zinc-500">
          Pick a currency to match prices in it.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-11 rounded-3xl bg-zinc-50 text-[13px] ring-1 ring-zinc-200/70 sm:text-sm">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any currency</SelectItem>
              {(facets?.currencies?.length
                ? facets.currencies
                : ["LKR", "USD", "EUR", "GBP", "AUD"]
              ).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InputGroup className="h-11 rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70">
            <InputGroupInput
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              inputMode="numeric"
              className="h-11 text-[13px] sm:text-sm"
              disabled={currency === "any"}
            />
          </InputGroup>
        </div>
      </div>
    </div>
  )
}

export default function ActivitiesPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [design, setDesign] = useState<"any" | "DAYS" | "TIME" | "DURATION">(
    "any",
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [currency, setCurrency] = useState<string>("any")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sort, setSort] = useState<string>("relevance")
  const [view, setView] = useState<"tile" | "list">("tile")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [facets, setFacets] = useState<PublicItineraryFacets | null>(null)
  const [topTags, setTopTags] = useState<TopTag[]>([])
  const [topTagsLoading, setTopTagsLoading] = useState(true)

  const [items, setItems] = useState<PublicItineraryCard[]>([])
  const [total, setTotal] = useState(0)
  const [hosts, setHosts] = useState<ActivityProviderListItem[]>([])
  const [hostsTotal, setHostsTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const img = new window.Image()
    img.src = wallpaper
    img.decode?.().catch(() => {})
  }, [])

  useEffect(() => {
    publicItinerariesService
      .facets()
      .then(setFacets)
      .catch(() => setFacets(null))
  }, [])

  // Popular tags shown as toggle chips above the listing.
  useEffect(() => {
    setTopTagsLoading(true)
    publicPartnersService
      .activityProviderTopTags()
      .then(setTopTags)
      .catch(() => setTopTags([]))
      .finally(() => setTopTagsLoading(false))
  }, [])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const maxPriceNum = useMemo(() => {
    const n = Number(maxPrice.replaceAll(",", "").trim())
    return currency !== "any" && Number.isFinite(n) && n > 0 ? n : undefined
  }, [currency, maxPrice])

  const itineraryParams = useMemo(
    () => ({
      ownerType: "ACTIVITY_PROVIDER" as const,
      search: debouncedQuery || undefined,
      designType: design === "any" ? undefined : design,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      currency: currency !== "any" ? currency : undefined,
      maxPrice: maxPriceNum,
      sort: sort as ItinerarySort,
    }),
    [debouncedQuery, design, selectedTags, selectedLanguages, currency, maxPriceNum, sort],
  )

  const providerParams = useMemo(
    () => ({
      search: debouncedQuery || undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      currency: currency !== "any" ? currency : undefined,
      maxPrice: maxPriceNum,
      sort: sort as ActivityProviderSort,
    }),
    [debouncedQuery, selectedLanguages, currency, maxPriceNum, sort],
  )

  // First page — fetch hosts and experiences together, then interleave.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      publicPartnersService.searchActivityProviders({
        ...providerParams,
        take: PAGE_SIZE,
        skip: 0,
      }),
      publicItinerariesService.search({
        ...itineraryParams,
        take: PAGE_SIZE,
        skip: 0,
      }),
    ])
      .then(([hostRes, itinRes]) => {
        if (cancelled) return
        setHosts(hostRes.items)
        setHostsTotal(hostRes.total)
        setItems(itinRes.items)
        setTotal(itinRes.total)
      })
      .catch(() => {
        if (cancelled) return
        setError("Couldn't load. Please try again.")
        setHosts([])
        setHostsTotal(0)
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [itineraryParams, providerParams])

  const hasMore = items.length < total || hosts.length < hostsTotal

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return
    setLoadingMore(true)
    try {
      const [hostRes, itinRes] = await Promise.all([
        hosts.length < hostsTotal
          ? publicPartnersService.searchActivityProviders({
              ...providerParams,
              take: PAGE_SIZE,
              skip: hosts.length,
            })
          : null,
        items.length < total
          ? publicItinerariesService.search({
              ...itineraryParams,
              take: PAGE_SIZE,
              skip: items.length,
            })
          : null,
      ])
      if (hostRes) {
        setHosts((prev) => [...prev, ...hostRes.items])
        setHostsTotal(hostRes.total)
      }
      if (itinRes) {
        setItems((prev) => [...prev, ...itinRes.items])
        setTotal(itinRes.total)
      }
    } catch {
      // swallow — the user can click Load more again
    } finally {
      setLoadingMore(false)
    }
  }, [
    loading,
    loadingMore,
    hasMore,
    hosts.length,
    hostsTotal,
    items.length,
    total,
    itineraryParams,
    providerParams,
  ])

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + document.documentElement.scrollTop + 200 >=
        document.documentElement.offsetHeight
      ) {
        void loadMore()
      }
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [loadMore])

  function resetFilters() {
    setQuery("")
    setDesign("any")
    setSelectedTags([])
    setSelectedLanguages([])
    setCurrency("any")
    setMaxPrice("")
    setSort("relevance")
    setView("tile")
  }

  const feed = useMemo(() => interleave(hosts, items), [hosts, items])
  const isEmpty = feed.length === 0

  const filtersPanel = (
    <ActivitiesFiltersPanel
      query={query}
      setQuery={setQuery}
      design={design}
      setDesign={setDesign}
      selectedLanguages={selectedLanguages}
      setSelectedLanguages={setSelectedLanguages}
      currency={currency}
      setCurrency={setCurrency}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      facets={facets}
      resetFilters={resetFilters}
    />
  )

  return (
    <div className="min-h-screen w-full px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>

        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden lg:block">
            <div className="pointer-events-auto">
              <SiteNavbar variant="glass" tone="dark" />
            </div>
          </div>

          <div className="relative w-full overflow-hidden rounded-4xl pt-14 lg:pt-20">
            <div className="absolute inset-0 z-0">
              <Image
                src={wallpaper}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30),rgba(0,0,0,0.12)_45%,rgba(0,0,0,0.45))]" />
            </div>

            <div className="relative z-10 px-5 pb-8 pt-6 sm:px-10 sm:pb-12 sm:pt-10 lg:px-14 lg:pb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md">
                <Tent className="size-4" />
                Activities
              </div>

              <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Book an experience
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Curated activities and the local hosts behind them — surfing,
                safaris, pottery, village tours and more.
              </p>

              <div className="mt-7 w-full rounded-4xl bg-white/90 p-4 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.45)] ring-1 ring-white/35 backdrop-blur-xl sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_160px]">
                  <InputGroup className="h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                    <InputGroupAddon className="text-zinc-500">
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by title, tag, language or host…"
                      className="h-11 text-[13px] sm:text-sm"
                    />
                  </InputGroup>

                  <Button
                    type="button"
                    className="h-11 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-900"
                    onClick={() =>
                      document
                        .getElementById("activities-results")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="activities-results"
          className="mt-3 grid items-start gap-4 rounded-none bg-transparent p-0 ring-0 sm:mt-6 sm:rounded-4xl sm:bg-zinc-50 sm:p-7 sm:ring-1 sm:ring-zinc-200/70 lg:grid-cols-[300px_1fr] lg:p-10"
        >
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] self-start overflow-y-auto rounded-4xl bg-white p-5 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70 lg:block">
            {filtersPanel}
          </aside>

          <section className="rounded-none bg-white p-0 shadow-none ring-0 sm:rounded-4xl sm:p-6 sm:shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] sm:ring-1 sm:ring-zinc-200/70">
            <div className="flex flex-wrap items-end justify-between gap-3 py-4 md:py-0">
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Activities &amp; hosts
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {loading
                    ? "Loading…"
                    : `${hostsTotal} host${hostsTotal === 1 ? "" : "s"} · ${total} experience${total === 1 ? "" : "s"}`}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-3xl bg-white ring-1 ring-zinc-200/70 lg:hidden"
                    >
                      <SlidersHorizontal className="mr-2 size-4 text-zinc-600" />
                      Filters
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="pb-2">
                      <DrawerTitle>Filters</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-auto rounded-4xl bg-white p-5 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70">
                      {filtersPanel}
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button className="h-11 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-900">
                          Show results
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10 w-44 rounded-3xl bg-white text-xs ring-1 ring-zinc-200/70">
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

                <ToggleGroup
                  type="single"
                  value={view}
                  onValueChange={(v) => v && setView(v as "tile" | "list")}
                >
                  <ToggleGroupItem value="tile" aria-label="Tile view">
                    <LayoutGrid className="size-4" />
                    <span className="hidden sm:inline">Tile</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="size-4" />
                    <span className="hidden sm:inline">List</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <PopularTags
              className="mt-4"
              tags={topTags}
              selected={selectedTags}
              onToggle={toggleTag}
              onClear={() => setSelectedTags([])}
              loading={topTagsLoading}
            />

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {loading && isEmpty ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-4xl bg-zinc-100 ring-1 ring-zinc-200/70"
                  />
                ))}
              </div>
            ) : isEmpty ? (
              <div className="mt-6 rounded-4xl bg-white p-10 text-center ring-1 ring-zinc-200/70">
                <div className="text-base font-semibold text-zinc-950">Nothing yet</div>
                <div className="mt-1 text-sm text-zinc-500">
                  Try widening your filters or clearing them.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-10 rounded-3xl"
                  onClick={resetFilters}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={[
                    "mt-4 grid gap-4",
                    view === "list"
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
                  ].join(" ")}
                >
                  {feed.map((f) =>
                    f.kind === "host" ? (
                      <HostCard key={f.id} host={f.data} />
                    ) : (
                      <ActivityCard
                        key={f.id}
                        itinerary={f.data}
                        list={view === "list"}
                      />
                    ),
                  )}
                </div>

                {loadingMore && (
                  <div className="mt-10 flex flex-col items-center justify-center gap-3 pb-12">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="size-2 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="size-2 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Loading more
                    </div>
                  </div>
                )}

                {!loadingMore && hasMore && (
                  <div className="mt-8 flex justify-center pb-12">
                    <button
                      type="button"
                      onClick={loadMore}
                      className="rounded-full bg-zinc-100 px-8 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function ActivityCard({
  itinerary,
  list,
}: {
  itinerary: PublicItineraryCard
  list: boolean
}) {
  const price = formatMoney(itinerary.price, itinerary.currency)
  const duration = deriveDurationLabel(itinerary)
  const owner = itinerary.owner

  return (
    <Link
      href={`/itinerary/${encodeURIComponent(itinerary.id)}`}
      className={[
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 transition-all duration-300 hover:-translate-y-1 hover:ring-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)]",
        list ? "sm:flex-row" : "",
      ].join(" ")}
    >
      <div className={["relative", list ? "sm:w-64 sm:shrink-0" : ""].join(" ")}>
        {itinerary.coverImageUrl ? (
          <div className="relative h-40 w-full sm:h-44">
            <Image
              src={itinerary.coverImageUrl}
              alt={itinerary.title}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className={[
              "h-40 w-full sm:h-44",
              itinerary.imageGradient ?? DEFAULT_GRADIENT,
            ].join(" ")}
          >
            <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm backdrop-blur-md">
            Experience
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          {duration && (
            <span className="rounded-2xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-zinc-800 ring-1 ring-white/70 backdrop-blur-md">
              {duration}
            </span>
          )}
          {price && (
            <span className="rounded-2xl bg-zinc-950/80 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
              {price}
              <span className="ml-1 text-[0.65rem] font-medium text-white/70">
                {PRICE_SCOPE_SUFFIX[itinerary.priceScope] ?? ""}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-blue-600">
          {itinerary.title}
        </h3>
        {itinerary.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
            {itinerary.subtitle}
          </p>
        )}

        {owner && (
          <div className="mt-3 flex items-center gap-2">
            <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200">
              {owner.photoUrl ? (
                <Image
                  src={owner.photoUrl}
                  alt={owner.name}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[10px] font-bold text-zinc-700">
                  {getInitials(owner.name)}
                </div>
              )}
            </div>
            <div className="truncate text-xs text-zinc-600">
              with <span className="font-semibold text-zinc-800">{owner.name}</span>
            </div>
          </div>
        )}

        {/* Languages — a tourist's first practical question is "can I follow
            the guide?". Shown with flags, exactly like the host tile. */}
        {itinerary.languagesOffered.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {itinerary.languagesOffered.slice(0, 4).map((l) => {
              const code = languageCountryCode(l)
              return (
                <div key={l} className="flex items-center gap-1.5">
                  {code && (
                    <div className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-zinc-200">
                      <Image
                        src={flagUrl(code)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="text-[13px] font-medium text-zinc-700">{l}</span>
                </div>
              )
            })}
            {itinerary.languagesOffered.length > 4 && (
              <span className="text-xs text-zinc-500">
                +{itinerary.languagesOffered.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tags — single row only; overflow collapses into a "+N more" chip. */}
        {itinerary.tags.length > 0 && (
          <div className="mt-3 flex flex-nowrap items-center gap-1 overflow-hidden">
            {itinerary.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200/70"
              >
                {t}
              </span>
            ))}
            {itinerary.tags.length > 3 && (
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70">
                +{itinerary.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer CTA — price already sits on the image for at-a-glance
            scanning, so the footer is a clear "open it" affordance that makes
            the tile read as bookable, matching the host tile's footer height. */}
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-blue-600">
              View experience
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition group-hover:bg-zinc-950 group-hover:text-white">
              <ChevronRight className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function HostCard({ host }: { host: ActivityProviderListItem }) {
  const day = formatMoney(host.pricePerDay, host.currency)
  const hour = formatMoney(host.pricePerHour, host.currency)
  const pkg = formatMoney(host.packagePrice, host.currency)
  const pkgSuffix = host.packagePriceScope === "PER_GROUP" ? "/group" : "/person"

  return (
    <Link
      href={`/activities/${encodeURIComponent(host.id)}`}
      className="group relative cursor-pointer overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 transition-all duration-300 hover:-translate-y-1 hover:ring-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)]"
    >
      <div className="relative h-32 overflow-hidden sm:h-36">
        {host.coverPhotoUrl ? (
          <Image
            src={host.coverPhotoUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover opacity-90 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm backdrop-blur-md">
            Host
          </span>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_12px_28px_-14px_rgba(0,0,0,0.5)] ring-4 ring-white sm:size-28">
            {host.profilePhotoUrl ? (
              <Image
                src={host.profilePhotoUrl}
                alt={host.displayName}
                fill
                sizes="(max-width: 1024px) 96px, 112px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-zinc-100 text-xl font-bold text-zinc-800">
                {getInitials(host.displayName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-zinc-950 transition-colors group-hover:text-blue-600">
              {host.displayName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {host.natureOfBusiness}
              </span>
              {typeof host.yearsOfExperience === "number" && host.yearsOfExperience > 0 && (
                <>
                  <div className="size-1 rounded-full bg-zinc-300" />
                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-700">
                    <Award className="size-3.5 text-amber-500" />
                    {host.yearsOfExperience} yr{host.yearsOfExperience === 1 ? "" : "s"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {host.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
            {host.description.replace(/<[^>]+>/g, " ")}
          </p>
        )}

        {host.languages.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {host.languages.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center gap-1.5">
                {l.countryCode && (
                  <div className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-zinc-200">
                    <Image
                      src={flagUrl(l.countryCode)}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-[13px] font-medium text-zinc-700">{l.language}</span>
              </div>
            ))}
            {host.languages.length > 4 && (
              <span className="text-xs text-zinc-500">+{host.languages.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              From
            </div>
            <div className="text-lg font-bold text-zinc-950">
              {day ?? hour ?? pkg ?? "On request"}
              {day && <span className="ml-1 text-xs font-medium text-zinc-400">/day</span>}
              {!day && hour && (
                <span className="ml-1 text-xs font-medium text-zinc-400">/hour</span>
              )}
              {!day && !hour && pkg && (
                <span className="ml-1 text-xs font-medium text-zinc-400">{pkgSuffix}</span>
              )}
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition group-hover:bg-zinc-950 group-hover:text-white">
            <ChevronRight className="size-5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
