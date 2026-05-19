"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserLayout } from "@/components/auth/userlayout"
import { authService } from "@/services/auth.service"
import { getApiErrorMessage } from "@/services/error-handler"
import { useAuth } from "@/context/auth-context"
 
export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <UserLayout
      formTitle="LOGIN"
      formSubtitle="Welcome back. Sign in with your email and password."
      footer={
        <div className="space-y-3 text-center">
          <div className="text-center text-xs text-zinc-500">
            Don’t have an account?{" "}
            <Link className="font-semibold text-zinc-950 hover:underline" href="/register">
              Register
            </Link>
          </div>
          <div className="text-center text-xs text-zinc-500">
            <Link className="font-semibold text-zinc-950 hover:underline" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          try {
            await login({ email, password })
            toast.success("Logged in successfully")
            router.push(redirect)
          } catch (err) {
            toast.error(getApiErrorMessage(err))
          } finally {
            setLoading(false)
          }
        }}
      >
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-700">Email</div>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            type="email"
            className="h-11 rounded-full border border-zinc-200 bg-white px-4"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-700">Password</div>
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              className="h-11 rounded-full border border-zinc-200 bg-white pl-4 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          loading={loading}
          className="h-11 w-full rounded-full bg-zinc-950 px-6 font-semibold text-white shadow-sm hover:bg-zinc-900"
        >
          Login
        </Button>
      </form>
    </UserLayout>
  )
}
