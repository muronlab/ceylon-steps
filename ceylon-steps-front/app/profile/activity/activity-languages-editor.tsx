"use client"

import { useState } from "react"
import axios from "axios"
import Image from "next/image"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  activityProviderService,
  type ActivityProviderProfile,
  type LanguageLevel,
} from "@/services/activity-provider.service"
import {
  LanguagePicker,
  type LanguageOption,
} from "@/app/profile/guide/sections/language-picker"

const LEVELS: LanguageLevel[] = ["NATIVE", "FLUENT", "CONVERSATIONAL"]

type Draft = {
  language: string
  level: LanguageLevel
  countryCode: string | null
}

function levelWidth(level: LanguageLevel) {
  return level === "NATIVE" ? "w-full" : level === "FLUENT" ? "w-5/6" : "w-2/3"
}

function titleCase(s: string) {
  return s[0] + s.slice(1).toLowerCase()
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

export function ActivityLanguagesEditor({
  profile,
  onSaved,
}: {
  profile: ActivityProviderProfile
  onSaved: (next: ActivityProviderProfile) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const languages = profile.languages ?? []
  const [draft, setDraft] = useState<Draft[]>(
    languages.map((l) => ({
      language: l.language,
      level: l.level,
      countryCode: l.countryCode,
    })),
  )

  function startEdit() {
    setDraft(
      languages.map((l) => ({
        language: l.language,
        level: l.level,
        countryCode: l.countryCode,
      })),
    )
    setError(null)
    setEditing(true)
  }

  function add() {
    setDraft((d) => [...d, { language: "", level: "FLUENT", countryCode: null }])
  }

  function remove(i: number) {
    setDraft((d) => d.filter((_, idx) => idx !== i))
  }

  function selectLanguage(i: number, opt: LanguageOption) {
    setDraft((d) =>
      d.map((entry, idx) =>
        idx === i
          ? { ...entry, language: opt.language, countryCode: opt.countryCode }
          : entry,
      ),
    )
  }

  function setLevel(i: number, level: LanguageLevel) {
    setDraft((d) => d.map((entry, idx) => (idx === i ? { ...entry, level } : entry)))
  }

  async function save() {
    const cleaned = draft
      .filter((d) => d.language.trim().length > 0)
      .map((d) => ({
        language: d.language.trim(),
        level: d.level,
        countryCode: d.countryCode,
      }))

    setSaving(true)
    setError(null)
    try {
      const next = await activityProviderService.setLanguages({ languages: cleaned })
      onSaved(next)
      setEditing(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to save languages.")
      } else {
        setError("Failed to save languages.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">Languages spoken</div>
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
        languages.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500 ring-1 ring-zinc-200/70">
            No languages added yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {languages.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-50 ring-1 ring-zinc-200/70">
                    {l.countryCode ? (
                      <Image
                        src={flagUrl(l.countryCode)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      {l.language}
                    </div>
                    <div className="text-xs font-semibold text-zinc-500">
                      {titleCase(l.level)}
                    </div>
                  </div>
                </div>
                <div className="h-2 w-28 rounded-full bg-zinc-100 ring-1 ring-zinc-200/70">
                  <div className={`h-full rounded-full bg-zinc-950 ${levelWidth(l.level)}`} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="mt-3 grid gap-2">
          {draft.length === 0 && (
            <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500 ring-1 ring-zinc-200/70">
              Click &quot;Add language&quot; to start.
            </div>
          )}
          {draft.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_auto] items-center gap-2">
              <LanguagePicker
                value={
                  d.language
                    ? { language: d.language, countryCode: d.countryCode }
                    : null
                }
                onSelect={(opt) => selectLanguage(i, opt)}
              />
              <Select value={d.level} onValueChange={(v) => setLevel(i, v as LanguageLevel)}>
                <SelectTrigger className="h-9 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {titleCase(lvl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
                onClick={() => remove(i)}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full text-xs"
              onClick={add}
            >
              <Plus className="size-3.5" />
              Add language
            </Button>
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
