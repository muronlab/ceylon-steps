"use client"

import { useRef, useState } from "react"
import axios from "axios"
import Image from "next/image"
import { ImageIcon, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import apiClient from "@/services/api-client"
import {
  activityProviderService,
  type ActivityProviderGalleryImage,
  type ActivityProviderProfile,
} from "@/services/activity-provider.service"
import { UploadOverlay } from "@/app/profile/guide/sections/upload-overlay"

type Draft = {
  imageUrl: string
  caption: string
  sortOrder: number
  // Not sent to the server, used only for client-side list uniqueness.
  _localKey: string
}

function toDraft(img: ActivityProviderGalleryImage, index: number): Draft {
  return {
    imageUrl: img.imageUrl,
    caption: img.caption ?? "",
    sortOrder: img.sortOrder ?? index,
    _localKey: img.id,
  }
}

function newDraft(url: string, sortOrder: number): Draft {
  return {
    imageUrl: url,
    caption: "",
    sortOrder,
    _localKey: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
}

export function ActivityGalleryEditor({
  profile,
  onSaved,
}: {
  profile: ActivityProviderProfile
  onSaved: (next: ActivityProviderProfile) => void
}) {
  const galleryImages = profile.galleryImages ?? []
  const [drafts, setDrafts] = useState<Draft[]>(galleryImages.map(toDraft))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadIndex, setUploadIndex] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [fileProgress, setFileProgress] = useState(0)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function reset() {
    setDrafts((profile.galleryImages ?? []).map(toDraft))
    setError(null)
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setUploadTotal(files.length)
    setUploadIndex(0)
    setFileProgress(0)
    setCurrentFileName(null)
    setError(null)

    // While we wait for the server response on each file, drift slowly toward
    // 95% so the bar never gets stuck and never claims completion before the
    // server confirms.
    let driftTimer: ReturnType<typeof setInterval> | null = null
    function startDrift() {
      if (driftTimer) return
      driftTimer = setInterval(() => {
        setFileProgress((p) => (p >= 95 ? p : Math.min(95, +(p + 0.5).toFixed(1))))
      }, 250)
    }
    function stopDrift() {
      if (driftTimer) {
        clearInterval(driftTimer)
        driftTimer = null
      }
    }

    try {
      const uploaded: Draft[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadIndex(i + 1)
        setCurrentFileName(file.name)
        setFileProgress(0)
        stopDrift()

        const ext = file.name.split(".").pop() || "jpg"
        const path = `activity/${profile.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
        const body = new FormData()
        body.append("file", file)
        body.append("path", path)
        const res = await apiClient.post<{ url: string }>("/storage/upload", body, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (!ev.total) return
            const real = (ev.loaded / ev.total) * 100
            // Cap at 90 during the network phase — only the resolved response
            // can move past it.
            const display = Math.min(90, Math.round(real * 0.9))
            setFileProgress((p) => Math.max(p, display))
            if (real >= 100) startDrift()
          },
        })

        stopDrift()
        setFileProgress(100)
        uploaded.push(newDraft(res.data.url, drafts.length + uploaded.length))
      }
      setDrafts((d) => [...d, ...uploaded])
    } catch (err) {
      stopDrift()
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? "Upload failed.")
      } else {
        setError("Upload failed.")
      }
    } finally {
      stopDrift()
      setUploading(false)
      setUploadTotal(0)
      setUploadIndex(0)
      setFileProgress(0)
      setCurrentFileName(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function remove(index: number) {
    setDrafts((d) => d.filter((_, i) => i !== index))
  }

  function move(index: number, dir: -1 | 1) {
    setDrafts((d) => {
      const next = [...d]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return d
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next.map((img, i) => ({ ...img, sortOrder: i }))
    })
  }

  function patchCaption(index: number, caption: string) {
    setDrafts((d) => d.map((img, i) => (i === index ? { ...img, caption } : img)))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const next = await activityProviderService.setGallery({
        images: drafts.map((d, i) => ({
          imageUrl: d.imageUrl,
          caption: d.caption.trim() ? d.caption.trim() : null,
          sortOrder: i,
        })),
      })
      onSaved(next)
      // Re-sync drafts to whatever the server returned (gets real IDs).
      setDrafts((next.galleryImages ?? []).map(toDraft))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? "Failed to save gallery.")
      } else {
        setError("Failed to save gallery.")
      }
    } finally {
      setSaving(false)
    }
  }

  const isDirty =
    drafts.length !== galleryImages.length ||
    drafts.some((d, i) => {
      const original = galleryImages[i]
      if (!original) return true
      return (
        d.imageUrl !== original.imageUrl ||
        (d.caption || null) !== (original.caption || null)
      )
    })

  const overlaySubtitle =
    uploadTotal > 1
      ? `${currentFileName ?? "Image"} — file ${uploadIndex} of ${uploadTotal}`
      : currentFileName ?? undefined

  return (
    <div id="gallery" className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-zinc-500" />
          <div className="text-sm font-semibold text-zinc-950">Gallery</div>
          <span className="text-xs text-zinc-500">
            {drafts.length} image{drafts.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFiles}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-full text-xs"
          >
            <Upload className="size-3.5" />
            {uploading ? "Uploading…" : "Add images"}
          </Button>
          {isDirty && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={saving}
                className="h-9 rounded-full text-xs"
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
              >
                {saving ? "Saving…" : "Save gallery"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500 ring-1 ring-zinc-200/70">
          No images yet. Upload photos of your activities to showcase your experience.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {drafts.map((img, index) => (
            <div
              key={img._localKey}
              className="group overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/70"
            >
              <div className="relative aspect-4/3 w-full">
                <Image src={img.imageUrl} alt="" fill className="object-cover" sizes="300px" />
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                    onClick={() => move(index, -1)}
                    aria-label="Move left"
                    title="Move left"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                    onClick={() => move(index, 1)}
                    aria-label="Move right"
                    title="Move right"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-full bg-white/95 text-red-600 ring-1 ring-red-200/70 hover:bg-red-50"
                    onClick={() => remove(index)}
                    aria-label="Remove"
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <Input
                  value={img.caption}
                  onChange={(e) => patchCaption(index, e.target.value)}
                  placeholder="Caption (optional)"
                  className="h-8 rounded-xl text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadOverlay
        open={uploading}
        title={uploadTotal > 1 ? "Uploading gallery images" : "Uploading image"}
        subtitle={overlaySubtitle}
        progress={fileProgress}
      />
    </div>
  )
}
