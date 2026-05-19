"use client"

import { useState } from "react"
import { MapPin, Pencil, Plus, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GuideProfile } from "@/services/guide-profile.service"

const SUGGESTED_REGIONS = [
  "Kandy",
  "Colombo",
  "Galle",
  "Sigiriya",
  "Ella",
  "Nuwara Eliya",
  "Anuradhapura",
  "Polonnaruwa",
  "Jaffna",
  "Trincomalee",
  "Mirissa",
  "Yala",
  "Udawalawe",
  "Negombo",
  "Bentota",
  "Arugam Bay",
]

type SavePayload = {
  tagline?: string | null
  regionsSpecialized?: string[]
}

export function IdentityEditor({
  profile,
  onSave,
}: {
  profile: GuideProfile
  onSave: (payload: SavePayload) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const safeRegions = Array.isArray(profile.regionsSpecialized)
    ? profile.regionsSpecialized
    : []
  const [tagline, setTagline] = useState(profile.tagline ?? "")
  const [regions, setRegions] = useState<string[]>(safeRegions)
  const [regionDraft, setRegionDraft] = useState("")

  function startEdit() {
    setTagline(profile.tagline ?? "")
    setRegions(
      Array.isArray(profile.regionsSpecialized) ? profile.regionsSpecialized : [],
    )
    setRegionDraft("")
    setEditing(true)
  }

  function addRegion(value: string) {
    const v = value.trim()
    if (!v) return
    setRegions((r) => (r.some((x) => x.toLowerCase() === v.toLowerCase()) ? r : [...r, v]))
    setRegionDraft("")
  }

  function removeRegion(value: string) {
    setRegions((r) => r.filter((x) => x !== value))
  }

  async function save() {
    setSaving(true)
    try {
      await onSave({
        tagline: tagline.trim() || null,
        regionsSpecialized: regions.map((r) => r.trim()).filter((r) => r.length > 0),
      })
      setEditing(false)
    } catch {
      // top-level error rendered by parent
    } finally {
      setSaving(false)
    }
  }

  const suggested = SUGGESTED_REGIONS.filter(
    (s) => !regions.some((r) => r.toLowerCase() === s.toLowerCase()),
  )

  return (
    <div className="mt-5 rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">Identity</div>
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

      {!editing ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
          <ReadItem
            icon={<Sparkles className="size-4 text-zinc-500" />}
            label="Tagline"
            value={profile.tagline ?? "—"}
            hint="Shown next to your name on the public listing."
          />
          <ReadItem
            icon={<MapPin className="size-4 text-zinc-500" />}
            label="Regions you specialise in"
            value={
              safeRegions.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {safeRegions.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
            hint="Travelers can filter the guide listing by these regions."
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-zinc-600">
              Tagline — one word or short phrase
            </Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={60}
              placeholder="e.g. Storyteller, Adventurer, Cultural guide"
              className="h-10 rounded-2xl"
            />
            <p className="text-[0.7rem] text-zinc-500">
              Up to 60 characters. Shown next to your name.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-zinc-600">
              Regions you specialise in
            </Label>

            {regions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {regions.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-3 pr-1 text-xs font-medium text-zinc-700"
                  >
                    {r}
                    <button
                      type="button"
                      aria-label={`Remove ${r}`}
                      onClick={() => removeRegion(r)}
                      className="grid size-5 place-items-center rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={regionDraft}
                onChange={(e) => setRegionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    addRegion(regionDraft)
                  }
                }}
                placeholder="Add a region (press Enter)"
                className="h-10 rounded-2xl"
                maxLength={40}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRegion(regionDraft)}
                disabled={!regionDraft.trim()}
                className="h-10 shrink-0 rounded-2xl px-3 text-xs"
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>

            {suggested.length > 0 && (
              <div className="mt-1">
                <div className="text-[0.7rem] text-zinc-500">Popular regions</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {suggested.slice(0, 12).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addRegion(s)}
                      className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

function ReadItem({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-900">{value}</div>
      {hint && <div className="mt-1 text-[0.7rem] text-zinc-500">{hint}</div>}
    </div>
  )
}
