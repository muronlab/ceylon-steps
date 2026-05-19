"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Award,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react"

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
  publicGuidesService,
  type GuideSort,
  type PublicGuideFacets,
  type PublicGuideListItem,
} from "@/services/public-guides.service"

const wallpaper = ROUTE_HERO_IMAGES["/guides"]

const SORT_OPTIONS: Array<{ value: GuideSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "experience-desc", label: "Most experience" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
]

const EXPERIENCE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+ years" },
  { value: 3, label: "3+ years" },
  { value: 5, label: "5+ years" },
  { value: 10, label: "10+ years" },
]

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

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "G"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
}

const PAGE_SIZE = 12

function GuidesFiltersPanel({
  query,
  setQuery,
  category,
  setCategory,
  minExperience,
  setMinExperience,
  selectedRegions,
  setSelectedRegions,
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
  category: string
  setCategory: (v: string) => void
  minExperience: number
  setMinExperience: (v: number) => void
  selectedRegions: string[]
  setSelectedRegions: React.Dispatch<React.SetStateAction<string[]>>
  selectedLanguages: string[]
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>
  currency: string
  setCurrency: (v: string) => void
  maxPrice: string
  setMaxPrice: (v: string) => void
  facets: PublicGuideFacets | null
  resetFilters: () => void
}) {
  const categoryOptions = useMemo(() => {
    const fromFacets = facets?.categories ?? []
    const base = ["National", "Chauffeur", "Area", "Site"]
    const merged = Array.from(new Set([...base, ...fromFacets, "Other"]))
    return merged
  }, [facets])

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
          placeholder="Search guides"
          className="h-11 text-[13px] sm:text-sm"
        />
      </InputGroup>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Guide type</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("All")}
            className={[
              "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
              category === "All"
                ? "bg-zinc-950 text-white ring-zinc-950"
                : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50",
            ].join(" ")}
          >
            All
          </button>
          {categoryOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCategory(t)}
              className={[
                "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
                category === t
                  ? "bg-zinc-950 text-white ring-zinc-950"
                  : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Experience</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMinExperience(opt.value)}
              className={[
                "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
                minExperience === opt.value
                  ? "bg-zinc-950 text-white ring-zinc-950"
                  : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Regions</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="mt-2 h-11 w-full justify-between rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70"
            >
              <span className="truncate">
                {selectedRegions.length ? `${selectedRegions.length} selected` : "Any region"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Regions specialised</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facets?.regions?.length ? (
              facets.regions.map((r) => {
                const checked = selectedRegions.includes(r)
                return (
                  <DropdownMenuCheckboxItem
                    key={r}
                    checked={checked}
                    onCheckedChange={(v) =>
                      setSelectedRegions((prev) =>
                        v === true ? [...prev, r] : prev.filter((x) => x !== r),
                      )
                    }
                  >
                    {r}
                  </DropdownMenuCheckboxItem>
                )
              })
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-500">No regions yet.</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Spoken languages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facets?.languages?.length ? (
              facets.languages.map((l) => {
                const checked = selectedLanguages.includes(l)
                return (
                  <DropdownMenuCheckboxItem
                    key={l}
                    checked={checked}
                    onCheckedChange={(v) =>
                      setSelectedLanguages((prev) =>
                        v === true ? [...prev, l] : prev.filter((x) => x !== l),
                      )
                    }
                  >
                    {l}
                  </DropdownMenuCheckboxItem>
                )
              })
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-500">No languages yet.</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <div className="text-sm font-semibold text-zinc-950">Budget</div>
        <p className="mt-1 text-[0.7rem] text-zinc-500">
          Pick a currency to match guides who price in it.
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
              placeholder="Max / day"
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

export default function GuidesPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [minExperience, setMinExperience] = useState<number>(0)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [currency, setCurrency] = useState<string>("any")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sort, setSort] = useState<GuideSort>("relevance")
  const [view, setView] = useState<"tile" | "list">("tile")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [facets, setFacets] = useState<PublicGuideFacets | null>(null)
  const [items, setItems] = useState<PublicGuideListItem[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Preload hero
  useEffect(() => {
    const img = new window.Image()
    img.src = wallpaper
    img.decode?.().catch(() => {})
  }, [])

  // Load facets once
  useEffect(() => {
    publicGuidesService.facets().then(setFacets).catch(() => setFacets(null))
  }, [])

  const queryParams = useMemo(() => {
    const maxPriceNum = Number(maxPrice.replaceAll(",", "").trim())
    const hasMaxPrice =
      currency !== "any" && Number.isFinite(maxPriceNum) && maxPriceNum > 0
    return {
      search: debouncedQuery || undefined,
      category: category === "All" ? undefined : category,
      regions: selectedRegions.length > 0 ? selectedRegions : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      minExperience: minExperience > 0 ? minExperience : undefined,
      currency: currency !== "any" ? currency : undefined,
      maxPrice: hasMaxPrice ? maxPriceNum : undefined,
      sort,
    }
  }, [
    debouncedQuery,
    category,
    selectedRegions,
    selectedLanguages,
    minExperience,
    currency,
    maxPrice,
    sort,
  ])

  // Reset paging whenever filters change
  useEffect(() => {
    setSkip(0)
  }, [queryParams])

  // Fetch the first page when filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    publicGuidesService
      .search({ ...queryParams, take: PAGE_SIZE, skip: 0 })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotal(res.total)
      })
      .catch(() => {
        if (cancelled) return
        setError("Couldn't load guides. Please try again.")
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryParams])

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return
    if (items.length >= total) return
    setLoadingMore(true)
    try {
      const nextSkip = items.length
      const res = await publicGuidesService.search({
        ...queryParams,
        take: PAGE_SIZE,
        skip: nextSkip,
      })
      setItems((prev) => [...prev, ...res.items])
      setSkip(nextSkip)
      setTotal(res.total)
    } catch {
      // swallow — user can click Load more again
    } finally {
      setLoadingMore(false)
    }
  }, [items, loading, loadingMore, queryParams, total])

  // Infinite scroll
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
    setCategory("All")
    setMinExperience(0)
    setSelectedRegions([])
    setSelectedLanguages([])
    setCurrency("any")
    setMaxPrice("")
    setSort("relevance")
    setView("tile")
  }

  const filtersPanel = (
    <GuidesFiltersPanel
      query={query}
      setQuery={setQuery}
      category={category}
      setCategory={setCategory}
      minExperience={minExperience}
      setMinExperience={setMinExperience}
      selectedRegions={selectedRegions}
      setSelectedRegions={setSelectedRegions}
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
                <UsersRound className="size-4" />
                Guides
              </div>

              <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Search & book a local guide
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Filter by region, language, experience and price to find your match.
              </p>

              <div className="mt-7 w-full rounded-4xl bg-white/90 p-4 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.45)] ring-1 ring-white/35 backdrop-blur-xl sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px_160px]">
                  <InputGroup className="h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                    <InputGroupAddon className="text-zinc-500">
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, tagline, region or language…"
                      className="h-11 text-[13px] sm:text-sm"
                    />
                  </InputGroup>

                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 w-full rounded-3xl bg-white text-[13px] ring-1 ring-zinc-200/70 sm:text-sm">
                      <SelectValue placeholder="Guide type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All types</SelectItem>
                      {(facets?.categories ?? ["National", "Chauffeur", "Area", "Site"]).map(
                        (c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    className="h-11 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-900"
                    onClick={() =>
                      document
                        .getElementById("guides-results")
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
          id="guides-results"
          className="mt-3 grid items-start gap-4 rounded-none bg-transparent p-0 ring-0 sm:mt-6 sm:rounded-4xl sm:bg-zinc-50 sm:p-7 sm:ring-1 sm:ring-zinc-200/70 lg:grid-cols-[300px_1fr] lg:p-10"
        >
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] self-start overflow-y-auto rounded-4xl bg-white p-5 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70 lg:block">
            {filtersPanel}
          </aside>

          <section className="rounded-none bg-white p-0 shadow-none ring-0 sm:rounded-4xl sm:p-6 sm:shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] sm:ring-1 sm:ring-zinc-200/70">
            <div className="flex flex-wrap items-end justify-between gap-3 py-4 md:py-0">
              <div>
                <div className="text-sm font-semibold text-zinc-950">Available guides</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {loading
                    ? "Loading…"
                    : `Showing ${items.length} of ${total} result${total === 1 ? "" : "s"}`}
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

                <Select value={sort} onValueChange={(v) => setSort(v as GuideSort)}>
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

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {loading && items.length === 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-4xl bg-zinc-100 ring-1 ring-zinc-200/70"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6 rounded-4xl bg-white p-10 text-center ring-1 ring-zinc-200/70">
                <div className="text-base font-semibold text-zinc-950">No matches</div>
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
                    "mt-3 grid gap-4 sm:mt-4",
                    view === "list"
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  ].join(" ")}
                >
                  {items.map((g) => (
                    <GuideCard key={g.id} guide={g} />
                  ))}
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
                      Loading more guides
                    </div>
                  </div>
                )}

                {!loadingMore && items.length < total && (
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

function GuideCard({ guide }: { guide: PublicGuideListItem }) {
  const day = formatMoney(guide.pricePerDay, guide.currency)
  const hour = formatMoney(guide.pricePerHour, guide.currency)

  return (
    <Link
      href={`/guides/${encodeURIComponent(guide.id)}`}
      className="group relative cursor-pointer overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 transition-all duration-300 hover:-translate-y-1 hover:ring-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)]"
    >
      {/* Cover */}
      <div className="relative h-32 overflow-hidden sm:h-36">
        {guide.coverPhotoUrl ? (
          <Image
            src={guide.coverPhotoUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover opacity-90 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {guide.tagline && (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm backdrop-blur-md">
            {guide.tagline}
          </div>
        )}
      </div>

      {/* Body: avatar + name row, then meta + price */}
      <div className="px-5 pb-5">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_12px_28px_-14px_rgba(0,0,0,0.5)] ring-4 ring-white sm:size-28">
            {guide.profilePhotoUrl ? (
              <Image
                src={guide.profilePhotoUrl}
                alt={guide.displayName}
                fill
                sizes="(max-width: 1024px) 96px, 112px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-zinc-100 text-xl font-bold text-zinc-800">
                {getInitials(guide.displayName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-zinc-950 transition-colors group-hover:text-blue-600">
              {guide.displayName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {guide.category}
              </span>
              {typeof guide.yearsOfExperience === "number" && guide.yearsOfExperience > 0 && (
                <>
                  <div className="size-1 rounded-full bg-zinc-300" />
                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-700">
                    <Award className="size-3.5 text-amber-500" />
                    {guide.yearsOfExperience} yr{guide.yearsOfExperience === 1 ? "" : "s"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {Array.isArray(guide.regionsSpecialized) && guide.regionsSpecialized.length > 0 && (
            <div className="flex items-start gap-2 text-zinc-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              <div className="line-clamp-1">
                <span className="font-medium text-zinc-800">Regions:</span>{" "}
                {guide.regionsSpecialized.join(", ")}
              </div>
            </div>
          )}
          {guide.languages.length > 0 && (
            <div className="flex items-start gap-2 text-zinc-600">
              <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                <div className="size-1.5 rounded-full bg-zinc-300" />
              </div>
              <div className="line-clamp-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-800">Speaks:</span>
                {guide.languages.slice(0, 4).map((l) => (
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
                {guide.languages.length > 4 && (
                  <span className="text-xs text-zinc-500">
                    +{guide.languages.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              From
            </div>
            <div className="text-lg font-bold text-zinc-950">
              {day ?? hour ?? "On request"}
              {day && (
                <span className="ml-1 text-xs font-medium text-zinc-400">/day</span>
              )}
              {!day && hour && (
                <span className="ml-1 text-xs font-medium text-zinc-400">/hour</span>
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
