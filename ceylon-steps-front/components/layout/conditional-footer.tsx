"use client"

import { usePathname } from "next/navigation"
import { HomeFooter } from "@/components/home/home-footer"

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
])

export function ConditionalFooter() {
  const pathname = usePathname()
  if (AUTH_ROUTES.has(pathname)) return null
  if (pathname.startsWith("/partner-dashboard")) return null
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return null
  return <HomeFooter />
}

