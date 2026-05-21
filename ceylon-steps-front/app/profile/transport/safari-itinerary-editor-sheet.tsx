"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import axios from "axios"
import Image from "next/image"
import { Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DayRichEditor } from "@/app/profile/guide/sections/day-rich-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import apiClient from "@/services/api-client"
import {
  safariItinerariesService,
  type SafariItinerary,
  type ItineraryDesignType,
  type ItineraryInclusionKind,
  type ItineraryPriceScope,
  type SaveItineraryPayload,
} from "@/services/safari-itineraries.service"
import { UploadOverlay } from "@/app/profile/guide/sections/upload-overlay"

const GRADIENT_PRESETS: Array<{
  id: string
  label: string
  className: string
}> = [
  {
    id: "savanna",
    label: "Savanna",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(245,158,11,0.38),transparent_55%),radial-gradient(900px_circle_at_75%_65%,rgba(34,197,94,0.22),transparent_60%),linear-gradient(120deg,rgba(245,158,11,0.18),rgba(34,197,94,0.12))]",
  },
  {
    id: "dusk",
    label: "Dusk",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(244,63,94,0.34),transparent_55%),radial-gradient(900px_circle_at_75%_60%,rgba(99,102,241,0.26),transparent_60%),linear-gradient(120deg,rgba(244,63,94,0.18),rgba(99,102,241,0.12))]",
  },
  {
    id: "highland",
    label: "Highland",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(34,197,94,0.38),transparent_55%),radial-gradient(900px_circle_at_80%_70%,rgba(99,102,241,0.26),transparent_60%),linear-gradient(120deg,rgba(34,197,94,0.18),rgba(99,102,241,0.12))]",
  },
  {
    id: "forest",
    label: "Forest",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(5,150,105,0.36),transparent_55%),radial-gradient(900px_circle_at_80%_60%,rgba(2,132,199,0.18),transparent_60%),linear-gradient(120deg,rgba(5,150,105,0.16),rgba(2,132,199,0.10))]",
  },
  {
    id: "ochre",
    label: "Ochre",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(217,119,6,0.34),transparent_55%),radial-gradient(900px_circle_at_75%_65%,rgba(120,53,15,0.22),transparent_60%),linear-gradient(120deg,rgba(217,119,6,0.18),rgba(120,53,15,0.12))]",
  },
  {
    id: "ocean",
    label: "Ocean",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]",
  },
]

const CURRENCIES = [
  "LKR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "INR",
  "AED",
  "SGD",
  "JPY",
]

type DayDraft = {
  id: string
  dayNumber: number
  title: string
  description: string
  startTime: string
  endTime: string
}
type InclusionDraft = {
  id: string
  kind: ItineraryInclusionKind
  text: string
}
type ImageDraft = { id: string; imageUrl: string; caption: string }

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function randomGradientClass(): string {
  const idx = Math.floor(Math.random() * GRADIENT_PRESETS.length)
  return (GRADIENT_PRESETS[idx] ?? GRADIENT_PRESETS[0]).className
}

function toDays(it: SafariItinerary | null): DayDraft[] {
  if (!it) return []
  return it.days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: d.description ?? "",
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
  }))
}
function toInclusions(it: SafariItinerary | null): InclusionDraft[] {
  if (!it) return []
  return it.inclusions.map((i) => ({ id: i.id, kind: i.kind, text: i.text }))
}
function toImages(it: SafariItinerary | null): ImageDraft[] {
  if (!it) return []
  return it.galleryImages.map((g) => ({
    id: g.id,
    imageUrl: g.imageUrl,
    caption: g.caption ?? "",
  }))
}

/**
 * Full-screen sheet editor for a safari itinerary. Safari itineraries are
 * always created from a safari jeep (the backend pre-fills cover, gallery,
 * languages, pricing, etc.), so this sheet is **edit-only** — there is no
 * "blank create" path. Operators click "Create from this jeep" elsewhere to
 * spawn a draft, then this sheet lets them refine it.
 */
export function SafariItineraryEditorSheet({
  profileId,
  target,
  open,
  onOpenChange,
  onSaved,
}: {
  profileId: string
  target: SafariItinerary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (saved: SafariItinerary) => void
}) {
  const itinerary = target

  const defaultCurrency = itinerary?.currency ?? "LKR"

  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState(defaultCurrency)
  const [priceScope, setPriceScope] = useState<ItineraryPriceScope>("PER_GROUP")
  const [overview, setOverview] = useState("")
  const [transportation, setTransportation] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [imageGradient, setImageGradient] = useState<string | null>(
    randomGradientClass(),
  )
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [designType, setDesignType] = useState<ItineraryDesignType>("TIME")
  const [languagesOffered, setLanguagesOffered] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [languageInput, setLanguageInput] = useState("")

  const [days, setDays] = useState<DayDraft[]>([])
  const [inclusions, setInclusions] = useState<InclusionDraft[]>([])
  const [images, setImages] = useState<ImageDraft[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [coverUploading, setCoverUploading] = useState(false)
  const [coverProgress, setCoverProgress] = useState(0)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryProgress, setGalleryProgress] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryTotal, setGalleryTotal] = useState(0)

  useEffect(() => {
    if (!open || !itinerary) return
    setTitle(itinerary.title)
    setSubtitle(itinerary.subtitle ?? "")
    setPrice(itinerary.price ?? "")
    setCurrency(itinerary.currency ?? "LKR")
    setPriceScope(itinerary.priceScope ?? "PER_GROUP")
    setOverview(itinerary.overview ?? "")
    setTransportation(itinerary.transportation ?? "")
    setMeetingLocation(itinerary.meetingLocation ?? "")
    setImageGradient(itinerary.imageGradient ?? randomGradientClass())
    setCoverImageUrl(itinerary.coverImageUrl ?? null)
    setIsActive(itinerary.isActive)
    setDesignType(itinerary.designType ?? "TIME")
    setLanguagesOffered(itinerary.languagesOffered ?? [])
    setTags(itinerary.tags ?? [])
    setDays(toDays(itinerary))
    setInclusions(toInclusions(itinerary))
    setImages(toImages(itinerary))
    setLanguageInput("")
    setTagInput("")
    setError(null)
  }, [open, itinerary])

  function addDay() {
    setDays((d) => [
      ...d,
      {
        id: uid("day"),
        dayNumber: d.length + 1,
        title: "",
        description: "",
        startTime: "",
        endTime: "",
      },
    ])
  }
  function removeDay(id: string) {
    setDays((d) => d.filter((x) => x.id !== id))
  }
  function patchDay(id: string, p: Partial<DayDraft>) {
    setDays((d) => d.map((x) => (x.id === id ? { ...x, ...p } : x)))
  }

  function addLanguage(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    setLanguagesOffered((prev) =>
      prev.some((l) => l.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed],
    )
    setLanguageInput("")
  }
  function removeLanguage(lang: string) {
    setLanguagesOffered((prev) => prev.filter((l) => l !== lang))
  }

  function addTag(raw: string) {
    const cleaned = raw.trim().replace(/^#+/, "").toLowerCase()
    if (!cleaned) return
    setTags((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]))
    setTagInput("")
  }
  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function addInclusion(kind: ItineraryInclusionKind) {
    setInclusions((i) => [...i, { id: uid("inc"), kind, text: "" }])
  }
  function removeInclusion(id: string) {
    setInclusions((i) => i.filter((x) => x.id !== id))
  }
  function patchInclusion(id: string, p: Partial<InclusionDraft>) {
    setInclusions((i) => i.map((x) => (x.id === id ? { ...x, ...p } : x)))
  }
  function insertInclusionAfter(
    afterId: string,
    kind: ItineraryInclusionKind,
    text = "",
  ): string {
    const newRow: InclusionDraft = { id: uid("inc"), kind, text }
    setInclusions((prev) => {
      const idx = prev.findIndex((x) => x.id === afterId)
      if (idx < 0) return [...prev, newRow]
      return [...prev.slice(0, idx + 1), newRow, ...prev.slice(idx + 1)]
    })
    return newRow.id
  }
  function insertInclusionsAfter(
    afterId: string,
    kind: ItineraryInclusionKind,
    texts: string[],
  ): string[] {
    const newRows: InclusionDraft[] = texts.map((t) => ({
      id: uid("inc"),
      kind,
      text: t,
    }))
    setInclusions((prev) => {
      const idx = prev.findIndex((x) => x.id === afterId)
      if (idx < 0) return [...prev, ...newRows]
      return [...prev.slice(0, idx + 1), ...newRows, ...prev.slice(idx + 1)]
    })
    return newRows.map((r) => r.id)
  }

  async function uploadCover(file: File) {
    setCoverUploading(true)
    setCoverProgress(0)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `transport/${profileId}/safari/itineraries/cover/${Date.now()}.${ext}`
      const body = new FormData()
      body.append("file", file)
      body.append("path", path)
      const res = await apiClient.post<{ url: string }>(
        "/storage/upload",
        body,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (!ev.total) return
            const real = (ev.loaded / ev.total) * 100
            setCoverProgress(Math.min(95, Math.round(real * 0.95)))
          },
        },
      )
      setCoverProgress(100)
      setCoverImageUrl(res.data.url)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to upload cover.",
        )
      } else {
        setError("Failed to upload cover.")
      }
    } finally {
      setCoverUploading(false)
      setCoverProgress(0)
    }
  }

  async function uploadGallery(files: File[]) {
    if (files.length === 0) return
    setGalleryUploading(true)
    setGalleryTotal(files.length)
    setGalleryIndex(0)
    setGalleryProgress(0)
    try {
      const newImages: ImageDraft[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setGalleryIndex(i + 1)
        setGalleryProgress(0)
        const ext = file.name.split(".").pop() || "jpg"
        const path = `transport/${profileId}/safari/itineraries/gallery/${Date.now()}-${i}.${ext}`
        const body = new FormData()
        body.append("file", file)
        body.append("path", path)
        const res = await apiClient.post<{ url: string }>(
          "/storage/upload",
          body,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (ev) => {
              if (!ev.total) return
              const real = (ev.loaded / ev.total) * 100
              setGalleryProgress(Math.min(95, Math.round(real * 0.95)))
            },
          },
        )
        setGalleryProgress(100)
        newImages.push({ id: uid("img"), imageUrl: res.data.url, caption: "" })
      }
      setImages((g) => [...g, ...newImages])
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to upload images.",
        )
      } else {
        setError("Failed to upload images.")
      }
    } finally {
      setGalleryUploading(false)
      setGalleryTotal(0)
      setGalleryIndex(0)
      setGalleryProgress(0)
    }
  }

  function removeImage(id: string) {
    setImages((g) => g.filter((x) => x.id !== id))
  }
  function moveImage(id: string, dir: -1 | 1) {
    setImages((g) => {
      const idx = g.findIndex((x) => x.id === id)
      if (idx < 0) return g
      const swap = idx + dir
      if (swap < 0 || swap >= g.length) return g
      const next = [...g]
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }
  function patchImageCaption(id: string, caption: string) {
    setImages((g) => g.map((x) => (x.id === id ? { ...x, caption } : x)))
  }

  async function save() {
    if (!itinerary) return
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    let priceValue: number | null = null
    if (price.trim() !== "") {
      const p = Number(price)
      if (!Number.isFinite(p) || p < 0) {
        setError("Price must be a non-negative number.")
        return
      }
      priceValue = Math.round(p * 100) / 100
    }

    const orderedDays =
      designType === "TIME"
        ? [...days].sort((a, b) => {
            if (!a.startTime && !b.startTime) return 0
            if (!a.startTime) return 1
            if (!b.startTime) return -1
            return a.startTime.localeCompare(b.startTime)
          })
        : days

    const cleanDays = orderedDays
      .map((d, i) => ({
        dayNumber: i + 1,
        title: d.title.trim(),
        description: d.description.trim() || null,
        startTime: designType === "TIME" ? d.startTime || null : null,
        endTime: designType === "TIME" ? d.endTime || null : null,
      }))
      .filter((d) => d.title.length > 0)

    const cleanInclusions = inclusions
      .map((inc) => ({ kind: inc.kind, text: inc.text.trim() }))
      .filter((inc) => inc.text.length > 0)

    const cleanImages = images
      .map((img) => ({
        imageUrl: img.imageUrl,
        caption: img.caption.trim() ? img.caption.trim() : null,
      }))
      .filter((img) => img.imageUrl)

    const payload: SaveItineraryPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      designType,
      languagesOffered,
      tags,
      durationDays: derivedDuration.days,
      durationLabel: derivedDuration.label,
      price: priceValue,
      currency: priceValue !== null ? currency : null,
      priceScope,
      overview: overview.trim() || null,
      transportation: transportation.trim() || null,
      meetingLocation: meetingLocation.trim() || null,
      imageGradient: coverImageUrl ? null : imageGradient,
      coverImageUrl,
      isActive,
      days: cleanDays,
      inclusions: cleanInclusions,
      galleryImages: cleanImages,
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await safariItinerariesService.update(itinerary.id, payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to save itinerary.",
        )
      } else {
        setError("Failed to save itinerary.")
      }
    } finally {
      setSaving(false)
    }
  }

  const inclusionsIncluded = useMemo(
    () => inclusions.filter((i) => i.kind === "INCLUDED"),
    [inclusions],
  )
  const inclusionsExcluded = useMemo(
    () => inclusions.filter((i) => i.kind === "EXCLUDED"),
    [inclusions],
  )

  /** Duration auto-derived. For TIME (safari default) it's always 1 day;
   * multi-day safari packages count days from the rows. */
  const derivedDuration = useMemo(() => {
    if (designType === "TIME") {
      return { days: 1 as number | null, label: "1 day" as string | null }
    }
    const count = days.length
    if (count === 0) return { days: null, label: null }
    return {
      days: count,
      label: `${count} day${count === 1 ? "" : "s"}`,
    }
  }, [designType, days.length])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">Edit safari itinerary</SheetTitle>
          <SheetDescription className="text-sm">
            {itinerary?.safariJeep ? (
              <>
                Built from <span className="font-medium">{itinerary.safariJeep.title}</span>
                {itinerary.safariJeep.driverName
                  ? ` with ${itinerary.safariJeep.driverName}`
                  : ""}
                . Adjust the schedule and details that the safari jeep can&apos;t
                tell us by itself.
              </>
            ) : (
              <>
                A safari itinerary is created from one of your jeeps. Adjust the
                pre-filled details below.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5">
          {error && (
            <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
            <div>
              <div className="text-sm font-semibold">Show on profile</div>
              <div className="text-xs text-zinc-500">
                Safari itineraries start hidden so you can finish the schedule
                before travelers see it.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Section title="Basics">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Yala morning safari with Sunil"
                className="h-10 rounded-2xl"
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Leopard tracking · Sunrise start · Bottled water included"
                className="h-10 rounded-2xl"
              />
            </Field>
          </Section>

          <Section
            title={designType === "TIME" ? "Time slots" : "Days"}
            action={
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-full bg-zinc-100 px-3 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200/70">
                  {derivedDuration.label ?? "No duration yet"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  className="h-8 rounded-full text-xs"
                >
                  <Plus className="size-3.5" />
                  {designType === "TIME" ? "Add slot" : "Add day"}
                </Button>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70">
              <span className="text-xs font-semibold text-zinc-600">Format</span>
              <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-zinc-200/70">
                <button
                  type="button"
                  onClick={() => setDesignType("TIME")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    designType === "TIME"
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Single day with times
                </button>
                <button
                  type="button"
                  onClick={() => setDesignType("DAYS")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    designType === "DAYS"
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Multi-day
                </button>
              </div>
              <span className="text-xs text-zinc-500">
                {designType === "TIME"
                  ? "Most safaris are a single day with time slots."
                  : "Use for multi-day safari packages (rare)."}
              </span>
            </div>
            {days.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                {designType === "TIME"
                  ? "Add slots like 05:30 – 09:30 with what happens at each stage of the safari."
                  : "Add a day-by-day breakdown for multi-day packages."}
              </p>
            ) : (
              <div className="grid gap-3">
                {days.map((d, i) => (
                  <div
                    key={d.id}
                    className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70"
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                      {designType === "TIME" ? (
                        <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-semibold text-zinc-950 ring-1 ring-zinc-200">
                          <Input
                            type="time"
                            value={d.startTime}
                            onChange={(e) =>
                              patchDay(d.id, { startTime: e.target.value })
                            }
                            className="h-9 w-36 rounded-lg border-0 bg-zinc-50 px-3 text-left text-sm font-medium text-zinc-950 ring-1 ring-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400"
                          />
                          <span className="text-zinc-400">–</span>
                          <Input
                            type="time"
                            value={d.endTime}
                            onChange={(e) =>
                              patchDay(d.id, { endTime: e.target.value })
                            }
                            className="h-9 w-36 rounded-lg border-0 bg-zinc-50 px-3 text-left text-sm font-medium text-zinc-950 ring-1 ring-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400"
                          />
                        </span>
                      ) : (
                        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-zinc-950 px-3 text-xs font-semibold text-white">
                          Day {i + 1}
                        </span>
                      )}
                      <Input
                        value={d.title}
                        onChange={(e) =>
                          patchDay(d.id, { title: e.target.value })
                        }
                        placeholder={
                          designType === "TIME"
                            ? "Slot title (e.g. Yala block 1 game drive)"
                            : "Day title (e.g. Yala + Bundala combo)"
                        }
                        className="h-9 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDay(d.id)}
                        className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
                        aria-label={
                          designType === "TIME" ? "Remove slot" : "Remove day"
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <DayRichEditor
                      value={d.description}
                      onChange={(html) => patchDay(d.id, { description: html })}
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Pricing">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12000"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10 w-32 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="This price is">
              <div className="inline-flex rounded-full bg-zinc-100 p-1 ring-1 ring-zinc-200/70">
                {(
                  [
                    { value: "PER_PERSON", label: "Per person" },
                    { value: "PER_GROUP", label: "Per trip" },
                    { value: "PER_DAY", label: "Per day" },
                  ] as { value: ItineraryPriceScope; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriceScope(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      priceScope === opt.value
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-950"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            <p className="text-xs text-zinc-500">
              Pre-filled from the cheapest charge on the safari jeep. Adjust if
              this itinerary has its own rate.
            </p>
          </Section>

          <Section title="Description">
            <Field label="Intro / overview">
              <DayRichEditor
                value={overview}
                onChange={setOverview}
                placeholder="What this safari covers — typical wildlife, route, what makes it special."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Transportation">
                <Input
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                  placeholder="Open-top safari jeep with padded raised seats"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Meeting / pickup location">
                <Input
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Tissamaharama town"
                  className="h-10 rounded-2xl"
                />
              </Field>
            </div>
          </Section>

          <Section title="Discovery">
            <Field label="Languages offered">
              <div className="grid gap-2">
                <p className="text-xs text-zinc-500">
                  Defaults to the driver&apos;s languages from the safari jeep.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {languagesOffered.length === 0 ? (
                    <span className="text-xs text-zinc-400">
                      No languages selected yet.
                    </span>
                  ) : (
                    languagesOffered.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang)}
                          className="text-zinc-500 hover:text-red-600"
                          aria-label={`Remove ${lang}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        addLanguage(languageInput)
                      }
                    }}
                    placeholder="Add a language (e.g. English) and press Enter"
                    className="h-9 rounded-full text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLanguage(languageInput)}
                    className="h-9 rounded-full text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Field>

            <Field label="Tags">
              <div className="grid gap-2">
                <p className="text-xs text-zinc-500">
                  Press Enter or comma to confirm — the # is added automatically.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.length === 0 ? (
                    <span className="text-xs text-zinc-400">No tags yet.</span>
                  ) : (
                    tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-200/70"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-blue-500 hover:text-red-600"
                          aria-label={`Remove tag ${t}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    placeholder="#yala, #leopard, #sunrise…"
                    className="h-9 rounded-full text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tagInput)}
                    className="h-9 rounded-full text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Field>
          </Section>

          <Section title="What's included / not included">
            <p className="text-xs text-zinc-500">
              Pre-filled from the safari jeep&apos;s inclusion / exclusion
              lists. Adjust per itinerary.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InclusionColumn
                label="Included"
                kind="INCLUDED"
                rows={inclusionsIncluded}
                onAdd={() => addInclusion("INCLUDED")}
                onPatch={patchInclusion}
                onRemove={removeInclusion}
                onInsertAfter={(id, text) =>
                  insertInclusionAfter(id, "INCLUDED", text)
                }
                onInsertManyAfter={(id, texts) =>
                  insertInclusionsAfter(id, "INCLUDED", texts)
                }
              />
              <InclusionColumn
                label="Not included"
                kind="EXCLUDED"
                rows={inclusionsExcluded}
                onAdd={() => addInclusion("EXCLUDED")}
                onPatch={patchInclusion}
                onRemove={removeInclusion}
                onInsertAfter={(id, text) =>
                  insertInclusionAfter(id, "EXCLUDED", text)
                }
                onInsertManyAfter={(id, texts) =>
                  insertInclusionsAfter(id, "EXCLUDED", texts)
                }
              />
            </div>
          </Section>

          <Section title="Card cover">
            <input
              id="safari-itinerary-cover-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadCover(f)
                e.target.value = ""
              }}
            />
            {coverImageUrl ? (
              <div className="overflow-hidden rounded-3xl ring-1 ring-zinc-200/70">
                <div className="relative h-32 w-full">
                  <Image
                    src={coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="text-xs text-zinc-500">
                    Custom cover image
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={coverUploading}
                      onClick={() =>
                        document
                          .getElementById("safari-itinerary-cover-input")
                          ?.click()
                      }
                      className="h-8 rounded-full text-xs"
                    >
                      <Upload className="size-3.5" />
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverImageUrl(null)}
                      className="h-8 rounded-full text-xs text-zinc-500 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                      Use gradient instead
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="relative h-24 overflow-hidden rounded-2xl ring-1 ring-zinc-200/70">
                  <div
                    className={`absolute inset-0 ${
                      imageGradient ?? GRADIENT_PRESETS[0].className
                    }`}
                  />
                  <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                </div>
                <div className="grid gap-1.5">
                  <p className="text-xs font-semibold text-zinc-600">
                    Pick a gradient
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADIENT_PRESETS.map((preset) => {
                      const active = imageGradient === preset.className
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setImageGradient(preset.className)}
                          aria-pressed={active}
                          title={preset.label}
                          className={`relative h-10 w-16 overflow-hidden rounded-xl ring-1 transition ${
                            active
                              ? "ring-2 ring-zinc-950"
                              : "ring-zinc-200/70 hover:ring-zinc-400"
                          }`}
                        >
                          <span
                            className={`absolute inset-0 ${preset.className}`}
                          />
                          <span className="sr-only">{preset.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={coverUploading}
                    onClick={() =>
                      document
                        .getElementById("safari-itinerary-cover-input")
                        ?.click()
                    }
                    className="h-9 rounded-full text-xs"
                  >
                    <Upload className="size-3.5" />
                    Upload cover image
                  </Button>
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Gallery"
            action={
              <>
                <input
                  id="safari-itinerary-gallery-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const arr = Array.from(e.target.files ?? [])
                    if (arr.length) void uploadGallery(arr)
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={galleryUploading}
                  onClick={() =>
                    document
                      .getElementById("safari-itinerary-gallery-input")
                      ?.click()
                  }
                  className="h-8 rounded-full text-xs"
                >
                  <Upload className="size-3.5" />
                  Add images
                </Button>
              </>
            }
          >
            {images.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                Pre-filled from the jeep&apos;s photos. Add more from this
                specific safari if you have them.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/70"
                  >
                    <div className="relative aspect-4/3 w-full">
                      <Image
                        src={img.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                          onClick={() => moveImage(img.id, -1)}
                          aria-label="Move left"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                          onClick={() => moveImage(img.id, 1)}
                          aria-label="Move right"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-red-600 ring-1 ring-red-200/70 hover:bg-red-50"
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <Input
                        value={img.caption}
                        onChange={(e) =>
                          patchImageCaption(img.id, e.target.value)
                        }
                        placeholder={`Caption ${idx + 1} (optional)`}
                        className="h-8 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background/95 p-3 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <UploadOverlay
          open={coverUploading}
          title="Uploading cover image"
          progress={coverProgress}
        />
        <UploadOverlay
          open={galleryUploading}
          title={
            galleryTotal > 1 ? "Uploading gallery images" : "Uploading image"
          }
          subtitle={
            galleryTotal > 1
              ? `File ${galleryIndex} of ${galleryTotal}`
              : undefined
          }
          progress={galleryProgress}
        />
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">{title}</div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-zinc-600">{label}</Label>
      {children}
    </div>
  )
}

function InclusionColumn({
  label,
  kind,
  rows,
  onAdd,
  onPatch,
  onRemove,
  onInsertAfter,
  onInsertManyAfter,
}: {
  label: string
  kind: ItineraryInclusionKind
  rows: InclusionDraft[]
  onAdd: () => void
  onPatch: (id: string, p: Partial<InclusionDraft>) => void
  onRemove: (id: string) => void
  onInsertAfter: (id: string, text?: string) => string
  onInsertManyAfter: (id: string, texts: string[]) => string[]
}) {
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())
  const setRef = (id: string) => (el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(id, el)
    else inputRefs.current.delete(id)
  }
  const focusSoon = (id: string) => {
    setTimeout(() => {
      inputRefs.current.get(id)?.focus()
    }, 0)
  }

  function handleKeyDown(
    e: ReactKeyboardEvent<HTMLInputElement>,
    rowId: string,
  ) {
    if (e.key === "Enter") {
      e.preventDefault()
      const newId = onInsertAfter(rowId, "")
      focusSoon(newId)
    }
  }

  function handlePaste(
    e: ReactClipboardEvent<HTMLInputElement>,
    rowId: string,
    currentText: string,
  ) {
    const pasted = e.clipboardData.getData("text")
    if (!pasted || !/\r?\n/.test(pasted)) return
    e.preventDefault()
    const lines = pasted
      .split(/\r?\n/)
      .map((l) =>
        l
          .trim()
          .replace(/^[•\-\*]\s+/, "")
          .replace(/^\d+[\.)]\s+/, "")
          .trim(),
      )
      .filter(Boolean)
    if (lines.length === 0) return

    const input = e.currentTarget
    const start = input.selectionStart ?? currentText.length
    const end = input.selectionEnd ?? currentText.length
    const before = currentText.slice(0, start)
    const after = currentText.slice(end)
    const [first, ...rest] = lines

    onPatch(rowId, { text: before + first + after })
    if (rest.length > 0) {
      const newIds = onInsertManyAfter(rowId, rest)
      const last = newIds[newIds.length - 1]
      if (last) focusSoon(last)
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-900">{label}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-7 rounded-full text-[0.65rem]"
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>
      <div className="mt-2 grid gap-2">
        {rows.length === 0 ? (
          <div className="text-xs text-zinc-500">
            {kind === "INCLUDED"
              ? "e.g. Bottled water, park guide commentary"
              : "e.g. Park entrance fees, meals, tips"}
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <Input
                ref={setRef(r.id)}
                value={r.text}
                onChange={(e) => onPatch(r.id, { text: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, r.id)}
                onPaste={(e) => handlePaste(e, r.id, r.text)}
                placeholder={
                  kind === "INCLUDED"
                    ? "What's included"
                    : "What's not included"
                }
                className="h-9 rounded-xl text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(r.id)}
                className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
