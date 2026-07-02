"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Bell, Building2, Car, Loader2, MenuIcon, Plane, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function NotificationsSheet({ trigger }: { trigger: React.ReactNode }) {
  const items = [
    {
      title: "New guide application received",
      desc: "We’ll review it within 24 hours.",
      time: "2h ago",
      unread: true,
    },
    {
      title: "Profile verification started",
      desc: "Hang tight — we’ll notify you when it’s done.",
      time: "Yesterday",
      unread: true,
    },
    {
      title: "Welcome to Ceylon Step",
      desc: "Complete your profile to get discovered faster.",
      time: "3 days ago",
      unread: false,
    },
  ] as const

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      {/* Mobile: open from top */}
      <SheetContent
        side="top"
        className="bg-white text-zinc-950 mx-4 md:hidden h-[80dvh] overflow-auto rounded-b-4xl inset-x-3"
      >
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
        </SheetHeader>

        <div className="mt-5 grid gap-3">
          {items.map((n) => (
            <div
              key={n.title}
              className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {n.unread ? (
                      <span className="inline-block size-2 rounded-full bg-blue-600" aria-hidden />
                    ) : null}
                    <div className="truncate text-sm font-semibold text-zinc-950">{n.title}</div>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">{n.desc}</div>
                </div>
                <div className="shrink-0 text-xs text-zinc-400">{n.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 pr-4 pb-4">
          <SheetClose asChild>
            <Button variant="outline" className="rounded-full text-xs" size="sm">
              Close
            </Button>
          </SheetClose>
          <Button className="rounded-full bg-zinc-950 text-white hover:bg-zinc-900 text-xs" size="sm">
            Mark all as read
          </Button>
        </div>
      </SheetContent>

      {/* Desktop/tablet: open from right */}
      <SheetContent side="right" className="hidden bg-white text-zinc-950 px-4 md:block">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
        </SheetHeader>

        <div className="mt-5 grid gap-3">
          {items.map((n) => (
            <div
              key={n.title}
              className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {n.unread ? (
                      <span className="inline-block size-2 rounded-full bg-blue-600" aria-hidden />
                    ) : null}
                    <div className="truncate text-sm font-semibold text-zinc-950">
                      {n.title}
                    </div>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">{n.desc}</div>
                </div>
                <div className="shrink-0 text-xs text-zinc-400">{n.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <SheetClose asChild>
            <Button variant="outline" className="h-10 rounded-2xl">
              Close
            </Button>
          </SheetClose>
          <Button className="h-10 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900">
            Mark all as read
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AvatarDropdown({ variant, tone = "light" }: { variant: "desktop" | "mobile"; tone?: "light" | "dark" }) {
  const { user, logout } = useAuth()
  const isDesktop = variant === "desktop"
  const buttonClassName = isDesktop
    ? tone === "dark"
      ? "h-12 w-12 rounded-full bg-white/10 text-white shadow-[0_12px_50px_-30px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:bg-white/15"
      : "h-12 w-12 rounded-full bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-50"
    : "h-10 w-10 rounded-full bg-white text-zinc-950 shadow-sm transition hover:bg-zinc-50"

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full p-0 hover:bg-transparent", buttonClassName)}
        >
          <Avatar className={cn("size-full", isDesktop && tone === "dark" ? "bg-white/10 text-white" : "")}>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback
              className={cn(
                "bg-transparent text-xs font-semibold",
                isDesktop && tone === "dark" ? "text-white" : "text-zinc-900",
              )}
            >
              U
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-40 bg-white text-zinc-950 shadow-lg ring-1 ring-zinc-200/80"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => logout()}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type NavItem = {
  label: string
  href: string
}

const defaultItems: NavItem[] = [
  { label: "About", href: "/#about" },
  { label: "Tour", href: "/#tour" },
  { label: "Contact", href: "/#contact" },
]

const servicesItems = [
  { title: "Guides", href: "/guides" },
  { title: "Hire / Rent vehicle", href: "/vehicles" },
  { title: "Agencies", href: "/agencies" },
  { title: "Airport pickups", href: "/airport-pickups" },
  { title: "Insurance", href: "/insurance" },
  { title: "Activities", href: "/activities" },
] as const

export function SiteNavbar({
  items = defaultItems,
  brand = "CEYLON STEP",
  variant = "glass",
  tone = "light",
}: {
  items?: NavItem[]
  brand?: string
  variant?: "glass" | "solid"
  tone?: "light" | "dark"
}) {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const isSolidDark = variant === "solid" && tone === "dark"
  const isSolidLight = variant === "solid" && tone === "light"

  return (
    <header
      className={cn(
        "pointer-events-none z-50 w-full",
        isSolidDark ? "bg-zinc-950" : "",
        isSolidLight ? "bg-white" : "",
        "px-3 pt-3 sm:px-6 sm:pt-5 xl:px-20",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex w-full items-center justify-between gap-3",
          tone === "dark" ? "text-white" : "text-zinc-950",
        )}
      >
        <Link href="/" className="flex items-center gap-3">
          <span className={cn("text-lg tracking-[0.16em]", tone === "dark" ? "text-white" : "text-zinc-950")}>
            {brand}
          </span>
        </Link>


        <div
          className={cn(
            "hidden md:flex",
            "rounded-full px-4 py-2",
            tone === "dark"
              ? "border border-white/20 bg-white/10 text-lg text-white/85 shadow-[0_12px_50px_-30px_rgba(0,0,0,0.65)] backdrop-blur-md"
              : "border border-zinc-200/70 bg-zinc-50 text-lg text-zinc-700 shadow-sm",
          )}
        >
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-2 px-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "rounded-full bg-transparent px-5 text-base font-medium",
                    tone === "dark"
                      ? "text-white/85 hover:bg-white/10 hover:text-white data-[state=open]:bg-white data-[state=open]:text-zinc-950 data-[state=open]:shadow-sm data-[state=open]:hover:bg-white"
                      : "text-zinc-700 hover:bg-white hover:text-zinc-950 data-[state=open]:bg-white data-[state=open]:text-zinc-950 data-[state=open]:shadow-sm",
                  )}
                >
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!w-[760px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-auto rounded-3xl border border-black/10 !bg-white/95 !text-zinc-950 shadow-[0_26px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur-xl md:!fixed md:!top-20 md:!left-0 md:!right-0 md:!mx-auto md:!mt-0 md:!z-[9999] md:!max-h-[calc(100vh-6rem)] md:!overflow-auto">
                  <div className="relative p-4">
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_30%_0%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(700px_circle_at_90%_20%,rgba(0,0,0,0.04),transparent_60%)]" />
                    <div className="flex items-start justify-between gap-4 px-1 pb-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                          Services
                        </div>
                        <div className="mt-1 text-base font-semibold text-zinc-950">
                          Plan your trip in one place
                        </div>
                        <div className="mt-1 text-sm text-zinc-500">
                          Choose what you need and continue.
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-9 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-900"
                        asChild
                      >
                        <Link href="/explore">Explore</Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          title: "Guides",
                          desc: "Find local experts",
                          href: "/guides",
                          icon: UsersRound,
                        },
                        {
                          title: "Hire / Rent vehicle",
                          desc: "With driver or self‑drive",
                          href: "/vehicles",
                          icon: Car,
                        },
                        {
                          title: "Agencies",
                          desc: "Find travel agencies",
                          href: "/agencies",
                          icon: Building2,
                        },
                        {
                          title: "Airport pickups",
                          desc: "Transfers anytime",
                          href: "/airport-pickups",
                          icon: Plane,
                        },
                        {
                          title: "Insurance",
                          desc: "Tourist coverage",
                          href: "/insurance",
                          icon: ShieldCheck,
                        },
                        {
                          title: "Activities",
                          desc: "Surf, abseil, balloon rides",
                          href: "/activities",
                          icon: Sparkles,
                        },
                      ].map((s) => (
                        <NavigationMenuLink asChild key={s.href}>
                          <Link
                            href={s.href}
                            className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition will-change-transform hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]"
                          >
                            <div
                              className={cn(
                                "grid size-11 place-items-center rounded-full",
                                "bg-zinc-950/5 ring-1 ring-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                              )}
                            >
                              <s.icon className="size-5 text-zinc-900/90" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-zinc-950 tracking-tight">
                                {s.title}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {s.desc}
                              </div>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-zinc-500 opacity-0 transition group-hover:opacity-100">
                              View
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {items.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-full px-5 py-2.5 text-base font-medium transition-colors",
                        tone === "dark"
                          ? "text-white/85 hover:text-white hover:bg-white/10"
                          : "text-zinc-700 hover:text-zinc-950 hover:bg-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            className={cn(
              "h-9 rounded-full px-5 h-12",
              tone === "dark"
                ? "border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 hover:text-zinc-950",
            )}
            asChild
          >
            <Link href="/become-a-partner">Become a Partner</Link>
          </Button>

          {loading ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Loader2 className="size-5 animate-spin text-zinc-500" />
            </div>
          ) : user ? (
            <>
              <NotificationsSheet
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full",
                      tone === "dark"
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                        : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 hover:text-zinc-950",
                    )}
                    aria-label="Notifications"
                  >
                    <Bell className="size-5" aria-hidden />
                  </Button>
                }
              />
              <AvatarDropdown variant="desktop" tone={tone} />
            </>
          ) : (
            <Button
              className={cn(
                "h-9 rounded-full px-5 shadow-sm h-12",
                tone === "dark" ? "bg-white text-zinc-950 hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-900",
              )}
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}


export function MobileNavBar({
  items = defaultItems,
  brand = "CEYLON STEP",
  variant = "glass",
  tone = "light",
}: {
  items?: NavItem[]
  brand?: string
  variant?: "glass" | "solid"
  tone?: "light" | "dark"
}) {
  const { user, loading } = useAuth()
  const isDark = tone === "dark"
  const isSolidDark = variant === "solid" && isDark

  return (
    <header className={cn("pointer-events-none z-50 w-full h-16", isSolidDark ? "bg-zinc-950" : "")}>
      <div className="flex justify-between py-3 px-3">
        <Link 
          href="/" 
          className={cn("pointer-events-auto font-semibold tracking-tight", isDark ? "text-white" : "text-zinc-950")}
        >
          {brand}
        </Link>
        <div className="pointer-events-auto relative z-50">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="size-5 animate-spin text-zinc-500" />
            ) : user ? (
              <>
                <NotificationsSheet
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-full hover:bg-zinc-100",
                        isDark ? "text-white hover:bg-white/10" : "text-zinc-950",
                      )}
                      aria-label="Notifications"
                    >
                      <Bell className="size-5" aria-hidden />
                    </Button>
                  }
                />
                <AvatarDropdown variant="mobile" tone={tone} />
              </>
            ) : null}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className={cn(isDark ? "text-white hover:bg-white/10" : "")}>
                  <MenuIcon className="size-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="bg-white text-zinc-950">
                <SheetHeader>
                  <SheetTitle className="tracking-[0.16em] text-zinc-950">{brand}</SheetTitle>
                </SheetHeader>

                <div className="mt-4 grid gap-4 px-4 pb-6">
                  <div>
                    <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Services
                    </div>
                    <div className="grid gap-1">
                      {servicesItems.map((s) => (
                        <SheetClose asChild key={s.href}>
                          <Link
                            href={s.href}
                            className="rounded-2xl px-4 py-3 text-sm text-zinc-900 hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            {s.title}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Menu
                    </div>
                    <div className="grid gap-1">
                      {items.map((item) => (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className="rounded-2xl px-4 py-3 text-sm text-zinc-900 hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-2xl border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 hover:text-zinc-950"
                      asChild
                    >
                      <SheetClose asChild>
                        <Link href="/become-a-partner">Become a Partner</Link>
                      </SheetClose>
                    </Button>
                    {!user && (
                      <Button className="h-11 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900" asChild>
                        <SheetClose asChild>
                          <Link href="/login">Login</Link>
                        </SheetClose>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  )
}

