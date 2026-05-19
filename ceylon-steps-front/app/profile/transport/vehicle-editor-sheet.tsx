"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Image from "next/image"
import { Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import {
  transportVehiclesService,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  CONDITION_LABELS,
  CHARGE_TYPE_LABELS,
  PREDEFINED_FACILITIES,
  FUEL_POLICY_OPTIONS,
  type TransportVehicle,
  type SaveVehiclePayload,
  type SaveVehicleChargePayload,
  type VehicleType,
  type VehicleFuelType,
  type VehicleCondition,
  type VehicleChargeType,
} from "@/services/transport-vehicles.service"
import { UploadOverlay } from "@/app/profile/guide/sections/upload-overlay"
import { VehicleDescriptionEditor } from "./vehicle-description-editor"

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR", "AED"]

type ImageDraft = {
  id: string
  imageUrl: string
  caption: string
}

type ChargeDraft = {
  id: string
  chargeType: VehicleChargeType
  amount: string
  currency: string
  includesFuel: boolean
  nightSurcharge: string
  minimumUnits: string
  label: string
  notes: string
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function chargeFromVehicle(c: TransportVehicle["charges"][number]): ChargeDraft {
  return {
    id: c.id,
    chargeType: c.chargeType,
    amount: c.amount,
    currency: c.currency,
    includesFuel: c.includesFuel,
    nightSurcharge: c.nightSurcharge ?? "",
    minimumUnits: c.minimumUnits != null ? String(c.minimumUnits) : "",
    label: c.label ?? "",
    notes: c.notes ?? "",
  }
}

export function VehicleEditorSheet({
  profileId,
  target,
  prefillFrom,
  open,
  defaultCurrency = "LKR",
  onOpenChange,
  onSaved,
}: {
  profileId: string
  target: TransportVehicle | "new" | null
  /** When target === "new", pre-populate the form from this vehicle's fields
   * (used by the Duplicate button). Title gets a "(copy)" suffix. Ignored
   * when editing an existing vehicle. */
  prefillFrom?: TransportVehicle | null
  open: boolean
  defaultCurrency?: string
  onOpenChange: (open: boolean) => void
  onSaved: (saved: TransportVehicle) => void
}) {
  const isCreate = target === "new"
  const editing = target === "new" || target === null ? null : target

  // Form state
  const [title, setTitle] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("SEDAN")
  const [manufacturedYear, setManufacturedYear] = useState<string>("")
  const [fuelType, setFuelType] = useState<VehicleFuelType>("PETROL")
  const [fuelConsumption, setFuelConsumption] = useState("")
  const [condition, setCondition] = useState<VehicleCondition>("GOOD")
  const [facilities, setFacilities] = useState<string[]>([])
  const [extraFacilities, setExtraFacilities] = useState<string[]>([])
  const [extraFacilityInput, setExtraFacilityInput] = useState("")
  const [inclusions, setInclusions] = useState<string[]>([])
  const [inclusionInput, setInclusionInput] = useState("")
  const [exclusions, setExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")
  const [description, setDescription] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [sameDropoffAsPickup, setSameDropoffAsPickup] = useState(true)
  const [allowsAnyLocation, setAllowsAnyLocation] = useState(false)
  const [fuelPolicy, setFuelPolicy] = useState<string>("")
  const [plateNumber, setPlateNumber] = useState("")
  const [plateNumberVisible, setPlateNumberVisible] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [images, setImages] = useState<ImageDraft[]>([])
  const [charges, setCharges] = useState<ChargeDraft[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload state for images
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryProgress, setGalleryProgress] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryTotal, setGalleryTotal] = useState(0)

  useEffect(() => {
    if (!open) return
    // Source for prefill: existing vehicle (edit) OR a duplicate source (when
    // we're creating). The "is this an edit vs a fresh create" distinction is
    // tracked by `editing` below; prefillFrom is only honoured when not editing.
    const source = editing ?? (isCreate ? prefillFrom ?? null : null)
    if (source) {
      setTitle(editing ? source.title : `${source.title} (copy)`)
      setVehicleType(source.vehicleType)
      setManufacturedYear(
        source.manufacturedYear != null ? String(source.manufacturedYear) : "",
      )
      setFuelType(source.fuelType)
      setFuelConsumption(source.fuelConsumption ?? "")
      setCondition(source.condition)
      setFacilities(source.facilities ?? [])
      setExtraFacilities(source.extraFacilities ?? [])
      setInclusions(source.inclusions ?? [])
      setExclusions(source.exclusions ?? [])
      setDescription(source.description ?? "")
      setPickupLocation(source.pickupLocation ?? "")
      setDropoffLocation(source.dropoffLocation ?? "")
      setSameDropoffAsPickup(source.sameDropoffAsPickup)
      setAllowsAnyLocation(source.allowsAnyLocation)
      setFuelPolicy(source.fuelPolicy ?? "")
      // Plate number is a per-physical-vehicle attribute, so don't carry it
      // across duplicates — copying 5 bikes shouldn't clone the same plate.
      setPlateNumber(editing ? source.plateNumber ?? "" : "")
      setPlateNumberVisible(source.plateNumberVisible)
      setIsActive(source.isActive)
      setImages(
        source.images.map((img) => ({
          // Fresh client ids when duplicating so React doesn't reuse the same
          // key across two cards; editing keeps the server ids.
          id: editing ? img.id : uid("img"),
          imageUrl: img.imageUrl,
          caption: img.caption ?? "",
        })),
      )
      setCharges(
        source.charges.map((c) =>
          editing
            ? chargeFromVehicle(c)
            : { ...chargeFromVehicle(c), id: uid("chg") },
        ),
      )
    } else {
      setTitle("")
      setVehicleType("SEDAN")
      setManufacturedYear("")
      setFuelType("PETROL")
      setFuelConsumption("")
      setCondition("GOOD")
      setFacilities([])
      setExtraFacilities([])
      setInclusions([])
      setExclusions([])
      setDescription("")
      setPickupLocation("")
      setDropoffLocation("")
      setSameDropoffAsPickup(true)
      setAllowsAnyLocation(false)
      setFuelPolicy("")
      setPlateNumber("")
      setPlateNumberVisible(false)
      setIsActive(true)
      setImages([])
      setCharges([
        {
          id: uid("chg"),
          chargeType: "PER_DAY",
          amount: "",
          currency: defaultCurrency,
          includesFuel: false,
          nightSurcharge: "",
          minimumUnits: "",
          label: "",
          notes: "",
        },
      ])
    }
    setExtraFacilityInput("")
    setInclusionInput("")
    setExclusionInput("")
    setError(null)
  }, [open, editing, prefillFrom, isCreate, defaultCurrency])

  /**
   * Substitute template placeholders in the description with live values from
   * the rest of the form. Only replaces tokens that are still LITERALLY
   * present (e.g. `[add price]`) — once a token has been substituted with a
   * real value, the user's text is preserved on subsequent changes. This is
   * what makes the rental template feel auto-completing without overwriting
   * manual edits.
   */
  const placeholderValues = useMemo(() => {
    const fmtAmount = (a: string, c: string) => {
      const num = Number(a)
      if (!Number.isFinite(num)) return null
      return `${num.toLocaleString()} ${c || defaultCurrency}`
    }
    // Prefer the first per-day rate since most rental templates assume a daily
    // price. Falls back to nothing if the provider hasn't set one yet.
    const perDay = charges.find(
      (c) => c.chargeType === "PER_DAY" && c.amount.trim(),
    )
    const dailyPrice = perDay ? fmtAmount(perDay.amount, perDay.currency) : null
    const minDays =
      perDay && perDay.minimumUnits.trim()
        ? `${perDay.minimumUnits} day${
            Number(perDay.minimumUnits) === 1 ? "" : "s"
          }`
        : null
    const policy = fuelPolicy.trim() || null
    return {
      "[add price]": dailyPrice,
      "[add minimum days]": minDays,
      "[add fuel policy]": policy,
    } as Record<string, string | null>
  }, [charges, fuelPolicy, defaultCurrency])

  useEffect(() => {
    if (!description) return
    let html = description
    let changed = false
    for (const [token, value] of Object.entries(placeholderValues)) {
      if (value && html.includes(token)) {
        html = html.split(token).join(value)
        changed = true
      }
    }
    if (changed) setDescription(html)
  }, [placeholderValues, description])

  function toggleFacility(name: string, on: boolean) {
    setFacilities((prev) =>
      on ? (prev.includes(name) ? prev : [...prev, name]) : prev.filter((f) => f !== name),
    )
  }

  function addExtraFacility(raw: string) {
    const cleaned = raw.trim()
    if (!cleaned) return
    setExtraFacilities((prev) =>
      prev.some((x) => x.toLowerCase() === cleaned.toLowerCase())
        ? prev
        : [...prev, cleaned],
    )
    setExtraFacilityInput("")
  }
  function removeExtraFacility(name: string) {
    setExtraFacilities((prev) => prev.filter((x) => x !== name))
  }

  function addInclusion(raw: string) {
    const cleaned = raw.trim()
    if (!cleaned) return
    setInclusions((prev) =>
      prev.some((x) => x.toLowerCase() === cleaned.toLowerCase())
        ? prev
        : [...prev, cleaned],
    )
    setInclusionInput("")
  }
  function removeInclusion(name: string) {
    setInclusions((prev) => prev.filter((x) => x !== name))
  }
  function addExclusion(raw: string) {
    const cleaned = raw.trim()
    if (!cleaned) return
    setExclusions((prev) =>
      prev.some((x) => x.toLowerCase() === cleaned.toLowerCase())
        ? prev
        : [...prev, cleaned],
    )
    setExclusionInput("")
  }
  function removeExclusion(name: string) {
    setExclusions((prev) => prev.filter((x) => x !== name))
  }

  // Image upload
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
        const path = `transport/${profileId}/vehicles/${Date.now()}-${i}.${ext}`
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
    setImages((prev) => prev.filter((x) => x.id !== id))
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
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, caption } : x)))
  }

  // Charge operations
  function addCharge() {
    setCharges((prev) => [
      ...prev,
      {
        id: uid("chg"),
        chargeType: "PER_DAY",
        amount: "",
        currency: defaultCurrency,
        includesFuel: false,
        nightSurcharge: "",
        minimumUnits: "",
        label: "",
        notes: "",
      },
    ])
  }
  function removeCharge(id: string) {
    setCharges((prev) => prev.filter((c) => c.id !== id))
  }
  function patchCharge(id: string, p: Partial<ChargeDraft>) {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)))
  }

  const yearNow = new Date().getFullYear()
  const yearError = useMemo(() => {
    if (!manufacturedYear) return null
    const n = Number(manufacturedYear)
    if (!Number.isFinite(n) || n < 1950 || n > yearNow + 1) {
      return `Year must be between 1950 and ${yearNow + 1}.`
    }
    return null
  }, [manufacturedYear, yearNow])

  async function save() {
    if (!title.trim()) {
      setError("Vehicle title is required.")
      return
    }
    if (yearError) {
      setError(yearError)
      return
    }

    // Build charge payload — strip rows without an amount, validate the rest.
    const cleanCharges: SaveVehicleChargePayload[] = []
    for (const c of charges) {
      if (!c.amount.trim()) continue
      const amount = Number(c.amount)
      if (!Number.isFinite(amount) || amount < 0) {
        setError("Charge amount must be a non-negative number.")
        return
      }
      const night = c.nightSurcharge.trim()
        ? Number(c.nightSurcharge)
        : null
      if (night !== null && (!Number.isFinite(night) || night < 0)) {
        setError("Night surcharge must be a non-negative number.")
        return
      }
      const minUnits = c.minimumUnits.trim()
        ? Number(c.minimumUnits)
        : null
      if (
        minUnits !== null &&
        (!Number.isInteger(minUnits) || minUnits < 1)
      ) {
        setError("Minimum units must be a positive whole number.")
        return
      }
      cleanCharges.push({
        chargeType: c.chargeType,
        amount: Math.round(amount * 100) / 100,
        currency: c.currency || defaultCurrency,
        includesFuel: c.includesFuel,
        nightSurcharge: night,
        minimumUnits: minUnits,
        label: c.label.trim() || null,
        notes: c.notes.trim() || null,
      })
    }

    const payload: SaveVehiclePayload = {
      title: title.trim(),
      vehicleType,
      manufacturedYear: manufacturedYear ? Number(manufacturedYear) : null,
      fuelType,
      fuelConsumption: fuelConsumption.trim() || null,
      condition,
      facilities,
      extraFacilities,
      inclusions,
      exclusions,
      description: description.trim() || null,
      pickupLocation: pickupLocation.trim() || null,
      dropoffLocation: sameDropoffAsPickup
        ? null
        : dropoffLocation.trim() || null,
      sameDropoffAsPickup,
      allowsAnyLocation,
      fuelPolicy: fuelPolicy.trim() || null,
      plateNumber: plateNumber.trim() || null,
      plateNumberVisible,
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
        ? await transportVehiclesService.create(payload)
        : await transportVehiclesService.update(editing!.id, payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to save vehicle.",
        )
      } else {
        setError("Failed to save vehicle.")
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
            {isCreate
              ? prefillFrom
                ? "Duplicate vehicle"
                : "Add vehicle"
              : "Edit vehicle"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {isCreate && prefillFrom
              ? "Pre-filled from your existing vehicle. Tweak the differences (registration, mileage, condition) and save."
              : "Describe one vehicle in your fleet. Travelers see this on your public listing."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5">
          {error && (
            <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
            <div>
              <div className="text-sm font-semibold">Show on profile</div>
              <div className="text-xs text-zinc-500">
                Hide this vehicle from travelers while you&apos;re still
                preparing it.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* 1. Basics */}
          <Section title="Basics">
            <Field label="Vehicle name / model">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Toyota Premio 2018"
                className="h-10 rounded-2xl"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Number plate">
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="e.g. CAR-1234"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <div className="flex items-center gap-2 self-end pb-1 sm:pt-6">
                <Switch
                  id="vehicle-plate-visible"
                  checked={plateNumberVisible}
                  onCheckedChange={setPlateNumberVisible}
                />
                <label
                  htmlFor="vehicle-plate-visible"
                  className="cursor-pointer text-xs text-zinc-700"
                >
                  Show to travelers
                </label>
              </div>
            </div>
            <p className="-mt-1 text-xs text-zinc-500">
              We always store the plate for your own records. Toggle the switch
              if you want travelers to see it on the public listing.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
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
                    ).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Manufactured year">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={yearNow + 1}
                  value={manufacturedYear}
                  onChange={(e) => setManufacturedYear(e.target.value)}
                  placeholder={String(yearNow - 3)}
                  className="h-10 rounded-2xl"
                />
                {yearError && (
                  <p className="text-xs text-red-600">{yearError}</p>
                )}
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Fuel type">
                <Select
                  value={fuelType}
                  onValueChange={(v) => setFuelType(v as VehicleFuelType)}
                >
                  <SelectTrigger className="h-10 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(FUEL_TYPE_LABELS) as Array<
                        [VehicleFuelType, string]
                      >
                    ).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fuel consumption">
                <Input
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(e.target.value)}
                  placeholder="e.g. 12 km/l"
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
                    ).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* 2. Facilities — predefined toggles + free-form chips */}
          <Section title="Facilities">
            <p className="text-xs text-zinc-500">
              Tick what the vehicle comes with. Add anything else as a custom
              chip below.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
              {PREDEFINED_FACILITIES.map((name) => {
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

            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-zinc-600">
                Other facilities
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {extraFacilities.length === 0 ? (
                  <span className="text-xs text-zinc-400">
                    Nothing extra yet.
                  </span>
                ) : (
                  extraFacilities.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeExtraFacility(name)}
                        className="text-zinc-500 hover:text-red-600"
                        aria-label={`Remove ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={extraFacilityInput}
                  onChange={(e) => setExtraFacilityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addExtraFacility(extraFacilityInput)
                    }
                  }}
                  placeholder="Add anything else (Cooler box, Snorkel gear…)"
                  className="h-9 rounded-full text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addExtraFacility(extraFacilityInput)}
                  className="h-9 rounded-full text-xs"
                >
                  Add
                </Button>
              </div>
            </div>
          </Section>

          {/* 2b. Inclusions / exclusions */}
          <Section title="What's included / not included">
            <p className="text-xs text-zinc-500">
              Spell out what travelers get with this vehicle, and what they
              should pay for themselves.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChipList
                heading="Included"
                tone="positive"
                value={inclusions}
                input={inclusionInput}
                onInputChange={setInclusionInput}
                onAdd={() => addInclusion(inclusionInput)}
                onRemove={removeInclusion}
                placeholder="e.g. Bottled water, free WiFi"
              />
              <ChipList
                heading="Not included"
                tone="negative"
                value={exclusions}
                input={exclusionInput}
                onInputChange={setExclusionInput}
                onAdd={() => addExclusion(exclusionInput)}
                onRemove={removeExclusion}
                placeholder="e.g. Tolls, parking fees, driver tips"
              />
            </div>
          </Section>

          {/* 3. Charges */}
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
              Add one row per pricing option. For per-km pricing, you can also
              set a per-night surcharge for trips that span overnight.
            </p>
            {charges.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                No charges yet. Add at least one pricing option.
              </p>
            ) : (
              <div className="grid gap-3">
                {charges.map((c) => (
                  <ChargeRow
                    key={c.id}
                    row={c}
                    onChange={(p) => patchCharge(c.id, p)}
                    onRemove={() => removeCharge(c.id)}
                  />
                ))}
              </div>
            )}

            <FuelPolicyField value={fuelPolicy} onChange={setFuelPolicy} />
          </Section>

          {/* 4. Pickup & dropoff */}
          <Section title="Pickup & dropoff">
            <Field label="Pickup location">
              <Input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Negombo town, near St. Sebastian's"
                className="h-10 rounded-2xl"
              />
            </Field>

            <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
              <div>
                <div className="text-sm font-medium text-zinc-950">
                  Drop off at same location
                </div>
                <div className="text-xs text-zinc-500">
                  Tick if the customer should return the vehicle to the pickup
                  location.
                </div>
              </div>
              <Switch
                checked={sameDropoffAsPickup}
                onCheckedChange={setSameDropoffAsPickup}
              />
            </div>

            {!sameDropoffAsPickup && (
              <Field label="Dropoff location">
                <Input
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Where should the vehicle be returned?"
                  className="h-10 rounded-2xl"
                />
              </Field>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
              <div>
                <div className="text-sm font-medium text-zinc-950">
                  Open to any location
                </div>
                <div className="text-xs text-zinc-500">
                  We can arrange pickup or dropoff at any agreed location
                  (extra fee may apply).
                </div>
              </div>
              <Switch
                checked={allowsAnyLocation}
                onCheckedChange={setAllowsAnyLocation}
              />
            </div>
          </Section>

          {/* 5. Images */}
          <Section
            title="Photos"
            action={
              <>
                <input
                  id="vehicle-image-input"
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
                    document.getElementById("vehicle-image-input")?.click()
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
                Upload at least one photo so travelers can see the vehicle.
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
                          aria-label="Remove photo"
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

          {/* 6. Description */}
          <Section title="Description">
            <p className="text-xs text-zinc-500">
              Describe the rental terms, what&apos;s included, payment, and
              anything travelers should know. Use the &quot;Insert
              template&quot; button to start from a structured outline.
            </p>
            <VehicleDescriptionEditor
              value={description}
              onChange={setDescription}
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
            {saving ? "Saving…" : isCreate ? "Create vehicle" : "Save changes"}
          </Button>
        </div>

        <UploadOverlay
          open={galleryUploading}
          title={
            galleryTotal > 1 ? "Uploading vehicle photos" : "Uploading photo"
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

function ChargeRow({
  row,
  onChange,
  onRemove,
}: {
  row: ChargeDraft
  onChange: (p: Partial<ChargeDraft>) => void
  onRemove: () => void
}) {
  const isPerKm = row.chargeType === "PER_KM"
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
                onChange({ chargeType: v as VehicleChargeType })
              }
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CHARGE_TYPE_LABELS) as Array<
                    [VehicleChargeType, string]
                  >
                ).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
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
            {isPerKm ? "Night surcharge (per night)" : "Min. units"}
          </Label>
          {isPerKm ? (
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={row.nightSurcharge}
              onChange={(e) => onChange({ nightSurcharge: e.target.value })}
              placeholder="e.g. 1000"
              className="h-9 rounded-xl"
            />
          ) : (
            <Input
              type="number"
              min={1}
              step="1"
              inputMode="numeric"
              value={row.minimumUnits}
              onChange={(e) => onChange({ minimumUnits: e.target.value })}
              placeholder="e.g. 3"
              className="h-9 rounded-xl"
            />
          )}
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

      {isPerKm && (
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Min. kilometres (optional)
          </Label>
          <Input
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            value={row.minimumUnits}
            onChange={(e) => onChange({ minimumUnits: e.target.value })}
            placeholder="e.g. 50"
            className="h-9 rounded-xl"
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200/70">
        <div className="text-xs">
          <div className="font-medium text-zinc-950">Includes fuel</div>
          <div className="text-zinc-500">
            Tick when the price covers petrol / diesel.
          </div>
        </div>
        <Switch
          checked={row.includesFuel}
          onCheckedChange={(v) => onChange({ includesFuel: v })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Notes (optional)
        </Label>
        <Input
          value={row.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Anything customers should know about this rate"
          className="h-9 rounded-xl"
        />
      </div>
    </div>
  )
}

/**
 * Generic chip list with an input. Used for inclusions ("Included") and
 * exclusions ("Not included"), themed by tone. Adding on Enter/comma.
 */
function ChipList({
  heading,
  tone,
  value,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  heading: string
  tone: "positive" | "negative"
  value: string[]
  input: string
  onInputChange: (next: string) => void
  onAdd: () => void
  onRemove: (item: string) => void
  placeholder?: string
}) {
  const chipClass =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
      : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
  const removeClass =
    tone === "positive"
      ? "text-emerald-500 hover:text-red-600"
      : "text-rose-500 hover:text-red-700"
  return (
    <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="text-xs font-semibold text-zinc-900">{heading}</div>
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-zinc-400">Nothing yet.</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${chipClass}`}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className={removeClass}
                aria-label={`Remove ${item}`}
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
    </div>
  )
}

/**
 * Curated dropdown for fuel policy. When the user picks "Other", a free-text
 * input shows up so they can describe a policy not in the curated list. Any
 * value that doesn't match a curated option is treated as "custom" on
 * hydration. The value flows directly into the description template's
 * `[add fuel policy]` placeholder.
 */
function FuelPolicyField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const CUSTOM = "__custom__"
  const matchesCurated = FUEL_POLICY_OPTIONS.some((o) => o.value === value)
  const selected = !value ? "" : matchesCurated ? value : CUSTOM
  return (
    <div className="grid gap-1.5 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <Label className="text-xs font-semibold text-zinc-600">
        Fuel policy
      </Label>
      <p className="text-xs text-zinc-500">
        Pick the policy that applies. This appears in the description template
        wherever you wrote &quot;[add fuel policy]&quot;.
      </p>
      <Select
        value={selected}
        onValueChange={(v) => {
          if (v === CUSTOM) {
            // Switch to custom mode without losing what they had — keep current
            // value if it was already custom, else clear so they can type.
            if (matchesCurated) onChange("")
          } else {
            onChange(v)
          }
        }}
      >
        <SelectTrigger className="h-10 w-full rounded-xl">
          <SelectValue placeholder="Select a fuel policy" />
        </SelectTrigger>
        <SelectContent>
          {FUEL_POLICY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Other (write your own)</SelectItem>
        </SelectContent>
      </Select>
      {selected === CUSTOM && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Customer brings the vehicle back at the same fuel level"
          className="h-10 rounded-xl"
        />
      )}
    </div>
  )
}
