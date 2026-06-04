"use client"

import { useState } from "react"
import { BadgeCheck, Banknote, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ActivityPackageScope,
  ActivityProviderProfile,
  UpdateActivityProviderProfilePayload,
} from "@/services/activity-provider.service"

const PACKAGE_SCOPE_SUFFIX: Record<ActivityPackageScope, string> = {
  PER_PERSON: "/ person",
  PER_GROUP: "/ group",
}

const CURRENCIES: Array<{ code: string; label: string }> = [
  { code: "LKR", label: "LKR — Sri Lankan Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
]

function formatMoney(value: string | null, currency: string | null) {
  if (!value) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num)
  } catch {
    // unknown currency — show plain number with the code suffix
    return `${num.toLocaleString()} ${currency ?? ""}`.trim()
  }
}

export function ActivityExperienceRatesEditor({
  profile,
  onSave,
}: {
  profile: ActivityProviderProfile
  onSave: (payload: UpdateActivityProviderProfilePayload) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [years, setYears] = useState<string>(
    profile.yearsOfExperience === null || profile.yearsOfExperience === undefined
      ? ""
      : String(profile.yearsOfExperience),
  )
  const [currency, setCurrency] = useState<string>(profile.currency ?? "LKR")
  const [hour, setHour] = useState<string>(profile.pricePerHour ?? "")
  const [day, setDay] = useState<string>(profile.pricePerDay ?? "")
  const [pkg, setPkg] = useState<string>(profile.packagePrice ?? "")
  const [pkgScope, setPkgScope] = useState<ActivityPackageScope>(
    profile.packagePriceScope ?? "PER_PERSON",
  )
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setYears(
      profile.yearsOfExperience === null || profile.yearsOfExperience === undefined
        ? ""
        : String(profile.yearsOfExperience),
    )
    setCurrency(profile.currency ?? "LKR")
    setHour(profile.pricePerHour ?? "")
    setDay(profile.pricePerDay ?? "")
    setPkg(profile.packagePrice ?? "")
    setPkgScope(profile.packagePriceScope ?? "PER_PERSON")
    setError(null)
    setEditing(true)
  }

  function parseMoney(v: string): number | null {
    const trimmed = v.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n < 0) return Number.NaN
    return Math.round(n * 100) / 100
  }

  async function save() {
    const yearsValue = years.trim() === "" ? null : Number(years)
    if (
      yearsValue !== null &&
      (!Number.isInteger(yearsValue) || yearsValue < 0 || yearsValue > 80)
    ) {
      setError("Years of experience must be a whole number between 0 and 80.")
      return
    }

    const hourValue = parseMoney(hour)
    const dayValue = parseMoney(day)
    const pkgValue = parseMoney(pkg)
    if (
      Number.isNaN(hourValue) ||
      Number.isNaN(dayValue) ||
      Number.isNaN(pkgValue)
    ) {
      setError("Prices must be non-negative numbers.")
      return
    }

    const usingPricing =
      hourValue !== null || dayValue !== null || pkgValue !== null
    const finalCurrency = usingPricing ? currency : null

    setSaving(true)
    setError(null)
    try {
      await onSave({
        yearsOfExperience: yearsValue,
        currency: finalCurrency,
        pricePerHour: hourValue,
        pricePerDay: dayValue,
        packagePrice: pkgValue,
        // Scope only matters when a package price is set.
        packagePriceScope: pkgValue !== null ? pkgScope : null,
      })
      setEditing(false)
    } catch {
      // top-level error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const hasYears =
    profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined
  const hourlyDisplay = formatMoney(profile.pricePerHour, profile.currency)
  const dailyDisplay = formatMoney(profile.pricePerDay, profile.currency)
  const packageDisplay = formatMoney(profile.packagePrice, profile.currency)
  const packageScopeLabel = profile.packagePriceScope
    ? PACKAGE_SCOPE_SUFFIX[profile.packagePriceScope]
    : ""
  const hasAnyRate = !!hourlyDisplay || !!dailyDisplay || !!packageDisplay

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">Experience &amp; prices</div>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={startEdit}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {!editing ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<BadgeCheck className="size-4 text-zinc-500" />}
            label="Experience"
            value={
              hasYears
                ? `${profile.yearsOfExperience} year${profile.yearsOfExperience === 1 ? "" : "s"}`
                : "—"
            }
          />
          <Stat
            icon={<Banknote className="size-4 text-zinc-500" />}
            label="Hourly"
            value={hourlyDisplay ?? "—"}
          />
          <Stat
            icon={<Banknote className="size-4 text-zinc-500" />}
            label="Daily"
            value={dailyDisplay ?? "—"}
          />
          {packageDisplay && (
            <Stat
              icon={<Banknote className="size-4 text-zinc-500" />}
              label="Package"
              value={`${packageDisplay} ${packageScopeLabel}`.trim()}
            />
          )}
          {!hasYears && !hasAnyRate && (
            <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70 sm:col-span-3">
              Optional — add your experience and pricing so travellers can decide quickly.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldBlock label="Years of experience">
              <Input
                type="number"
                min={0}
                max={80}
                step={1}
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g. 8"
                className="h-10 rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10 rounded-2xl">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldBlock label={`Hourly rate (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="Leave blank if not offered"
                className="h-10 rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label={`Daily rate (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="Leave blank if not offered"
                className="h-10 rounded-2xl"
              />
            </FieldBlock>
          </div>

          {/* Package price — an alternative to time-based rates. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldBlock label={`Package price (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                placeholder="Leave blank if not offered"
                className="h-10 rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Package is charged">
              <Select
                value={pkgScope}
                onValueChange={(v) => setPkgScope(v as ActivityPackageScope)}
              >
                <SelectTrigger className="h-10 rounded-2xl" disabled={pkg.trim() === ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_PERSON">Per person</SelectItem>
                  <SelectItem value="PER_GROUP">Per group</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>
          </div>

          <p className="text-xs text-zinc-500">
            All prices are optional. Offer time-based rates (hourly / daily), a
            fixed package price, or any combination. Leave a field blank if you
            don&apos;t offer it.
          </p>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={saving}
              onClick={save}
              className="h-10 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-zinc-950">{value}</div>
    </div>
  )
}

function FieldBlock({
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
