"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import {
  AlertTriangle,
  Edit2,
  ImagePlus,
  MapPin,
  Plus,
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
  guideItinerariesService,
  type GuideItinerary,
  type ItineraryCrudService,
  type ItineraryDesignType,
} from "@/services/guide-itineraries.service"
import {
  ItineraryEditorSheet,
  type ItineraryOwnerProfile,
} from "./itinerary-editor-sheet"

const PRICE_SCOPE_SUFFIX: Record<string, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ group",
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
  "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]"

export function ItinerariesEditor({
  profile,
  service = guideItinerariesService,
  uploadPathPrefix = "guides",
  defaultDesignType = "DAYS",
}: {
  profile: ItineraryOwnerProfile
  /** CRUD surface to use. Defaults to the guide service. */
  service?: ItineraryCrudService
  /** Storage path root, e.g. "guides" or "activity". */
  uploadPathPrefix?: string
  /** Format new itineraries start in, and which format tab shows first. */
  defaultDesignType?: ItineraryDesignType
}) {
  const [items, setItems] = useState<GuideItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<GuideItinerary | "new" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<GuideItinerary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.list()
      setItems(data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to load itineraries.",
        )
      } else {
        setError("Failed to load itineraries.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function onSaved(saved: GuideItinerary) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id)
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i))
      return [saved, ...prev]
    })
  }

  async function doDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await service.remove(confirmDelete.id)
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

  return (
    <div className="mt-5 rounded-4xl bg-white p-6 ring-1 ring-zinc-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-zinc-500" />
          <div className="text-sm font-semibold text-zinc-950">Itineraries</div>
          <span className="text-xs text-zinc-500">
            {items.length} package{items.length === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full text-xs"
          onClick={() => setEditing("new")}
        >
          <Plus className="size-3.5" />
          Add itinerary
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-5 grid place-items-center rounded-3xl bg-zinc-50/70 py-12 ring-1 ring-zinc-200/70">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500 ring-1 ring-zinc-200/70">
          No itineraries yet. Add sample packages so travelers can quickly see what
          you offer.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
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
                        Hidden
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
      )}

      <ItineraryEditorSheet
        profile={profile}
        service={service}
        uploadPathPrefix={uploadPathPrefix}
        defaultDesignType={defaultDesignType}
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
                ? `“${confirmDelete.title}” will be permanently removed along with its days, inclusions, and gallery images.`
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
    </div>
  )
}
