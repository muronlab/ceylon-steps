"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import {
  Car,
  Copy,
  Edit,
  ImageOff,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  transportVehiclesService,
  VEHICLE_TYPE_LABELS,
  CHARGE_TYPE_LABELS,
  type TransportVehicle,
} from "@/services/transport-vehicles.service"
import { VehicleEditorSheet } from "./vehicle-editor-sheet"

/** Format a decimal amount (Prisma Decimal arrives as string) for display. */
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

type VehiclesMode = "fleet" | "driver"

const MODE_TEXT: Record<
  VehiclesMode,
  { sectionTitle: string; sectionHelp: string; emptyTitle: string; emptyHelp: string }
> = {
  fleet: {
    sectionTitle: "Fleet",
    sectionHelp:
      "Add the vehicles travelers can rent from you. Each row is one vehicle with its own photos, charges, and rental terms.",
    emptyTitle: "No vehicles yet",
    emptyHelp: "Add your first vehicle so travelers can find and book it.",
  },
  driver: {
    sectionTitle: "My vehicles",
    sectionHelp:
      "List the vehicles you personally drive. You can add up to 2 — keep duplicates if you switch between cars.",
    emptyTitle: "No vehicles yet",
    emptyHelp:
      "Add the vehicle you drive so travelers know what to expect on their trip.",
  },
}

export function FleetSection({
  profileId,
  mode = "fleet",
  maxVehicles = null,
}: {
  profileId: string
  mode?: VehiclesMode
  /** Hard cap on number of vehicles. Null = unlimited. */
  maxVehicles?: number | null
}) {
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TransportVehicle | "new" | null>(null)
  const [duplicateSource, setDuplicateSource] =
    useState<TransportVehicle | null>(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const text = MODE_TEXT[mode]
  const atCap =
    maxVehicles !== null && vehicles.length >= maxVehicles && !loading

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await transportVehiclesService.list()
      setVehicles(list)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to load vehicles.")
      } else {
        setError("Failed to load vehicles.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setDuplicateSource(null)
    setEditing("new")
    setOpen(true)
  }

  function openEdit(v: TransportVehicle) {
    setDuplicateSource(null)
    setEditing(v)
    setOpen(true)
  }

  function openDuplicate(v: TransportVehicle) {
    if (atCap) {
      setError(
        `You've reached the limit of ${maxVehicles} vehicles. Remove one before duplicating.`,
      )
      return
    }
    setDuplicateSource(v)
    setEditing("new")
    setOpen(true)
  }

  async function remove(id: string) {
    const confirmed = window.confirm(
      "Delete this vehicle? This will remove its photos, charges, and description.",
    )
    if (!confirmed) return
    setDeletingId(id)
    try {
      await transportVehiclesService.remove(id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to delete vehicle.")
      } else {
        setError("Failed to delete vehicle.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  function onSaved(saved: TransportVehicle) {
    setVehicles((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id)
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
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold tracking-tight text-zinc-950">
              {text.sectionTitle}
            </div>
            {maxVehicles !== null && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-zinc-200/70">
                {vehicles.length}/{maxVehicles}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">{text.sectionHelp}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atCap}
          onClick={openCreate}
          className="h-8 shrink-0 rounded-full text-xs"
          title={
            atCap
              ? `Limit reached (${maxVehicles}). Remove one to add another.`
              : undefined
          }
        >
          <Plus className="size-3.5" />
          Add vehicle
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
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center ring-1 ring-zinc-200/70">
          <Car className="mx-auto size-6 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-700">
            {text.emptyTitle}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{text.emptyHelp}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              deleting={deletingId === v.id}
              onEdit={() => openEdit(v)}
              onDuplicate={() => openDuplicate(v)}
              onRemove={() => remove(v.id)}
            />
          ))}
        </div>
      )}

      <VehicleEditorSheet
        profileId={profileId}
        target={editing}
        prefillFrom={duplicateSource}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setEditing(null)
            setDuplicateSource(null)
          }
        }}
        onSaved={onSaved}
      />
    </section>
  )
}

function VehicleCard({
  vehicle,
  deleting,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  vehicle: TransportVehicle
  deleting: boolean
  onEdit: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const cover = vehicle.images[0]?.imageUrl
  const cheapestCharge = [...vehicle.charges].sort(
    (a, b) => Number(a.amount) - Number(b.amount),
  )[0]
  return (
    <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="relative aspect-4/3 size-24 overflow-hidden rounded-xl bg-zinc-100">
        {cover ? (
          <Image
            src={cover}
            alt={vehicle.title}
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
            {vehicle.title}
          </h4>
          {!vehicle.isActive && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
              Hidden
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {VEHICLE_TYPE_LABELS[vehicle.vehicleType]}
          {vehicle.manufacturedYear ? ` • ${vehicle.manufacturedYear}` : ""}
          {vehicle.fuelType ? ` • ${vehicle.fuelType.toLowerCase()}` : ""}
        </p>
        {cheapestCharge && (
          <p className="mt-1 text-xs font-medium text-zinc-700">
            From {formatAmount(cheapestCharge.amount, cheapestCharge.currency)}{" "}
            <span className="text-zinc-500">
              {CHARGE_TYPE_LABELS[cheapestCharge.chargeType].toLowerCase()}
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
          onClick={onDuplicate}
          className="h-8 rounded-full text-xs"
          title="Duplicate this vehicle"
        >
          <Copy className="size-3.5" />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={deleting}
          className="size-8 rounded-full p-0 text-zinc-500 hover:text-red-600"
          aria-label="Delete vehicle"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
