"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Slide = {
  kicker: string
  title: string
  subtitle: string
}

const DEFAULT_SLIDES: Slide[] = [
  {
    kicker: "YOUR",
    title: "Next adventure awaits",
    subtitle: "Plan your dream escapes and book in just a few clicks.",
  },
  {
    kicker: "DISCOVER",
    title: "The real Ceylon",
    subtitle: "Trusted local guides, transport, and experiences in one place.",
  },
  {
    kicker: "EXPLORE",
    title: "Mountains to coastlines",
    subtitle: "From misty hills to golden beaches — your journey starts here.",
  },
]

export function AuthHero({
  videoSrc = "/wallpapers/istockphoto-2182739265-640_adpp_is.mp4",
  logoText = "CEYLON STEPS",
  slides = DEFAULT_SLIDES,
}: {
  videoSrc?: string
  logoText?: string
  slides?: Slide[]
}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [slides.length])

  const slide = slides[active]

  return (
    <div className="relative hidden h-full min-h-[260px] overflow-hidden lg:block">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

      <div className="absolute left-6 top-6 md:left-10 md:top-9">
        <Link href="/" className="inline-flex items-center gap-2 text-white hover:opacity-90">
          <span className="grid size-8 place-items-center rounded-full bg-white/95 text-zinc-950">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none">
              <path
                d="M3 11.5 12 4l9 7.5M5 10v9h14v-9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-[0.14em]">{logoText}</span>
        </Link>
      </div>

      <div className="absolute inset-x-6 bottom-6 text-white md:inset-x-10 md:bottom-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-white/80 md:text-sm">{slide.kicker}</div>
        <div className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">{slide.title}</div>
        <p className="mt-4 max-w-md text-xs leading-5 text-white/80 md:text-sm md:leading-6">{slide.subtitle}</p>

        <div className="mt-6 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActive(index)}
              className={
                index === active
                  ? "h-1.5 w-7 rounded-full bg-white transition-all"
                  : "h-1.5 w-3 rounded-full bg-white/45 transition-all hover:bg-white/70"
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
