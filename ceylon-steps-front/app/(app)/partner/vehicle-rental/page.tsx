"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  Bike,
  Building2,
  Car,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Sparkles,
  Truck,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { getApiErrorMessage } from "@/services/error-handler"
import {
  transportProviderService,
  type TransportProviderApplication,
} from "@/services/transport-provider.service"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/diceui/file-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ---------- types ----------

type ProviderType =
  | "SAFARI_JEEP"
  | "VEHICLE_WITH_DRIVER"
  | "VEHICLE_FLEET"

type VehicleRentalFormState = {
  fullName: string
  mobileNumber: string
  whatsappAvailable: boolean
  useAccountEmail: boolean
  contactEmail: string
  hasBusiness: boolean
  businessName: string
  businessDescription: string
  providerType: ProviderType | ""
  nicFront: File | null
  nicBack: File | null
  brdDocument: File | null
  safariJeepLicense: File | null
}

type FieldErrors = Partial<Record<keyof VehicleRentalFormState, string>>

const PROVIDER_OPTIONS: Array<{
  id: ProviderType
  title: string
  description: string
  icon: LucideIcon
  tagline: string
}> = [
  {
    id: "SAFARI_JEEP",
    title: "Safari Jeep Operator",
    description:
      "Government-licensed safari jeep service for national parks (Yala, Udawalawe, Wilpattu).",
    tagline: "Licensed for national parks",
    icon: Truck,
  },
  {
    id: "VEHICLE_WITH_DRIVER",
    title: "Driver with Vehicle",
    description:
      "You own a car, van or coach and drive travelers yourself. Driver service only — not a guide.",
    tagline: "Driver + vehicle",
    icon: Car,
  },
  {
    id: "VEHICLE_FLEET",
    title: "Vehicle Rental / Fleet",
    description:
      "Rent out one or more vehicles — bikes, tuktuks, cars or vans. You may also manage drivers.",
    tagline: "Rent out vehicles",
    icon: Bike,
  },
]

// ---------- helpers ----------

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function normalizeSriLankaMobileLocal(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("94")) return digits.slice(2, 11)
  if (digits.startsWith("0")) return digits.slice(1, 10)
  return digits.slice(0, 9)
}

function formatSriLankaMobileLocal(value: string) {
  const digits = value.replace(/\D/g, "")
  const match = digits.match(/^(\d{0,2})(\d{0,3})(\d{0,4})$/)
  if (!match) return digits
  return !match[2]
    ? match[1]
    : !match[3]
      ? `${match[1]} ${match[2]}`
      : `${match[1]} ${match[2]} ${match[3]}`
}

function validateSriLankaMobileLocal(value: string) {
  return /^7\d{8}$/.test(value)
}

function useFilePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return url
}

function handleDownload(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}
function handlePreview(file: File) {
  const url = URL.createObjectURL(file)
  window.open(url, "_blank")
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ---------- page ----------

export default function VehicleRentalPartnerPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [existingApp, setExistingApp] =
    useState<TransportProviderApplication | null>(null)
  const [loadingApp, setLoadingApp] = useState(true)

  const [form, setForm] = useState<VehicleRentalFormState>({
    fullName: "",
    mobileNumber: "",
    whatsappAvailable: false,
    useAccountEmail: true,
    contactEmail: "",
    hasBusiness: false,
    businessName: "",
    businessDescription: "",
    providerType: "",
    nicFront: null,
    nicBack: null,
    brdDocument: null,
    safariJeepLicense: null,
  })

  const [alertConfig, setAlertConfig] = useState<{
    open: boolean
    title: string
    description: string
    type: "success" | "error"
  }>({ open: false, title: "", description: "", type: "success" })

  // Pre-fill name/email from logged-in user (once, when we first know them)
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name?.trim() || "",
      contactEmail: prev.contactEmail || user.email || "",
    }))
  }, [user])

  // Fetch any existing application so we can gate the form
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const app = await transportProviderService.getMine()
        if (cancelled) return
        setExistingApp(app)
        // Pre-fill the form when the existing application is REJECTED so the
        // user can edit + resubmit. PENDING / APPROVED skip the form entirely.
        if (app && app.status === "REJECTED") {
          setForm((prev) => ({
            ...prev,
            fullName: app.fullName,
            mobileNumber: app.mobileNumber.replace(/^\+94/, ""),
            whatsappAvailable: app.whatsappAvailable,
            useAccountEmail: app.usesAccountEmail,
            contactEmail: app.contactEmail,
            hasBusiness: app.hasBusiness,
            businessName: app.businessName ?? "",
            businessDescription: app.businessDescription ?? "",
            providerType: app.providerType,
          }))
        }
      } catch {
        if (!cancelled) setExistingApp(null)
      } finally {
        if (!cancelled) setLoadingApp(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Effective email used at submit time
  const effectiveEmail = useMemo(() => {
    if (form.useAccountEmail) return user?.email ?? ""
    return form.contactEmail
  }, [form.contactEmail, form.useAccountEmail, user?.email])

  function setField<K extends keyof VehicleRentalFormState>(
    key: K,
    value: VehicleRentalFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  // ---------- step validation ----------

  function validateStep1(s: VehicleRentalFormState): FieldErrors {
    const e: FieldErrors = {}
    if (!s.fullName.trim()) e.fullName = "Full name is required."
    if (!s.mobileNumber.trim()) e.mobileNumber = "Mobile number is required."
    else if (!validateSriLankaMobileLocal(s.mobileNumber))
      e.mobileNumber =
        "Enter a valid Sri Lanka mobile number (starts with 7, 9 digits)."

    if (!s.useAccountEmail) {
      if (!s.contactEmail.trim()) e.contactEmail = "Contact email is required."
      else if (!isLikelyEmail(s.contactEmail))
        e.contactEmail = "Please enter a valid email address."
    }

    if (s.hasBusiness) {
      if (!s.businessName.trim()) e.businessName = "Business name is required."
      if (!s.businessDescription.trim())
        e.businessDescription = "Please describe your business."
    }
    return e
  }

  function validateStep2(s: VehicleRentalFormState): FieldErrors {
    const e: FieldErrors = {}
    if (!s.providerType) e.providerType = "Please select a provider type."
    return e
  }

  function validateStep3(s: VehicleRentalFormState): FieldErrors {
    const e: FieldErrors = {}
    if (!s.nicFront) e.nicFront = "NIC front image is required."
    if (!s.nicBack) e.nicBack = "NIC back image is required."
    if (s.providerType === "SAFARI_JEEP" && !s.safariJeepLicense) {
      e.safariJeepLicense =
        "Government-issued safari jeep license is required."
    }
    return e
  }

  function onNext() {
    if (step === 1) {
      const e = validateStep1(form)
      setErrors(e)
      if (Object.keys(e).length === 0) setStep(2)
    } else if (step === 2) {
      const e = validateStep2(form)
      setErrors(e)
      if (Object.keys(e).length === 0) setStep(3)
    } else if (step === 3) {
      const e = validateStep3(form)
      setErrors(e)
      if (Object.keys(e).length === 0) setStep(4)
    }
  }

  async function submitApplication() {
    // Final validation
    const e: FieldErrors = {
      ...validateStep1(form),
      ...validateStep2(form),
      ...validateStep3(form),
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    try {
      // Backend endpoint will be wired in a later step. For now we just gather
      // the payload as multipart/form-data so swapping in a fetch is one-liner.
      const body = new FormData()
      body.set("fullName", form.fullName)
      body.set("mobileNumber", `+94${form.mobileNumber}`)
      body.set("whatsappAvailable", String(form.whatsappAvailable))
      body.set("contactEmail", effectiveEmail)
      body.set("usesAccountEmail", String(form.useAccountEmail))
      body.set("hasBusiness", String(form.hasBusiness))
      if (form.hasBusiness) {
        body.set("businessName", form.businessName)
        body.set("businessDescription", form.businessDescription)
      }
      body.set("providerType", form.providerType)
      if (form.nicFront) body.set("nicFront", form.nicFront)
      if (form.nicBack) body.set("nicBack", form.nicBack)
      if (form.brdDocument) body.set("brdDocument", form.brdDocument)
      if (form.safariJeepLicense)
        body.set("safariJeepLicense", form.safariJeepLicense)

      const saved = await transportProviderService.apply(body)
      setExistingApp(saved)
      setAlertConfig({
        open: true,
        title: "Application Submitted",
        description:
          "Thanks! We'll review your application and get back to you by email.",
        type: "success",
      })
    } catch (err) {
      console.error(err)
      setAlertConfig({
        open: true,
        title: "Submission Failed",
        description: `Something went wrong: ${getApiErrorMessage(err)}`,
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- derived ----------

  const nicFrontFiles = useMemo(() => (form.nicFront ? [form.nicFront] : []), [form.nicFront])
  const nicBackFiles = useMemo(() => (form.nicBack ? [form.nicBack] : []), [form.nicBack])
  const brdFiles = useMemo(() => (form.brdDocument ? [form.brdDocument] : []), [form.brdDocument])
  const safariFiles = useMemo(
    () => (form.safariJeepLicense ? [form.safariJeepLicense] : []),
    [form.safariJeepLicense],
  )
  const nicFrontPreview = useFilePreviewUrl(form.nicFront)
  const nicBackPreview = useFilePreviewUrl(form.nicBack)
  const brdPreview = useFilePreviewUrl(form.brdDocument)
  const safariPreview = useFilePreviewUrl(form.safariJeepLicense)

  const selectedProvider = PROVIDER_OPTIONS.find((p) => p.id === form.providerType)

  // ---------- render: status gate ----------

  if (loadingApp) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  if (
    existingApp &&
    (existingApp.status === "PENDING" || existingApp.status === "APPROVED")
  ) {
    const isPending = existingApp.status === "PENDING"
    return (
      <div className="min-h-dvh w-full bg-zinc-50 p-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4">
            <Button asChild variant="outline" className="h-10 rounded-full bg-white px-4">
              <Link href="/become-a-partner" className="inline-flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-4xl bg-white p-8 shadow-xl ring-1 ring-zinc-200/70">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "grid size-14 place-items-center rounded-full",
                  isPending
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600",
                )}
              >
                {isPending ? (
                  <Sparkles className="size-7 animate-pulse" />
                ) : (
                  <CheckCircle2 className="size-7" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                  {isPending
                    ? "Application Under Review"
                    : "You're a verified transport partner"}
                </h1>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {isPending
                    ? "Your transport application is being reviewed. You can't submit another while this one is pending."
                    : "Your transport application has been approved."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryItem label="Provider type">
                {PROVIDER_OPTIONS.find((p) => p.id === existingApp.providerType)?.title ??
                  existingApp.providerType}
              </SummaryItem>
              <SummaryItem label="Full name">{existingApp.fullName}</SummaryItem>
              <SummaryItem label="Mobile">{existingApp.mobileNumber}</SummaryItem>
              <SummaryItem label="WhatsApp">
                {existingApp.whatsappAvailable ? "Yes" : "No"}
              </SummaryItem>
              <SummaryItem label="Contact email">{existingApp.contactEmail}</SummaryItem>
              {existingApp.hasBusiness && existingApp.businessName && (
                <SummaryItem label="Business">{existingApp.businessName}</SummaryItem>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                asChild
                className="h-11 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- render: form ----------

  return (
    <div className="min-h-dvh w-full bg-white">
      <div className="mx-auto w-full px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
          {/* Stepper */}
          <aside className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
            <div className="rounded-4xl bg-zinc-100/80 p-6 ring-1 ring-zinc-200/70">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-white ring-1 ring-zinc-200/80">
                  <div className="size-2 rounded-full bg-blue-600" aria-hidden />
                </div>
                <div className="text-sm font-semibold text-zinc-900">Ceylon Step</div>
              </div>

              <div className="relative mt-6">
                <div
                  className="absolute left-[18px] top-2 bottom-2 w-px bg-zinc-200"
                  aria-hidden
                />
                <div className="grid gap-7">
                  {[
                    { n: 1, title: "Your details", desc: "Name, contact, business" },
                    { n: 2, title: "Provider type", desc: "What service you offer" },
                    { n: 3, title: "Documents", desc: "NIC and licences" },
                    { n: 4, title: "Review", desc: "Confirm and submit" },
                  ].map((s) => {
                    const isActive = step === s.n
                    const isComplete = step > s.n
                    return (
                      <div key={s.n} className="relative flex items-start gap-4">
                        <div
                          className={cn(
                            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1",
                            isActive
                              ? "bg-zinc-950 text-white ring-zinc-950"
                              : isComplete
                                ? "bg-emerald-500 text-white ring-emerald-500"
                                : "bg-white text-zinc-900 ring-zinc-200/80",
                          )}
                        >
                          {isComplete ? <CheckCircle2 className="size-4" /> : s.n}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="text-sm font-semibold text-zinc-950">
                            {s.title}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500">
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="flex items-center justify-between gap-4">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full bg-white px-6"
              >
                <Link
                  href="/become-a-partner"
                  className="inline-flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              </Button>

              <button
                type="button"
                className="inline-flex h-11 items-center gap-3 rounded-full bg-white px-6 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200/80"
              >
                <span className="grid size-7 place-items-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                  V
                </span>
                Become a vehicle partner
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-b border-zinc-200/80 pb-6">
              <div className="text-xs text-zinc-500">Step {step}/4</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-sky-600 sm:text-3xl">
                    Vehicle partner registration
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Tell us about your service. We&apos;ll verify and activate your
                    listing.
                  </p>
                </div>
                {existingApp?.status === "REJECTED" && (
                  <div className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <X className="size-4" />
                      <span className="text-sm font-semibold">Application Rejected</span>
                    </div>
                    {existingApp.remark && (
                      <p className="mt-2 text-sm leading-6 text-red-600">
                        <span className="font-semibold">Reason:</span> {existingApp.remark}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-red-500">
                      Update the details and resubmit to try again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (step < 4) onNext()
                else void submitApplication()
              }}
              className="pt-6"
            >
              <FieldGroup className="bg-white p-0">
                {step === 1 && (
                  <Step1Details
                    form={form}
                    errors={errors}
                    setField={setField}
                    accountEmail={user?.email}
                  />
                )}

                {step === 2 && (
                  <Step2Provider
                    form={form}
                    errors={errors}
                    setField={setField}
                  />
                )}

                {step === 3 && (
                  <Step3Documents
                    form={form}
                    errors={errors}
                    setField={setField}
                    nicFrontFiles={nicFrontFiles}
                    nicBackFiles={nicBackFiles}
                    brdFiles={brdFiles}
                    safariFiles={safariFiles}
                  />
                )}

                {step === 4 && (
                  <Step4Review
                    form={form}
                    selectedProvider={selectedProvider}
                    effectiveEmail={effectiveEmail}
                    nicFrontPreview={nicFrontPreview}
                    nicBackPreview={nicBackPreview}
                    brdPreview={brdPreview}
                    safariPreview={safariPreview}
                  />
                )}

                {/* Footer actions */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-full sm:w-auto sm:min-w-32"
                      onClick={() =>
                        setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))
                      }
                    >
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 4 ? (
                    <Button
                      type="button"
                      className="group relative ml-auto h-11 w-full rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 sm:w-auto sm:min-w-48"
                      onClick={onNext}
                    >
                      {step === 1
                        ? "Choose provider type"
                        : step === 2
                          ? "Add documents"
                          : "Review application"}
                      <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                        <ArrowUpRight className="size-4" aria-hidden />
                      </span>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="group relative ml-auto h-11 w-full rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 disabled:opacity-60 sm:w-auto sm:min-w-48"
                    >
                      {submitting ? "Submitting…" : "Submit application"}
                      <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                        <ArrowUpRight className="size-4" aria-hidden />
                      </span>
                    </Button>
                  )}
                </div>
              </FieldGroup>
            </form>
          </main>
        </div>
      </div>

      <AlertDialog
        open={alertConfig.open}
        onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid size-10 place-items-center rounded-full",
                  alertConfig.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600",
                )}
              >
                {alertConfig.type === "success" ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <X className="size-6" />
                )}
              </div>
              <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="mt-2 text-base">
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className={cn(
                "rounded-full px-8",
                alertConfig.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700",
              )}
            >
              {alertConfig.type === "success" ? "Great!" : "Try again"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-950">{children}</div>
    </div>
  )
}

// ---------- Step 1: Your details ----------

function Step1Details({
  form,
  errors,
  setField,
  accountEmail,
}: {
  form: VehicleRentalFormState
  errors: FieldErrors
  setField: <K extends keyof VehicleRentalFormState>(
    key: K,
    value: VehicleRentalFormState[K],
  ) => void
  accountEmail: string | undefined
}) {
  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">Your details</div>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="hidden lg:block">
          <div className="rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
            <div className="text-sm font-semibold text-zinc-950">
              Why we ask this
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Travelers see your contact info to book directly. We never share it
              for marketing.
            </p>
            <div className="mt-4 grid gap-3 text-xs text-zinc-500">
              <div>
                <span className="font-semibold text-zinc-700">Mobile</span>: Sri
                Lanka only (+94) and 9 digits starting with 7.
              </div>
              <div>
                <span className="font-semibold text-zinc-700">Business</span>: optional
                — only fill it if you have a registered company.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel>Full name</FieldLabel>
            <FieldContent>
              <Input
                value={form.fullName}
                onChange={(ev) => setField("fullName", ev.target.value)}
                placeholder="Your full name"
                className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm sm:h-12 sm:px-4 sm:text-base"
                aria-invalid={!!errors.fullName}
              />
              <FieldError errors={[errors.fullName ? { message: errors.fullName } : undefined]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.mobileNumber}>
            <FieldLabel>Mobile number</FieldLabel>
            <FieldContent>
              <div className="flex h-10 w-full overflow-hidden rounded-full border border-zinc-200 bg-white ring-offset-white focus-within:ring-2 focus-within:ring-zinc-950/30 sm:h-12">
                <div className="flex shrink-0 items-center gap-2 border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 sm:px-4">
                  <span
                    className="relative size-5 overflow-hidden rounded-sm ring-1 ring-zinc-200"
                    aria-hidden
                  >
                    <img
                      src="https://flagcdn.com/w40/lk.png"
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">(+94)</span>
                </div>
                <Input
                  value={formatSriLankaMobileLocal(form.mobileNumber)}
                  onChange={(ev) =>
                    setField(
                      "mobileNumber",
                      normalizeSriLankaMobileLocal(ev.target.value),
                    )
                  }
                  placeholder="7X XXX XXXX"
                  inputMode="numeric"
                  maxLength={11}
                  className="h-full flex-1 rounded-none border-0 bg-white px-3 text-sm text-zinc-950 shadow-none focus-visible:ring-0 sm:px-4 sm:text-base"
                  aria-invalid={!!errors.mobileNumber}
                />
              </div>
              <FieldDescription>
                If this number is available on WhatsApp, it&apos;s best.
              </FieldDescription>
              <div className="mt-2 flex items-center gap-3">
                <Checkbox
                  checked={form.whatsappAvailable}
                  onCheckedChange={(checked) =>
                    setField("whatsappAvailable", checked === true)
                  }
                  id="whatsappAvailable"
                />
                <label
                  htmlFor="whatsappAvailable"
                  className="text-sm text-zinc-600"
                >
                  Available on WhatsApp
                </label>
              </div>
              <FieldError
                errors={[
                  errors.mobileNumber ? { message: errors.mobileNumber } : undefined,
                ]}
              />
            </FieldContent>
          </Field>

          {/* Email block — full width */}
          <div className="md:col-span-2">
            <Field data-invalid={!!errors.contactEmail}>
              <FieldLabel>Contact email</FieldLabel>
              <FieldContent>
                <div className="rounded-3xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="useAccountEmail"
                      checked={form.useAccountEmail}
                      disabled={!accountEmail}
                      onCheckedChange={(checked) =>
                        setField("useAccountEmail", checked === true)
                      }
                    />
                    <label
                      htmlFor="useAccountEmail"
                      className="grid gap-0.5 text-sm text-zinc-800"
                    >
                      <span className="font-medium">
                        Use my account email
                      </span>
                      <span className="text-xs text-zinc-500">
                        {accountEmail ? accountEmail : "Sign in to use this option."}
                      </span>
                    </label>
                  </div>

                  {(!form.useAccountEmail || !accountEmail) && (
                    <div className="mt-3">
                      <Input
                        type="email"
                        value={form.contactEmail}
                        onChange={(ev) =>
                          setField("contactEmail", ev.target.value)
                        }
                        placeholder="you@email.com"
                        className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm sm:h-12 sm:px-4 sm:text-base"
                        aria-invalid={!!errors.contactEmail}
                      />
                    </div>
                  )}
                </div>
                <FieldError
                  errors={[
                    errors.contactEmail ? { message: errors.contactEmail } : undefined,
                  ]}
                />
              </FieldContent>
            </Field>
          </div>

          {/* Business block */}
          <div className="md:col-span-2">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200/70">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">
                        Do you operate as a business?
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        Optional — tick this if you have a registered company.
                      </div>
                    </div>
                    <Checkbox
                      checked={form.hasBusiness}
                      onCheckedChange={(checked) =>
                        setField("hasBusiness", checked === true)
                      }
                      aria-label="I operate as a business"
                    />
                  </div>

                  {form.hasBusiness && (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field data-invalid={!!errors.businessName}>
                        <FieldLabel>Business name</FieldLabel>
                        <FieldContent>
                          <Input
                            value={form.businessName}
                            onChange={(ev) =>
                              setField("businessName", ev.target.value)
                            }
                            placeholder="e.g. Lanka Safari Hire"
                            className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm sm:h-12 sm:px-4 sm:text-base"
                            aria-invalid={!!errors.businessName}
                          />
                          <FieldError
                            errors={[
                              errors.businessName
                                ? { message: errors.businessName }
                                : undefined,
                            ]}
                          />
                        </FieldContent>
                      </Field>

                      <div className="md:col-span-2">
                        <Field data-invalid={!!errors.businessDescription}>
                          <FieldLabel>Business description</FieldLabel>
                          <FieldContent>
                            <Textarea
                              value={form.businessDescription}
                              onChange={(ev) =>
                                setField("businessDescription", ev.target.value)
                              }
                              placeholder="Briefly describe what your business offers — fleet size, types of vehicles, areas you cover…"
                              className="min-h-24 rounded-3xl border border-zinc-200 bg-white px-3 py-3 text-sm sm:text-base"
                              aria-invalid={!!errors.businessDescription}
                            />
                            <FieldError
                              errors={[
                                errors.businessDescription
                                  ? { message: errors.businessDescription }
                                  : undefined,
                              ]}
                            />
                          </FieldContent>
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ---------- Step 2: Provider type ----------

function Step2Provider({
  form,
  errors,
  setField,
}: {
  form: VehicleRentalFormState
  errors: FieldErrors
  setField: <K extends keyof VehicleRentalFormState>(
    key: K,
    value: VehicleRentalFormState[K],
  ) => void
}) {
  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">Choose provider type</div>
      <p className="mt-1 text-sm text-zinc-500">
        Pick the option that best matches what you offer. You can update this later.
      </p>

      {errors.providerType && (
        <div className="mt-3 rounded-3xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {errors.providerType}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDER_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const active = form.providerType === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setField("providerType", opt.id)}
              className={cn(
                "group relative overflow-hidden rounded-4xl p-5 text-left ring-1 transition",
                active
                  ? "bg-zinc-950 text-white ring-zinc-950 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.55)]"
                  : "bg-white text-zinc-900 ring-zinc-200/70 hover:-translate-y-0.5 hover:ring-zinc-400",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-2xl ring-1",
                    active
                      ? "bg-white/10 text-white ring-white/20"
                      : "bg-zinc-100 text-zinc-800 ring-zinc-200/70",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold tracking-tight">
                    {opt.title}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-xs font-semibold uppercase tracking-wider",
                      active ? "text-white/70" : "text-zinc-500",
                    )}
                  >
                    {opt.tagline}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-6",
                      active ? "text-white/80" : "text-zinc-600",
                    )}
                  >
                    {opt.description}
                  </p>
                </div>
              </div>

              {active && (
                <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-white text-zinc-950">
                  <CheckCircle2 className="size-4" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {form.providerType === "SAFARI_JEEP" && (
        <div className="mt-5 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 text-amber-600" />
            <div>
              <div className="font-semibold">Heads up</div>
              <div className="mt-1 text-amber-800">
                Safari jeep operators must upload the government-issued safari
                jeep licence in the next step. You won&apos;t be listed without it.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------- Step 3: Documents ----------

function Step3Documents({
  form,
  errors,
  setField,
  nicFrontFiles,
  nicBackFiles,
  brdFiles,
  safariFiles,
}: {
  form: VehicleRentalFormState
  errors: FieldErrors
  setField: <K extends keyof VehicleRentalFormState>(
    key: K,
    value: VehicleRentalFormState[K],
  ) => void
  nicFrontFiles: File[]
  nicBackFiles: File[]
  brdFiles: File[]
  safariFiles: File[]
}) {
  const showBrd = form.hasBusiness
  const showSafari = form.providerType === "SAFARI_JEEP"

  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">Upload documents</div>
      <p className="mt-1 text-sm text-zinc-500">
        Files should be clear photos or PDFs. Max 10 MB each.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <DocSlot
          label="NIC front"
          required
          files={nicFrontFiles}
          error={errors.nicFront}
          onChange={(f) => setField("nicFront", f)}
        />
        <DocSlot
          label="NIC back"
          required
          files={nicBackFiles}
          error={errors.nicBack}
          onChange={(f) => setField("nicBack", f)}
        />

        {showSafari && (
          <DocSlot
            label="Safari jeep licence (govt)"
            required
            description="Government-issued licence for your safari jeep service."
            files={safariFiles}
            error={errors.safariJeepLicense}
            onChange={(f) => setField("safariJeepLicense", f)}
          />
        )}

        {showBrd && (
          <DocSlot
            label="Business Registration (BRD)"
            description="Optional. Helps speed up verification."
            files={brdFiles}
            onChange={(f) => setField("brdDocument", f)}
          />
        )}
      </div>
    </>
  )
}

function DocSlot({
  label,
  description,
  required,
  files,
  error,
  onChange,
}: {
  label: string
  description?: string
  required?: boolean
  files: File[]
  error?: string
  onChange: (file: File | null) => void
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </FieldLabel>
      <FieldContent>
        <FileUpload
          maxFiles={1}
          maxSize={10 * 1024 * 1024}
          className="w-full"
          value={files}
          onValueChange={(next) => onChange(next[0] ?? null)}
        >
          <FileUploadDropzone>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
                <Upload className="size-6 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-900">Upload file</p>
              <p className="text-xs text-zinc-500">JPG, PNG or PDF up to 10MB</p>
            </div>
            <FileUploadTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 rounded-full"
              >
                Browse files
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>
          <FileUploadList>
            {files.map((file, idx) => (
              <FileUploadItem key={idx} value={file}>
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handlePreview(file)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <FileUploadItemDelete asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                    >
                      <X className="size-4" />
                    </Button>
                  </FileUploadItemDelete>
                </div>
              </FileUploadItem>
            ))}
          </FileUploadList>
        </FileUpload>

        {description && (
          <FieldDescription>{description}</FieldDescription>
        )}
        <FieldError errors={[error ? { message: error } : undefined]} />
      </FieldContent>
    </Field>
  )
}

// ---------- Step 4: Review ----------

function Step4Review({
  form,
  selectedProvider,
  effectiveEmail,
  nicFrontPreview,
  nicBackPreview,
  brdPreview,
  safariPreview,
}: {
  form: VehicleRentalFormState
  selectedProvider:
    | (typeof PROVIDER_OPTIONS)[number]
    | undefined
  effectiveEmail: string
  nicFrontPreview: string | null
  nicBackPreview: string | null
  brdPreview: string | null
  safariPreview: string | null
}) {
  const docs: Array<{
    label: string
    file: File | null
    preview: string | null
  }> = [
    { label: "NIC front", file: form.nicFront, preview: nicFrontPreview },
    { label: "NIC back", file: form.nicBack, preview: nicBackPreview },
  ]
  if (form.providerType === "SAFARI_JEEP") {
    docs.push({
      label: "Safari licence",
      file: form.safariJeepLicense,
      preview: safariPreview,
    })
  }
  if (form.hasBusiness) {
    docs.push({
      label: "Business registration",
      file: form.brdDocument,
      preview: brdPreview,
    })
  }

  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">Review application</div>
      <p className="mt-1 text-sm text-zinc-500">
        Make sure everything looks right. You can go back to fix anything.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
          <div className="text-sm font-semibold text-zinc-950">Before you submit</div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            We&apos;ll review your application and reach out by email. Most reviews
            take 1–3 business days.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.35)] ring-1 ring-zinc-200/80">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Full name", form.fullName],
              [
                "Mobile",
                form.mobileNumber
                  ? `+94 ${formatSriLankaMobileLocal(form.mobileNumber)}`
                  : "—",
              ],
              ["WhatsApp", form.whatsappAvailable ? "Yes" : "No"],
              ["Contact email", effectiveEmail || "—"],
              [
                "Provider type",
                selectedProvider ? selectedProvider.title : "—",
              ],
              [
                "Business",
                form.hasBusiness ? form.businessName || "—" : "Individual",
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {String(label)}
                </div>
                <div className="mt-2 text-sm font-medium text-zinc-950">
                  {String(value || "—")}
                </div>
              </div>
            ))}
          </div>

          {form.hasBusiness && form.businessDescription && (
            <div className="mt-4 rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Business description
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                {form.businessDescription}
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {docs.map((doc) => (
              <div
                key={doc.label}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70"
              >
                <div className="px-3 py-2 text-xs font-semibold text-zinc-950">
                  {doc.label}
                </div>
                <div className="border-t border-zinc-200/70 bg-zinc-50 p-2">
                  {doc.preview ? (
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl ring-1 ring-zinc-200/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.preview}
                        alt={doc.label}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : doc.file ? (
                    <div className="grid aspect-4/3 place-items-center rounded-xl bg-white p-3 text-center text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                      <div>
                        <div className="font-medium text-zinc-700">{doc.file.name}</div>
                        <div className="mt-1 text-[0.65rem] uppercase tracking-wider text-zinc-400">
                          Document
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid aspect-4/3 place-items-center rounded-xl bg-white p-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                      Not provided
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
