"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import {
  ChevronLeft,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Award,
} from "lucide-react"

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar"
import { GuideItineraries } from "@/components/guides/guide-itineraries"
import { GuideGallery } from "@/components/guides/guide-gallery"
import { ChatPopup } from "@/components/chat/chat-popup"
import {
  publicGuidesService,
  type PublicGuideDetail,
} from "@/services/public-guides.service"

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "G"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
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

function levelWidth(level: "CONVERSATIONAL" | "FLUENT" | "NATIVE") {
  return level === "NATIVE" ? "w-full" : level === "FLUENT" ? "w-5/6" : "w-2/3"
}

function levelLabel(level: "CONVERSATIONAL" | "FLUENT" | "NATIVE") {
  return level[0] + level.slice(1).toLowerCase()
}

function looksLikeHtml(s: string | null | undefined): boolean {
  if (!s) return false
  return /<\w+[^>]*>/.test(s)
}

const DEFAULT_GRADIENT =
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]"

export default function GuideDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const guideId = String((params as { guideId?: string }).guideId ?? "")

  const [guide, setGuide] = useState<PublicGuideDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!guideId) {
      router.replace("/guides")
      return
    }
    let cancelled = false
    setLoading(true)
    publicGuidesService
      .findOne(guideId)
      .then((data) => {
        if (cancelled) return
        setGuide(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("This guide isn't available right now.")
        } else {
          setError("Couldn't load the guide. Please try again.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [guideId, router])

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-950">{error ?? "Guide not found"}</h2>
        <Link
          href="/guides"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
        >
          <ChevronLeft className="size-4" />
          Back to guides
        </Link>
      </div>
    )
  }

  const dayPrice = formatMoney(guide.pricePerDay, guide.currency)
  const hourPrice = formatMoney(guide.pricePerHour, guide.currency)

  // GuideItineraries now consumes the real backend shape directly — no
  // remapping or hardcoded placeholders.
  const itinerariesForCard = guide.itineraries

  return (
    <div className="min-h-screen w-full bg-white px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>
        <div className="hidden lg:block">
          <SiteNavbar variant="glass" tone="light" />
        </div>

        <div className="mx-auto w-full max-w-7xl pb-12 pt-0 lg:pt-6">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200/70 hover:bg-white"
          >
            <ChevronLeft className="size-4" />
            Back to guides
          </Link>

          {/* Profile card */}
          <div className="mt-5 overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)]">
            {/* Banner */}
            <div className="relative h-52 sm:h-72">
              {guide.coverPhotoUrl ? (
                <Image
                  src={guide.coverPhotoUrl}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(14,165,233,0.42),transparent_55%),radial-gradient(1000px_circle_at_80%_65%,rgba(99,102,241,0.30),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]" />
                  <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                </>
              )}
            </div>

            <div className="relative px-2 pb-7 sm:px-7">
              <div className="-mt-20 sm:-mt-28">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-4 ring-white sm:size-48">
                      {guide.profilePhotoUrl ? (
                        <div className="relative size-full">
                          <Image
                            src={guide.profilePhotoUrl}
                            alt={guide.displayName}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                      ) : (
                        <div className="grid size-32 place-items-center rounded-full bg-zinc-950/5 text-4xl font-semibold text-zinc-800 ring-1 ring-zinc-200 sm:size-44 sm:text-6xl">
                          {getInitials(guide.fullName)}
                        </div>
                      )}
                    </div>

                    <div className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                          {guide.displayName}
                        </div>
                        {guide.tagline && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                            {guide.tagline}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="font-semibold uppercase tracking-wider">
                          {guide.category ?? "Guide"}
                        </span>
                        {typeof guide.yearsOfExperience === "number" &&
                          guide.yearsOfExperience > 0 && (
                            <>
                              <div className="size-1 rounded-full bg-zinc-300" />
                              <div className="inline-flex items-center gap-1 text-zinc-700">
                                <Award className="size-3.5 text-amber-500" />
                                {guide.yearsOfExperience} year
                                {guide.yearsOfExperience === 1 ? "" : "s"} of experience
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pb-2">
                    {guide.galleryImages.length > 0 && (
                      <Link
                        href="#gallery"
                        className="inline-flex h-10 items-center justify-center rounded-3xl bg-white px-4 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200/70 hover:bg-zinc-50"
                      >
                        <ImageIcon className="mr-2 size-4 text-zinc-700" />
                        View gallery
                      </Link>
                    )}
                    <Link
                      href={`/partner/guide?ref=${encodeURIComponent(guide.id)}`}
                      className="inline-flex h-10 items-center justify-center rounded-3xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900"
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
                  <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
                    <div className="grid gap-3 text-sm text-zinc-700">
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-500">Email</div>
                          <div className="mt-0.5 break-all font-medium text-zinc-800">
                            {guide.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-500">Telephone</div>
                          <div className="mt-0.5 font-medium text-zinc-800">
                            {guide.mobileNumber}
                          </div>
                        </div>
                      </div>
                      {(guide.whatsappNumber || guide.whatsappAvailable) && (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-500">WhatsApp</div>
                            <div className="mt-0.5 font-medium text-zinc-800">
                              {guide.whatsappNumber ?? guide.mobileNumber}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-500">Address</div>
                          <div className="mt-0.5 font-medium text-zinc-800">
                            {guide.address}
                          </div>
                        </div>
                      </div>

                      {(dayPrice || hourPrice) && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Rates
                          </div>
                          {dayPrice && (
                            <span className="rounded-2xl bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-900">
                              {dayPrice}
                              <span className="ml-1 text-xs font-medium text-zinc-500">/day</span>
                            </span>
                          )}
                          {hourPrice && (
                            <span className="rounded-2xl bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-900">
                              {hourPrice}
                              <span className="ml-1 text-xs font-medium text-zinc-500">/hour</span>
                            </span>
                          )}
                        </div>
                      )}

                      {Array.isArray(guide.regionsSpecialized) && guide.regionsSpecialized.length > 0 && (
                        <div className="mt-2 border-t border-zinc-100 pt-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Regions specialised
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {guide.regionsSpecialized.map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
                    <div className="text-sm font-semibold text-zinc-950">Spoken languages</div>
                    {guide.languages.length === 0 ? (
                      <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                        Not specified.
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3">
                        {guide.languages.map((l) => (
                          <div
                            key={l.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-50 ring-1 ring-zinc-200/70">
                                {l.countryCode ? (
                                  <Image
                                    src={flagUrl(l.countryCode)}
                                    alt={l.language}
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                    unoptimized
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-zinc-900">
                                  {l.language}
                                </div>
                                <div className="text-xs font-semibold text-zinc-500">
                                  {levelLabel(l.level)}
                                </div>
                              </div>
                            </div>
                            <div className="h-2 w-28 rounded-full bg-zinc-100 ring-1 ring-zinc-200/70">
                              <div
                                className={`h-full rounded-full bg-zinc-950 ${levelWidth(l.level)}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {guide.bio && (
                  <div className="mt-5 rounded-4xl bg-zinc-50 p-6 ring-1 ring-zinc-200/70">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Bio
                    </div>
                    {looksLikeHtml(guide.bio) ? (
                      <div
                        className="bio-content mt-4 space-y-6 text-[15px] leading-7 text-zinc-700"
                        dangerouslySetInnerHTML={{ __html: guide.bio }}
                      />
                    ) : (
                      <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                        {guide.bio}
                      </div>
                    )}
                  </div>
                )}

                {itinerariesForCard.length > 0 && (
                  <GuideItineraries
                    itineraries={itinerariesForCard}
                    guideId={guide.id}
                    guideLanguages={guide.languages}
                  />
                )}

                {guide.galleryImages.length > 0 && (
                  <GuideGallery
                    images={guide.galleryImages.map((img) => ({
                      src: img.imageUrl,
                      alt: img.caption ?? guide.displayName,
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <ChatPopup recipientName={guide.displayName} recipientRole="Guide" />
      </div>
    </div>
  )
}
