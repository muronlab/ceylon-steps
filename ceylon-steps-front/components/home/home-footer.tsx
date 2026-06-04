"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppStoreBadges } from "@/components/common/app-store-badges"

const MARQUEE_ITEMS = [
  "Plan your trip",
  "Book guides & transport",
  "Explore Sri Lanka",
  "Make memories",
] as const

export function HomeFooter() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")

  function handleTryNow(e: React.FormEvent) {
    e.preventDefault()
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""
    router.push(`/register${q}`)
  }

  return (
    <footer className="mt-16 bg-zinc-50 px-4 pb-6 pt-0 sm:px-6 lg:px-8" id="contact">
      <div className="overflow-hidden rounded-3xl bg-zinc-950 text-white ring-1 ring-zinc-800 sm:rounded-4xl">
        <div className="w-full px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,auto)] lg:gap-10">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-[0.16em] text-white">
                CEYLON STEP
              </div>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                Your Sri Lanka travel companion — guides, vehicles, transfers, insurance, and
                activities.
              </p>

              <form
                className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center"
                onSubmit={handleTryNow}
              >
                <Input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="h-11 rounded-full border-zinc-700 bg-zinc-900/80 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                  autoComplete="email"
                />
                <Button
                  type="submit"
                  className="h-11 shrink-0 rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-white/90"
                >
                  Try now
                </Button>
              </form>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Services</div>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <Link className="hover:text-white" href="/guides">
                  Guides
                </Link>
                <Link className="hover:text-white" href="/vehicles/with-driver">
                  Hire vehicle
                </Link>
                <Link className="hover:text-white" href="/vehicles/self-drive">
                  Rent vehicle
                </Link>
                <Link className="hover:text-white" href="/airport-pickups">
                  Airport pickups
                </Link>
                <Link className="hover:text-white" href="/insurance">
                  Insurance
                </Link>
                <Link className="hover:text-white" href="/activities">
                  Activities
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Company</div>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <Link className="hover:text-white" href="/#about">
                  About
                </Link>
                <Link className="hover:text-white" href="/#contact">
                  Contact
                </Link>
                <Link className="hover:text-white" href="/become-a-partner">
                  Become a Partner
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Support</div>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <Link className="hover:text-white" href="/help">
                  Help center
                </Link>
                <Link className="hover:text-white" href="/terms">
                  Terms
                </Link>
                <Link className="hover:text-white" href="/privacy">
                  Privacy
                </Link>
              </div>
            </div>

            <AppStoreBadges tone="dark" />
          </div>
        </div>

        <div className="overflow-hidden border-y border-white/10 bg-zinc-900/50 py-3">
          <div className="home-footer-marquee-track text-sm font-medium tracking-wide text-white/55">
            <div className="flex shrink-0 items-center gap-10 px-6">
              {MARQUEE_ITEMS.map((label) => (
                <span key={label} className="flex shrink-0 items-center gap-10">
                  <span>{label}</span>
                  <span aria-hidden className="text-white/35">
                    *
                  </span>
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-10 px-6" aria-hidden>
              {MARQUEE_ITEMS.map((label) => (
                <span key={`dup-${label}`} className="flex shrink-0 items-center gap-10">
                  <span>{label}</span>
                  <span className="text-white/35">*</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-white/55 sm:flex-row sm:px-10 lg:px-14">
          <div>© 2026 CeylonStep. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-white" href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
