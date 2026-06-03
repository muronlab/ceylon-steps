"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { UserLayout } from "@/components/auth/userlayout"
import { getApiErrorMessage } from "@/services/error-handler"
import { useAuth } from "@/context/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <UserLayout
      formTitle="Welcome back to Ceylon Steps"
      formSubtitle="Sign in to your account"
      cornerLabel="Register"
      cornerHref="/register"
      footer={
        <div className="text-center text-sm text-zinc-500">
          Don’t have an account?{" "}
          <Link className="font-semibold text-zinc-950 hover:underline" href="/register">
            Register
          </Link>
        </div>
      }
    >
      <form
        className="space-y-5"
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
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Your Email
          </label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-4"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 rounded-xl border border-zinc-200 bg-white pl-4 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
            <Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(value === true)} />
            Remember me
          </label>
          <Link className="text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <Button
          loading={loading}
          className="h-11 w-full rounded-xl bg-zinc-950 px-6 font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Login
        </Button>
      </form>
    </UserLayout>
  )
}
