"use client"

import type { TopTag } from "@/services/public-itineraries.service"

/**
 * Popular-tags chip row shown above a listing. Each chip is a top tag (with its
 * usage count); ticking one toggles it as a filter. The parent owns the
 * selected set and feeds the chosen tags into its search query.
 */
export function PopularTags({
  tags,
  selected,
  onToggle,
  onClear,
  loading = false,
  title = "Popular tags",
  className = "",
}: {
  tags: TopTag[]
  selected: string[]
  onToggle: (tag: string) => void
  onClear?: () => void
  loading?: boolean
  title?: string
  className?: string
}) {
  // Nothing to show once loaded and there are no tags.
  if (!loading && tags.length === 0) return null

  const selectedSet = new Set(selected)

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </span>
        {selected.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear ({selected.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-full bg-zinc-100"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const active = selectedSet.has(t.tag)
            return (
              <button
                key={t.tag}
                type="button"
                onClick={() => onToggle(t.tag)}
                aria-pressed={active}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  active
                    ? "bg-primary-2 text-white ring-primary-2"
                    : "bg-white text-zinc-700 ring-zinc-200/70 hover:bg-zinc-50 hover:ring-zinc-300",
                ].join(" ")}
              >
                {t.tag}
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500",
                  ].join(" ")}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
