"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import {
  ChevronLeft,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  User,
} from "lucide-react"

import { MobileNavBar, SiteNavbar } from "@/components/navbar/site-navbar"
import { ChatPopup } from "@/components/chat/chat-popup"
import { ItineraryShowcase } from "@/components/itineraries/itinerary-showcase"
import {
  publicPartnersService,
  type ProfileLanguage,
  type PublicActivityProviderProfile,
} from "@/services/public-partners.service"

// Same default cover gradient the /profile/activity editor uses when no cover
// is uploaded, so the public store reads as the same surface.
const DEFAULT_COVER =
  "radial-gradient(1000px circle at 10% 0%, rgba(244,114,182,0.32), transparent 55%), radial-gradient(1000px circle at 85% 70%, rgba(99,102,241,0.30), transparent 60%), linear-gradient(120deg, rgba(245,158,11,0.20), rgba(59,130,246,0.16))"

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

export default function ActivityProviderStorePage() {
  const params = useParams()
  const router = useRouter()
  const id = String((params as { id?: string }).id ?? "")

  const [provider, setProvider] = useState<PublicActivityProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Chat popup is controlled here so an itinerary's "Message the host" CTA can
  // open it from inside the showcase dialog.
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace("/activities")
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    publicPartnersService
      .getActivityProvider(id)
      .then((data) => {
        if (cancelled) return
        setProvider(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("This profile isn't available right now.")
        } else {
          setError("Couldn't load the profile. Please try again.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-950">{error ?? "Profile not found"}</h2>
        <Link
          href="/activities"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
        >
          <ChevronLeft className="size-4" />
          Back to activities
        </Link>
      </div>
    )
  }

  const dayPrice = formatMoney(provider.pricePerDay, provider.currency)
  const hourPrice = formatMoney(provider.pricePerHour, provider.currency)
  const packagePrice = formatMoney(provider.packagePrice, provider.currency)
  const packageSuffix =
    provider.packagePriceScope === "PER_GROUP" ? "/ group" : "/ person"
  const hasExp =
    typeof provider.yearsOfExperience === "number" && provider.yearsOfExperience > 0
  const messageHref = `/partner/guide?ref=${encodeURIComponent(provider.id)}`

  return (
    <div className="min-h-screen w-full bg-zinc-50 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="relative w-full">
        <div className="block lg:hidden">
          <MobileNavBar variant="solid" tone="light" />
        </div>
        <div className="hidden lg:block">
          <SiteNavbar variant="glass" tone="light" />
        </div>

        <div className="mx-auto w-full max-w-5xl pb-20 pt-0 lg:pt-4">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200/70 transition hover:bg-zinc-50"
          >
            <ChevronLeft className="size-4" />
            Back to activities
          </Link>

          {/* ── Header — cover → circular profile photo → business name (mirrors /profile/activity) ── */}
          <div className="mt-4 overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.25)] ring-1 ring-zinc-200/70">
            <div className="relative h-52 sm:h-72">
              {provider.coverPhotoUrl ? (
                <Image
                  src={provider.coverPhotoUrl}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <>
                  <div className="absolute inset-0" style={{ backgroundImage: DEFAULT_COVER }} />
                  <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                </>
              )}

              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200/70 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Open for bookings
              </div>
            </div>

            <div className="relative px-3 pb-7 sm:px-7">
              <div className="-mt-20 sm:-mt-28">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    {/* Circular profile photo — same as /profile/activity */}
                    <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-4 ring-white sm:size-48">
                      {provider.profilePhotoUrl ? (
                        <div className="relative size-full">
                          <Image
                            src={provider.profilePhotoUrl}
                            alt={provider.displayName}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                      ) : (
                        <div className="grid size-32 place-items-center rounded-full bg-zinc-950/5 text-4xl font-semibold text-zinc-800 ring-1 ring-zinc-200 sm:size-44 sm:text-6xl">
                          {getInitials(provider.displayName)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 pb-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {provider.natureOfBusiness}
                      </div>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                        {provider.displayName}
                      </h1>
                      {hasExp && (
                        <div className="mt-1 text-xs font-medium text-zinc-500">
                          {provider.yearsOfExperience} year
                          {provider.yearsOfExperience === 1 ? "" : "s"} of experience
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pb-2">
                    <Link
                      href={messageHref}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-900"
                    >
                      <MessageCircle className="size-4" />
                      Message host
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Business details (main section) ─────────────────────────── */}
          <Section title="Business details" subtitle="What this host offers">
            {provider.description ? (
              looksLikeHtml(provider.description) ? (
                <div
                  className="bio-content space-y-4 text-[15px] leading-7 text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: provider.description }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                  {provider.description}
                </p>
              )
            ) : (
              <p className="text-sm text-zinc-500">No description yet.</p>
            )}

            <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-3">
              <ContactRow icon={<Mail className="size-4" />} label="Email" value={provider.email} />
              <ContactRow
                icon={<Phone className="size-4" />}
                label={provider.whatsappAvailable ? "Phone / WhatsApp" : "Phone"}
                value={provider.mobileNumber}
              />
              <ContactRow icon={<MapPin className="size-4" />} label="Address" value={provider.address} />
            </div>
          </Section>

          {/* ── Experience & prices  +  Languages (mirrors editor's 2-col row) ── */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
            <Section title="Experience & prices" compact>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Experience" value={hasExp ? `${provider.yearsOfExperience} yrs` : "—"} />
                <Stat label="Hourly" value={hourPrice ?? "—"} />
                <Stat label="Daily" value={dayPrice ?? "—"} />
                {packagePrice && (
                  <Stat label="Package" value={`${packagePrice} ${packageSuffix}`} />
                )}
              </div>
              {!hasExp && !dayPrice && !hourPrice && !packagePrice && (
                <p className="mt-3 rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                  Rates available on request.
                </p>
              )}
            </Section>

            <Section title="Languages spoken" compact>
              {provider.languages.length === 0 ? (
                <p className="text-sm text-zinc-500">Not specified.</p>
              ) : (
                <div className="grid gap-3">
                  {provider.languages.map((l) => (
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
                          ) : (
                            <Globe className="size-4 text-zinc-400" />
                          )}
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
                      <div className="h-2 w-20 rounded-full bg-zinc-100 ring-1 ring-zinc-200/70">
                        <div className={`h-full rounded-full bg-zinc-950 ${levelWidth(l.level)}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── Provider details (separate section) ─────────────────────── */}
          <Section title="Provider details" subtitle="The person behind the business">
            <div className="grid gap-4 sm:grid-cols-3">
              <Fact icon={<User className="size-4" />} label="Hosted by" value={provider.fullName} />
              <Fact
                icon={<Sparkles className="size-4" />}
                label="Experience"
                value={hasExp ? `${provider.yearsOfExperience} years` : "—"}
              />
              <Fact
                icon={<MessageCircle className="size-4" />}
                label="WhatsApp"
                value={provider.whatsappAvailable ? "Available" : "Not available"}
              />
            </div>
          </Section>

          {/* ── Itineraries (the offerings) ─────────────────────────────── */}
          <section className="mt-8">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">Itineraries</h2>
              <span className="text-sm text-zinc-400">
                {provider.itineraries.length}{" "}
                {provider.itineraries.length === 1 ? "package" : "packages"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Sample packages — tap one to see the full plan.
            </p>

            {provider.itineraries.length === 0 ? (
              <div className="mt-4 rounded-[2rem] bg-white p-10 text-center text-sm text-zinc-500 ring-1 ring-zinc-200/70">
                No itineraries yet — check back soon.
              </div>
            ) : (
              <ItineraryShowcase
                itineraries={provider.itineraries}
                cta={{
                  label: `Message ${provider.displayName}`,
                  onClick: () => setChatOpen(true),
                }}
              />
            )}
          </section>

          {/* ── Gallery ─────────────────────────────────────────────────── */}
          {provider.galleryImages.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">Gallery</h2>
              <div className="mt-4 grid auto-rows-[140px] grid-cols-2 gap-3 sm:grid-cols-4">
                {provider.galleryImages.map((img, i) => (
                  <div
                    key={img.id}
                    className={[
                      "relative overflow-hidden rounded-3xl bg-zinc-100 ring-1 ring-zinc-200/60",
                      i % 6 === 0 ? "col-span-2 row-span-2" : "",
                    ].join(" ")}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.caption ?? provider.displayName}
                      fill
                      className="object-cover transition duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 300px"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <ChatPopup
          recipientName={provider.displayName}
          recipientRole="Activity host"
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  compact,
  children,
}: {
  title: string
  subtitle?: string
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={[
        "rounded-[2rem] bg-white ring-1 ring-zinc-200/70",
        compact ? "p-5" : "mt-5 p-6 sm:p-7",
      ].join(" ")}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </section>
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
      <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </div>
        <div className="mt-0.5 break-words text-sm font-medium text-zinc-800">{value}</div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  )
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1.5 break-words text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  )
}

