"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type FileUploadContextValue = {
  value: File[]
  onValueChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  disabled?: boolean
}

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null)

function useFileUploadContext() {
  const ctx = React.useContext(FileUploadContext)
  if (!ctx) throw new Error("FileUpload components must be used within <FileUpload />")
  return ctx
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return ""
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function clampFiles(
  incoming: File[],
  opts: { maxFiles?: number; maxSize?: number; multiple?: boolean }
) {
  const { maxFiles, maxSize, multiple } = opts
  const filtered = incoming.filter((f) => (maxSize ? f.size <= maxSize : true))
  if (multiple) {
    return typeof maxFiles === "number" ? filtered.slice(0, maxFiles) : filtered
  }
  return filtered.length ? [filtered[0]] : []
}

function mergeFiles(existing: File[], next: File[], maxFiles?: number) {
  const byKey = new Map<string, File>()
  for (const f of existing) byKey.set(`${f.name}:${f.size}:${f.lastModified}`, f)
  for (const f of next) byKey.set(`${f.name}:${f.size}:${f.lastModified}`, f)
  const merged = [...byKey.values()]
  return typeof maxFiles === "number" ? merged.slice(0, maxFiles) : merged
}

export function FileUpload({
  value,
  onValueChange,
  maxFiles,
  maxSize,
  multiple,
  disabled,
  className,
  children,
}: {
  value: File[]
  onValueChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const ctx = React.useMemo<FileUploadContextValue>(
    () => ({
      value,
      onValueChange,
      maxFiles,
      maxSize,
      multiple,
      inputRef,
      disabled,
    }),
    [disabled, maxFiles, maxSize, multiple, onValueChange, value]
  )

  return (
    <FileUploadContext.Provider value={ctx}>
      <div className={cn("w-full", className)}>{children}</div>
    </FileUploadContext.Provider>
  )
}

export function FileUploadDropzone({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = useFileUploadContext()

  return (
    <div
      className={cn(
        "flex min-h-52 flex-col items-center justify-center gap-2 text-center",
        "rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/70 p-10 transition",
        "hover:bg-zinc-50",
        "focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:ring-offset-0",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60",
        className
      )}
      data-disabled={ctx.disabled ? "true" : "false"}
      onDragOver={(e) => {
        if (ctx.disabled) return
        e.preventDefault()
      }}
      onDrop={(e) => {
        if (ctx.disabled) return
        e.preventDefault()
        const dropped = Array.from(e.dataTransfer.files ?? [])
        const clamped = clampFiles(dropped, {
          maxFiles: ctx.maxFiles,
          maxSize: ctx.maxSize,
          multiple: ctx.multiple,
        })
        const next = ctx.multiple ? mergeFiles(ctx.value, clamped, ctx.maxFiles) : clamped
        ctx.onValueChange(next)
      }}
    >
      {children}
    </div>
  )
}

function composeAsChild(
  child: React.ReactElement,
  props: Record<string, unknown>
) {
  const childProps = (child.props ?? {}) as Record<string, unknown>
  return React.cloneElement(child, { ...childProps, ...props } as Record<string, unknown>)
}

export function FileUploadTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const ctx = useFileUploadContext()

  const onClick = () => {
    if (ctx.disabled) return
    ctx.inputRef.current?.click()
  }

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files)
    const clamped = clampFiles(selected, {
      maxFiles: ctx.maxFiles,
      maxSize: ctx.maxSize,
      multiple: ctx.multiple,
    })
    const next = ctx.multiple ? mergeFiles(ctx.value, clamped, ctx.maxFiles) : clamped
    ctx.onValueChange(next)
  }

  const input = (
    <input
      ref={ctx.inputRef}
      type="file"
      className="sr-only"
      multiple={!!ctx.multiple}
      disabled={ctx.disabled}
      onChange={(e) => onFilesSelected(e.target.files)}
    />
  )

  if (asChild && React.isValidElement(children)) {
    return (
      <>
        {composeAsChild(children, { onClick })}
        {input}
      </>
    )
  }

  return (
    <>
      <button type="button" onClick={onClick} disabled={ctx.disabled}>
        {children}
      </button>
      {input}
    </>
  )
}

export function FileUploadList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("mt-4 space-y-3", className)}>{children}</div>
}

const FileUploadItemContext = React.createContext<{ file: File } | null>(null)

function useFileUploadItemContext() {
  const ctx = React.useContext(FileUploadItemContext)
  if (!ctx) throw new Error("FileUploadItem components must be used within <FileUploadItem />")
  return ctx
}

export function FileUploadItem({
  value,
  className,
  children,
}: {
  value: File
  className?: string
  children: React.ReactNode
}) {
  return (
    <FileUploadItemContext.Provider value={{ file: value }}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white/70 p-3",
          className
        )}
      >
        {children}
      </div>
    </FileUploadItemContext.Provider>
  )
}

export function FileUploadItemPreview({ className }: { className?: string }) {
  const { file } = useFileUploadItemContext()
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!file) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const isImage = file.type.startsWith("image/")

  return (
    <div
      className={cn(
        "grid size-14 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-white",
        className
      )}
    >
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="text-xs font-semibold text-zinc-600">FILE</div>
      )}
    </div>
  )
}

export function FileUploadItemMetadata({ className }: { className?: string }) {
  const { file } = useFileUploadItemContext()
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div className="truncate text-sm font-semibold text-zinc-950">{file.name}</div>
      <div className="text-xs text-zinc-500">{formatBytes(file.size)}</div>
    </div>
  )
}

export function FileUploadItemDelete({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const { file } = useFileUploadItemContext()
  const ctx = useFileUploadContext()

  const onClick = () => {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    const next = ctx.value.filter((f) => `${f.name}:${f.size}:${f.lastModified}` !== key)
    ctx.onValueChange(next)
  }

  if (asChild && React.isValidElement(children)) {
    return composeAsChild(children, { onClick })
  }

  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}

