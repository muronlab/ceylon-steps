"use client"

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { HomeAfterHeroExact } from "@/components/home/home-after-hero"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  HOME_DARK_FEATURE_IMAGE,
  HOME_PROMO_CARDS,
  HOME_SERVICES,
  HOME_STATS,
  HOME_WALLPAPER_IMAGE,
} from "@/lib/home-page-content"

export default function Home() {
  return (
    <div className="min-h-screen w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>

        <div className="relative w-full min-h-[72vh] sm:min-h-[78vh] lg:min-h-[85vh]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden lg:block">
            <div className="pointer-events-auto">
              <SiteNavbar variant="glass" tone="dark" />
            </div>
          </div>

          <div className="relative w-full min-h-[72vh] overflow-hidden rounded-4xl sm:min-h-[78vh] lg:min-h-[85vh]">
            <div className="absolute inset-0 z-0">
              <Image
                src={HOME_WALLPAPER_IMAGE}
                alt="Sri Lanka"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.2)_42%,rgba(0,0,0,0.15)_100%)]" />
            </div>

            <div className="relative z-10 flex min-h-[72vh] flex-col justify-end sm:min-h-[78vh] lg:min-h-[85vh]">
              <div className="px-4 pb-10 pt-24 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14 lg:pt-28">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                  <h1 className="max-w-xl text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:max-w-2xl lg:text-5xl xl:text-6xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
                    Extraordinary natural and cultural charm
                  </h1>

                  <div className="flex max-w-md flex-col gap-4 text-white motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 lg:items-end lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                        Sri Lanka
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
                        Guides, vehicles, airport pickups, insurance, and activities — plan
                        everything in one place.
                      </p>
                    </div>
                    <Button
                      className="h-11 w-fit rounded-full border-0 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-white/90"
                      asChild
                    >
                      <Link href="/explore" className="inline-flex items-center gap-2">
                        See details
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Promo row */}
        <section className="mt-10 sm:mt-14">
          <div className="mb-8 text-center sm:mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Our top features
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Everything you need to explore Sri Lanka
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">
              Trusted local guides and reliable transport — book the essentials for your
              trip in one place.
            </p>
          </div>
          <div className="mx-auto mb-3 max-w-5xl sm:mb-4">
            <div className="group relative flex min-h-85 flex-col justify-end overflow-hidden rounded-3xl p-7 sm:min-h-105 sm:rounded-4xl sm:p-9">
              <Image
                src="/wallpapers/explore.png"
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Plan your journey
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Explore Sri Lanka, your way
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
                    From misty hill country to golden beaches and ancient cities — discover
                    curated experiences across the island.
                  </p>
                </div>
                <Button
                  asChild
                  className="h-11 w-fit shrink-0 rounded-full bg-white px-6 text-zinc-950 hover:bg-white/90"
                >
                  <Link href="/explore" className="inline-flex items-center gap-2">
                    Explore Sri Lanka
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 lg:grid-cols-2 lg:grid-rows-1">
            {HOME_PROMO_CARDS.map((card) => {
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={[
                    "group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl p-6 sm:min-h-[340px] sm:rounded-4xl sm:p-7",
                    card.wide ? "lg:col-span-2" : "",
                    card.variant === "image" ? "text-white" : "",
                    card.variant === "light"
                      ? "bg-zinc-100 text-zinc-950 ring-1 ring-zinc-200/80"
                      : "",
                    card.variant === "dark" ? "bg-zinc-950 text-white ring-1 ring-zinc-800" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {card.variant === "image" && card.image ? (
                    <>
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                      <div className="absolute inset-0 bg-linear-to-tl from-black/70 via-black/25 to-transparent" />
                    </>
                  ) : null}

                  <div
                    className={[
                      card.variant === "image" ? "relative z-10" : "relative",
                      "pb-14",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "max-w-md text-lg font-semibold leading-snug tracking-tight sm:text-xl",
                        card.variant === "image" ? "text-white" : "",
                      ].join(" ")}
                    >
                      {card.title}
                    </p>
                    {card.desc ? (
                      <p
                        className={[
                          "mt-2 ml-auto max-w-sm pr-12 text-right text-sm leading-relaxed sm:text-[0.9375rem]",
                          card.variant === "image"
                            ? "text-white/80"
                            : "text-zinc-500",
                        ].join(" ")}
                      >
                        {card.desc}
                      </p>
                    ) : null}
                    <span
                      className={[
                        "absolute bottom-0 right-0 inline-flex size-11 items-center justify-center rounded-full transition sm:size-12",
                        card.variant === "light"
                          ? "bg-zinc-950 text-white group-hover:bg-zinc-800"
                          : "",
                        card.variant === "dark"
                          ? "bg-white text-zinc-950 group-hover:bg-white/90"
                          : "",
                        card.variant === "image"
                          ? "bg-white text-zinc-950 group-hover:bg-white/90"
                          : "",
                      ].join(" ")}
                      aria-hidden
                    >
                      <ArrowUpRight className="size-5 sm:size-5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Dark services + image */}
        <section className="mt-6 sm:mt-8">
          <div className="overflow-hidden rounded-3xl bg-zinc-950 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.5)] ring-1 ring-zinc-800 sm:rounded-4xl sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Discover a new level of comfort
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Everything you need to move, stay protected, and experience Sri Lanka —
                  curated in one platform.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 w-fit shrink-0 rounded-full border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white"
                asChild
              >
                <Link href="/explore" className="inline-flex items-center gap-2">
                  See details
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(260px,340px)] lg:items-stretch lg:gap-10">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {HOME_SERVICES.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07] sm:p-5"
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                      <item.icon className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white sm:text-base">
                        {item.title}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-3xl ring-1 ring-white/10 sm:min-h-[320px] lg:min-h-[420px]">
                <Image
                  src={HOME_DARK_FEATURE_IMAGE}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 340px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Trust + stats */}
        <section className="mt-10 sm:mt-12">
          <div className="rounded-3xl bg-white px-5 py-10 ring-1 ring-zinc-200/80 sm:rounded-4xl sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <p className="mx-auto max-w-4xl text-center text-2xl font-semibold leading-snug tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
              For years, travelers have trusted Ceylon Step for guides, vehicles, transfers,
              and experiences across Sri Lanka.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                className="h-11 rounded-full border-zinc-300 bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900 hover:text-white"
                asChild
              >
                <Link href="/reviews" className="inline-flex items-center gap-2">
                  See details
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-stretch sm:justify-between sm:gap-0">
              {HOME_STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={[
                    "flex-1 text-center px-2 sm:px-6",
                    i > 0 ? "sm:border-l sm:border-zinc-200" : "",
                  ].join(" ")}
                >
                  <div className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="bg-zinc-50 pt-10 sm:pt-14 lg:pt-16">
        <HomeAfterHeroExact />
      </div>
    </div>
  )
}
