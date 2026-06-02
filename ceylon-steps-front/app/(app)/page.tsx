"use client";

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { HomeAfterHeroExact } from "@/components/home/home-after-hero";
import { HeroSearchBar } from "@/components/home/hero-search-bar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CometCard } from "@/components/ui/comet-card";
import { Reveal } from "@/components/ui/reveal";
import {
  HOME_DARK_FEATURE_IMAGE,
  HOME_PROMO_CARDS,
  HOME_SERVICES,
  HOME_STATS,
  HOME_WALLPAPER_IMAGE,
} from "@/lib/home-page-content";

/** Soft corner-glow colours, one per promo card (by order). */
const PROMO_GLOW_ACCENTS = [
  "bg-violet-200/60 group-hover:bg-violet-200/80",
  "bg-rose-200/60 group-hover:bg-rose-200/80",
  "bg-sky-200/60 group-hover:bg-sky-200/80",
  "bg-emerald-200/60 group-hover:bg-emerald-200/80",
] as const;

/** Soft pastel icon-badge accents, one per service tile (by order). */
const SERVICE_ICON_ACCENTS = [
  "bg-violet-100 text-violet-600",
  "bg-rose-100 text-rose-500",
  "bg-teal-100 text-teal-600",
  "bg-sky-100 text-sky-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
] as const;

export default function Home() {
  const renderPromoCard = (
    card: (typeof HOME_PROMO_CARDS)[number],
    i: number,
  ) => (
    <Reveal key={card.title} delay={i * 0.1} className="h-full">
      <CometCard
        className="h-full"
        boxShadow="rgba(0, 0, 0, 0.06) 0px 18px 40px -24px, rgba(0, 0, 0, 0.08) 0px 6px 16px -10px"
      >
        <Link
          href={card.href}
          className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-zinc-200/80 transition sm:p-8"
        >
          <div
            className={[
              "pointer-events-none absolute -right-8 -top-8 size-64 rounded-full blur-2xl transition duration-500",
              PROMO_GLOW_ACCENTS[i % PROMO_GLOW_ACCENTS.length],
            ].join(" ")}
          />

          <div className="relative flex items-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary-2 text-white ring-1 ring-primary-2/30 transition group-hover:scale-[1.03]">
              <card.icon className="size-6" strokeWidth={2.5} aria-hidden />
            </span>
          </div>

          <span className="relative mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {card.tag}
          </span>
          <h3 className="relative mt-2 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
            {card.title}
          </h3>
          <p className="relative mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
            {card.desc}
          </p>

          <div className="relative mt-auto flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 sm:text-sm">
              <MapPin className="size-4 text-zinc-400" aria-hidden />
              {card.meta}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
              {card.cta}
              <span className="grid size-8 place-items-center rounded-full bg-zinc-950 text-white transition group-hover:bg-zinc-800">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </span>
          </div>
        </Link>
      </CometCard>
    </Reveal>
  );

  return (
    <div className="min-h-screen w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>

        <div className="relative w-full min-h-[80vh] ">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden lg:block">
            <div className="pointer-events-auto">
              <SiteNavbar variant="glass" tone="dark" />
            </div>
          </div>

          <div className="relative w-full min-h-[80vh] overflow-hidden rounded-4xl ">
            <div className="absolute inset-0 z-0">
              <Image
                src={HOME_WALLPAPER_IMAGE}
                alt="Sri Lanka"
                fill
                priority
                className="object-cover"
              />
              {/* Bottom mask — keeps headline & search legible */}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.12)_38%,transparent_72%)]" />
              {/* Top mask — for the navbar */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.1)_22%,transparent_45%)]" />
              {/* Left-corner mask */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.5)_0%,transparent_40%)]" />
            </div>

            <div className="relative z-10 flex min-h-[80vh] flex-col justify-end">
              {/* Badge + headline + CTAs */}
              <div className="px-4 pt-28 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
                <div className="grid gap-10 lg:grid-cols-[1.05fr_minmax(340px,400px)] lg:items-end lg:gap-12">
                  {/* Left: badge + headline */}
                  <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
                    {/* Badge pill */}
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/20"
                    >
                      <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-zinc-900 shadow-sm">
                        New
                      </span>
                      <span className="text-white/90">
                        Choose your destination
                      </span>
                      <ArrowUpRight className="size-4 text-white" aria-hidden />
                    </Link>

                    <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                      Discover Sri Lanka in comfort and style.
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                      Tailored trips across the island — trusted local guides,
                      reliable transport, airport pickups, insurance and
                      activities, all planned in one place.
                    </p>
                  </div>

                  {/* Right: search card */}
                  <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
                    <HeroSearchBar />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 pb-12 sm:mt-14 sm:pb-16">
          <div className="w-full">
            <div className="flex flex-col items-center text-center">
              <Reveal className="mx-auto max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Our top features
                </span>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                  Everything you need to explore Sri Lanka
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">
                  Trusted local guides and reliable transport — book the
                  essentials for your trip in one place.
                </p>
              </Reveal>

              <Reveal delay={0.12} className="mt-6 flex justify-center">
                <Link
                  href="/explore"
                  className="group relative inline-flex h-10 items-center rounded-full bg-white py-2 pl-5 pr-12 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-950 shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 sm:h-11 sm:pl-6 sm:pr-14"
                >
                  View all
                  <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-zinc-950 text-white transition group-hover:bg-zinc-900 sm:right-2.5 sm:size-8">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            </div>

            <div className="mx-auto mt-8 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {/* Row 1: two tiles + a travel feature image (lg only) */}
              {HOME_PROMO_CARDS.slice(0, 2).map((card, i) =>
                renderPromoCard(card, i),
              )}

              <Reveal delay={0.2} className="hidden h-full lg:block">
                <CometCard
                  className="h-full"
                  boxShadow="rgba(0, 0, 0, 0.1) 0px 18px 40px -24px, rgba(0, 0, 0, 0.12) 0px 6px 16px -10px"
                >
                  <Link
                    href="/explore"
                    className="group relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-3xl ring-1 ring-zinc-200/80"
                  >
                    <Image
                      src="/wallpapers/7.jpg"
                      alt="Travelling across Sri Lanka"
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 0px, 420px"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="relative p-7">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900">
                        Discover the island
                      </span>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        Travel Sri Lanka, your way
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        Beaches, hill country, wildlife and ancient cities — one
                        trip, endless experiences.
                      </p>
                    </div>
                  </Link>
                </CometCard>
              </Reveal>

              {/* Row 2: a platform feature image (lg only) + two tiles */}
              <Reveal delay={0.1} className="hidden h-full lg:block">
                <CometCard
                  className="h-full"
                  boxShadow="rgba(0, 0, 0, 0.1) 0px 18px 40px -24px, rgba(0, 0, 0, 0.12) 0px 6px 16px -10px"
                >
                  <Link
                    href="/explore"
                    className="group relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-3xl ring-1 ring-zinc-200/80"
                  >
                    <Image
                      src="/wallpapers/2.jpg"
                      alt="Everything Ceylon Step provides"
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 0px, 420px"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="relative p-7">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        One platform
                      </span>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        Everything we provide, in one place
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        Guides, vehicles, airport pickups, insurance and
                        activities — booked and managed from a single account.
                      </p>
                    </div>
                  </Link>
                </CometCard>
              </Reveal>

              {HOME_PROMO_CARDS.slice(2).map((card, i) =>
                renderPromoCard(card, i + 2),
              )}
            </div>
          </div>
        </section>

        {/* <section className="mt-6 sm:mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/80 sm:rounded-4xl sm:p-8 lg:p-12">
        
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-zinc-200/50 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 right-1/4 size-72 rounded-full bg-zinc-100/70 blur-3xl"
            />

           
            <Reveal className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 ring-1 ring-zinc-200/80">
                  <span className="size-1.5 rounded-full bg-zinc-900" />
                  Plan once
                </span>
                <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
                  Discover a new level of comfort
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Everything you need to move, stay protected, and experience
                  Sri Lanka — curated in one platform.
                </p>
              </div>
              <Button
                className="h-11 w-fit shrink-0 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800"
                asChild
              >
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2"
                >
                  See all services
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </Reveal>

     
            <div className="relative mt-10 grid gap-5 lg:grid-cols-12 lg:gap-6">
            
              <Reveal direction="right" className="col-span-12 lg:col-span-5">
              <Link
                href="/explore"
                className="group relative block h-full min-h-72 overflow-hidden rounded-3xl ring-1 ring-zinc-200/80 sm:min-h-80 lg:min-h-130"
              >
                <Image
                  src={HOME_DARK_FEATURE_IMAGE}
                  alt="Sri Lanka landscape"
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-6 bottom-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900">
                    Island-wide
                  </span>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    One platform, every essential
                  </p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/80">
                    Start exploring
                    <ArrowUpRight
                      className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </p>
                </div>
              </Link>
              </Reveal>

       
              <div className="col-span-12 grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:gap-5">
                {HOME_SERVICES.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.07} className="h-full">
                  <Link
                    href={item.href}
                    className="group relative flex h-full flex-col rounded-3xl bg-white p-6 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.35)] ring-1 ring-zinc-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.4)]"
                  >
                    <span
                      className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-primary-2 text-white shadow-sm transition group-hover:scale-105"
                      aria-hidden
                    >
                      <ArrowUpRight className="size-4" />
                    </span>
                    <span
                      className={[
                        "grid size-14 place-items-center rounded-2xl transition group-hover:scale-105",
                        SERVICE_ICON_ACCENTS[i % SERVICE_ICON_ACCENTS.length],
                      ].join(" ")}
                    >
                      <item.icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-base font-semibold tracking-tight text-zinc-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      {item.desc}
                    </p>
                  </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section> */}

        {/* Trust + stats */}
        <section className="mt-10 sm:mt-12">
          <div className="rounded-3xl bg-white px-5 py-10 sm:rounded-4xl sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <Reveal className="mx-auto max-w-4xl">
              <p className="text-center text-2xl font-semibold leading-snug tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
                For years, travelers have trusted Ceylon Step for guides,
                vehicles, transfers, and experiences across Sri Lanka.
              </p>
            </Reveal>
            <Reveal delay={0.12} className="mt-8 flex justify-center">
              <Button
                variant="outline"
                className="h-11 rounded-full border-zinc-300 bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900 hover:text-white"
                asChild
              >
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-2"
                >
                  See details
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </Reveal>

            <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-stretch sm:justify-between sm:gap-0">
              {HOME_STATS.map((stat, i) => (
                <Reveal
                  key={stat.label}
                  delay={i * 0.1}
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="bg-zinc-50 pt-10 sm:pt-14 lg:pt-16">
        <HomeAfterHeroExact />
      </div>
    </div>
  );
}
