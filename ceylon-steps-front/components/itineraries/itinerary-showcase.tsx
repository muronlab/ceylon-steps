"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Bus, MapPin, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useOutsideClick } from "@/hooks/use-outside-click"
import {
  publicItinerariesService,
  type PublicItineraryDetail,
} from "@/services/public-itineraries.service"
import type { PartnerItineraryCard } from "@/services/public-partners.service"
import { formatDurationMinutes } from "@/lib/itinerary-duration"
import { flagUrl, languageCountryCode } from "@/lib/language-flags"

const DEFAULT_GRADIENT =
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]"

const PRICE_SCOPE_SUFFIX: Record<string, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ group",
  PER_DAY: "/ day",
}

function formatPrice(value: string | null, currency: string | null): string | null {
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

function deriveDurationLabel(
  it: PartnerItineraryCard | PublicItineraryDetail,
): string {
  if (it.durationLabel) return it.durationLabel
  if (it.designType === "DURATION") return formatDurationMinutes(it.durationMinutes)
  if (it.designType === "TIME") return "1 day"
  if (it.durationDays && it.durationDays > 0) {
    return `${it.durationDays} day${it.durationDays === 1 ? "" : "s"}`
  }
  if ("days" in it && it.days.length > 0) {
    return `${it.days.length} day${it.days.length === 1 ? "" : "s"}`
  }
  return ""
}

/**
 * Animated itinerary showcase — a card grid where clicking a card morphs it
 * (Framer `layoutId`) into a full-screen dialog that lazily fetches the full
 * itinerary, instead of navigating to the itinerary page. Mirrors the guide
 * profile's `GuideItineraries`, but is owner-agnostic: it loads detail from the
 * public `/public/itineraries/:id` endpoint, so any owner's cards work.
 */
export function ItineraryShowcase({
  itineraries,
  cta,
}: {
  itineraries: PartnerItineraryCard[]
  /**
   * Optional primary action shown at the foot of the open dialog (e.g. "Message
   * the host"). The dialog closes after it fires so any page-level surface it
   * opens (chat popup, etc.) is visible.
   */
  cta?: { label: string; onClick: () => void }
}) {
  const [activeCard, setActiveCard] = useState<PartnerItineraryCard | null>(null)
  const [activeDetail, setActiveDetail] = useState<PublicItineraryDetail | null>(
    null,
  )
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  function closeDialog() {
    setActiveCard(null)
    setActiveDetail(null)
    setDetailError(null)
  }

  // Lazily fetch the full itinerary once a card opens; cancel cleanly if the
  // user closes or switches cards before it settles.
  useEffect(() => {
    if (!activeCard) return
    let cancelled = false
    setActiveDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    publicItinerariesService
      .findOne(activeCard.id)
      .then((data) => {
        if (cancelled) return
        setActiveDetail(data)
      })
      .catch(() => {
        if (cancelled) return
        setDetailError("Couldn't load this itinerary. Please try again.")
      })
      .finally(() => {
        if (cancelled) return
        setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeCard])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (lightboxImage) setLightboxImage(null)
        else closeDialog()
      }
    }
    if (activeCard || lightboxImage) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeCard, lightboxImage])

  useOutsideClickClose(ref, () => closeDialog())

  const included =
    activeDetail?.inclusions.filter((i) => i.kind === "INCLUDED") ?? []
  const excluded =
    activeDetail?.inclusions.filter((i) => i.kind === "EXCLUDED") ?? []
  const activePrice = activeCard
    ? formatPrice(activeCard.price, activeCard.currency)
    : null
  const activeDuration = activeCard ? deriveDurationLabel(activeCard) : ""

  return (
    <>
      <AnimatePresence>
        {activeCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] h-full w-full bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCard ? (
          <div className="fixed inset-0 z-[110] grid place-items-center p-4">
            <motion.div
              layoutId={`card-${activeCard.id}-${id}`}
              ref={ref}
              className="flex h-full max-h-[92%] w-full max-w-[960px] flex-col overflow-hidden rounded-4xl bg-white shadow-2xl"
            >
              <div className="flex-1 overflow-auto">
                <div className="relative">
                  {activeCard.coverImageUrl ? (
                    <motion.div
                      layoutId={`image-${activeCard.id}-${id}`}
                      className="relative h-60 w-full sm:h-80"
                    >
                      <Image
                        src={activeCard.coverImageUrl}
                        alt={activeCard.title}
                        fill
                        className="object-cover"
                        sizes="960px"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      layoutId={`image-${activeCard.id}-${id}`}
                      className={cn(
                        "h-60 w-full sm:h-80",
                        activeCard.imageGradient ?? DEFAULT_GRADIENT,
                      )}
                    >
                      <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                    </motion.div>
                  )}

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeDialog}
                    className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
                    aria-label="Close"
                  >
                    <X className="size-6" />
                  </motion.button>

                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3">
                    {activeDuration && (
                      <motion.div
                        layoutId={`duration-${activeCard.id}-${id}`}
                        className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-white/70 backdrop-blur-md"
                      >
                        {activeDuration}
                      </motion.div>
                    )}
                    {activePrice && (
                      <motion.div
                        layoutId={`price-${activeCard.id}-${id}`}
                        className="rounded-2xl bg-zinc-950/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 backdrop-blur-md"
                      >
                        {activePrice}
                        <span className="ml-1 text-xs font-medium text-white/70">
                          {PRICE_SCOPE_SUFFIX[activeCard.priceScope] ?? ""}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <motion.h3
                    layoutId={`title-${activeCard.id}-${id}`}
                    className="text-2xl font-bold tracking-tight text-zinc-950"
                  >
                    {activeCard.title}
                  </motion.h3>
                  {activeCard.subtitle && (
                    <motion.p
                      layoutId={`subtitle-${activeCard.id}-${id}`}
                      className="mt-2 text-base text-zinc-600"
                    >
                      {activeCard.subtitle}
                    </motion.p>
                  )}

                  {detailLoading && !activeDetail && (
                    <div className="mt-10 flex flex-col items-center gap-3 py-8 text-zinc-500">
                      <div className="size-7 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
                      <div className="text-xs">Loading full itinerary…</div>
                    </div>
                  )}

                  {detailError && !activeDetail && (
                    <div className="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                      {detailError}
                    </div>
                  )}

                  {activeDetail && (
                    <>
                      {/* Languages offered — flags resolved from the shared
                          language dataset (names → country code). */}
                      {activeDetail.languagesOffered.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {activeDetail.languagesOffered.map((lang) => {
                            const code = languageCountryCode(lang)
                            return (
                              <span
                                key={`lang-${lang}`}
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

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-8 space-y-8 pb-10 text-zinc-700"
                      >
                        {activeDetail.overview && (
                          <div
                            className="bio-content space-y-3 text-base leading-7 text-zinc-700"
                            dangerouslySetInnerHTML={{
                              __html: activeDetail.overview,
                            }}
                          />
                        )}

                        {activeDetail.days.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-base font-semibold text-zinc-900">
                              {activeDetail.designType === "TIME"
                                ? "Schedule for the day"
                                : activeDetail.designType === "DURATION"
                                  ? "What you'll do"
                                  : "Your itinerary"}
                            </h4>
                            <div className="ml-2 space-y-6 border-l-2 border-zinc-100 pl-6">
                              {activeDetail.days.map((d, idx) => {
                                const label =
                                  activeDetail.designType === "TIME"
                                    ? d.startTime || d.endTime
                                      ? `${d.startTime ?? ""}${d.endTime ? ` – ${d.endTime}` : ""}`
                                      : `Stop ${idx + 1}`
                                    : activeDetail.designType === "DURATION"
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
                                        dangerouslySetInnerHTML={{
                                          __html: d.description,
                                        }}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {(included.length > 0 || excluded.length > 0) && (
                          <div className="grid gap-6 sm:grid-cols-2">
                            {included.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                                  What&apos;s included
                                </h4>
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
                                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                                  What&apos;s not included
                                </h4>
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

                        {(activeDetail.transportation ||
                          activeDetail.meetingLocation) && (
                          <div className="space-y-4 rounded-3xl bg-zinc-50 p-6">
                            {activeDetail.transportation && (
                              <div className="flex items-start gap-4">
                                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                                  <Bus className="size-5" aria-hidden />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-zinc-950">
                                    Transportation
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {activeDetail.transportation}
                                  </div>
                                </div>
                              </div>
                            )}
                            {activeDetail.meetingLocation && (
                              <div className="flex items-start gap-4">
                                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                                  <MapPin className="size-5" aria-hidden />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-zinc-950">
                                    Meeting location
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {activeDetail.meetingLocation}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {activeDetail.galleryImages.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-base font-semibold text-zinc-900">
                              Itinerary gallery
                            </h4>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              {activeDetail.galleryImages.map((img) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => setLightboxImage(img.imageUrl)}
                                  className="group/img relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/50"
                                >
                                  <Image
                                    src={img.imageUrl}
                                    alt={img.caption ?? ""}
                                    fill
                                    className="object-cover transition duration-300 group-hover/img:scale-110"
                                    sizes="(max-width: 768px) 33vw, 240px"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeDetail.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {activeDetail.tags.map((t) => (
                              <span
                                key={`tag-${t}`}
                                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200/70"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {cta && (
                          <div className="sticky bottom-0 bg-white/80 pt-6 backdrop-blur-md">
                            <button
                              type="button"
                              onClick={() => {
                                cta.onClick()
                                closeDialog()
                              }}
                              className="inline-flex h-14 w-full items-center justify-center rounded-3xl bg-zinc-950 px-8 text-base font-semibold text-white shadow-xl transition hover:bg-zinc-900"
                            >
                              {cta.label}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute right-6 top-6 z-[260] flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image"
            >
              <X className="size-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxImage}
                alt="Itinerary"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itineraries.map((it) => {
          const price = formatPrice(it.price, it.currency)
          const duration = deriveDurationLabel(it)
          return (
            <motion.div
              layoutId={`card-${it.id}-${id}`}
              key={it.id}
              className="group cursor-pointer overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_26px_65px_-55px_rgba(0,0,0,0.45)]"
              onClick={() => setActiveCard(it)}
            >
              <div className="relative">
                {it.coverImageUrl ? (
                  <motion.div
                    layoutId={`image-${it.id}-${id}`}
                    className="relative h-36 w-full"
                  >
                    <Image
                      src={it.coverImageUrl}
                      alt={it.title}
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    layoutId={`image-${it.id}-${id}`}
                    className={cn("h-36 w-full", it.imageGradient ?? DEFAULT_GRADIENT)}
                  >
                    <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                  </motion.div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                  {duration && (
                    <motion.div
                      layoutId={`duration-${it.id}-${id}`}
                      className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold text-zinc-800 ring-1 ring-white/70 backdrop-blur-md"
                    >
                      {duration}
                    </motion.div>
                  )}
                  {price && (
                    <motion.div
                      layoutId={`price-${it.id}-${id}`}
                      className="rounded-2xl bg-zinc-950/80 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md"
                    >
                      {price}
                      <span className="ml-1 text-[0.65rem] font-medium text-white/70">
                        {PRICE_SCOPE_SUFFIX[it.priceScope] ?? ""}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <motion.div
                  layoutId={`title-${it.id}-${id}`}
                  className="text-base font-semibold tracking-tight text-zinc-950"
                >
                  {it.title}
                </motion.div>
                {it.subtitle && (
                  <motion.div
                    layoutId={`subtitle-${it.id}-${id}`}
                    className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600"
                  >
                    {it.subtitle}
                  </motion.div>
                )}

                {/* Languages with flags — same treatment as the listing tile. */}
                {it.languagesOffered.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {it.languagesOffered.slice(0, 4).map((l) => {
                      const code = languageCountryCode(l)
                      return (
                        <div key={l} className="flex items-center gap-1.5">
                          {code && (
                            <div className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-zinc-200">
                              <Image
                                src={flagUrl(code)}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-zinc-700">
                            {l}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveCard(it)
                    }}
                    className="inline-flex h-10 w-full items-center justify-center rounded-3xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900"
                  >
                    View itinerary
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}

// Local import kept at the bottom to mirror the guide component's hook usage
// without colliding with the default export ordering above.
import { useOutsideClick as useOutsideClickClose } from "@/hooks/use-outside-click"
