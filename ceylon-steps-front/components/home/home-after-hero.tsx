"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import AnimatedTestimonialsDemo from "@/components/animated-testimonials-demo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Car,
  CarTaxiFront,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Landmark,
  MapPinned,
  PlaneTakeoff,
  Quote,
  Star,
  ShieldCheck,
  TentTree,
  Users,
} from "lucide-react"

const kEyebrow =
  "text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500"
const kH2 =
  "mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl"
const kLead =
  "mx-auto mt-3 max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg"

function SectionShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="w-full px-0 sm:px-8 xl:px-20">
      <div className="rounded-4xl bg-white p-6 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/70 sm:p-8 lg:p-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
        {children}
      </div>
    </section>
  )
}

function AboutSriLankaSection() {
  const [showGuideDetails, setShowGuideDetails] = React.useState(false)

  const guideTypes = [
    {
      title: "National Guides",
      desc: "Authorized to accompany groups exceeding 7 passengers, facilitating travel across the entire island.",
      icon: ShieldCheck,
    },
    {
      title: "Chauffeur Guides",
      desc: "Licensed to guide groups up to 7 passengers, offering comprehensive islandwide coverage (while driving).",
      icon: Car,
    },
    {
      title: "Area Guides",
      desc: "Restricted to guiding visitors within a specific province.",
      icon: MapPinned,
    },
    {
      title: "Site Guides",
      desc: "Specialized in providing services at designated sites only.",
      icon: Landmark,
    },
  ] as const

  return (
    <section className="w-full px-0 sm:px-8 xl:px-20" id="about">
      <div className="rounded-4xl bg-white p-6 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/70 sm:p-8 lg:p-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
        <p className="mx-auto max-w-4xl text-center text-2xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-3xl lg:text-[2.1rem] lg:leading-snug">
          Join us as we share stories, routes, and experiences across Sri Lanka — from
          misty tea country to golden coasts, ancient cities, and wildlife you will not
          forget.
        </p>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:items-start lg:gap-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
          <div className="min-w-0 lg:col-span-5">
            <p className={kEyebrow}>A land of wonders</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Sri Lanka
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
              Sri Lanka is an island of natural wonders — golden beaches, misty tea
              mountains, ancient cities, and unforgettable wildlife adventures.
            </p>

            <div className="mt-6 sm:mt-7">
              <div className="rounded-3xl bg-zinc-50/90 p-4 ring-1 ring-zinc-200/70 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 sm:text-base">
                    <Users className="size-5 shrink-0 text-zinc-900/80" />
                    Find expert guides
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 w-fit rounded-full border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-950 hover:bg-zinc-50 sm:h-10 sm:text-sm"
                    asChild
                  >
                    <Link href="/guides" className="inline-flex items-center gap-1.5">
                      See details
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
                <p
                  className={[
                    "mt-3 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7",
                    showGuideDetails ? "block" : "hidden",
                    "sm:block",
                  ].join(" ")}
                >
                  According to <span className="font-semibold">Gazette No. 473/20</span> dated{" "}
                  <span className="font-semibold">20.10.1987</span> and{" "}
                  <span className="font-semibold">Gazette No. 2140/17</span> dated{" "}
                  <span className="font-semibold">10.09.2019</span>, the categories of guides
                  are clearly delineated as follows:
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70 hover:bg-zinc-50 sm:hidden"
                  onClick={() => setShowGuideDetails((v) => !v)}
                >
                  {showGuideDetails ? "Hide details" : "Show details"}
                </button>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
                  {guideTypes.map((g, idx) => {
                    const isDark = idx === 0 || idx === 3
                    return (
                      <Link
                        key={g.title}
                        href="/guides"
                        className={[
                          "group relative rounded-2xl p-4 shadow-sm ring-1 transition sm:p-5",
                          "hover:-translate-y-0.5 hover:shadow-md",
                          isDark
                            ? "bg-zinc-950 text-white ring-zinc-800"
                            : "bg-white/80 text-zinc-950 ring-zinc-200/70",
                        ].join(" ")}
                        aria-label={`Explore ${g.title}`}
                      >
                        <div className="flex items-start gap-3 pr-10">
                          <div
                            className={[
                              "grid size-10 shrink-0 place-items-center rounded-full ring-1 sm:size-11",
                              isDark
                                ? "bg-white/10 ring-white/15"
                                : "bg-white ring-zinc-200/70",
                            ].join(" ")}
                          >
                            <g.icon
                              className={["size-5", isDark ? "text-white/85" : "text-zinc-900/80"].join(" ")}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className={["text-sm font-semibold leading-6 sm:text-base", isDark ? "text-white" : "text-zinc-950"].join(" ")}>
                              {g.title}
                            </div>
                            <div
                              className={[
                                "mt-1 text-xs leading-5 sm:text-sm sm:leading-6 lg:text-xs lg:leading-5",
                                isDark ? "text-white/70" : "text-zinc-600",
                              ].join(" ")}
                            >
                              {g.desc}
                            </div>
                          </div>
                        </div>

                        <span
                          className={[
                            "absolute right-4 top-4 grid size-9 place-items-center rounded-full shadow-sm ring-1 transition group-hover:scale-[1.02] sm:right-5 sm:top-5",
                            "bg-white text-zinc-950 ring-black/10",
                          ].join(" ")}
                          aria-hidden
                        >
                          <ArrowUpRight className="size-4" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-3xl bg-zinc-50/60 ring-1 ring-zinc-200/80 sm:rounded-4xl">
              <div className="p-4 sm:p-5">
                <AnimatedTestimonialsDemo />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex w-full justify-center">
          <Button
            variant="outline"
            className="h-12 w-full max-w-md rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-[0_14px_40px_-30px_rgba(0,0,0,0.35)] hover:bg-zinc-900 hover:text-white sm:h-14 sm:w-auto sm:max-w-none sm:px-8 sm:text-base"
            asChild
          >
            <Link href="/guides">View all guides who can help you</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function HighlightsSection() {
  return (
    <section className="w-full px-0 sm:px-8 xl:px-20">
      <div className="rounded-4xl bg-white p-6 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/70 sm:p-8 lg:p-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 text-center sm:max-w-3xl sm:text-left">
            <p className={kEyebrow}>Transport</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
              Travel the island your way
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Hire with a guide driver, rent self‑drive, book airport pickups, or join safari tours
              — all in one place.
            </p>
          </div>

          <div className="flex justify-center sm:shrink-0 sm:justify-end">
            <Link
              href="/transport"
              className="group relative inline-flex h-10 items-center rounded-full bg-white py-2 pl-5 pr-12 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-950 ring-1 ring-zinc-200/80 shadow-sm transition hover:bg-zinc-50 sm:h-11 sm:pl-6 sm:pr-14"
            >
              View all
              <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-zinc-950 text-white transition group-hover:bg-zinc-900 sm:right-2.5 sm:size-8">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
          {[
            {
              title: "Hire with guide driver",
              desc: "Comfortable travel + local guidance",
              image: "/transport/vehicle-with-guide.jpg",
              href: "/vehicles/with-driver",
              icon: CarTaxiFront,
              tag: "Recommended",
            },
            {
              title: "Rent self‑drive",
              desc: "Car, bike, tuk‑tuk & more",
              image: "/transport/rent-vichile.jpg",
              href: "/vehicles/self-drive",
              icon: Car,
              tag: "Flexible",
            },
            {
              title: "Airport tours & pickups",
              desc: "Fast transfers anytime",
              image: "/transport/aairpot-pickup.jpg",
              href: "/airport-pickups",
              icon: PlaneTakeoff,
              tag: "24/7",
            },
            {
              title: "Safari jeeps & tours",
              desc: "National parks & adventure rides",
              image: "/transport/safari-jeeps.webp",
              href: "/vehicles/safari-jeeps",
              icon: TentTree,
              tag: "Adventure",
            },
          ].map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="group relative overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/80 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_75px_-55px_rgba(0,0,0,0.45)]"
            >
              <div className="relative h-[220px] w-full sm:h-[240px] lg:h-[260px]">
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.76),rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.25))]" />
              </div>

              <div className="absolute left-5 top-5 flex items-center gap-2">
                <div className="grid size-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm ring-1 ring-black/10">
                  <t.icon className="size-5" />
                </div>
                <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-950 ring-1 ring-black/10">
                  {t.tag}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-base font-semibold tracking-tight">{t.title}</div>
                <div className="mt-1 text-sm text-white/85">{t.desc}</div>

                <div className="mt-4">
                  <span className="group relative inline-flex h-10 items-center rounded-full bg-zinc-950 py-2 pl-5 pr-12 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-zinc-900 sm:h-11 sm:pl-6 sm:pr-14">
                    Explore
                    <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90 sm:right-2.5 sm:size-8">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function ActivitiesEventsSection() {
  const cards = [
    {
      title: "Surf schools & beach adventures",
      desc: "Learn to surf, enjoy sunset sessions, and explore the best coastal spots.",
      price: "LKR 5,990.00",
      image: "/activities/surf.webp",
    },
    {
      title: "Hot‑air balloon sunrise ride",
      desc: "Float above the landscapes at sunrise — a bucket‑list experience.",
      price: "LKR 18,500.00",
      image: "/activities/hot-air-baloon.jpg",
    },
    {
      title: "White‑water rafting",
      desc: "A thrilling river adventure with professional guides and safety gear.",
      price: "LKR 7,540.00",
      image: "/activities/rafting.jpg",
    },
    {
      title: "Sigiriya village tour",
      desc: "Village life, local stories, and authentic culture near Sigiriya.",
      price: "LKR 9,990.00",
      image: "/activities/Sigiyria-Village-Tour-habarana.jpg",
    },
    {
      title: "Tea picking experience",
      desc: "Walk through tea estates and try tea picking with local guidance.",
      price: "LKR 6,750.00",
      image: "/activities/tea-picking.jpg",
    },
    {
      title: "Village food experience",
      desc: "Taste authentic Sri Lankan dishes prepared in a village setting.",
      price: "LKR 5,250.00",
      image: "/activities/village-food-experience.jpg",
    },
    {
      title: "Abseiling adventure",
      desc: "Challenge yourself with a guided abseiling session in nature.",
      price: "LKR 8,250.00",
      image: "/activities/Abselling.jpg",
    },
    {
      title: "Kayaking",
      desc: "Peaceful kayaking through scenic waters — perfect for a relaxed day.",
      price: "LKR 4,950.00",
      image: "/activities/kayak.jpg",
    },
    {
      title: "Pottery experience",
      desc: "Hands‑on pottery session with local artisans — fun and memorable.",
      price: "LKR 4,500.00",
      image: "/activities/pottery-experience-img.jpeg",
    },
  ] as const

  return (
    <section className="w-full px-0">
      <div className="relative overflow-hidden rounded-4xl ring-1 ring-zinc-200/70 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.2)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
        <div className="absolute inset-0">
          <Image src="/wallpapers/6.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_0%_0%,rgba(0,0,0,0.85),transparent_60%)]" />
        </div>

        <div className="relative p-4 sm:p-6 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                Unforgettable moment
                <br />
                with unique events
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm ring-1 ring-black/10 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                aria-label="Previous"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm ring-1 ring-black/10 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                aria-label="Next"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          <div className="mx-auto mt-4 w-full max-w-none sm:mt-5 2xl:max-w-[1600px]">
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
              {cards.map((c) => (
                <div
                  key={c.image}
                  className="overflow-hidden rounded-3xl border-[5px] border-white/95 bg-white/95 shadow-[0_16px_50px_-38px_rgba(0,0,0,0.55)] sm:border-[7px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-700"
                >
                  <div className="relative h-[220px] w-full sm:h-[280px]">
                    <Image src={c.image} alt="" fill sizes="100vw" className="object-cover" />
                    <Link href="/activities" className="absolute inset-0" aria-label="View activity" />
                  </div>

                  <div className="grid gap-3 bg-white px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8 sm:px-5 sm:py-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950 sm:text-base">
                        {c.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 sm:line-clamp-none sm:text-sm">
                        {c.desc}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-zinc-900">Start From</div>
                        <div className="mt-1 text-base font-semibold text-zinc-950 sm:text-lg">
                          {c.price}
                        </div>
                      </div>
                      <Link
                        href="/activities"
                        className="group relative inline-flex h-10 items-center rounded-full bg-zinc-950 py-2 pl-5 pr-12 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-zinc-900 sm:h-11 sm:pl-6 sm:pr-14"
                        aria-label="Explore activities"
                      >
                        Explore
                        <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90 sm:right-2.5 sm:size-8">
                          <ArrowUpRight className="size-4" aria-hidden />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button className="h-11 rounded-full bg-white px-7 text-zinc-950 hover:bg-white/90" asChild>
                <Link href="/activities">View all activities, events & experiences</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



function TestimonialsStripSection() {
  return (
    <SectionShell>
      <div className="sm:flex sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <p className={kEyebrow}>What our happy travelers are saying</p>
          <h2 className={kH2}>Reviews</h2>
          <p className={kLead}>
            Real stories from travelers who booked guides, vehicles, and activities on
            CeylonStep.
          </p>
        </div>

        <div className="mt-4 flex justify-center sm:mt-0 sm:justify-end">
          <Button
            variant="outline"
            className="h-10 rounded-full border-zinc-200 bg-white/70 px-5 text-zinc-950 backdrop-blur hover:bg-white"
            asChild
          >
            <Link href="/reviews">View all</Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="pointer-events-none absolute -inset-x-6 -top-8 -bottom-8 hidden sm:block">
          <div className="absolute left-0 top-10 size-64 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="absolute right-0 bottom-10 size-64 rounded-full bg-sky-200/35 blur-3xl" />
        </div>

        <div className="grid gap-5 sm:grid-cols-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
          {[
            {
              name: "Nimal",
              meta: "Colombo • Guide booking",
              rating: 5,
              date: "Apr 2026",
              text: "Easy booking and a professional guide. We covered the best spots without any stress. Highly recommended!",
            },
            {
              name: "Sofia",
              meta: "Negombo • Airport pickup",
              rating: 5,
              date: "Mar 2026",
              text: "Airport pickup was smooth and on time. The driver was friendly and the whole trip felt safe and comfortable.",
            },
            {
              name: "Arjun",
              meta: "Kandy • Vehicle hire",
              rating: 5,
              date: "Feb 2026",
              text: "Vehicle was clean and reliable. Clear communication, fair pricing, and a great overall experience.",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="transition-transform duration-300 hover:-translate-y-0.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-700"
            >
              <Card
                className="group relative overflow-hidden rounded-4xl bg-white/75 shadow-[0_14px_40px_-30px_rgba(0,0,0,0.40)] ring-1 ring-zinc-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_26px_75px_-50px_rgba(0,0,0,0.50)]"
            >
              <div className="pointer-events-none absolute right-5 top-5 text-zinc-200">
                <Quote className="size-7" />
              </div>

              <CardHeader className="gap-4 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-full bg-zinc-950 text-sm font-semibold text-white ring-1 ring-black/10">
                      {t.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <div className="mt-0.5 text-xs font-medium text-zinc-500">
                        {t.meta}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < t.rating
                              ? "size-4 fill-amber-400 text-amber-400"
                              : "size-4 text-zinc-300"
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{t.date}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-base leading-7 text-zinc-700">{t.text}</p>
              </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

function BottomCtaSection() {
  return (
    <section className="w-full px-4 sm:px-8 xl:px-20">
      <div className="relative overflow-hidden rounded-4xl shadow-[0_18px_50px_-35px_rgba(0,0,0,0.15)] ring-1 ring-zinc-200/70">
        <div className="absolute inset-0">
          <Image src="/wallpapers/2.jpg" alt="" fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
          <div className="absolute inset-0 bg-zinc-950/45" />
        </div>
        <div className="relative px-6 py-14 text-center text-white sm:px-10 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Don’t miss the chance to explore Sri Lanka
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80">
            Find guides, book vehicles, arrange pickups, add insurance, and choose activities.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-11 rounded-full bg-white px-6 text-zinc-950 hover:bg-white/90" asChild>
              <Link href="/explore">Explore now</Link>
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-white/30 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <Link href="/guide">Become a partner</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeAfterHeroExact() {
  return (
    <div className="w-full space-y-12 bg-white pb-6 sm:space-y-16 sm:pb-10 lg:space-y-20">
      <AboutSriLankaSection />
      <HighlightsSection />
      <ActivitiesEventsSection />

      <TestimonialsStripSection />
      <BottomCtaSection />
    </div>
  )
}

