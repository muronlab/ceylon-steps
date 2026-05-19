"use client"

import { useRef, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import apiClient from "@/services/api-client"
import { UploadOverlay } from "./upload-overlay"

export function PhotoUpload({
  label,
  uploading,
  setUploading,
  pathPrefix,
  onUploaded,
  className,
  compact,
  icon,
}: {
  label: string
  uploading: boolean
  setUploading: (v: boolean) => void
  pathPrefix: string
  onUploaded: (url: string) => void | Promise<void>
  className?: string
  compact?: boolean
  icon?: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    setFileName(file.name)

    // Slowly drift the bar from 90 → 95 while we wait for the server response
    // after the network bytes are done. Never crosses 95 — only the resolved
    // request lets us reach 100.
    let driftTimer: ReturnType<typeof setInterval> | null = null
    function startDrift() {
      if (driftTimer) return
      driftTimer = setInterval(() => {
        setProgress((p) => {
          if (p === null) return p
          if (p >= 95) return p
          // step ~0.5% every tick — smooth, not stuck
          return Math.min(95, +(p + 0.5).toFixed(1))
        })
      }, 250)
    }
    function stopDrift() {
      if (driftTimer) {
        clearInterval(driftTimer)
        driftTimer = null
      }
    }

    try {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${pathPrefix}/${Date.now()}.${ext}`
      const body = new FormData()
      body.append("file", file)
      body.append("path", path)

      const res = await apiClient.post<{ url: string }>("/storage/upload", body, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (!ev.total) return
          const real = (ev.loaded / ev.total) * 100
          // Cap visual progress at 90 during the network phase so we never
          // claim "done" before the server actually responds.
          const display = Math.min(90, Math.round(real * 0.9))
          setProgress((p) => (p === null ? display : Math.max(p, display)))
          if (real >= 100) startDrift()
        },
      })

      stopDrift()
      // Hold at 95 while the onUploaded callback runs (PATCH to backend).
      setProgress((p) => (p === null ? 95 : Math.max(p, 95)))
      await onUploaded(res.data.url)
      setProgress(100)
    } catch (err) {
      stopDrift()
      if (axios.isAxiosError(err)) {
        console.error("Upload failed", err.response?.data ?? err.message)
      }
    } finally {
      stopDrift()
      setUploading(false)
      setProgress(null)
      setFileName(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <div className={cn(className)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          type="button"
          variant={compact ? "outline" : "default"}
          size={compact ? "sm" : "default"}
          className={cn(
            compact
              ? "h-8 w-8 rounded-full bg-white p-0 ring-1 ring-zinc-200/70"
              : "h-9 rounded-full bg-zinc-950/80 px-3 text-xs font-semibold text-white backdrop-blur hover:bg-zinc-950",
          )}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          aria-label={label}
          title={label}
        >
          {icon}
          {!compact && <span className="ml-1">{uploading ? "Uploading…" : label}</span>}
        </Button>
      </div>

      <UploadOverlay
        open={uploading}
        title={label}
        subtitle={fileName ?? undefined}
        progress={progress}
      />
    </>
  )
}
