"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A borderless, padding-free, transparent text input. It carries no chrome of
 * its own — every visual decision (font size, colour, focus affordance) is left
 * to the caller via `className`, which is merged through `cn` so callers can
 * inject and override freely. Useful for inline/document-style editing where an
 * input should read as plain text until focused.
 */
const GhostInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-slot="ghost-input"
      className={cn(
        "w-full border-0 bg-transparent p-0 text-inherit outline-none",
        "placeholder:text-zinc-300 focus:outline-none focus:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  )
})
GhostInput.displayName = "GhostInput"

export { GhostInput }
