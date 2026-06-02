"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowUpRight, Building2, Car, CheckCircle2, Compass, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import apiClient from "@/services/api-client"
import { cn } from "@/lib/utils"

function PartnerCard({
  title,
  description,
  href,
  icon: Icon,
  tone = "light",
  disabled = false,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "light" | "dark"
  disabled?: boolean
}) {
  const isDark = tone === "dark"
  const cardClassName = cn(
    "group relative overflow-hidden rounded-4xl p-6 ring-1 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.35)] transition backdrop-blur-xl",
    !disabled && "hover:-translate-y-0.5 hover:shadow-[0_26px_75px_-55px_rgba(0,0,0,0.45)]",
    isDark
      ? "bg-[radial-gradient(900px_circle_at_20%_10%,rgba(127,29,29,0.35),transparent_50%),radial-gradient(800px_circle_at_85%_35%,rgba(2,6,23,0.75),transparent_55%),linear-gradient(to_bottom,rgba(9,9,11,0.96),rgba(0,0,0,0.96))] text-white ring-white/10"
      : "bg-[radial-gradient(900px_circle_at_15%_10%,rgba(30,64,175,0.30),transparent_45%),radial-gradient(800px_circle_at_90%_30%,rgba(2,6,23,0.70),transparent_55%),linear-gradient(to_bottom,rgba(28,25,23,0.92),rgba(12,10,9,0.92))] text-white ring-white/10",
    disabled && "opacity-60 cursor-not-allowed pointer-events-none select-none"
  )

  const inner = (
    <>
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div
          className={cn(
            "absolute inset-0",
            isDark
              ? "bg-[radial-gradient(900px_circle_at_30%_0%,rgba(244,63,94,0.16),transparent_55%)]"
              : "bg-[radial-gradient(900px_circle_at_30%_0%,rgba(59,130,246,0.16),transparent_55%)]"
          )}
        />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full shadow-sm ring-1",
              "bg-white/10 text-white ring-white/15"
            )}
          >
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-white">
              {title}
            </div>
            <p className="mt-1 text-sm leading-6 text-white/70">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div
            className={cn(
              "relative flex h-11 w-full items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm transition",
              "bg-white/10 text-white ring-1 ring-white/15",
              !disabled && "group-hover:bg-white/[0.14]"
            )}
          >
            <span className="w-full text-center">
              {disabled ? "Application Status" : "Register now"}
            </span>
            {!disabled && (
              <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )

  if (disabled) {
    return (
      <div className={cardClassName} aria-disabled="true">
        {inner}
      </div>
    )
  }

  return (
    <Link href={href} className={cardClassName}>
      {inner}
    </Link>
  )
}

function GuideApplicationStatus({ appStatus }: { appStatus: { status: string; remark?: string | null; createdAt?: string; updatedAt?: string } }) {
  const status = appStatus.status as "PENDING" | "APPROVED" | "REJECTED"

  const config = {
    PENDING: {
      tone: "amber",
      title: "Your guide application is under review",
      message: "We received your application. Our team will get back to you by email once the review is complete. You can't submit another guide application while this one is pending.",
      cta: "View application",
      icon: AlertCircle,
    },
    APPROVED: {
      tone: "emerald",
      title: "You're a verified guide",
      message: "Your guide application has been approved. You can manage your profile and services from the dashboard.",
      cta: "View application",
      icon: CheckCircle2,
    },
    REJECTED: {
      tone: "red",
      title: "Your guide application was rejected",
      message: appStatus.remark
        ? `Reason: ${appStatus.remark}. You can update the details and resubmit.`
        : "Please update your details and resubmit your application.",
      cta: "Update and resubmit",
      icon: AlertCircle,
    },
  } as const

  const c = config[status]
  const Icon = c.icon

  const toneClasses = {
    amber: { bg: "bg-amber-50", ring: "ring-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-600", titleText: "text-amber-900", text: "text-amber-800" },
    emerald: { bg: "bg-emerald-50", ring: "ring-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-600", titleText: "text-emerald-900", text: "text-emerald-800" },
    red: { bg: "bg-red-50", ring: "ring-red-200", iconBg: "bg-red-100", iconText: "text-red-600", titleText: "text-red-900", text: "text-red-800" },
  }[c.tone]

  return (
    <div className={cn("mt-8 rounded-3xl p-5 ring-1 sm:p-6", toneClasses.bg, toneClasses.ring)}>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("grid size-12 shrink-0 place-items-center rounded-full", toneClasses.iconBg, toneClasses.iconText)}>
            <Icon className="size-6" />
          </div>
          <div>
            <div className={cn("text-base font-semibold", toneClasses.titleText)}>{c.title}</div>
            <p className={cn("mt-1 text-sm leading-6", toneClasses.text)}>{c.message}</p>
          </div>
        </div>
        <Button asChild className="h-11 shrink-0 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900">
          <Link href="/partner/guide" className="inline-flex items-center gap-2">
            {c.cta}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function TransportApplicationStatus({
  appStatus,
}: {
  appStatus: { status: string; remark?: string | null }
}) {
  const status = appStatus.status as "PENDING" | "APPROVED" | "REJECTED"

  const config = {
    PENDING: {
      tone: "amber",
      title: "Your transport application is under review",
      message:
        "We received your application. We'll get back to you by email once the review is complete.",
      cta: "View application",
      icon: AlertCircle,
    },
    APPROVED: {
      tone: "emerald",
      title: "You're a verified transport partner",
      message: "Your transport application has been approved.",
      cta: "View application",
      icon: CheckCircle2,
    },
    REJECTED: {
      tone: "red",
      title: "Your transport application was rejected",
      message: appStatus.remark
        ? `Reason: ${appStatus.remark}. You can update the details and resubmit.`
        : "Please update your details and resubmit your application.",
      cta: "Update and resubmit",
      icon: AlertCircle,
    },
  } as const

  const c = config[status]
  const Icon = c.icon

  const toneClasses = {
    amber: {
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      titleText: "text-amber-900",
      text: "text-amber-800",
    },
    emerald: {
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      titleText: "text-emerald-900",
      text: "text-emerald-800",
    },
    red: {
      bg: "bg-red-50",
      ring: "ring-red-200",
      iconBg: "bg-red-100",
      iconText: "text-red-600",
      titleText: "text-red-900",
      text: "text-red-800",
    },
  }[c.tone]

  return (
    <div
      className={cn(
        "mt-4 rounded-3xl p-5 ring-1 sm:p-6",
        toneClasses.bg,
        toneClasses.ring,
      )}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full",
              toneClasses.iconBg,
              toneClasses.iconText,
            )}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <div className={cn("text-base font-semibold", toneClasses.titleText)}>
              {c.title}
            </div>
            <p className={cn("mt-1 text-sm leading-6", toneClasses.text)}>
              {c.message}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900"
        >
          <Link
            href="/partner/vehicle-rental"
            className="inline-flex items-center gap-2"
          >
            {c.cta}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ActivityApplicationStatus({
  appStatus,
}: {
  appStatus: { status: string; remark?: string | null }
}) {
  const status = appStatus.status as "PENDING" | "APPROVED" | "REJECTED"

  const config = {
    PENDING: {
      tone: "amber",
      title: "Your activity application is under review",
      message:
        "We received your application. We'll get back to you by email once the review is complete.",
      cta: "View application",
      icon: AlertCircle,
    },
    APPROVED: {
      tone: "emerald",
      title: "You're a verified activity partner",
      message: "Your activity application has been approved.",
      cta: "View application",
      icon: CheckCircle2,
    },
    REJECTED: {
      tone: "red",
      title: "Your activity application was rejected",
      message: appStatus.remark
        ? `Reason: ${appStatus.remark}. You can update the details and resubmit.`
        : "Please update your details and resubmit your application.",
      cta: "Update and resubmit",
      icon: AlertCircle,
    },
  } as const

  const c = config[status]
  const Icon = c.icon

  const toneClasses = {
    amber: {
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      titleText: "text-amber-900",
      text: "text-amber-800",
    },
    emerald: {
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      titleText: "text-emerald-900",
      text: "text-emerald-800",
    },
    red: {
      bg: "bg-red-50",
      ring: "ring-red-200",
      iconBg: "bg-red-100",
      iconText: "text-red-600",
      titleText: "text-red-900",
      text: "text-red-800",
    },
  }[c.tone]

  return (
    <div
      className={cn(
        "mt-4 rounded-3xl p-5 ring-1 sm:p-6",
        toneClasses.bg,
        toneClasses.ring,
      )}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full",
              toneClasses.iconBg,
              toneClasses.iconText,
            )}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <div className={cn("text-base font-semibold", toneClasses.titleText)}>
              {c.title}
            </div>
            <p className={cn("mt-1 text-sm leading-6", toneClasses.text)}>
              {c.message}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900"
        >
          <Link
            href="/partner/activity-provider"
            className="inline-flex items-center gap-2"
          >
            {c.cta}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function BecomeAPartnerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/become-a-partner")
    }
  }, [user, loading, router])

  const [appStatus, setAppStatus] = useState<any>(null)
  const [transportStatus, setTransportStatus] = useState<any>(null)
  const [activityStatus, setActivityStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    async function checkApp() {
      if (!user) return
      try {
        const [guideRes, transportRes, activityRes] = await Promise.allSettled([
          apiClient.get("/partner/guide/me"),
          apiClient.get("/partner/transport-provider/me"),
          apiClient.get("/partner/activity-provider/me"),
        ])
        if (guideRes.status === "fulfilled") setAppStatus(guideRes.value.data)
        if (transportRes.status === "fulfilled")
          setTransportStatus(transportRes.value.data)
        if (activityRes.status === "fulfilled")
          setActivityStatus(activityRes.value.data)
      } catch (err) {
        console.error("Failed to fetch application statuses", err)
      } finally {
        setLoadingStatus(false)
      }
    }
    if (user) checkApp()
    else setLoadingStatus(false)
  }, [user])

  if (loading || loadingStatus) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  if (!user) return null

  const isApprovedGuide = appStatus?.status === "APPROVED"
  const isPendingGuide = appStatus?.status === "PENDING"
  const isApprovedTransport = transportStatus?.status === "APPROVED"
  const isPendingTransport = transportStatus?.status === "PENDING"
  const isApprovedActivity = activityStatus?.status === "APPROVED"
  const isPendingActivity = activityStatus?.status === "PENDING"

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[radial-gradient(1100px_circle_at_15%_10%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(900px_circle_at_85%_20%,rgba(99,102,241,0.12),transparent_40%),linear-gradient(to_bottom,white,rgba(244,244,245,0.9))] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-4xl bg-white/70 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.6)] ring-1 ring-zinc-200/70 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-10 p-7 sm:p-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                <span className="inline-block size-1.5 rounded-full bg-blue-600" />
                Become a Partner
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Grow your business with Ceylon Step
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-zinc-600 sm:text-base">
                Join our trusted network of Sri Lanka travel partners. Get discovered by travelers,
                receive verified leads, and manage enquiries in one place — while you focus on
                delivering unforgettable experiences.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "More visibility",
                    desc: "Show up where travelers search — guides, transport, activities, agencies.",
                  },
                  {
                    title: "Quality enquiries",
                    desc: "Get relevant requests from real travelers, not spam.",
                  },
                  {
                    title: "Built for trust",
                    desc: "Profiles, reviews, and clear pricing help customers book confidently.",
                  },
                  {
                    title: "Fast onboarding",
                    desc: "Create your profile in minutes and start receiving enquiries.",
                  },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="rounded-3xl bg-white/60 p-4 border border-dashed border-zinc-300/80"
                  >
                    <div className="text-sm font-semibold text-zinc-950">{b.title}</div>
                    <div className="mt-1 text-sm leading-6 text-zinc-600">{b.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="h-11 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900"
                >
                  <Link href="#partner-types" className="inline-flex items-center gap-2">
                    Choose a partner type
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full border-zinc-200 bg-white px-6">
                  <Link href="/" className="inline-flex items-center gap-2">
                    Back to home
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-full overflow-hidden rounded-4xl bg-zinc-950 p-8 text-white">
                <div className="pointer-events-none absolute inset-0 opacity-90">
                  <div className="absolute -left-24 -top-24 size-80 rounded-full bg-blue-600/30 blur-3xl" />
                  <div className="absolute -right-24 top-28 size-72 rounded-full bg-indigo-500/25 blur-3xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.18),transparent_40%)]" />
                </div>

                <div className="relative">
                  <div className="text-sm font-semibold text-white/80">What you’ll get</div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">
                    A professional profile travelers trust
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    Upload photos, list your services, set availability, and respond to enquiries
                    quickly. We help you stand out with a clean listing and clear call-to-actions.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      "Partner verification & profile badge",
                      "Easy service listing (packages & add-ons)",
                      "Customer reviews and ratings",
                      "Direct enquiries to your inbox",
                    ].map((t) => (
                      <div key={t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                        <div className="mt-1 size-2 rounded-full bg-blue-400" />
                        <div className="text-sm text-white/85">{t}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                    <div className="text-sm font-semibold">Tip</div>
                    <div className="mt-1 text-sm leading-6 text-white/75">
                      The more complete your profile is (photos, pricing, and availability), the more
                      bookings you’ll receive.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="partner-types" className="border-t border-zinc-200/70 bg-white/40 p-7 sm:p-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="text-sm font-semibold text-zinc-950">Choose how you partner</div>
                <div className="mt-2 text-sm leading-6 text-zinc-600">
                  Pick the category that matches your business. You can add more later.
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PartnerCard
                title={isApprovedGuide ? "Already a Partner" : isPendingGuide ? "Application Pending" : "Become a Guide"}
                description={isApprovedGuide ? "You are already a verified guide partner." : isPendingGuide ? "Your application is currently under review." : "Create your guide profile, regions, languages, and packages."}
                href="/partner/guide"
                icon={Compass}
                tone="dark"
                disabled={isApprovedGuide || isPendingGuide}
              />
              <PartnerCard
                title={
                  isApprovedTransport
                    ? "Already a Transport Partner"
                    : isPendingTransport
                      ? "Application Pending"
                      : "Vehicle Rental Partner"
                }
                description={
                  isApprovedTransport
                    ? "You are already a verified transport partner."
                    : isPendingTransport
                      ? "Your application is currently under review."
                      : "List your vehicles, pricing, driver options, and availability."
                }
                href="/partner/vehicle-rental"
                icon={Car}
                disabled={isApprovedTransport || isPendingTransport}
              />
              <PartnerCard
                title={
                  isApprovedActivity
                    ? "Already an Activity Partner"
                    : isPendingActivity
                      ? "Application Pending"
                      : "Activity Provider"
                }
                description={
                  isApprovedActivity
                    ? "You are already a verified activity partner."
                    : isPendingActivity
                      ? "Your application is currently under review."
                      : "Balloon rides, pottery, village tours, surfing, rafting and more."
                }
                href="/partner/activity-provider"
                icon={Sparkles}
                tone="dark"
                disabled={isApprovedActivity || isPendingActivity}
              />
              <PartnerCard
                title="Tourism Agency"
                description="Register your agency and publish curated tours and packages."
                href="/partner/tourism-agency"
                icon={Building2}
              />
            </div>

            {appStatus && (appStatus.status === "PENDING" || appStatus.status === "APPROVED" || appStatus.status === "REJECTED") && (
              <GuideApplicationStatus appStatus={appStatus} />
            )}

            {transportStatus && (transportStatus.status === "PENDING" || transportStatus.status === "APPROVED" || transportStatus.status === "REJECTED") && (
              <TransportApplicationStatus appStatus={transportStatus} />
            )}

            {activityStatus && (activityStatus.status === "PENDING" || activityStatus.status === "APPROVED" || activityStatus.status === "REJECTED") && (
              <ActivityApplicationStatus appStatus={activityStatus} />
            )}

            <div className="mt-8 rounded-3xl bg-white/70 p-5 ring-1 ring-zinc-200/70">
              <div className="text-sm font-semibold text-zinc-950">Need help choosing?</div>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                If you offer multiple services (for example, guide + transport), choose the closest
                match now — you can add more categories after onboarding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

