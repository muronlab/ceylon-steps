"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, Home, LogOut, User as UserIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(value: string | null | undefined) {
  if (!value) return "U"
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "U"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
}

export function ProfileTopbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    setSigningOut(true)
    try {
      await logout()
      router.replace("/")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = user?.name?.trim() || user?.email || "Account"
  const initials = getInitials(user?.name || user?.email)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200/70 bg-white/90 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mx-1 data-[orientation=vertical]:h-4"
      />

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
      >
        <Home className="size-4" />
        <span>Home</span>
      </Link>

      <Link
        href="/guides"
        className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:inline-flex"
      >
        Guides
      </Link>

      <Link
        href="/become-a-partner"
        className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 md:inline-flex"
      >
        Become a partner
      </Link>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-50 py-1 pl-1 pr-3 ring-1 ring-zinc-200/70 transition hover:bg-zinc-100"
              >
                <span className="grid size-7 place-items-center rounded-full bg-zinc-950 text-[10px] font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[160px] truncate text-xs font-semibold text-zinc-800 sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="size-3.5 text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-zinc-950">
                  {user.name?.trim() || "Account"}
                </span>
                <span className="truncate text-xs font-medium text-zinc-500">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserIcon className="size-3.5" />
                  My profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="size-3.5" />
                  Back to home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={signingOut}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="size-3.5" />
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
