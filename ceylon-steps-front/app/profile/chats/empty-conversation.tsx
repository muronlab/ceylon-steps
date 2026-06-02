"use client"

import { Lock, MessageCircle } from "lucide-react"

export function EmptyConversation() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-linear-to-b from-zinc-50/80 via-white to-white p-8 text-center">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 size-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 size-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-md">
        <div className="relative mx-auto grid size-20 place-items-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/15 blur-xl" />
          <div className="relative grid size-16 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
            <MessageCircle className="size-7" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-zinc-950">
          Ceylon Step Chats
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Send and receive messages from travellers without leaving the dashboard.
          Pick a chat on the left to get started.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
          <Lock className="size-3.5" />
          Conversations are private to you and the traveller.
        </div>
      </div>
    </div>
  )
}
