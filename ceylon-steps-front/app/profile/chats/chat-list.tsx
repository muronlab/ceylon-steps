"use client"

import { useMemo, useState } from "react"
import {
  BellOff,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  MicVocal,
  MoreVertical,
  Plus,
  Search,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatSummary, Tick } from "./mock-data"
import { avatarGradient, getInitials } from "./avatar-colour"

type Tab = "all" | "unread"

function formatStamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    const h = d.getHours().toString().padStart(2, "0")
    const m = d.getMinutes().toString().padStart(2, "0")
    return `${h}:${m}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (isYesterday) return "Yesterday"
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })
}

function PreviewIcon({ kind }: { kind: ChatSummary["previewKind"] }) {
  if (!kind || kind === "text") return null
  if (kind === "image") return <ImageIcon className="size-3.5 shrink-0 text-zinc-400" />
  if (kind === "video") return <Video className="size-3.5 shrink-0 text-zinc-400" />
  if (kind === "document") return <FileText className="size-3.5 shrink-0 text-zinc-400" />
  if (kind === "voice") return <MicVocal className="size-3.5 shrink-0 text-zinc-400" />
  return null
}

function TickIcon({ tick }: { tick?: Tick }) {
  if (!tick) return null
  if (tick === "sent") return <Check className="size-3.5 text-zinc-400" />
  if (tick === "delivered") return <CheckCheck className="size-3.5 text-zinc-400" />
  return <CheckCheck className="size-3.5 text-blue-500" />
}

export function ChatList({
  chats,
  selectedId,
  onSelect,
}: {
  chats: ChatSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return chats.filter((c) => {
      if (tab === "unread" && c.unreadCount === 0) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.preview.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [chats, tab, query])

  const unreadCount = chats.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0)

  return (
    <aside className="flex h-full flex-col border-r border-zinc-200/70 bg-white/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5">
        <div>
          <div className="text-lg font-bold tracking-tight text-zinc-950">Messages</div>
          <div className="mt-0.5 text-[0.7rem] font-medium text-zinc-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="New chat" title="New chat" tone="accent">
            <Plus className="size-4" />
          </IconButton>
          <IconButton aria-label="More" title="More">
            <MoreVertical className="size-4" />
          </IconButton>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-2xl bg-zinc-100/80 px-3.5 py-2.5 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-blue-500/40 focus-within:shadow-sm">
          <Search className="size-4 shrink-0 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Filter tabs — All / Unread */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Tab label="All" active={tab === "all"} onClick={() => setTab("all")} />
        <Tab
          label="Unread"
          count={unreadCount}
          active={tab === "unread"}
          onClick={() => setTab("unread")}
        />
      </div>

      {/* Chat list — the only scrollable region; header/search/tabs stay fixed */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-zinc-500">
            No chats match this filter.
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((c) => {
              const selected = selectedId === c.id
              const unread = c.unreadCount > 0
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                      selected
                        ? "bg-blue-50 ring-1 ring-blue-100"
                        : "hover:bg-zinc-50",
                    )}
                  >
                    {/* Active accent rail */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-500 transition-opacity",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Avatar name={c.name} avatarUrl={c.avatarUrl} online={c.online} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div
                          className={cn(
                            "truncate text-[0.9rem] text-zinc-950",
                            unread ? "font-bold" : "font-semibold",
                          )}
                        >
                          {c.name}
                        </div>
                        <div
                          className={cn(
                            "shrink-0 text-[0.7rem]",
                            unread ? "font-semibold text-blue-500" : "text-zinc-400",
                          )}
                        >
                          {formatStamp(c.lastAt)}
                        </div>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <div
                          className={cn(
                            "flex min-w-0 items-center gap-1.5 text-xs",
                            unread ? "text-zinc-700" : "text-zinc-500",
                          )}
                        >
                          <PreviewIcon kind={c.previewKind} />
                          <span className="truncate">{c.preview}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {c.muted && <BellOff className="size-3.5 text-zinc-400" />}
                          {unread ? (
                            <span className="grid min-w-5 place-items-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white shadow-sm shadow-blue-500/30">
                              {c.unreadCount}
                            </span>
                          ) : (
                            <TickIcon tick={c.lastTick} />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70",
      )}
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold",
            active ? "bg-white/25 text-white" : "bg-white text-zinc-700",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function IconButton({
  children,
  tone = "muted",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "muted" | "accent" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "grid size-9 place-items-center rounded-full transition",
        tone === "accent"
          ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30 hover:bg-blue-600"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
      )}
    >
      {children}
    </button>
  )
}

function Avatar({
  name,
  avatarUrl,
  online,
}: {
  name: string
  avatarUrl?: string
  online?: boolean
}) {
  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="size-11 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div
          className={cn(
            "grid size-11 place-items-center rounded-full bg-linear-to-br text-sm font-bold text-white shadow-sm ring-2 ring-white",
            avatarGradient(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  )
}
