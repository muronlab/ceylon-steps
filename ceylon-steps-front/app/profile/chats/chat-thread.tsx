"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Mic,
  MoreVertical,
  Paperclip,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage, ChatThread as ThreadType } from "./mock-data"
import { avatarGradient, getInitials } from "./avatar-colour"

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = dayKey(d.toISOString()) === dayKey(now.toISOString())
  if (sameDay) return "Today"
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (dayKey(d.toISOString()) === dayKey(y.toISOString())) return "Yesterday"
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function timeOnly(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`
}

function fileBadge(kind: NonNullable<ChatMessage["file"]>["kind"]) {
  const colour: Record<typeof kind, string> = {
    pdf: "bg-red-50 text-red-600 ring-red-200",
    ppt: "bg-orange-50 text-orange-600 ring-orange-200",
    doc: "bg-blue-50 text-blue-600 ring-blue-200",
    xls: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    zip: "bg-amber-50 text-amber-700 ring-amber-200",
    other: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  }
  const label = kind.toUpperCase()
  return { className: colour[kind], label }
}

export function ChatThread({
  thread,
  onBack,
}: {
  thread: ThreadType
  onBack?: () => void
}) {
  const { summary, messages } = thread
  const [pending, setPending] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const allMessages = useMemo(() => [...messages, ...pending], [messages, pending])

  // Group consecutive messages on the same day so we can render day separators.
  const grouped = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: ChatMessage[] }> = []
    for (const m of allMessages) {
      const key = dayKey(m.at)
      const last = groups[groups.length - 1]
      if (last && last.key === key) {
        last.items.push(m)
      } else {
        groups.push({ key, label: dayLabel(m.at), items: [m] })
      }
    }
    return groups
  }, [allMessages])

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [grouped.length, pending.length, summary.id])

  function send() {
    const text = draft.trim()
    if (!text) return
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      from: "me",
      at: new Date().toISOString(),
      kind: "text",
      text,
      tick: "sent",
    }
    setPending((p) => [...p, msg])
    setDraft("")
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header — glassy, name + presence + more */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to chats"
              className="grid size-9 place-items-center rounded-full text-zinc-600 transition hover:bg-zinc-100 md:hidden"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <ThreadAvatar name={summary.name} online={summary.online} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-950">
              {summary.name}
            </div>
            {summary.presence && (
              <div className="flex items-center gap-1.5 truncate text-[0.7rem] text-zinc-500">
                {summary.online && (
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                )}
                {summary.presence}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="More"
          title="More"
          className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <MoreVertical className="size-4" />
        </button>
      </header>

      {/* Messages — the only scrollable region; header + composer stay fixed */}
      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/70 bg-[radial-gradient(circle_at_1px_1px,rgba(24,24,27,0.045)_1px,transparent_0)] [background-size:22px_22px]"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-6 sm:px-8">
          {grouped.map((g) => (
            <div key={g.key} className="flex flex-col gap-2.5">
              <div className="sticky top-2 z-[1] mx-auto rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-semibold text-zinc-500 shadow-sm ring-1 ring-zinc-200/70 backdrop-blur">
                {g.label}
              </div>
              {g.items.map((m, i) => {
                const prev = g.items[i - 1]
                const stacked =
                  !!prev && prev.from === m.from && minutesBetween(prev.at, m.at) < 4
                return (
                  <Bubble
                    key={m.id}
                    message={m}
                    senderName={summary.name}
                    stacked={stacked}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <footer className="border-t border-zinc-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-zinc-100/80 px-3 py-2 ring-1 ring-transparent transition focus-within:bg-white focus-within:shadow-sm focus-within:ring-blue-500/30">
            <button
              type="button"
              aria-label="Attach file"
              title="Attach"
              className="grid size-7 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Your message"
              className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="button"
              aria-label="Voice message"
              title="Voice message"
              className="grid size-7 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
            >
              <Mic className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transition hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:from-zinc-300 disabled:to-zinc-300 disabled:shadow-none disabled:hover:scale-100"
          >
            <Send className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}

function Bubble({
  message,
  senderName,
  stacked,
}: {
  message: ChatMessage
  senderName: string
  stacked: boolean
}) {
  const mine = message.from === "me"

  return (
    <div className={cn("flex w-full items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="w-8 shrink-0">
          {!stacked ? <SmallAvatar name={senderName} /> : null}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          mine ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-3.5 py-2.5 text-sm shadow-sm",
            mine
              ? "rounded-2xl rounded-br-md bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20"
              : "rounded-2xl rounded-bl-md bg-white text-zinc-900 ring-1 ring-zinc-200/70",
          )}
        >
          {/* File attachment */}
          {message.kind === "file" && message.file && (
            <div
              className={cn(
                "mb-1.5 flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                mine ? "bg-white/15" : "bg-zinc-50",
              )}
            >
              <div
                className={cn(
                  "grid size-9 place-items-center rounded-lg text-[0.6rem] font-bold ring-1",
                  fileBadge(message.file.kind).className,
                )}
              >
                {fileBadge(message.file.kind).label}
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate text-[0.8rem] font-semibold",
                    mine ? "text-white" : "text-zinc-900",
                  )}
                >
                  {message.file.name}
                </div>
                <div
                  className={cn(
                    "text-[0.65rem]",
                    mine ? "text-white/80" : "text-zinc-500",
                  )}
                >
                  {message.file.sizeLabel}
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {message.kind === "image" && message.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.imageUrl}
              alt=""
              className="-mx-1 -mt-1 mb-2 max-h-72 w-full rounded-xl object-cover"
            />
          )}

          {/* Link preview */}
          {message.kind === "link" && message.link && (
            <a
              href={message.link.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "-mx-1 -mt-1 mb-2 block overflow-hidden rounded-xl ring-1",
                mine ? "bg-white/10 ring-white/15" : "bg-zinc-50 ring-zinc-200",
              )}
            >
              {message.link.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.link.thumbUrl}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-2">
                <div
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    mine ? "text-white" : "text-zinc-900",
                  )}
                >
                  {message.link.title}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-[0.65rem] uppercase tracking-wider",
                    mine ? "text-white/80" : "text-zinc-500",
                  )}
                >
                  {message.link.siteName}
                </div>
              </div>
            </a>
          )}

          {message.text && (
            <div className="whitespace-pre-wrap leading-5">{message.text}</div>
          )}
        </div>

        <div className="px-1 text-[0.65rem] text-zinc-400">
          {timeOnly(message.at)}
        </div>
      </div>

      {mine && (
        <div className="w-8 shrink-0">{!stacked ? <SmallAvatar name="You" mine /> : null}</div>
      )}
    </div>
  )
}

function minutesBetween(a: string, b: string) {
  return Math.abs((new Date(b).getTime() - new Date(a).getTime()) / 60000)
}

function ThreadAvatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br text-[11px] font-bold text-white shadow-sm ring-2 ring-white",
          avatarGradient(name),
        )}
      >
        {getInitials(name)}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  )
}

function SmallAvatar({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <div
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br text-[10px] font-bold text-white shadow-sm ring-2 ring-white",
        mine ? "from-zinc-700 to-zinc-900" : avatarGradient(name),
      )}
    >
      {getInitials(name)}
    </div>
  )
}
