"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Users,
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import transportData from "@/data/transport.demo.json"
import { ROUTE_HERO_IMAGES } from "@/lib/route-hero-images"

type Car = {
  id: string
  name: string
  subtitle: string
  rating: number
  reviews: number
  location: string
  pricePerDay: number
  meta: { label: string; value: string }[]
  color: "blue" | "white" | "orange" | "teal"
  brand: "BMW" | "Mercedes" | "Audi" | "Toyota"
}

const cars = transportData as Car[]

function formatMoneyUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function colorClass(color: Car["color"]) {
  switch (color) {
    case "blue":
      return "from-blue-600/25 via-blue-500/10 to-transparent"
    case "white":
      return "from-zinc-200/70 via-zinc-100/40 to-transparent"
    case "orange":
      return "from-orange-600/25 via-orange-500/10 to-transparent"
    case "teal":
      return "from-teal-600/25 via-teal-500/10 to-transparent"
  }
}

function BrandPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
        active
          ? "bg-zinc-950 text-white ring-zinc-950"
          : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function TransportFiltersPanel({
  filterQuery,
  setFilterQuery,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  brands,
  setBrands,
  avg,
  p1,
  p2,
  sliderMin,
  sliderMax,
  minClamped,
  maxClamped,
  resetFilters,
}: {
  filterQuery: string
  setFilterQuery: (v: string) => void
  priceMin: number
  setPriceMin: (v: number) => void
  priceMax: number
  setPriceMax: (v: number) => void
  brands: Array<Car["brand"]>
  setBrands: React.Dispatch<React.SetStateAction<Array<Car["brand"]>>>
  avg: number
  p1: number
  p2: number
  sliderMin: number
  sliderMax: number
  minClamped: number
  maxClamped: number
  resetFilters: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-950">Filter Plans</div>
        <button
          type="button"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-700"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      <InputGroup className="mt-4 h-11 rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70">
        <InputGroupAddon className="text-zinc-500">
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Search"
          className="h-11"
        />
      </InputGroup>

      <div className="mt-6">
        <div className="text-sm font-semibold text-zinc-950">Price &amp; Budget</div>
        <div className="mt-1 text-xs text-zinc-500">Average range ${avg}</div>

        <div className="mt-4 rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
          <div className="relative">
            <div
              className="h-2 w-full rounded-full"
              style={{
                background: `linear-gradient(to right,
                          rgba(228,228,231,1) 0%,
                          rgba(228,228,231,1) ${p1}%,
                          rgba(245,158,11,1) ${p1}%,
                          rgba(249,115,22,1) ${p2}%,
                          rgba(228,228,231,1) ${p2}%,
                          rgba(228,228,231,1) 100%)`,
              }}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-zinc-500">Min Price</div>
                <div className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200/70">
                  ${minClamped}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500">Max price</div>
                <div className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200/70">
                  ${maxClamped}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <input
                  aria-label="Minimum price"
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  value={minClamped}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPriceMin(Math.min(v, maxClamped))
                  }}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <input
                  aria-label="Maximum price"
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  value={maxClamped}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPriceMax(Math.max(v, minClamped))
                  }}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-zinc-950">Brand &amp; Model</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["BMW", "Mercedes", "Audi", "Toyota"] as const).map((b) => (
            <BrandPill
              key={b}
              label={b}
              active={brands.includes(b)}
              onClick={() => setBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))}
            />
          ))}
        </div>
      </div>


    </>
  )
}

export default function TransportPage() {
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [pickupDate, setPickupDate] = useState("2025-01-19")
  const [pickupTime, setPickupTime] = useState("07:00")
  const [dropDate, setDropDate] = useState("2025-01-19")
  const [dropTime, setDropTime] = useState("07:00")

  const [filterQuery, setFilterQuery] = useState("")
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(60)
  const [brands, setBrands] = useState<Array<Car["brand"]>>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const wallpaper = ROUTE_HERO_IMAGES["/transport"]

  useEffect(() => {
    const img = new window.Image()
    img.src = wallpaper
    img.decode?.().catch(() => { })
  }, [wallpaper])

  const filteredCars = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    return cars.filter((c) => {
      if (brands.length && !brands.includes(c.brand)) return false
      if (c.pricePerDay < priceMin || c.pricePerDay > priceMax) return false
      if (!q) return true
      const hay = [c.name, c.subtitle, c.location, c.brand].join(" ").toLowerCase()
      return hay.includes(q)
    })
  }, [brands, filterQuery, priceMax, priceMin])

  const sliderMin = 0
  const sliderMax = 100
  const minClamped = clamp(priceMin, sliderMin, sliderMax)
  const maxClamped = clamp(priceMax, sliderMin, sliderMax)
  const avg = Math.round((minClamped + maxClamped) / 2)
  const p1 = Math.round((minClamped / sliderMax) * 100)
  const p2 = Math.round((maxClamped / sliderMax) * 100)

  const resetFilters = () => {
    setFilterQuery("")
    setPriceMin(0)
    setPriceMax(60)
    setBrands([])
  }

  return (
    <div className="min-h-screen w-full px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>
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

          <div className="relative z-10 px-5 pb-10 pt-6 sm:px-10 sm:pb-14 sm:pt-10 lg:px-14 lg:pb-18">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md">
              <Car className="size-4" />
              Transport
            </div>

            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              All In One Car Platform
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Renting a car gives your freedom, and we&apos;ll help you book the right one.
            </p>

            <div className="mt-7 w-full rounded-4xl bg-white/90 p-5 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.45)] ring-1 ring-white/35 backdrop-blur-xl sm:p-7 lg:p-10">
              <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-center">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-zinc-950 sm:text-base">
                    Popular rentals
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Browse top picks and filter by budget and brand.
                  </div>

                  <div className="mt-4 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,rgba(24,24,27,0.04),rgba(24,24,27,0.00))] ring-1 ring-zinc-200/70">
                    <div className="relative h-24 sm:h-28">
                      <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_20%_20%,rgba(59,130,246,0.22),transparent_55%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_70%_70%,rgba(16,185,129,0.16),transparent_55%)]" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div className="rounded-3xl bg-white/70 px-3 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200/70 backdrop-blur-md">
                          Popular rentals
                        </div>
                        <div className="flex -space-x-2">
                          <div className="size-8 rounded-2xl bg-zinc-950/10 ring-1 ring-white" />
                          <div className="size-8 rounded-2xl bg-blue-600/15 ring-1 ring-white" />
                          <div className="size-8 rounded-2xl bg-emerald-600/15 ring-1 ring-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl bg-white p-4 ring-1 ring-zinc-200/70 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-zinc-700">Pick-up Location</div>
                      <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                        <InputGroupAddon className="text-zinc-500">
                          <MapPin className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          placeholder="Enter City, Airport, or Address"
                          className="h-11 text-[13px] sm:text-sm"
                        />
                      </InputGroup>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-zinc-700">Drop-off Location</div>
                      <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                        <InputGroupAddon className="text-zinc-500">
                          <MapPin className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          value={dropoff}
                          onChange={(e) => setDropoff(e.target.value)}
                          placeholder="Enter City, Airport, or Address"
                          className="h-11 text-[13px] sm:text-sm"
                        />
                      </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-zinc-700">Pick-up Date</div>
                        <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                          <InputGroupAddon className="text-zinc-500">
                            <Calendar className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            type="date"
                            className="h-11 text-[13px] sm:text-sm"
                          />
                        </InputGroup>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-700">Pick-up Time</div>
                        <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                          <InputGroupAddon className="text-zinc-500">
                            <Clock className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            type="time"
                            className="h-11 text-[13px] sm:text-sm"
                          />
                        </InputGroup>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-zinc-700">Pick-up Date</div>
                        <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                          <InputGroupAddon className="text-zinc-500">
                            <Calendar className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            value={dropDate}
                            onChange={(e) => setDropDate(e.target.value)}
                            type="date"
                            className="h-11 text-[13px] sm:text-sm"
                          />
                        </InputGroup>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-700">Pick-up Time</div>
                        <InputGroup className="mt-2 h-11 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                          <InputGroupAddon className="text-zinc-500">
                            <Clock className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            value={dropTime}
                            onChange={(e) => setDropTime(e.target.value)}
                            type="time"
                            className="h-11 text-[13px] sm:text-sm"
                          />
                        </InputGroup>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-3xl bg-white ring-1 ring-zinc-200/70"
                      onClick={() => {
                        setPickup("")
                        setDropoff("")
                        setPickupDate("2025-01-19")
                        setPickupTime("07:00")
                        setDropDate("2025-01-19")
                        setDropTime("07:00")
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      className="h-10 rounded-3xl bg-zinc-950 px-5 text-white hover:bg-zinc-900"
                      onClick={() =>
                        document.getElementById("transport-results")?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="transport-results"
          className="mt-3 grid gap-4 rounded-none bg-transparent p-0 ring-0 sm:mt-6 sm:rounded-4xl sm:bg-zinc-50 sm:p-7 sm:ring-1 sm:ring-zinc-200/70 lg:grid-cols-[300px_1fr] lg:p-10"
        >
          <aside className="hidden rounded-4xl bg-white p-5 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70 lg:block">
            <TransportFiltersPanel
              filterQuery={filterQuery}
              setFilterQuery={setFilterQuery}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              brands={brands}
              setBrands={setBrands}
              avg={avg}
              p1={p1}
              p2={p2}
              sliderMin={sliderMin}
              sliderMax={sliderMax}
              minClamped={minClamped}
              maxClamped={maxClamped}
              resetFilters={resetFilters}
            />
          </aside>

          <section className="rounded-none bg-white p-0 shadow-none ring-0 sm:rounded-4xl sm:p-6 sm:shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] sm:ring-1 sm:ring-zinc-200/70">
            <div className="flex flex-wrap items-end justify-between gap-3 py-4 md:py-0 ml-4 md:ml-0">
              <div>
                <div className="text-sm font-semibold text-zinc-950">Available cars</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Showing <span className="font-semibold text-zinc-700">{filteredCars.length}</span> results
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
                      <TransportFiltersPanel
                        filterQuery={filterQuery}
                        setFilterQuery={setFilterQuery}
                        priceMin={priceMin}
                        setPriceMin={setPriceMin}
                        priceMax={priceMax}
                        setPriceMax={setPriceMax}
                        brands={brands}
                        setBrands={setBrands}
                        avg={avg}
                        p1={p1}
                        p2={p2}
                        sliderMin={sliderMin}
                        sliderMax={sliderMax}
                        minClamped={minClamped}
                        maxClamped={maxClamped}
                        resetFilters={resetFilters}
                      />
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

                <Button variant="outline" className="h-10 rounded-3xl bg-white ring-1 ring-zinc-200/70">
                  Sort: Popular
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-4 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="group relative overflow-hidden rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_26px_65px_-55px_rgba(0,0,0,0.45)]"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_25%_0%,rgba(59,130,246,0.14),transparent_55%)]" />
                  </div>

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-950">{car.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">{car.subtitle}</div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                      <Star className="size-4 text-amber-500" />
                      {car.rating.toFixed(1)}
                      <span className="font-medium text-zinc-500">({car.reviews})</span>
                    </div>
                  </div>

                  <div className="relative mt-4 overflow-hidden rounded-3xl bg-zinc-50 ring-1 ring-zinc-200/70">
                    <div className={["h-48 bg-gradient-to-br", colorClass(car.color)].join(" ")} />

                  </div>

                  <div className="relative mt-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
                      <MapPin className="size-4 shrink-0" />
                      <div className="truncate">{car.location}</div>
                    </div>
                    <div className="text-sm font-semibold text-zinc-950">
                      {formatMoneyUsd(car.pricePerDay)}
                      <span className="text-xs font-medium text-zinc-500">/Day</span>
                    </div>
                  </div>

                  <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    {car.meta.map((m) => (
                      <div
                        key={m.label}
                        className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70"
                      >
                        <span className="font-medium text-zinc-700">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 grid gap-2">
                    <Button className="h-10 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-900">
                      Rent Now
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-3xl bg-white ring-1 ring-zinc-200/70"
                      asChild
                    >
                      <Link href={`/transport?car=${encodeURIComponent(car.id)}`}>
                        <Users className="mr-2 size-4 text-zinc-600" />
                        View details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

