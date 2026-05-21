"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  generateSafariSubtitleOptions,
  generateSafariTitleOptions,
} from "@/lib/safari-itinerary-templates"
import type { SafariJeep } from "@/services/safari-jeeps.service"

/**
 * Two-step picker shown right after the operator chooses a safari jeep but
 * before the itinerary draft is created. Generates title + subtitle templates
 * from the jeep's parks, experiences, driver and inclusions so the operator
 * lands on a meaningful name on the first save — they can still type their
 * own.
 *
 * Returns the chosen values via `onConfirm` (parent posts to the backend).
 */
export function SafariItineraryTemplatePicker({
  jeep,
  open,
  onOpenChange,
  onConfirm,
  creating = false,
}: {
  jeep: SafariJeep | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (vals: { title: string; subtitle: string | null }) => void
  creating?: boolean
}) {
  const titleOptions = useMemo(
    () => (jeep ? generateSafariTitleOptions(jeep) : []),
    [jeep],
  )
  const subtitleOptions = useMemo(
    () => (jeep ? generateSafariSubtitleOptions(jeep) : []),
    [jeep],
  )

  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [titleCustom, setTitleCustom] = useState(false)
  const [subtitleCustom, setSubtitleCustom] = useState(false)

  // Reset when the dialog re-opens for a different jeep.
  useEffect(() => {
    if (!open || !jeep) return
    setTitle(titleOptions[0] ?? jeep.title)
    setSubtitle(subtitleOptions[0] ?? (jeep.driverName ? `with ${jeep.driverName}` : ""))
    setTitleCustom(false)
    setSubtitleCustom(false)
  }, [open, jeep, titleOptions, subtitleOptions])

  function confirm() {
    if (!title.trim()) return
    onConfirm({
      title: title.trim(),
      subtitle: subtitle.trim() ? subtitle.trim() : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="size-4 text-zinc-500" />
            Name this itinerary
          </DialogTitle>
          <DialogDescription className="text-xs">
            We&apos;ve drafted a few names from this jeep&apos;s parks and
            experiences. Pick one — or write your own. You can change it later.
          </DialogDescription>
        </DialogHeader>

        {jeep && (
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              {jeep.images[0]?.imageUrl ? (
                <Image
                  src={jeep.images[0].imageUrl}
                  alt={jeep.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="grid size-full place-items-center text-zinc-400">
                  <Sparkles className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950">
                {jeep.title}
              </div>
              <div className="truncate text-[11px] text-zinc-500">
                {[
                  jeep.driverName,
                  jeep.nationalParks[0],
                  jeep.experiences[0],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {/* Title */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700">
                Title
              </Label>
              <button
                type="button"
                onClick={() => setTitleCustom((v) => !v)}
                className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
              >
                {titleCustom ? "Use a template" : "Write my own"}
              </button>
            </div>

            {titleCustom || titleOptions.length === 0 ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this itinerary"
                className="h-10 rounded-2xl"
                autoFocus
              />
            ) : (
              <>
                <div className="grid gap-1.5">
                  {titleOptions.map((opt) => {
                    const active = opt === title
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTitle(opt)}
                        className={`group flex items-start gap-2 rounded-2xl px-3 py-2 text-left text-xs ring-1 transition ${
                          active
                            ? "bg-zinc-950 text-white ring-zinc-950"
                            : "bg-white text-zinc-900 ring-zinc-200/70 hover:bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                            active
                              ? "border-white bg-white text-zinc-950"
                              : "border-zinc-300 text-transparent group-hover:border-zinc-400"
                          }`}
                        >
                          <span className="size-2 rounded-full bg-current" />
                        </span>
                        <span className="font-medium">{opt}</span>
                      </button>
                    )
                  })}
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Or refine the selected title"
                  className="h-9 rounded-xl text-xs"
                />
              </>
            )}
          </div>

          {/* Subtitle */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700">
                Subtitle <span className="font-normal text-zinc-400">(optional)</span>
              </Label>
              <button
                type="button"
                onClick={() => setSubtitleCustom((v) => !v)}
                className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
              >
                {subtitleCustom ? "Use a template" : "Write my own"}
              </button>
            </div>

            {subtitleCustom || subtitleOptions.length === 0 ? (
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short tagline (leave blank to skip)"
                className="h-10 rounded-2xl"
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubtitle("")}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition ${
                      subtitle === ""
                        ? "bg-zinc-950 text-white ring-zinc-950"
                        : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50"
                    }`}
                  >
                    No subtitle
                  </button>
                  {subtitleOptions.map((opt) => {
                    const active = opt === subtitle
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSubtitle(opt)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition ${
                          active
                            ? "bg-zinc-950 text-white ring-zinc-950"
                            : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50"
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Or refine the selected subtitle"
                  className="h-9 rounded-xl text-xs"
                />
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={creating}
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={confirm}
            disabled={creating || !title.trim()}
            className="h-9 rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            {creating ? "Creating…" : "Create itinerary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
