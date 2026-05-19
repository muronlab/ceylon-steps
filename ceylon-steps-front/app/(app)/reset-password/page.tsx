"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth.service"
import { getApiErrorMessage } from "@/services/error-handler"
import { UserLayout } from "@/components/auth/userlayout"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

function ResetPasswordInner() {
  const router = useRouter()
  const search = useSearchParams()
  const initialEmail = useMemo(() => search.get("email") ?? "", [search])

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <UserLayout
      formTitle="RESET PASSWORD"
      formSubtitle="Enter the OTP we sent to your email, then choose a new password."
      footer={
        <div className="text-center text-xs text-zinc-500">
          Back to{" "}
          <Link className="font-semibold text-zinc-950 hover:underline" href="/login">
            Login
          </Link>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          try {
            await authService.resetPassword({ email, code, newPassword })
            toast.success("Password reset. Please login.")
            router.push("/login")
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
          <div className="text-xs font-medium text-zinc-700 text-center">Enter the OTP</div>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(val) => setCode(val)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-12 w-10 rounded-none border-zinc-200" />
                <InputOTPSlot index={1} className="h-12 w-10 rounded-none border-l-0 border-zinc-200" />
                <InputOTPSlot index={2} className="h-12 w-10 rounded-none border-l-0 border-zinc-200" />
                <InputOTPSlot index={3} className="h-12 w-10 rounded-none border-l-0 border-zinc-200" />
                <InputOTPSlot index={4} className="h-12 w-10 rounded-none border-l-0 border-zinc-200" />
                <InputOTPSlot index={5} className="h-12 w-10 rounded-none border-l-0 border-zinc-200" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-700">New password</div>
          <div className="relative">
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              className="h-11 rounded-full border border-zinc-200 bg-white pl-4 pr-10"
              autoComplete="new-password"
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
          className="h-12 w-full rounded-full bg-zinc-950 text-white hover:bg-zinc-900 font-semibold shadow-lg shadow-zinc-950/20"
        >
          Reset password
        </Button>

      </form>
    </UserLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md px-4 py-10">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}

