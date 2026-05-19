"use client"

import { cn } from "@/lib/utils"

/**
 * Renders Tiptap-generated HTML with the typography baseline used on the
 * public guide profile. Wrap the bio HTML in this so headings, lists, quotes
 * etc. all match the reference design without any extra effort from the guide.
 */
export function BioContent({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  return (
    <div
      className={cn("bio-content space-y-6 text-[15px] leading-7 text-zinc-700", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
