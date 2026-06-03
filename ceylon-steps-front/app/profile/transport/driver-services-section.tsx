"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import {
  Briefcase,
  Edit,
  ImageOff,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  driverServicesService,
  DRIVER_SERVICE_CATEGORY_LABELS,
  DRIVER_SERVICE_PRICE_UNIT_LABELS,
  type DriverService,
  type DriverServiceCategory,
  type DriverServicePriceUnit,
  type SaveDriverServicePayload,
} from "@/services/driver-services.service"

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR", "AED"]

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

export function DriverServicesSection({ profileId }: { profileId: string }) {
  const [services, setServices] = useState<DriverService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<DriverService | "new" | null>(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await driverServicesService.list()
      setServices(list)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to load services.")
      } else {
        setError("Failed to load services.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(id: string) {
    const confirmed = window.confirm("Delete this service?")
    if (!confirmed) return
    setDeletingId(id)
    try {
      await driverServicesService.remove(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to delete service.")
      } else {
        setError("Failed to delete service.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  function onSaved(saved: DriverService) {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id)
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
            Services I offer
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Airport pickups, day tours, round trips — anything you drive
            travelers for. Each service has its own price and inclusions.
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
          Add service
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
      ) : services.length === 0 ? (
        <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center ring-1 ring-zinc-200/70">
          <Briefcase className="mx-auto size-6 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-700">
            No services yet
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Add things like airport pickups or full-day tours so travelers
            know what they can book.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              deleting={deletingId === s.id}
              onEdit={() => {
                setEditing(s)
                setOpen(true)
              }}
              onRemove={() => remove(s.id)}
            />
          ))}
        </div>
      )}

      <DriverServiceEditorSheet
        profileId={profileId}
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

function ServiceCard({
  service,
  deleting,
  onEdit,
  onRemove,
}: {
  service: DriverService
  deleting: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="relative size-20 overflow-hidden rounded-xl bg-zinc-100">
        {service.coverImageUrl ? (
          <Image
            src={service.coverImageUrl}
            alt={service.title}
            fill
            className="object-cover"
            sizes="80px"
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
            {service.title}
          </h4>
          {!service.isActive && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
              Hidden
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {DRIVER_SERVICE_CATEGORY_LABELS[service.category]}
        </p>
        <p className="mt-1 text-xs font-medium text-zinc-700">
          {formatAmount(service.basePrice, service.currency)}{" "}
          <span className="text-zinc-500">
            {DRIVER_SERVICE_PRICE_UNIT_LABELS[service.priceUnit].toLowerCase()}
          </span>
          {service.priceNotes && (
            <span className="text-zinc-500"> · {service.priceNotes}</span>
          )}
        </p>
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
          aria-label="Delete service"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */

function DriverServiceEditorSheet({
  profileId,
  target,
  open,
  onOpenChange,
  onSaved,
}: {
  profileId: string
  target: DriverService | "new" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (saved: DriverService) => void
}) {
  const isCreate = target === "new"
  const editing = target === "new" || target === null ? null : target

  const [title, setTitle] = useState("")
  const [category, setCategory] =
    useState<DriverServiceCategory>("AIRPORT_PICKUP")
  const [description, setDescription] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [basePrice, setBasePrice] = useState("")
  const [currency, setCurrency] = useState("LKR")
  const [priceUnit, setPriceUnit] = useState<DriverServicePriceUnit>("PER_TRIP")
  const [priceNotes, setPriceNotes] = useState("")
  const [inclusions, setInclusions] = useState<string[]>([])
  const [inclusionInput, setInclusionInput] = useState("")
  const [exclusions, setExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")
  const [isActive, setIsActive] = useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setCategory(editing.category)
      setDescription(editing.description ?? "")
      setCoverImageUrl(editing.coverImageUrl)
      setBasePrice(editing.basePrice)
      setCurrency(editing.currency)
      setPriceUnit(editing.priceUnit)
      setPriceNotes(editing.priceNotes ?? "")
      setInclusions(editing.inclusions ?? [])
      setExclusions(editing.exclusions ?? [])
      setIsActive(editing.isActive)
    } else {
      setTitle("")
      setCategory("AIRPORT_PICKUP")
      setDescription("")
      setCoverImageUrl(null)
      setBasePrice("")
      setCurrency("LKR")
      setPriceUnit("PER_TRIP")
      setPriceNotes("")
      setInclusions([])
      setExclusions([])
      setIsActive(true)
    }
    setInclusionInput("")
    setExclusionInput("")
    setError(null)
  }, [open, editing])

  async function uploadCover(file: File) {
    setCoverUploading(true)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `transport/${profileId}/services/${Date.now()}.${ext}`
      const body = new FormData()
      body.append("file", file)
      body.append("path", path)
      const res = await apiClient.post<{ url: string }>(
        "/storage/upload",
        body,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
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
    }
  }

  function addChip(
    raw: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
  ) {
    const cleaned = raw.trim()
    if (!cleaned) return
    setter((prev) =>
      prev.some((x) => x.toLowerCase() === cleaned.toLowerCase())
        ? prev
        : [...prev, cleaned],
    )
    inputSetter("")
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    const price = Number(basePrice)
    if (!basePrice.trim() || !Number.isFinite(price) || price < 0) {
      setError("Base price must be a non-negative number.")
      return
    }
    const payload: SaveDriverServicePayload = {
      title: title.trim(),
      category,
      description: description.trim() || null,
      coverImageUrl,
      basePrice: Math.round(price * 100) / 100,
      currency,
      priceUnit,
      priceNotes: priceNotes.trim() || null,
      inclusions,
      exclusions,
      isActive,
    }
    setSaving(true)
    setError(null)
    try {
      const saved = isCreate
        ? await driverServicesService.create(payload)
        : await driverServicesService.update(editing!.id, payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to save service.",
        )
      } else {
        setError("Failed to save service.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl min-w-[55vw]">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">
            {isCreate ? "Add service" : "Edit service"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            One bookable service you drive travelers for.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {error && (
            <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
            <div>
              <div className="text-sm font-semibold">Show on profile</div>
              <div className="text-xs text-zinc-500">
                Hide this service while you&apos;re still preparing it.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="grid gap-3">
            <Field label="Service title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Airport to Kandy transfer"
                className="h-10 rounded-2xl"
              />
            </Field>
            <Field label="Category">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DriverServiceCategory)}
              >
                <SelectTrigger className="h-10 w-full rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(DRIVER_SERVICE_CATEGORY_LABELS) as Array<
                      [DriverServiceCategory, string]
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

          {/* Cover */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-zinc-600">
              Cover image
            </Label>
            {coverImageUrl ? (
              <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-200/70">
                <div className="relative h-32 w-full">
                  <Image
                    src={coverImageUrl}
                    alt="Service cover"
                    fill
                    className="object-cover"
                    sizes="500px"
                  />
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-xs text-zinc-500">Service cover</span>
                  <div className="flex items-center gap-1">
                    <input
                      id="driver-service-cover-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadCover(f)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={coverUploading}
                      onClick={() =>
                        document
                          .getElementById("driver-service-cover-input")
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
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
                <p className="text-xs text-zinc-500">
                  Optional. Helps travelers visualise the service.
                </p>
                <input
                  id="driver-service-cover-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadCover(f)
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={coverUploading}
                  onClick={() =>
                    document
                      .getElementById("driver-service-cover-input")
                      ?.click()
                  }
                  className="h-9 w-fit rounded-full text-xs"
                >
                  <Upload className="size-3.5" />
                  Upload cover image
                </Button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
            <div className="text-xs font-semibold text-zinc-900">Pricing</div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_180px]">
              <Field label="Base price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  className="h-10 rounded-xl"
                />
              </Field>
              <Field label="Currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10 w-full rounded-xl">
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
              <Field label="Price unit">
                <Select
                  value={priceUnit}
                  onValueChange={(v) =>
                    setPriceUnit(v as DriverServicePriceUnit)
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(DRIVER_SERVICE_PRICE_UNIT_LABELS) as Array<
                        [DriverServicePriceUnit, string]
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
            <Field label="Price notes (optional)">
              <Input
                value={priceNotes}
                onChange={(e) => setPriceNotes(e.target.value)}
                placeholder="e.g. min 4 hrs, up to 4 passengers, tolls extra"
                className="h-10 rounded-xl"
              />
            </Field>
          </div>

          {/* Inclusions / exclusions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
              <div className="text-xs font-semibold text-zinc-900">Included</div>
              <div className="flex flex-wrap gap-1.5">
                {inclusions.length === 0 ? (
                  <span className="text-xs text-zinc-400">Nothing yet.</span>
                ) : (
                  inclusions.map((it) => (
                    <span
                      key={it}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200"
                    >
                      {it}
                      <button
                        type="button"
                        onClick={() =>
                          setInclusions((p) => p.filter((x) => x !== it))
                        }
                        className="text-emerald-500 hover:text-red-600"
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
                  value={inclusionInput}
                  onChange={(e) => setInclusionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addChip(inclusionInput, setInclusions, setInclusionInput)
                    }
                  }}
                  placeholder="e.g. Bottled water, fuel, parking"
                  className="h-9 rounded-full text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addChip(inclusionInput, setInclusions, setInclusionInput)
                  }
                  className="h-9 rounded-full text-xs"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
              <div className="text-xs font-semibold text-zinc-900">
                Not included
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exclusions.length === 0 ? (
                  <span className="text-xs text-zinc-400">Nothing yet.</span>
                ) : (
                  exclusions.map((it) => (
                    <span
                      key={it}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-900 ring-1 ring-rose-200"
                    >
                      {it}
                      <button
                        type="button"
                        onClick={() =>
                          setExclusions((p) => p.filter((x) => x !== it))
                        }
                        className="text-rose-500 hover:text-red-700"
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
                  value={exclusionInput}
                  onChange={(e) => setExclusionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addChip(exclusionInput, setExclusions, setExclusionInput)
                    }
                  }}
                  placeholder="e.g. Tolls, entry fees, tips"
                  className="h-9 rounded-full text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addChip(exclusionInput, setExclusions, setExclusionInput)
                  }
                  className="h-9 rounded-full text-xs"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details about this service — typical route, time of day, group size, etc."
              rows={5}
              className="rounded-2xl"
            />
          </Field>
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
            {saving ? "Saving…" : isCreate ? "Create service" : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
