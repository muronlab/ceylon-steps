"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import languagesData from "@/data/languages.json"

export type LanguageOption = {
  /** Human-readable language name, e.g. "English". */
  language: string
  /** ISO 3166-1 alpha-2 country code (uppercase), e.g. "GB". */
  countryCode: string
}

const LANGUAGE_OPTIONS = (languagesData as LanguageOption[])
  .slice()
  .sort((a, b) => a.language.localeCompare(b.language))

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

export function LanguagePicker({
  value,
  onSelect,
  placeholder = "Select a language",
  disabledLanguages,
}: {
  value: { language: string; countryCode: string | null } | null
  onSelect: (option: LanguageOption) => void
  placeholder?: string
  /** Language names already chosen — disabled in the dropdown to prevent dupes. */
  disabledLanguages?: string[]
}) {
  const [open, setOpen] = useState(false)

  const disabledSet = useMemo(
    () => new Set((disabledLanguages ?? []).map((l) => l.toLowerCase())),
    [disabledLanguages],
  )

  const displayLabel = value?.language ?? placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between rounded-2xl px-3 text-sm font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            {value?.countryCode ? (
              <span className="relative size-4 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                <Image
                  src={flagUrl(value.countryCode)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="16px"
                  unoptimized
                />
              </span>
            ) : null}
            <span className={cn("truncate", !value && "text-zinc-500")}>{displayLabel}</span>
          </span>
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search language…" />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isDisabled = disabledSet.has(opt.language.toLowerCase())
                const isSelected =
                  value?.language?.toLowerCase() === opt.language.toLowerCase()
                return (
                  <CommandItem
                    key={`${opt.language}-${opt.countryCode}`}
                    value={`${opt.language} ${opt.countryCode}`}
                    disabled={isDisabled}
                    onSelect={() => {
                      if (isDisabled) return
                      onSelect(opt)
                      setOpen(false)
                    }}
                  >
                    <span className="relative mr-2 size-4 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                      <Image
                        src={flagUrl(opt.countryCode)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="16px"
                        unoptimized
                      />
                    </span>
                    <span className="truncate text-sm">{opt.language}</span>
                    {isSelected && <Check className="ml-auto size-4 text-zinc-700" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
