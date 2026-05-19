"use client"

import { ImageUp } from "lucide-react"

export function UploadOverlay({
  open,
  title,
  subtitle,
  /** 0-100. If omitted or null, an indeterminate animation is shown. */
  progress,
}: {
  open: boolean
  title: string
  subtitle?: string
  progress?: number | null
}) {
  if (!open) return null

  const determinate = typeof progress === "number" && Number.isFinite(progress)
  const clamped = determinate ? Math.max(0, Math.min(100, progress as number)) : null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="alertdialog"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-[88%] max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-zinc-200/70">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70">
            <ImageUp className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-950">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-xs text-zinc-500">{subtitle}</div>
            )}
          </div>
          {determinate && (
            <div className="ml-auto text-xs font-semibold tabular-nums text-zinc-700">
              {clamped}%
            </div>
          )}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          {determinate ? (
            <div
              className="h-full rounded-full bg-zinc-950 transition-[width] duration-200"
              style={{ width: `${clamped}%` }}
            />
          ) : (
            <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-zinc-950" />
          )}
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">
          Don&apos;t close this tab until the upload finishes.
        </p>
      </div>

      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}
