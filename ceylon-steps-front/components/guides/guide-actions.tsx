"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export function GuideActions({ guideId, mobileNumber }: { guideId: string; mobileNumber: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-3xl bg-white ring-1 ring-zinc-200/70"
        onClick={() => navigator.clipboard?.writeText(mobileNumber)}
      >
        Copy number
      </Button>

      <Button asChild className="h-10 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-900">
        <Link href={`/partner/guide?ref=${encodeURIComponent(guideId)}`}>
          <MessageCircle className="mr-2 size-4" />
          Contact
        </Link>
      </Button>
    </div>
  )
}

