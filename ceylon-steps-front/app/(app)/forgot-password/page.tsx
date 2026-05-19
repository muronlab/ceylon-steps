"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth.service"
import { getApiErrorMessage } from "@/services/error-handler"
import { UserLayout } from "@/components/auth/userlayout"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <UserLayout
      formTitle="FORGOT PASSWORD"
      formSubtitle="Enter your email and we’ll send an OTP to reset your password."
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
            await authService.forgotPassword({ email })
            toast.success("If the email exists, an OTP was sent")
            router.push(`/reset-password?email=${encodeURIComponent(email)}`)
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

        <Button
          loading={loading}
          className="h-11 w-full rounded-full bg-zinc-950 px-6 font-semibold text-white shadow-sm hover:bg-zinc-900"
        >
          Send OTP
        </Button>
      </form>
    </UserLayout>
  )
}

