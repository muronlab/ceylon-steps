"use client"

import { useMemo } from "react"
import Image from "next/image"
import { LanguagePicker } from "./language-picker"
import languagesData from "@/data/languages.json"

/**
 * Per-itinerary "languages offered" editor. Stored as a plain `string[]` of
 * language names on the itinerary, so this keeps the data model as names but
 * lets the operator pick from the searchable flag picker (same one the profile
 * languages editor uses) instead of typing free text. The flag for each chip is
 * looked up from the shared language dataset; names not in the dataset (e.g. a
 * legacy free-text entry) simply render without a flag.
 */

const NAME_TO_CODE = new Map<string, string>(
  (languagesData as { language: string; countryCode: string }[]).map((l) => [
    l.language.toLowerCase(),
    l.countryCode,
  ]),
)

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

export function OfferedLanguagesField({
  value,
  onChange,
  placeholder = "Add a language",
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const chips = useMemo(
    () =>
      value.map((lang) => ({
        lang,
        code: NAME_TO_CODE.get(lang.toLowerCase()) ?? null,
      })),
    [value],
  )

  function add(language: string) {
    const trimmed = language.trim()
    if (!trimmed) return
    if (value.some((l) => l.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...value, trimmed])
  }

  function remove(language: string) {
    onChange(value.filter((l) => l !== language))
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.length === 0 ? (
          <span className="text-xs text-zinc-400">
            No languages selected yet.
          </span>
        ) : (
          chips.map(({ lang, code }) => (
            <span
              key={lang}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800"
            >
              {code ? (
                <span className="relative size-3.5 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                  <Image
                    src={flagUrl(code)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="14px"
                    unoptimized
                  />
                </span>
              ) : null}
              {lang}
              <button
                type="button"
                onClick={() => remove(lang)}
                className="text-zinc-500 hover:text-red-600"
                aria-label={`Remove ${lang}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <LanguagePicker
        value={null}
        onSelect={(opt) => add(opt.language)}
        placeholder={placeholder}
        disabledLanguages={value}
      />
    </div>
  )
}
