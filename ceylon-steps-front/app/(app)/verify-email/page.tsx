"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { authService } from "@/services/auth.service"
import { getApiErrorMessage } from "@/services/error-handler"
import { UserLayout } from "@/components/auth/userlayout"
import { useAuth } from "@/context/auth-context"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

function VerifyEmailInner() {
  const { refreshUser } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const initialEmail = useMemo(() => search.get("email") ?? "", [search])

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <UserLayout
      formTitle="VERIFY EMAIL"
      formSubtitle="Enter the OTP sent to your email address."
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
            await authService.verifyEmailOtp({ email, code })
            await refreshUser()
            toast.success("Email verified")
            router.push("/")
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            loading={loading}
            className="h-12 rounded-full border-zinc-200 bg-white hover:bg-zinc-50 font-semibold"
            onClick={async () => {
              setLoading(true)
              try {
                await authService.startEmailVerification({ email })
                toast.success("OTP sent")
              } catch (err) {
                toast.error(getApiErrorMessage(err))
              } finally {
                setLoading(false)
              }
            }}
          >
            Resend OTP
          </Button>

          <Button
            loading={loading}
            loading={loading}
            className="h-12 rounded-full bg-zinc-950 text-white hover:bg-zinc-900 font-semibold shadow-lg shadow-zinc-950/20"
          >
            Verify
          </Button>
        </div>

      </form>
    </UserLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md px-4 py-10">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  )
}

