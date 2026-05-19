"use client"

import { Lock, MessageCircle } from "lucide-react"

export function EmptyConversation() {
  return (
    <div className="grid h-full place-items-center bg-white p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100">
          <MessageCircle className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-zinc-950">Ceylon Step Chats</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Send and receive messages from travelers without leaving the dashboard.
          Pick a chat on the left to get started.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-500">
          <Lock className="size-3.5" />
          Conversations are private to you and the traveler.
        </div>
      </div>
    </div>
  )
}
