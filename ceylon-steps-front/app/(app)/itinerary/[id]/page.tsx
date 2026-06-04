"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { AnimatePresence, motion } from "motion/react"
import {
  Award,
  Bus,
  Car,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Tent,
  X,
} from "lucide-react"

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar"
import { ChatPopup } from "@/components/chat/chat-popup"
import { useOutsideClick } from "@/hooks/use-outside-click"
import {
  publicItinerariesService,
  type PublicItineraryDetail,
  type PublicItineraryOwner,
} from "@/services/public-itineraries.service"
import {
  publicGuidesService,
  type PublicGuideDetail,
} from "@/services/public-guides.service"
import {
  publicPartnersService,
  type ProfileLanguage,
  type PublicActivityProviderProfile,
  type PublicTransportProviderProfile,
} from "@/services/public-partners.service"
import { formatDurationMinutes } from "@/lib/itinerary-duration"
import { languageCountryCode } from "@/lib/language-flags"

const DEFAULT_GRADIENT =
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]"

const PRICE_SCOPE_SUFFIX: Record<string, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ group",
  PER_DAY: "/ day",
}

const TRANSPORT_TYPE_LABEL: Record<string, string> = {
  SAFARI_JEEP: "Safari operator",
  VEHICLE_WITH_DRIVER: "Vehicle with driver",
  VEHICLE_FLEET: "Vehicle fleet",
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "C"
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

function deriveDurationLabel(it: PublicItineraryDetail): string {
  if (it.durationLabel) return it.durationLabel
  if (it.designType === "DURATION") return formatDurationMinutes(it.durationMinutes)
  if (it.designType === "TIME") return "1 day"
  if (it.durationDays && it.durationDays > 0) {
    return `${it.durationDays} day${it.durationDays === 1 ? "" : "s"}`
  }
  if (it.days.length > 0) {
    return `${it.days.length} day${it.days.length === 1 ? "" : "s"}`
  }
  return ""
}

function looksLikeHtml(s: string | null | undefined): boolean {
  if (!s) return false
  return /<\w+[^>]*>/.test(s)
}

function levelWidth(level: ProfileLanguage["level"]) {
  return level === "NATIVE" ? "w-full" : level === "FLUENT" ? "w-5/6" : "w-2/3"
}

function levelLabel(level: ProfileLanguage["level"]) {
  return level[0] + level.slice(1).toLowerCase()
}

// ── Owner profile, loaded after the itinerary resolves ─────────────────────
type OwnerProfile =
  | { kind: "GUIDE"; data: PublicGuideDetail }
  | { kind: "ACTIVITY_PROVIDER"; data: PublicActivityProviderProfile }
  | { kind: "TRANSPORT_PROVIDER"; data: PublicTransportProviderProfile }

export default function ItineraryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String((params as { id?: string }).id ?? "")

  const [itinerary, setItinerary] = useState<PublicItineraryDetail | null>(null)
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The owner profile opens in an animated dialog (same pattern as the guide
  // page's itinerary cards) instead of rendering inline.
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) {
      router.replace("/explore")
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setOwnerProfile(null)
    publicItinerariesService
      .findOne(id)
      .then((data) => {
        if (cancelled) return
        setItinerary(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("This itinerary isn't available right now.")
        } else {
          setError("Couldn't load the itinerary. Please try again.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  // Once the itinerary resolves, load the owner's full public profile so we can
  // render "about the host/provider" for whichever partner kind owns the trip.
  useEffect(() => {
    const owner = itinerary?.owner
    if (!owner?.profileId) return
    let cancelled = false
    setOwnerLoading(true)
    setOwnerProfile(null)

    const load = async (): Promise<OwnerProfile | null> => {
      if (owner.type === "GUIDE") {
        return { kind: "GUIDE", data: await publicGuidesService.findOne(owner.profileId!) }
      }
      if (owner.type === "ACTIVITY_PROVIDER") {
        return {
          kind: "ACTIVITY_PROVIDER",
          data: await publicPartnersService.getActivityProvider(owner.profileId!),
        }
      }
      return {
        kind: "TRANSPORT_PROVIDER",
        data: await publicPartnersService.getTransportProvider(owner.profileId!),
      }
    }

    load()
      .then((p) => {
        if (!cancelled) setOwnerProfile(p)
      })
      .catch(() => {
        if (!cancelled) setOwnerProfile(null)
      })
      .finally(() => {
        if (!cancelled) setOwnerLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [itinerary?.owner])

  // Lock body scroll + close on Escape while the profile dialog is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false)
    }
    document.body.style.overflow = profileOpen ? "hidden" : "auto"
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [profileOpen])

  useOutsideClick(profileRef, () => setProfileOpen(false))

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-950">
          {error ?? "Itinerary not found"}
        </h2>
        <Link
          href="/explore"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
        >
          <ChevronLeft className="size-4" />
          Back to explore
        </Link>
      </div>
    )
  }

  const price = formatMoney(itinerary.price, itinerary.currency)
  const duration = deriveDurationLabel(itinerary)
  const included = itinerary.inclusions.filter((i) => i.kind === "INCLUDED")
  const excluded = itinerary.inclusions.filter((i) => i.kind === "EXCLUDED")
  const owner = itinerary.owner

  return (
    <div className="min-h-screen w-full bg-white px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>
        <div className="hidden lg:block">
          <SiteNavbar variant="glass" tone="light" />
        </div>

        <div className="mx-auto w-full max-w-5xl pb-12 pt-0 lg:pt-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200/70 hover:bg-white"
          >
            <ChevronLeft className="size-4" />
            Back to explore
          </Link>

          {/* Itinerary card */}
          <div className="mt-5 overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70">
            {/* Cover */}
            <div className="relative">
              {itinerary.coverImageUrl ? (
                <div className="relative h-60 w-full sm:h-80">
                  <Image
                    src={itinerary.coverImageUrl}
                    alt={itinerary.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ) : (
                <div
                  className={[
                    "h-60 w-full sm:h-80",
                    itinerary.imageGradient ?? DEFAULT_GRADIENT,
                  ].join(" ")}
                >
                  <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                </div>
              )}

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3">
                {duration && (
                  <div className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-white/70 backdrop-blur-md">
                    {duration}
                  </div>
                )}
                {price && (
                  <div className="rounded-2xl bg-zinc-950/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
                    {price}
                    <span className="ml-1 text-xs font-medium text-white/70">
                      {PRICE_SCOPE_SUFFIX[itinerary.priceScope] ?? ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                    {itinerary.title}
                  </h1>
                  {itinerary.subtitle && (
                    <p className="mt-2 text-base text-zinc-600">
                      {itinerary.subtitle}
                    </p>
                  )}

                  {/* Languages offered — with flags, same treatment as the
                      listing tiles and host profile. */}
                  {itinerary.languagesOffered.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {itinerary.languagesOffered.map((lang) => {
                        const code = languageCountryCode(lang)
                        return (
                          <span
                            key={lang}
                            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {code && (
                              <span className="relative inline-block h-3.5 w-5 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                                <Image
                                  src={flagUrl(code)}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="20px"
                                  unoptimized
                                />
                              </span>
                            )}
                            {lang}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Provider tile — tap to open the full profile in a dialog. */}
                {owner && (
                  <div className="lg:w-72 lg:shrink-0">
                    <OwnerTile
                      owner={owner}
                      loading={ownerLoading && !ownerProfile}
                      onOpen={() => setProfileOpen(true)}
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-8 text-zinc-700">
                {/* Overview */}
                {itinerary.overview && (
                  <div
                    className="bio-content space-y-3 text-base leading-7 text-zinc-700"
                    dangerouslySetInnerHTML={{ __html: itinerary.overview }}
                  />
                )}

                {/* Days */}
                {itinerary.days.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-semibold text-zinc-900">
                      {itinerary.designType === "TIME"
                        ? "Schedule for the day"
                        : itinerary.designType === "DURATION"
                          ? "What you'll do"
                          : "Your itinerary"}
                    </h2>
                    <div className="ml-2 space-y-6 border-l-2 border-zinc-100 pl-6">
                      {itinerary.days.map((d, idx) => {
                        const label =
                          itinerary.designType === "TIME"
                            ? d.startTime || d.endTime
                              ? `${d.startTime ?? ""}${d.endTime ? ` – ${d.endTime}` : ""}`
                              : `Stop ${idx + 1}`
                            : itinerary.designType === "DURATION"
                              ? `Step ${idx + 1}`
                              : `Day ${d.dayNumber || idx + 1}`
                        return (
                          <div key={d.id} className="relative">
                            <div className="absolute -left-[33px] top-1 size-3 rounded-full border-2 border-white bg-zinc-300 ring-4 ring-white" />
                            <div className="text-sm font-bold text-zinc-900">
                              {label}: {d.title}
                            </div>
                            {d.description && (
                              <div
                                className="bio-content mt-1 space-y-2 text-sm leading-6 text-zinc-600"
                                dangerouslySetInnerHTML={{ __html: d.description }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Inclusions */}
                {(included.length > 0 || excluded.length > 0) && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {included.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                          What&apos;s included
                        </h2>
                        <ul className="space-y-2 text-sm">
                          {included.map((i) => (
                            <li key={i.id} className="flex items-start gap-2">
                              <span aria-hidden>✅</span>
                              <span>{i.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excluded.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                          What&apos;s not included
                        </h2>
                        <ul className="space-y-2 text-sm text-zinc-500">
                          {excluded.map((i) => (
                            <li key={i.id} className="flex items-start gap-2">
                              <span aria-hidden>❌</span>
                              <span>{i.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Transport + meeting */}
                {(itinerary.transportation || itinerary.meetingLocation) && (
                  <div className="space-y-4 rounded-3xl bg-zinc-50 p-6">
                    {itinerary.transportation && (
                      <div className="flex items-start gap-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                          <Bus className="size-5" aria-hidden />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-950">
                            Transportation
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {itinerary.transportation}
                          </div>
                        </div>
                      </div>
                    )}
                    {itinerary.meetingLocation && (
                      <div className="flex items-start gap-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                          <MapPin className="size-5" aria-hidden />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-950">
                            Meeting location
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {itinerary.meetingLocation}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery */}
                {itinerary.galleryImages.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-semibold text-zinc-900">
                      Itinerary gallery
                    </h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                      {itinerary.galleryImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/50"
                        >
                          <Image
                            src={img.imageUrl}
                            alt={img.caption ?? itinerary.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 240px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {itinerary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {itinerary.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Owner profile dialog — morphs out of the tile via shared layoutId. */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] h-full w-full bg-black/40 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {profileOpen && owner ? (
            <div className="fixed inset-0 z-[110] grid place-items-center p-4">
              <motion.div
                layoutId={`owner-${owner.id}`}
                ref={profileRef}
                className="relative flex h-full max-h-[92%] w-full max-w-[960px] flex-col overflow-hidden rounded-4xl bg-white shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-zinc-700 ring-1 ring-zinc-200 backdrop-blur-md transition hover:bg-white"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
                <div className="flex-1 overflow-auto p-6 sm:p-8">
                  {ownerLoading && !ownerProfile && (
                    <div className="flex flex-col items-center gap-3 py-24 text-zinc-500">
                      <div className="size-7 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
                      <div className="text-xs">Loading profile…</div>
                    </div>
                  )}
                  {!ownerLoading && !ownerProfile && (
                    <div className="py-24 text-center text-sm text-zinc-500">
                      This provider&apos;s profile isn&apos;t available right now.
                    </div>
                  )}
                  {ownerProfile?.kind === "GUIDE" && (
                    <GuideProfileBlock guide={ownerProfile.data} />
                  )}
                  {ownerProfile?.kind === "ACTIVITY_PROVIDER" && (
                    <ActivityProfileBlock provider={ownerProfile.data} />
                  )}
                  {ownerProfile?.kind === "TRANSPORT_PROVIDER" && (
                    <TransportProfileBlock provider={ownerProfile.data} />
                  )}
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        {owner && (
          <ChatPopup
            recipientName={owner.name}
            recipientRole={ownerKindLabel(owner.type)}
          />
        )}
      </div>
    </div>
  )
}

function ownerKindLabel(type: "GUIDE" | "ACTIVITY_PROVIDER" | "SAFARI_JEEP") {
  if (type === "GUIDE") return "guide"
  if (type === "ACTIVITY_PROVIDER") return "host"
  return "operator"
}

/**
 * Compact, clickable owner tile. Renders instantly from the itinerary's
 * resolved `owner` (name/photo/type) and morphs into the full profile dialog
 * via a shared `layoutId`.
 */
function OwnerTile({
  owner,
  loading,
  onOpen,
}: {
  owner: PublicItineraryOwner
  loading: boolean
  onOpen: () => void
}) {
  return (
    <motion.div
      layoutId={`owner-${owner.id}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group flex w-full cursor-pointer items-center gap-4 rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:bg-white hover:ring-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)]"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200">
        {owner.photoUrl ? (
          <Image
            src={owner.photoUrl}
            alt={owner.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-700">
            {getInitials(owner.name)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold text-zinc-950">
          {owner.name}
        </div>
        <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {ownerKindLabel(owner.type)}
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          {loading ? "Loading profile…" : "Tap to view full profile"}
        </div>
      </div>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition group-hover:bg-zinc-950 group-hover:text-white">
        <ChevronRight className="size-5" />
      </div>
    </motion.div>
  )
}

// ── Shared profile pieces ──────────────────────────────────────────────────
function ProfileBanner({
  coverPhotoUrl,
  profilePhotoUrl,
  name,
  fallbackName,
}: {
  coverPhotoUrl: string | null
  profilePhotoUrl: string | null
  name: string
  fallbackName: string
}) {
  return (
    <div className="relative">
      <div className="relative h-40 sm:h-52">
        {coverPhotoUrl ? (
          <Image src={coverPhotoUrl} alt="" fill className="object-cover" sizes="100vw" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(14,165,233,0.42),transparent_55%),radial-gradient(1000px_circle_at_80%_65%,rgba(99,102,241,0.30),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]" />
            <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
          </>
        )}
      </div>
      <div className="absolute -bottom-12 left-6">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-4 ring-white sm:size-28">
          {profilePhotoUrl ? (
            <div className="relative size-full">
              <Image
                src={profilePhotoUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="120px"
              />
            </div>
          ) : (
            <div className="grid size-full place-items-center bg-zinc-950/5 text-2xl font-semibold text-zinc-800">
              {getInitials(fallbackName)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-zinc-500">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-zinc-500">{label}</div>
        <div className="mt-0.5 break-all font-medium text-zinc-800">{value}</div>
      </div>
    </div>
  )
}

function LanguagesCard({ languages }: { languages: ProfileLanguage[] }) {
  if (languages.length === 0) return null
  return (
    <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
      <div className="text-sm font-semibold text-zinc-950">Spoken languages</div>
      <div className="mt-4 grid gap-3">
        {languages.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-50 ring-1 ring-zinc-200/70">
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
            <div className="h-2 w-24 rounded-full bg-zinc-100 ring-1 ring-zinc-200/70">
              <div className={`h-full rounded-full bg-primary-2 ${levelWidth(l.level)}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GalleryGrid({
  images,
}: {
  images: { id: string; imageUrl: string; caption: string | null }[]
}) {
  if (images.length === 0) return null
  return (
    <div className="mt-4 rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
      <div className="text-sm font-semibold text-zinc-950">Gallery</div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/50"
          >
            <Image
              src={img.imageUrl}
              alt={img.caption ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Guide ──────────────────────────────────────────────────────────────────
function GuideProfileBlock({ guide }: { guide: PublicGuideDetail }) {
  const dayPrice = formatMoney(guide.pricePerDay, guide.currency)
  const hourPrice = formatMoney(guide.pricePerHour, guide.currency)
  return (
    <div className="mt-4 overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70">
      <ProfileBanner
        coverPhotoUrl={guide.coverPhotoUrl}
        profilePhotoUrl={guide.profilePhotoUrl}
        name={guide.displayName}
        fallbackName={guide.fullName}
      />
      <div className="px-6 pb-6 pt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                {guide.displayName}
              </h3>
              {guide.tagline && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
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
                    <span className="inline-flex items-center gap-1 text-zinc-700">
                      <Award className="size-3.5 text-amber-500" />
                      {guide.yearsOfExperience} year
                      {guide.yearsOfExperience === 1 ? "" : "s"} of experience
                    </span>
                  </>
                )}
            </div>
          </div>
          <Link
            href={`/guides/${encodeURIComponent(guide.id)}`}
            className="inline-flex h-10 items-center justify-center rounded-3xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            View full profile
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
            <div className="grid gap-3 text-sm">
              <ContactRow icon={<Mail className="size-4" />} label="Email" value={guide.email} />
              <ContactRow
                icon={<Phone className="size-4" />}
                label="Telephone"
                value={guide.mobileNumber}
              />
              <ContactRow
                icon={<MapPin className="size-4" />}
                label="Address"
                value={guide.address}
              />
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
              {guide.regionsSpecialized.length > 0 && (
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
          <LanguagesCard languages={guide.languages} />
        </div>

        {guide.bio && (
          <div className="mt-4 rounded-4xl bg-zinc-50 p-6 ring-1 ring-zinc-200/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Bio
            </div>
            {looksLikeHtml(guide.bio) ? (
              <div
                className="bio-content mt-4 space-y-4 text-[15px] leading-7 text-zinc-700"
                dangerouslySetInnerHTML={{ __html: guide.bio }}
              />
            ) : (
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                {guide.bio}
              </div>
            )}
          </div>
        )}

        <GalleryGrid
          images={guide.galleryImages.map((g) => ({
            id: g.id,
            imageUrl: g.imageUrl,
            caption: g.caption,
          }))}
        />
      </div>
    </div>
  )
}

// ── Activity provider ───────────────────────────────────────────────────────
function ActivityProfileBlock({
  provider,
}: {
  provider: PublicActivityProviderProfile
}) {
  const dayPrice = formatMoney(provider.pricePerDay, provider.currency)
  const hourPrice = formatMoney(provider.pricePerHour, provider.currency)
  return (
    <div className="mt-4 overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70">
      <ProfileBanner
        coverPhotoUrl={provider.coverPhotoUrl}
        profilePhotoUrl={provider.profilePhotoUrl}
        name={provider.displayName}
        fallbackName={provider.fullName}
      />
      <div className="px-6 pb-6 pt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
              {provider.displayName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider">
                {provider.natureOfBusiness}
              </span>
              {typeof provider.yearsOfExperience === "number" &&
                provider.yearsOfExperience > 0 && (
                  <>
                    <div className="size-1 rounded-full bg-zinc-300" />
                    <span className="inline-flex items-center gap-1 text-zinc-700">
                      <Award className="size-3.5 text-amber-500" />
                      {provider.yearsOfExperience} year
                      {provider.yearsOfExperience === 1 ? "" : "s"} of experience
                    </span>
                  </>
                )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
            <div className="grid gap-3 text-sm">
              <ContactRow
                icon={<Mail className="size-4" />}
                label="Email"
                value={provider.email}
              />
              <ContactRow
                icon={<Phone className="size-4" />}
                label="Telephone"
                value={provider.mobileNumber}
              />
              <ContactRow
                icon={<MapPin className="size-4" />}
                label="Address"
                value={provider.address}
              />
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
            </div>
          </div>
          <LanguagesCard languages={provider.languages} />
        </div>

        {provider.description && (
          <div className="mt-4 rounded-4xl bg-zinc-50 p-6 ring-1 ring-zinc-200/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              About
            </div>
            {looksLikeHtml(provider.description) ? (
              <div
                className="bio-content mt-4 space-y-4 text-[15px] leading-7 text-zinc-700"
                dangerouslySetInnerHTML={{ __html: provider.description }}
              />
            ) : (
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                {provider.description}
              </div>
            )}
          </div>
        )}

        <GalleryGrid
          images={provider.galleryImages.map((g) => ({
            id: g.id,
            imageUrl: g.imageUrl,
            caption: g.caption,
          }))}
        />
      </div>
    </div>
  )
}

// ── Transport provider ───────────────────────────────────────────────────────
function TransportProfileBlock({
  provider,
}: {
  provider: PublicTransportProviderProfile
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200/70">
      <ProfileBanner
        coverPhotoUrl={provider.coverPhotoUrl}
        profilePhotoUrl={provider.profilePhotoUrl}
        name={provider.displayName}
        fallbackName={provider.fullName}
      />
      <div className="px-6 pb-6 pt-16">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
            {provider.displayName}
          </h3>
          <div className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {TRANSPORT_TYPE_LABEL[provider.providerType] ?? "Transport provider"}
          </div>
        </div>

        <div className="mt-5 rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <ContactRow icon={<Mail className="size-4" />} label="Email" value={provider.email} />
            <ContactRow
              icon={<Phone className="size-4" />}
              label="Telephone"
              value={provider.mobileNumber}
            />
          </div>
        </div>

        {provider.businessDescription && (
          <div className="mt-4 rounded-4xl bg-zinc-50 p-6 ring-1 ring-zinc-200/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              About
            </div>
            {looksLikeHtml(provider.businessDescription) ? (
              <div
                className="bio-content mt-4 space-y-4 text-[15px] leading-7 text-zinc-700"
                dangerouslySetInnerHTML={{ __html: provider.businessDescription }}
              />
            ) : (
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                {provider.businessDescription}
              </div>
            )}
          </div>
        )}

        {/* Safari jeeps */}
        {provider.safariJeeps.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Tent className="size-4 text-zinc-500" />
              Safari jeeps
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {provider.safariJeeps.map((j) => (
                <div
                  key={j.id}
                  className="overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-200/70"
                >
                  <div className="relative h-28 w-full bg-zinc-100">
                    {j.images[0] ? (
                      <Image
                        src={j.images[0].imageUrl}
                        alt={j.title}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-zinc-300">
                        <Tent className="size-7" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      {j.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {j.passengerCapacity
                        ? `${j.passengerCapacity} seats`
                        : j.vehicleType}
                      {j.nationalParks.length > 0 && ` · ${j.nationalParks[0]}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicles */}
        {provider.vehicles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Car className="size-4 text-zinc-500" />
              Vehicles
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {provider.vehicles.map((v) => (
                <div
                  key={v.id}
                  className="overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-200/70"
                >
                  <div className="relative h-28 w-full bg-zinc-100">
                    {v.images[0] ? (
                      <Image
                        src={v.images[0].imageUrl}
                        alt={v.title}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-zinc-300">
                        <Car className="size-7" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      {v.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">{v.vehicleType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver services */}
        {provider.driverServices.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold text-zinc-950">Driver services</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {provider.driverServices.map((s) => {
                const base = formatMoney(s.basePrice, s.currency)
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200/70"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">
                        {s.title}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {s.category.replaceAll("_", " ").toLowerCase()}
                      </div>
                    </div>
                    {base && (
                      <div className="shrink-0 text-sm font-semibold text-zinc-900">
                        {base}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
