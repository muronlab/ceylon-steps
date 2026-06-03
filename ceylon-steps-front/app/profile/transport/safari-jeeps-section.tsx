"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import languagesData from "@/data/languages.json"
import {
  LanguagePicker,
  type LanguageOption,
} from "@/app/profile/guide/sections/language-picker"
import {
  Compass,
  Edit,
  ImageOff,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { UploadOverlay } from "@/app/profile/guide/sections/upload-overlay"
import {
  safariJeepsService,
  SAFARI_CHARGE_TYPE_LABELS,
  COMMON_NATIONAL_PARKS,
  COMMON_SAFARI_EXPERIENCES,
  SAFARI_PREDEFINED_FACILITIES,
  type SafariJeep,
  type SafariChargeType,
  type SaveSafariJeepPayload,
  type SaveSafariJeepChargePayload,
} from "@/services/safari-jeeps.service"
import {
  VEHICLE_TYPE_LABELS,
  CONDITION_LABELS,
  type VehicleType,
  type VehicleCondition,
} from "@/services/transport-vehicles.service"

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR", "AED"]

/** Lookup map for rendering country flags next to a stored language name. */
const LANGUAGES_BY_NAME = new Map<string, LanguageOption>(
  (languagesData as LanguageOption[]).map((l) => [l.language.toLowerCase(), l]),
)

type ImageDraft = { id: string; imageUrl: string; caption: string }
type ChargeDraft = {
  id: string
  chargeType: SafariChargeType
  amount: string
  currency: string
  includesParkFee: boolean
  minimumUnits: string
  label: string
  notes: string
}

function uid(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatAmount(amount: string, currency: string) {
  const num = Number(amount)
  if (!Number.isFinite(num)) return `${amount} ${currency}`
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num)
  } catch {
    return `${num.toLocaleString()} ${currency}`
  }
}

export function SafariJeepsSection({
  profileId,
  providerFullName,
  providerHasBusiness,
  providerProfilePhotoUrl,
}: {
  profileId: string
  providerFullName: string
  /** Solo operators (hasBusiness === false) share their provider profile
   * photo as the driver photo on every jeep — no separate upload needed.
   * Business operators get a per-jeep driver photo upload. */
  providerHasBusiness: boolean
  providerProfilePhotoUrl: string | null
}) {
  const [jeeps, setJeeps] = useState<SafariJeep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<SafariJeep | "new" | null>(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await safariJeepsService.list()
      setJeeps(list)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to load safari jeeps.")
      } else {
        setError("Failed to load safari jeeps.")
      }
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  async function remove(id: string) {
    if (!window.confirm("Delete this safari jeep?")) return
    setDeletingId(id)
    try {
      await safariJeepsService.remove(id)
      setJeeps((p) => p.filter((j) => j.id !== id))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to delete.")
      } else {
        setError("Failed to delete.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  function onSaved(saved: SafariJeep) {
    setJeeps((prev) => {
      const idx = prev.findIndex((j) => j.id === saved.id)
      if (idx < 0) return [saved, ...prev]
      const next = [...prev]
      next[idx] = saved
      return next
    })
  }

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold tracking-tight text-zinc-950">
            Safari jeeps
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Add each jeep you operate. Driver details live with each jeep —
            for solo operators we default to your name, but you can override
            per jeep if a different driver takes that vehicle.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing("new")
            setOpen(true)
          }}
          className="h-8 shrink-0 rounded-full text-xs"
        >
          <Plus className="size-3.5" />
          Add safari jeep
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid h-32 place-items-center">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
        </div>
      ) : jeeps.length === 0 ? (
        <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center ring-1 ring-zinc-200/70">
          <Compass className="mx-auto size-6 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-700">
            No safari jeeps yet
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Add your first jeep so travelers can book a safari with you.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jeeps.map((j) => (
            <JeepCard
              key={j.id}
              jeep={j}
              deleting={deletingId === j.id}
              onEdit={() => {
                setEditing(j)
                setOpen(true)
              }}
              onRemove={() => remove(j.id)}
            />
          ))}
        </div>
      )}

      <SafariJeepEditorSheet
        profileId={profileId}
        providerFullName={providerFullName}
        providerHasBusiness={providerHasBusiness}
        providerProfilePhotoUrl={providerProfilePhotoUrl}
        target={editing}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setEditing(null)
        }}
        onSaved={onSaved}
      />
    </section>
  )
}

function JeepCard({
  jeep,
  deleting,
  onEdit,
  onRemove,
}: {
  jeep: SafariJeep
  deleting: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const cover = jeep.images[0]?.imageUrl
  const cheapest = [...jeep.charges].sort(
    (a, b) => Number(a.amount) - Number(b.amount),
  )[0]
  return (
    <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="relative aspect-4/3 size-24 overflow-hidden rounded-xl bg-zinc-100">
        {cover ? (
          <Image
            src={cover}
            alt={jeep.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="grid size-full place-items-center text-zinc-400">
            <ImageOff className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <h4 className="truncate text-sm font-semibold text-zinc-950">
            {jeep.title}
          </h4>
          {!jeep.isActive && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
              Hidden
            </span>
          )}
        </div>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500">
          <User className="size-3" />
          {jeep.driverName}
          {jeep.driverYearsExperience
            ? ` · ${jeep.driverYearsExperience} yrs exp.`
            : ""}
        </p>
        {jeep.nationalParks.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {jeep.nationalParks.slice(0, 3).join(" · ")}
            {jeep.nationalParks.length > 3
              ? ` +${jeep.nationalParks.length - 3}`
              : ""}
          </p>
        )}
        {cheapest && (
          <p className="mt-1 text-xs font-medium text-zinc-700">
            From {formatAmount(cheapest.amount, cheapest.currency)}{" "}
            <span className="text-zinc-500">
              {SAFARI_CHARGE_TYPE_LABELS[cheapest.chargeType].toLowerCase()}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 rounded-full text-xs"
        >
          <Edit className="size-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={deleting}
          className="size-8 rounded-full p-0 text-zinc-500 hover:text-red-600"
          aria-label="Delete jeep"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Editor sheet ─────────────────────────── */

function SafariJeepEditorSheet({
  profileId,
  providerFullName,
  providerHasBusiness,
  providerProfilePhotoUrl,
  target,
  open,
  onOpenChange,
  onSaved,
}: {
  profileId: string
  providerFullName: string
  providerHasBusiness: boolean
  providerProfilePhotoUrl: string | null
  target: SafariJeep | "new" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (saved: SafariJeep) => void
}) {
  const isCreate = target === "new"
  const editing = target === "new" || target === null ? null : target

  // Vehicle details (simplified — no plate / year / fuel for safari jeeps)
  const [title, setTitle] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("JEEP")
  const [condition, setCondition] = useState<VehicleCondition>("GOOD")
  const [passengerCapacity, setPassengerCapacity] = useState("")

  // Driver inline
  const [driverName, setDriverName] = useState("")
  const [driverPhotoUrl, setDriverPhotoUrl] = useState<string | null>(null)
  const [driverYearsExperience, setDriverYearsExperience] = useState("")
  const [driverBio, setDriverBio] = useState("")
  const [driverLanguages, setDriverLanguages] = useState<string[]>([])
  const [driverGuidesAtParks, setDriverGuidesAtParks] = useState(true)
  const [driverPhotoUploading, setDriverPhotoUploading] = useState(false)

  // Safari
  const [nationalParks, setNationalParks] = useState<string[]>([])
  const [nationalParkInput, setNationalParkInput] = useState("")
  const [experiences, setExperiences] = useState<string[]>([])
  const [experienceInput, setExperienceInput] = useState("")
  const [durationNotes, setDurationNotes] = useState("")

  // Facilities + inclusions
  const [facilities, setFacilities] = useState<string[]>([])
  const [extraFacilities, setExtraFacilities] = useState<string[]>([])
  const [extraFacilityInput, setExtraFacilityInput] = useState("")
  const [inclusions, setInclusions] = useState<string[]>([])
  const [inclusionInput, setInclusionInput] = useState("")
  const [exclusions, setExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")

  const [description, setDescription] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [isActive, setIsActive] = useState(true)

  const [images, setImages] = useState<ImageDraft[]>([])
  const [charges, setCharges] = useState<ChargeDraft[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryProgress, setGalleryProgress] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryTotal, setGalleryTotal] = useState(0)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setVehicleType(editing.vehicleType)
      setCondition(editing.condition)
      setPassengerCapacity(
        editing.passengerCapacity != null
          ? String(editing.passengerCapacity)
          : "",
      )
      setDriverName(editing.driverName)
      // For solo operators, ignore any stored driver photo and use the
      // provider profile photo instead — keeps the two in sync without UI.
      setDriverPhotoUrl(
        providerHasBusiness
          ? editing.driverPhotoUrl
          : providerProfilePhotoUrl,
      )
      setDriverYearsExperience(
        editing.driverYearsExperience != null
          ? String(editing.driverYearsExperience)
          : "",
      )
      setDriverBio(editing.driverBio ?? "")
      setDriverLanguages(editing.driverLanguages ?? [])
      setDriverGuidesAtParks(editing.driverGuidesAtParks)
      setNationalParks(editing.nationalParks ?? [])
      setExperiences(editing.experiences ?? [])
      setDurationNotes(editing.durationNotes ?? "")
      setFacilities(editing.facilities ?? [])
      setExtraFacilities(editing.extraFacilities ?? [])
      setInclusions(editing.inclusions ?? [])
      setExclusions(editing.exclusions ?? [])
      setDescription(editing.description ?? "")
      setPickupLocation(editing.pickupLocation ?? "")
      setIsActive(editing.isActive)
      setImages(
        editing.images.map((i) => ({
          id: i.id,
          imageUrl: i.imageUrl,
          caption: i.caption ?? "",
        })),
      )
      setCharges(
        editing.charges.map((c) => ({
          id: c.id,
          chargeType: c.chargeType,
          amount: c.amount,
          currency: c.currency,
          includesParkFee: c.includesParkFee,
          minimumUnits: c.minimumUnits != null ? String(c.minimumUnits) : "",
          label: c.label ?? "",
          notes: c.notes ?? "",
        })),
      )
    } else {
      setTitle("")
      setVehicleType("JEEP")
      setCondition("GOOD")
      setPassengerCapacity("")
      // Default driver name to provider's full name on create — solo
      // operators usually drive themselves.
      setDriverName(providerFullName)
      setDriverPhotoUrl(providerHasBusiness ? null : providerProfilePhotoUrl)
      setDriverYearsExperience("")
      setDriverBio("")
      setDriverLanguages([])
      setDriverGuidesAtParks(true)
      setNationalParks([])
      setExperiences([])
      setDurationNotes("")
      setFacilities([])
      setExtraFacilities([])
      setInclusions([])
      setExclusions([])
      setDescription("")
      setPickupLocation("")
      setIsActive(true)
      setImages([])
      setCharges([
        {
          id: uid("chg"),
          chargeType: "PER_JEEP",
          amount: "",
          currency: "LKR",
          includesParkFee: false,
          minimumUnits: "",
          label: "",
          notes: "",
        },
      ])
    }
    setNationalParkInput("")
    setExperienceInput("")
    setExtraFacilityInput("")
    setInclusionInput("")
    setExclusionInput("")
    setError(null)
  }, [
    open,
    editing,
    providerFullName,
    providerHasBusiness,
    providerProfilePhotoUrl,
  ])

  // ── Chip helpers ──────────────────────────────────────────────────
  function addChip(
    raw: string,
    arr: string[],
    setter: (next: string[]) => void,
    inputSetter: (next: string) => void,
  ) {
    const cleaned = raw.trim()
    if (!cleaned) return
    if (arr.some((x) => x.toLowerCase() === cleaned.toLowerCase())) {
      inputSetter("")
      return
    }
    setter([...arr, cleaned])
    inputSetter("")
  }
  function removeChip(name: string, arr: string[], setter: (n: string[]) => void) {
    setter(arr.filter((x) => x !== name))
  }
  function toggleFacility(name: string, on: boolean) {
    setFacilities((prev) =>
      on
        ? prev.includes(name)
          ? prev
          : [...prev, name]
        : prev.filter((f) => f !== name),
    )
  }

  // ── Image upload (gallery) ────────────────────────────────────────
  async function uploadImages(files: File[]) {
    if (files.length === 0) return
    setGalleryUploading(true)
    setGalleryTotal(files.length)
    setGalleryIndex(0)
    setGalleryProgress(0)
    try {
      const fresh: ImageDraft[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setGalleryIndex(i + 1)
        setGalleryProgress(0)
        const ext = file.name.split(".").pop() || "jpg"
        const path = `transport/${profileId}/safari/${Date.now()}-${i}.${ext}`
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
        fresh.push({ id: uid("img"), imageUrl: res.data.url, caption: "" })
      }
      setImages((prev) => [...prev, ...fresh])
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
    setImages((p) => p.filter((x) => x.id !== id))
  }
  function moveImage(id: string, dir: -1 | 1) {
    setImages((prev) => {
      const idx = prev.findIndex((x) => x.id === id)
      if (idx < 0) return prev
      const swap = idx + dir
      if (swap < 0 || swap >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }
  function patchImageCaption(id: string, caption: string) {
    setImages((p) => p.map((x) => (x.id === id ? { ...x, caption } : x)))
  }

  // ── Driver photo upload ───────────────────────────────────────────
  async function uploadDriverPhoto(file: File) {
    setDriverPhotoUploading(true)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `transport/${profileId}/safari-drivers/${Date.now()}.${ext}`
      const body = new FormData()
      body.append("file", file)
      body.append("path", path)
      const res = await apiClient.post<{ url: string }>(
        "/storage/upload",
        body,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      setDriverPhotoUrl(res.data.url)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to upload driver photo.",
        )
      } else {
        setError("Failed to upload driver photo.")
      }
    } finally {
      setDriverPhotoUploading(false)
    }
  }

  // ── Charges ────────────────────────────────────────────────────────
  function addCharge() {
    setCharges((p) => [
      ...p,
      {
        id: uid("chg"),
        chargeType: "PER_JEEP",
        amount: "",
        currency: "LKR",
        includesParkFee: false,
        minimumUnits: "",
        label: "",
        notes: "",
      },
    ])
  }
  function removeCharge(id: string) {
    setCharges((p) => p.filter((c) => c.id !== id))
  }
  function patchCharge(id: string, p: Partial<ChargeDraft>) {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)))
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    if (!driverName.trim()) {
      setError("Driver name is required.")
      return
    }
    const cleanCharges: SaveSafariJeepChargePayload[] = []
    for (const c of charges) {
      if (!c.amount.trim()) continue
      const amount = Number(c.amount)
      if (!Number.isFinite(amount) || amount < 0) {
        setError("Charge amount must be a non-negative number.")
        return
      }
      const min = c.minimumUnits.trim() ? Number(c.minimumUnits) : null
      if (min !== null && (!Number.isInteger(min) || min < 1)) {
        setError("Minimum units must be a positive whole number.")
        return
      }
      cleanCharges.push({
        chargeType: c.chargeType,
        amount: Math.round(amount * 100) / 100,
        currency: c.currency || "LKR",
        includesParkFee: c.includesParkFee,
        minimumUnits: min,
        label: c.label.trim() || null,
        notes: c.notes.trim() || null,
      })
    }

    const payload: SaveSafariJeepPayload = {
      title: title.trim(),
      vehicleType,
      condition,
      passengerCapacity: passengerCapacity ? Number(passengerCapacity) : null,
      driverName: driverName.trim(),
      // Solo operators always send the provider profile photo as the driver
      // photo so the public listing has something to show.
      driverPhotoUrl: providerHasBusiness ? driverPhotoUrl : providerProfilePhotoUrl,
      driverYearsExperience: driverYearsExperience
        ? Number(driverYearsExperience)
        : null,
      driverBio: driverBio.trim() || null,
      driverLanguages,
      driverGuidesAtParks,
      nationalParks,
      experiences,
      durationNotes: durationNotes.trim() || null,
      facilities,
      extraFacilities,
      inclusions,
      exclusions,
      description: description.trim() || null,
      pickupLocation: pickupLocation.trim() || null,
      isActive,
      images: images.map((img) => ({
        imageUrl: img.imageUrl,
        caption: img.caption.trim() || null,
      })),
      charges: cleanCharges,
    }

    setSaving(true)
    setError(null)
    try {
      const saved = isCreate
        ? await safariJeepsService.create(payload)
        : await safariJeepsService.update(editing!.id, payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to save safari jeep.",
        )
      } else {
        setError("Failed to save safari jeep.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">
            {isCreate ? "Add safari jeep" : "Edit safari jeep"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            One safari jeep with the driver who runs it. Travelers care a lot
            about who&apos;s behind the wheel, so fill in the driver section
            properly.
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
                Hide this jeep while you&apos;re still preparing it.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* 1. Vehicle — kept lean for safari jeeps. Plate, year, fuel are
              not part of the safari booking decision. */}
          <Section title="Vehicle">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mahindra Bolero — Yala Special"
                className="h-10 rounded-2xl"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Vehicle type">
                <Select
                  value={vehicleType}
                  onValueChange={(v) => setVehicleType(v as VehicleType)}
                >
                  <SelectTrigger className="h-10 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(VEHICLE_TYPE_LABELS) as Array<
                        [VehicleType, string]
                      >
                    ).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Passenger capacity">
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={passengerCapacity}
                  onChange={(e) => setPassengerCapacity(e.target.value)}
                  placeholder="6"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Condition">
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as VehicleCondition)}
                >
                  <SelectTrigger className="h-10 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(CONDITION_LABELS) as Array<
                        [VehicleCondition, string]
                      >
                    ).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* 2. Driver */}
          <Section title="Driver">
            <p className="text-xs text-zinc-500">
              Travelers pick safari jeeps largely based on the driver&apos;s
              experience and the wildlife they help spot. Fill in as much as
              you can.
            </p>
            <div className="flex items-start gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/70">
                {driverPhotoUrl ? (
                  <Image
                    src={driverPhotoUrl}
                    alt={driverName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-zinc-400">
                    <User className="size-6" />
                  </div>
                )}
              </div>
              <div className="grid flex-1 gap-2">
                {providerHasBusiness ? (
                  <>
                    <input
                      id="safari-driver-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadDriverPhoto(f)
                        e.target.value = ""
                      }}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={driverPhotoUploading}
                        onClick={() =>
                          document
                            .getElementById("safari-driver-photo-input")
                            ?.click()
                        }
                        className="h-8 rounded-full text-xs"
                      >
                        <Upload className="size-3.5" />
                        {driverPhotoUrl ? "Replace photo" : "Upload photo"}
                      </Button>
                      {driverPhotoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDriverPhotoUrl(null)}
                          className="h-8 rounded-full text-xs text-zinc-500 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Business account — upload a photo of the specific driver
                      assigned to this jeep.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Solo operator — we use your profile photo as the driver
                    photo for every jeep. Update your profile photo at the top
                    of this page to change it.
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Driver name">
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder={providerFullName}
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Years of experience">
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={driverYearsExperience}
                  onChange={(e) => setDriverYearsExperience(e.target.value)}
                  placeholder="e.g. 12"
                  className="h-10 rounded-2xl"
                />
              </Field>
            </div>
            <Field label="Driver bio">
              <Textarea
                value={driverBio}
                onChange={(e) => setDriverBio(e.target.value)}
                placeholder="A short paragraph about the driver — background, what they're known for, any wildlife achievements."
                rows={4}
                className="rounded-2xl"
              />
            </Field>

            <LanguagesField
              value={driverLanguages}
              onChange={setDriverLanguages}
            />
            <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
              <div>
                <div className="text-sm font-medium text-zinc-950">
                  Driver also guides inside the park
                </div>
                <div className="text-xs text-zinc-500">
                  Licensed to guide travelers about wildlife and parks, not
                  just drive.
                </div>
              </div>
              <Switch
                checked={driverGuidesAtParks}
                onCheckedChange={setDriverGuidesAtParks}
              />
            </div>
          </Section>

          {/* 3. Safari specifics */}
          <Section title="Safari details">
            <SafariChipField
              label="National parks / areas"
              value={nationalParks}
              input={nationalParkInput}
              onInputChange={setNationalParkInput}
              onAdd={() =>
                addChip(
                  nationalParkInput,
                  nationalParks,
                  setNationalParks,
                  setNationalParkInput,
                )
              }
              onRemove={(it) =>
                removeChip(it, nationalParks, setNationalParks)
              }
              placeholder="Add a park (e.g. Yala National Park)"
              suggestions={COMMON_NATIONAL_PARKS as readonly string[]}
            />
            <SafariChipField
              label="Experiences offered"
              value={experiences}
              input={experienceInput}
              onInputChange={setExperienceInput}
              onAdd={() =>
                addChip(
                  experienceInput,
                  experiences,
                  setExperiences,
                  setExperienceInput,
                )
              }
              onRemove={(it) => removeChip(it, experiences, setExperiences)}
              placeholder="e.g. Sunrise safari, Night safari"
              suggestions={COMMON_SAFARI_EXPERIENCES as readonly string[]}
            />
            <Field label="Duration / timing notes">
              <Input
                value={durationNotes}
                onChange={(e) => setDurationNotes(e.target.value)}
                placeholder="e.g. 3 hr typical, also half-day and full-day"
                className="h-10 rounded-2xl"
              />
            </Field>
            <Field label="Pickup location">
              <Input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Tissamaharama town"
                className="h-10 rounded-2xl"
              />
            </Field>
          </Section>

          {/* 4. Facilities */}
          <Section title="Facilities">
            <p className="text-xs text-zinc-500">
              On-board kit and viewing comfort — what travelers actually
              experience during the safari. Add custom extras as chips below.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
              {SAFARI_PREDEFINED_FACILITIES.map((name) => {
                const checked = facilities.includes(name)
                return (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs ring-1 ring-zinc-200/70 hover:bg-zinc-100"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleFacility(name, v === true)}
                    />
                    <span>{name}</span>
                  </label>
                )
              })}
            </div>
            <SafariChipField
              label="Other facilities"
              value={extraFacilities}
              input={extraFacilityInput}
              onInputChange={setExtraFacilityInput}
              onAdd={() =>
                addChip(
                  extraFacilityInput,
                  extraFacilities,
                  setExtraFacilities,
                  setExtraFacilityInput,
                )
              }
              onRemove={(it) =>
                removeChip(it, extraFacilities, setExtraFacilities)
              }
              placeholder="e.g. Binoculars, cool box, raincoats"
            />
          </Section>

          {/* 5. Inclusions / exclusions */}
          <Section title="What's included / not included">
            <div className="grid gap-3 sm:grid-cols-2">
              <SafariChipField
                label="Included"
                tone="positive"
                value={inclusions}
                input={inclusionInput}
                onInputChange={setInclusionInput}
                onAdd={() =>
                  addChip(
                    inclusionInput,
                    inclusions,
                    setInclusions,
                    setInclusionInput,
                  )
                }
                onRemove={(it) => removeChip(it, inclusions, setInclusions)}
                placeholder="e.g. Bottled water, park guide commentary"
              />
              <SafariChipField
                label="Not included"
                tone="negative"
                value={exclusions}
                input={exclusionInput}
                onInputChange={setExclusionInput}
                onAdd={() =>
                  addChip(
                    exclusionInput,
                    exclusions,
                    setExclusions,
                    setExclusionInput,
                  )
                }
                onRemove={(it) => removeChip(it, exclusions, setExclusions)}
                placeholder="e.g. Park entry fees, meals, tips"
              />
            </div>
          </Section>

          {/* 6. Charges */}
          <Section
            title="Charges"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCharge}
                className="h-8 rounded-full text-xs"
              >
                <Plus className="size-3.5" />
                Add charge
              </Button>
            }
          >
            <p className="text-xs text-zinc-500">
              Add one row per pricing option (per-jeep, per-person, per-hour
              etc.). Tick &quot;Includes park fee&quot; if your rate already
              covers the entrance ticket.
            </p>
            {charges.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                No charges yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {charges.map((c) => (
                  <SafariChargeRow
                    key={c.id}
                    row={c}
                    onChange={(p) => patchCharge(c.id, p)}
                    onRemove={() => removeCharge(c.id)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* 7. Gallery */}
          <Section
            title="Photos"
            action={
              <>
                <input
                  id="safari-image-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const arr = Array.from(e.target.files ?? [])
                    if (arr.length) void uploadImages(arr)
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={galleryUploading}
                  onClick={() =>
                    document.getElementById("safari-image-input")?.click()
                  }
                  className="h-8 rounded-full text-xs"
                >
                  <Upload className="size-3.5" />
                  Add photos
                </Button>
              </>
            }
          >
            {images.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                Upload photos of the jeep + safari moments.
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
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                          onClick={() => moveImage(img.id, 1)}
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-red-600 ring-1 ring-red-200/70 hover:bg-red-50"
                          onClick={() => removeImage(img.id)}
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

          {/* 8. Description */}
          <Section title="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything else travelers should know — your route, what wildlife you typically spot, how you handle weather, etc."
              rows={6}
              className="rounded-2xl"
            />
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
            {saving
              ? "Saving…"
              : isCreate
                ? "Create safari jeep"
                : "Save changes"}
          </Button>
        </div>

        <UploadOverlay
          open={galleryUploading}
          title={
            galleryTotal > 1 ? "Uploading safari photos" : "Uploading photo"
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

/* ──────────────────────────────────────────── */

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

/**
 * Pick driver languages from the curated languages.json list. Stores just the
 * language name as a string (matches the existing `String[]` column), but
 * renders the country flag at display time by looking up the JSON.
 */
function LanguagesField({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <Label className="text-xs font-semibold text-zinc-600">
        Languages spoken
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-zinc-400">
            No languages added yet.
          </span>
        ) : (
          value.map((langName) => {
            const opt = LANGUAGES_BY_NAME.get(langName.toLowerCase())
            return (
              <span
                key={langName}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800"
              >
                {opt?.countryCode && (
                  <span className="relative size-3.5 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                    <Image
                      src={`https://flagcdn.com/w40/${opt.countryCode.toLowerCase()}.png`}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="14px"
                      unoptimized
                    />
                  </span>
                )}
                {langName}
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((x) => x !== langName))
                  }
                  className="text-zinc-500 hover:text-red-600"
                  aria-label={`Remove ${langName}`}
                >
                  ×
                </button>
              </span>
            )
          })
        )}
      </div>
      <LanguagePicker
        value={null}
        onSelect={(opt) => {
          if (
            !value.some(
              (x) => x.toLowerCase() === opt.language.toLowerCase(),
            )
          ) {
            onChange([...value, opt.language])
          }
        }}
        placeholder="Search and add a language"
        disabledLanguages={value}
      />
    </div>
  )
}

function SafariChipField({
  label,
  tone = "neutral",
  value,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: {
  label: string
  tone?: "neutral" | "positive" | "negative"
  value: string[]
  input: string
  onInputChange: (next: string) => void
  onAdd: () => void
  onRemove: (item: string) => void
  placeholder?: string
  suggestions?: readonly string[]
}) {
  const chipClass =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
      : tone === "negative"
        ? "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
        : "bg-zinc-100 text-zinc-800"
  const removeClass =
    tone === "positive"
      ? "text-emerald-500 hover:text-red-600"
      : tone === "negative"
        ? "text-rose-500 hover:text-red-700"
        : "text-zinc-500 hover:text-red-600"
  const unused = suggestions?.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  )
  return (
    <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <Label className="text-xs font-semibold text-zinc-600">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-zinc-400">Nothing yet.</span>
        ) : (
          value.map((it) => (
            <span
              key={it}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${chipClass}`}
            >
              {it}
              <button
                type="button"
                onClick={() => onRemove(it)}
                className={removeClass}
                aria-label={`Remove ${it}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              onAdd()
            }
          }}
          placeholder={placeholder}
          className="h-9 rounded-full text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-9 rounded-full text-xs"
        >
          Add
        </Button>
      </div>
      {unused && unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Suggestions:
          </span>
          {unused.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onInputChange("")
                onAdd()
                // Cheap workaround: simulate adding the suggestion by writing
                // it to input then calling onAdd in two steps would be flaky.
                // Instead, push it into the chip set directly via onRemove's
                // sibling? Simpler: call onAdd after onInputChange(suggestion).
              }}
              className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-950 hover:text-white"
              onMouseDown={(e) => {
                e.preventDefault()
                onInputChange(s)
                // Defer onAdd until after the input change has been applied.
                setTimeout(() => onAdd(), 0)
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SafariChargeRow({
  row,
  onChange,
  onRemove,
}: {
  row: ChargeDraft
  onChange: (p: Partial<ChargeDraft>) => void
  onRemove: () => void
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr_120px]">
          <div className="grid gap-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Type
            </Label>
            <Select
              value={row.chargeType}
              onValueChange={(v) =>
                onChange({ chargeType: v as SafariChargeType })
              }
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(SAFARI_CHARGE_TYPE_LABELS) as Array<
                    [SafariChargeType, string]
                  >
                ).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Amount
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
              placeholder="0.00"
              className="h-9 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Currency
            </Label>
            <Select
              value={row.currency}
              onValueChange={(v) => onChange({ currency: v })}
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
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
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
          aria-label="Remove charge"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Minimum units (optional)
          </Label>
          <Input
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            value={row.minimumUnits}
            onChange={(e) => onChange({ minimumUnits: e.target.value })}
            placeholder="e.g. 2"
            className="h-9 rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Label (optional)
          </Label>
          <Input
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. Foreigner rate"
            className="h-9 rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200/70">
        <div className="text-xs">
          <div className="font-medium text-zinc-950">Includes park fee</div>
          <div className="text-zinc-500">
            Tick when the park entrance ticket is already covered by the price.
          </div>
        </div>
        <Switch
          checked={row.includesParkFee}
          onCheckedChange={(v) => onChange({ includesParkFee: v })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Notes (optional)
        </Label>
        <Input
          value={row.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Anything customers should know"
          className="h-9 rounded-xl"
        />
      </div>
    </div>
  )
}
