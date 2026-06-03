"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import axios from "axios"
import Image from "next/image"
import {
  AlertTriangle,
  Edit2,
  ImagePlus,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  safariItinerariesService,
  type SafariItinerary,
} from "@/services/safari-itineraries.service"
import { safariJeepsService, type SafariJeep } from "@/services/safari-jeeps.service"
import { SafariItineraryEditorSheet } from "./safari-itinerary-editor-sheet"
import { SafariItineraryTemplatePicker } from "./safari-itinerary-template-picker"

const PRICE_SCOPE_SUFFIX: Record<string, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ trip",
  PER_DAY: "/ day",
}

const PRICE_FORMATTERS = new Map<string, Intl.NumberFormat>()
function formatPrice(value: string | null, currency: string | null) {
  if (!value) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  const code = currency || "LKR"
  let fmt = PRICE_FORMATTERS.get(code)
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
      })
    } catch {
      fmt = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 })
    }
    PRICE_FORMATTERS.set(code, fmt)
  }
  return fmt.format(num)
}

const DEFAULT_GRADIENT =
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(245,158,11,0.38),transparent_55%),radial-gradient(900px_circle_at_75%_65%,rgba(34,197,94,0.22),transparent_60%),linear-gradient(120deg,rgba(245,158,11,0.18),rgba(34,197,94,0.12))]"

/**
 * Lists safari itineraries owned by the operator's jeeps. Itineraries can
 * only be **created from a safari jeep** — the operator picks a jeep and the
 * backend snapshots its title, cover, gallery, inclusions, charges, and
 * driver languages into a fresh draft (`isActive: false`). They can then
 * edit the draft to add the schedule (time slots) and any details the jeep
 * can't describe by itself.
 *
 * Multiple itineraries per jeep are supported — operators often have a
 * morning-safari and an afternoon-safari product on the same vehicle.
 */
export function SafariItinerariesSection({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<SafariItinerary[]>([])
  const [jeeps, setJeeps] = useState<SafariJeep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<SafariItinerary | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SafariItinerary | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  /** When set, the template picker is showing for this jeep. The picker
   * is the second step of the "Add from a jeep" flow — first the operator
   * picks a jeep, then the picker suggests title/subtitle templates. */
  const [pickingFor, setPickingFor] = useState<SafariJeep | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, jeepList] = await Promise.all([
        safariItinerariesService.list(),
        safariJeepsService.list(),
      ])
      setItems(list)
      setJeeps(jeepList)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to load safari itineraries.",
        )
      } else {
        setError("Failed to load safari itineraries.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function onSaved(saved: SafariItinerary) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id)
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i))
      return [saved, ...prev]
    })
  }

  /** Step 1: operator picked a jeep. Open the title/subtitle template picker
   * so they land on a meaningful name on the first save. */
  function pickJeep(jeep: SafariJeep) {
    setCreateOpen(false)
    setError(null)
    setPickingFor(jeep)
  }

  /** Step 2: operator confirmed title + subtitle in the picker. POST to the
   * backend, push the draft into the list, and open the editor so they can
   * finish the schedule. */
  async function confirmCreate(vals: { title: string; subtitle: string | null }) {
    if (!pickingFor) return
    setCreating(true)
    setError(null)
    try {
      const created = await safariItinerariesService.createFromJeep(
        pickingFor.id,
        vals,
      )
      setItems((prev) => [created, ...prev])
      setPickingFor(null)
      setEditing(created)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to create itinerary from this jeep.",
        )
      } else {
        setError("Failed to create itinerary from this jeep.")
      }
    } finally {
      setCreating(false)
    }
  }

  async function doDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await safariItinerariesService.remove(confirmDelete.id)
      setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id))
      setConfirmDelete(null)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to delete itinerary.",
        )
      } else {
        setError("Failed to delete itinerary.")
      }
    } finally {
      setDeleting(false)
    }
  }

  // Group itineraries under the jeep they belong to so the operator can see
  // their products organised by vehicle. Itineraries with a missing/deleted
  // jeep reference fall into an "Orphaned" bucket (rare — usually means the
  // jeep was deleted before the itinerary).
  const grouped = useMemo(() => {
    const byJeep = new Map<string, SafariItinerary[]>()
    for (const it of items) {
      const key = it.safariJeepId ?? "_orphan_"
      const arr = byJeep.get(key) ?? []
      arr.push(it)
      byJeep.set(key, arr)
    }
    return byJeep
  }, [items])

  const hasJeeps = jeeps.length > 0

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-zinc-500" />
          <div className="text-sm font-semibold tracking-tight text-zinc-950">
            Safari itineraries
          </div>
          <span className="text-xs text-zinc-500">
            {items.length} package{items.length === 1 ? "" : "s"}
          </span>
        </div>

        <Popover open={createOpen} onOpenChange={setCreateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasJeeps || creating}
              className="h-8 rounded-full text-xs"
            >
              <Plus className="size-3.5" />
              {creating ? "Creating…" : "Add from a jeep"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2">
            <div className="px-2 pb-2 pt-1">
              <div className="text-xs font-semibold text-zinc-900">
                Choose a safari jeep
              </div>
              <p className="text-[11px] text-zinc-500">
                We&apos;ll pre-fill the itinerary from the jeep&apos;s photos,
                inclusions and charges. You can add more itineraries from the
                same jeep — e.g. morning + afternoon variants.
              </p>
            </div>
            <div className="grid gap-1">
              {jeeps.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => pickJeep(j)}
                  className="grid grid-cols-[40px_1fr] items-center gap-2 rounded-xl px-2 py-2 text-left text-xs hover:bg-zinc-50"
                >
                  <div className="relative size-10 overflow-hidden rounded-lg bg-zinc-100">
                    {j.images[0]?.imageUrl ? (
                      <Image
                        src={j.images[0].imageUrl}
                        alt={j.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-zinc-400">
                        <Sparkles className="size-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-950">
                      {j.title}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {j.driverName}
                      {j.nationalParks.length > 0
                        ? ` · ${j.nationalParks[0]}${j.nationalParks.length > 1 ? ` +${j.nationalParks.length - 1}` : ""}`
                        : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!hasJeeps && (
        <div className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Add a safari jeep above before creating an itinerary. Itineraries are
          built from a jeep&apos;s details.
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center rounded-3xl bg-zinc-50/70 py-12 ring-1 ring-zinc-200/70">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500 ring-1 ring-zinc-200/70">
          <Sparkles className="mx-auto size-5 text-zinc-400" />
          <p className="mt-2 font-medium text-zinc-700">No itineraries yet</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {hasJeeps
              ? "Click “Add from a jeep” to spin up a draft. You can have multiple itineraries per jeep."
              : "Add a safari jeep first, then create an itinerary from it."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {Array.from(grouped.entries()).map(([jeepId, list]) => {
            const jeep = jeeps.find((j) => j.id === jeepId)
            const groupTitle = jeep
              ? jeep.title
              : list[0]?.safariJeep?.title ?? "Other"
            const groupSubtitle = jeep
              ? jeep.driverName
              : list[0]?.safariJeep?.driverName ?? ""
            return (
              <div key={jeepId} className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {groupTitle}
                    </div>
                    {groupSubtitle && (
                      <span className="text-[11px] text-zinc-400">
                        · {groupSubtitle}
                      </span>
                    )}
                  </div>
                  {jeep && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={creating}
                      onClick={() => pickJeep(jeep)}
                      className="h-7 rounded-full text-[11px] text-zinc-600 hover:text-zinc-950"
                    >
                      <Plus className="size-3" />
                      Another from this jeep
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((it) => {
                    const price = formatPrice(it.price, it.currency)
                    return (
                      <div
                        key={it.id}
                        className="group overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_26px_65px_-55px_rgba(0,0,0,0.45)]"
                      >
                        <div className="relative h-36">
                          {it.coverImageUrl ? (
                            <Image
                              src={it.coverImageUrl}
                              alt={it.title}
                              fill
                              className="object-cover"
                              sizes="400px"
                            />
                          ) : (
                            <div
                              className={`h-full w-full ${
                                it.imageGradient || DEFAULT_GRADIENT
                              }`}
                            >
                              <div className="h-full w-full opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                            {it.durationLabel && (
                              <span className="rounded-2xl bg-white/85 px-3 py-1.5 text-xs font-semibold text-zinc-800 ring-1 ring-white/70 backdrop-blur-md">
                                {it.durationLabel}
                              </span>
                            )}
                            {price && (
                              <span className="rounded-2xl bg-zinc-950/85 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
                                {price}
                                <span className="ml-1 text-[0.65rem] font-medium text-white/70">
                                  {PRICE_SCOPE_SUFFIX[it.priceScope] ?? ""}
                                </span>
                              </span>
                            )}
                          </div>

                          {!it.isActive && (
                            <div className="absolute right-2 top-2">
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700"
                              >
                                Draft
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="text-sm font-semibold tracking-tight text-zinc-950">
                            {it.title}
                          </div>
                          {it.subtitle && (
                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                              {it.subtitle}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-zinc-500">
                            {it.days.length > 0 && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                                {it.designType === "TIME"
                                  ? `${it.days.length} stop${it.days.length === 1 ? "" : "s"}`
                                  : `${it.days.length} day${it.days.length === 1 ? "" : "s"}`}
                              </span>
                            )}
                            {it.galleryImages.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5">
                                <ImagePlus className="size-3" />
                                {it.galleryImages.length}
                              </span>
                            )}
                            {it.tags.length > 0 && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800 ring-1 ring-blue-200/70">
                                #{it.tags[0]}
                                {it.tags.length > 1 ? ` +${it.tags.length - 1}` : ""}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full text-xs"
                              onClick={() => setEditing(it)}
                            >
                              <Edit2 className="size-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-full text-xs text-zinc-500 hover:text-red-600"
                              onClick={() => setConfirmDelete(it)}
                              aria-label="Delete itinerary"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SafariItineraryTemplatePicker
        jeep={pickingFor}
        open={pickingFor !== null}
        creating={creating}
        onOpenChange={(open) => {
          if (!open && !creating) setPickingFor(null)
        }}
        onConfirm={(vals) => void confirmCreate(vals)}
      />

      <SafariItineraryEditorSheet
        profileId={profileId}
        target={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSaved={onSaved}
      />

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              Delete itinerary
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmDelete
                ? `“${confirmDelete.title}” will be permanently removed along with its schedule, inclusions, and gallery images. The safari jeep is not affected.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              className="h-9 rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={doDelete}
              disabled={deleting}
              className="h-9 rounded-full bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete itinerary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
