"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { CHATS } from "./mock-data"
import { ChatList } from "./chat-list"
import { ChatThread } from "./chat-thread"
import { EmptyConversation } from "./empty-conversation"

export default function ChatsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  // Start with no selection so mobile lands on the chat list. Desktop shows
  // the empty state until the user picks a chat (matching common messenger UX).
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/profile/chats")
      return
    }
    const isGuide = Array.isArray(user.roles) && user.roles.includes("GUIDE")
    if (!isGuide) router.replace("/profile")
  }, [authLoading, user, router])

  const active = useMemo(
    () => CHATS.find((c) => c.summary.id === selectedId) ?? null,
    [selectedId],
  )

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  const hasSelection = selectedId !== null

  return (
    <div className="-mx-4 -mb-4 grid h-[calc(100vh-4rem)] flex-1 grid-cols-1 overflow-hidden border-t border-zinc-200 bg-white text-zinc-900 md:grid-cols-[360px_1fr]">
      {/* Chat list — visible on md+, hidden on mobile/tablet when a chat is open */}
      <div className={cn("min-h-0", hasSelection ? "hidden md:block" : "block")}>
        <ChatList
          chats={CHATS.map((c) => c.summary)}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Thread / empty — on mobile only renders when a chat is open */}
      <div className={cn("min-h-0", hasSelection ? "block" : "hidden md:block")}>
        {active ? (
          <ChatThread thread={active} onBack={() => setSelectedId(null)} />
        ) : (
          <EmptyConversation />
        )}
      </div>
    </div>
  )
}
