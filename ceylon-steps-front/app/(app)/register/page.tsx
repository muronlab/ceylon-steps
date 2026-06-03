"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserLayout } from "@/components/auth/userlayout"
import { authService } from "@/services/auth.service"
import { getApiErrorMessage } from "@/services/error-handler"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const nextStep = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        toast.error("Please fill in all account details")
        return
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters")
        return
      }
      setStep(2)
    }
  }

  const prevStep = () => setStep(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error("Please enter your name")
      return
    }

    setLoading(true)
    try {
      await authService.register({ email, password, name, phone })
      toast.success("Account created successfully. Please verify your email.")
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout
      formTitle="Create your Ceylon Steps account"
      formSubtitle={step === 1 ? "Step 1 — your account credentials" : "Step 2 — your personal details"}
      cornerLabel="Sign in"
      cornerHref="/login"
      footer={
        <div className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link className="font-semibold text-zinc-950 hover:underline" href="/login">
            Login
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
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
                  required
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
                    placeholder="At least 8 characters"
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-xl border border-zinc-200 bg-white pl-4 pr-10"
                    required
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  type={showPassword ? "text" : "password"}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4"
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="h-11 w-full rounded-xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800"
              >
                Continue <ArrowRight className="ml-2 size-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  type="text"
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
                  Phone Number (Optional)
                </label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  type="tel"
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-11 flex-1 rounded-xl border-zinc-200 font-semibold"
                >
                  <ArrowLeft className="mr-2 size-4" /> Back
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="h-11 flex-2 rounded-xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800"
                >
                  Create Account
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </UserLayout>
  )
}
