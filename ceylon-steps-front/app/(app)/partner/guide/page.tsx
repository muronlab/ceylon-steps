"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { 
  Upload, 
  X, 
  Download, 
  Eye, 
  ArrowLeft, 
  ArrowUpRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import Image from "next/image"

import apiClient from "@/services/api-client"
import { getApiErrorMessage } from "@/services/error-handler"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


type GuideCategory = "Area" | "Site" | "Chauffeur" | "National"

type GuideFormState = {
  fullName: string
  displayName: string
  category: GuideCategory | ""
  mobileNumber: string
  whatsappAvailable: boolean
  address: string
  nicNumber: string
  registrationNo: string
  email: string
  guideLicenseExpiryDate: string
  nicFront: File | null
  nicBack: File | null
  guideLicenseFront: File | null
  guideLicenseBack: File | null
}

type FieldErrors = Partial<Record<keyof GuideFormState, string>>

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function normalizeSriLankaMobileLocal(value: string) {
  // Store only the local mobile part (no leading 0 / +94), digits only.
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""

  // Handle common pasted formats: 0XXXXXXXXX, 94XXXXXXXXX, +94XXXXXXXXX
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
  // Local part must be 9 digits starting with 7: 7XXXXXXXX
  return /^7\d{8}$/.test(value)
}

function toIsoDateString(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function fromIsoDateString(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  // Interpret as local date (avoid timezone shift).
  return new Date(`${value}T00:00:00`)
}

function validateOneField(
  key: keyof GuideFormState,
  next: GuideFormState
): string | undefined {
  switch (key) {
    case "fullName":
      return next.fullName.trim() ? undefined : "Full name is required."
    case "displayName":
      return next.displayName.trim() ? undefined : "Display name is required."
    case "category":
      return undefined // Optional
    case "mobileNumber":
      if (!next.mobileNumber.trim()) return "Mobile number is required."
      return validateSriLankaMobileLocal(next.mobileNumber)
        ? undefined
        : "Enter a valid Sri Lanka mobile number (starts with 7 and has 9 digits)."
    case "address":
      return next.address.trim() ? undefined : "Address is required."
    case "nicNumber":
      return next.nicNumber.trim() ? undefined : "NIC number is required."
    case "registrationNo":
      return undefined // Optional
    case "email": {
      if (!next.email.trim()) return "Email is required."
      return isLikelyEmail(next.email) ? undefined : "Please enter a valid email address."
    }
    case "guideLicenseExpiryDate":
      return undefined // Optional
    case "nicFront":
      return next.nicFront ? undefined : "NIC front image is required."
    case "nicBack":
      return next.nicBack ? undefined : "NIC back image is required."
    case "guideLicenseFront":
      return undefined // Optional
    case "guideLicenseBack":
      return undefined // Optional
    case "whatsappAvailable":
      return undefined
    default:
      return undefined
  }
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

export default function PartnerGuidePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [licenseDateOpen, setLicenseDateOpen] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState<GuideFormState>({
    fullName: "",
    displayName: "",
    category: "",
    mobileNumber: "",
    whatsappAvailable: false,
    address: "",
    nicNumber: "",
    registrationNo: "",
    email: "",
    guideLicenseExpiryDate: "",
    nicFront: null,
    nicBack: null,
    guideLicenseFront: null,
    guideLicenseBack: null,
  })

  const [alertConfig, setAlertConfig] = useState<{
    open: boolean
    title: string
    description: string
    type: "success" | "error"
  }>({
    open: false,
    title: "",
    description: "",
    type: "success",
  })

  const [appStatus, setAppStatus] = useState<any>(null)
  const [loadingApp, setLoadingApp] = useState(true)

  useEffect(() => {
    async function checkApp() {
      try {
        const res = await apiClient.get("/partner/guide/me")
        setAppStatus(res.data)
        if (res.data && res.data.status === "REJECTED") {
          // Pre-fill form if rejected
          setForm({
            fullName: res.data.fullName || "",
            displayName: res.data.displayName || "",
            category: res.data.category || "",
            mobileNumber: res.data.mobileNumber?.replace("+94", "") || "",
            whatsappAvailable: res.data.whatsappAvailable || false,
            address: res.data.address || "",
            nicNumber: res.data.nicNumber || "",
            registrationNo: res.data.registrationNo || "",
            email: res.data.email || "",
            guideLicenseExpiryDate: res.data.guideLicenseExpiryDate ? toIsoDateString(new Date(res.data.guideLicenseExpiryDate)) : "",
            nicFront: null,
            nicBack: null,
            guideLicenseFront: null,
            guideLicenseBack: null,
          })
        }
      } catch (err) {
        console.error("Failed to fetch app status", err)
      } finally {
        setLoadingApp(false)
      }
    }
    checkApp()
  }, [])

  const licenseExpiryDate = useMemo(
    () => fromIsoDateString(form.guideLicenseExpiryDate),
    [form.guideLicenseExpiryDate]
  )

  const nicFrontFiles = useMemo(() => (form.nicFront ? [form.nicFront] : []), [form.nicFront])
  const nicBackFiles = useMemo(() => (form.nicBack ? [form.nicBack] : []), [form.nicBack])

  const guideLicenseFrontFiles = useMemo(
    () => (form.guideLicenseFront ? [form.guideLicenseFront] : []),
    [form.guideLicenseFront]
  )
  const guideLicenseBackFiles = useMemo(
    () => (form.guideLicenseBack ? [form.guideLicenseBack] : []),
    [form.guideLicenseBack]
  )

  const nicFrontPreview = useFilePreviewUrl(form.nicFront)
  const nicBackPreview = useFilePreviewUrl(form.nicBack)
  const licenseFrontPreview = useFilePreviewUrl(form.guideLicenseFront)
  const licenseBackPreview = useFilePreviewUrl(form.guideLicenseBack)

  const handleDownload = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  function setField<K extends keyof GuideFormState>(
    key: K,
    value: GuideFormState[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      setErrors((curr) => {
        if (!curr[key]) return curr
        const message = validateOneField(key, next)
        if (!message) {
          const { [key]: _, ...rest } = curr
          return rest
        }
        return { ...curr, [key]: message }
      })
      return next
    })
  }

  const uploadSummary = useMemo(() => {
    const items: Array<{ label: string; file: File | null }> = [
      { label: "NIC front", file: form.nicFront },
      { label: "NIC back", file: form.nicBack },
      { label: "License front", file: form.guideLicenseFront },
      { label: "License back", file: form.guideLicenseBack },
    ]

    return items
      .filter((i) => i.file)
      .map((i) => `${i.label}: ${i.file?.name}`)
      .join(" • ")
  }, [form.guideLicenseBack, form.guideLicenseFront, form.nicBack, form.nicFront])

  function validateStep1(next: GuideFormState): FieldErrors {
    const e: FieldErrors = {}

    if (!next.fullName.trim()) e.fullName = "Full name is required."
    if (!next.displayName.trim()) e.displayName = "Display name is required."

    // Category, Registration No, and License Expiry are now optional.

    if (!next.mobileNumber.trim()) e.mobileNumber = "Mobile number is required."
    else if (!validateSriLankaMobileLocal(next.mobileNumber)) {
      e.mobileNumber = "Enter a valid Sri Lanka mobile number (starts with 7 and has 9 digits)."
    }
    if (!next.address.trim()) e.address = "Address is required."
    if (!next.nicNumber.trim()) e.nicNumber = "NIC number is required."
    if (!next.email.trim()) e.email = "Email is required."
    else if (!isLikelyEmail(next.email)) e.email = "Please enter a valid email address."

    return e
  }

  function validateAll(next: GuideFormState): FieldErrors {
    const e: FieldErrors = {}

    Object.assign(e, validateStep1(next))
    if (!next.nicFront && !appStatus?.nicFrontUrl) e.nicFront = "NIC front image is required."
    if (!next.nicBack && !appStatus?.nicBackUrl) e.nicBack = "NIC back image is required."
    // Guide license images are optional


    return e
  }

  function onNext() {
    const nextErrors = validateStep1(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStep(2)
  }

  function onNextDocuments() {
    const nextErrors = validateAll(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStep(3)
  }

  async function submitApplication() {
    const body = new FormData()
    body.set("fullName", form.fullName)
    body.set("displayName", form.displayName)
    body.set("category", form.category)
    body.set("mobileNumber", form.mobileNumber ? `+94${form.mobileNumber}` : "")
    body.set("whatsappAvailable", String(form.whatsappAvailable))
    body.set("address", form.address)
    body.set("nicNumber", form.nicNumber)
    body.set("registrationNo", form.registrationNo)
    body.set("email", form.email)
    body.set("guideLicenseExpiryDate", form.guideLicenseExpiryDate)
    if (form.nicFront) body.set("nicFront", form.nicFront)
    if (form.nicBack) body.set("nicBack", form.nicBack)
    if (form.guideLicenseFront) body.set("guideLicenseFront", form.guideLicenseFront)
    if (form.guideLicenseBack) body.set("guideLicenseBack", form.guideLicenseBack)

    try {
      setSubmitting(true)
      await apiClient.post("/partner/guide/apply", body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setForm({
        fullName: "",
        displayName: "",
        category: "",
        mobileNumber: "",
        whatsappAvailable: false,
        address: "",
        nicNumber: "",
        registrationNo: "",
        email: "",
        guideLicenseExpiryDate: "",
        nicFront: null,
        nicBack: null,
        guideLicenseFront: null,
        guideLicenseBack: null,
      })
      setErrors({})
      setStep(1)
      setAlertConfig({
        open: true,
        title: "Application Submitted",
        description: "Submitted successfully. We’ll review and get back to you.",
        type: "success",
      })
    } catch (err) {
      console.error(err)
      const msg = getApiErrorMessage(err)
      setAlertConfig({
        open: true,
        title: "Submission Failed",
        description: `Something went wrong: ${msg}`,
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingApp) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  if (appStatus && (appStatus.status === "PENDING" || appStatus.status === "APPROVED")) {
    const isPending = appStatus.status === "PENDING"
    const submittedAt = appStatus.createdAt ? new Date(appStatus.createdAt).toLocaleString() : null
    const updatedAt = appStatus.updatedAt ? new Date(appStatus.updatedAt).toLocaleString() : null
    const licenseExpiry = appStatus.guideLicenseExpiryDate
      ? new Date(appStatus.guideLicenseExpiryDate).toLocaleDateString()
      : "-"

    const detailRows: Array<[string, string]> = [
      ["Full name", appStatus.fullName || "-"],
      ["Display name", appStatus.displayName || "-"],
      ["Category", appStatus.category || "-"],
      ["Mobile", appStatus.mobileNumber || "-"],
      ["WhatsApp", appStatus.whatsappAvailable ? "Yes" : "No"],
      ["Email", appStatus.email || "-"],
      ["NIC number", appStatus.nicNumber || "-"],
      ["Registration no", appStatus.registrationNo || "-"],
      ["License expiry", licenseExpiry],
    ]

    const documents: Array<{ label: string; url: string | null }> = [
      { label: "NIC front", url: appStatus.nicFrontUrl ?? null },
      { label: "NIC back", url: appStatus.nicBackUrl ?? null },
      { label: "License front", url: appStatus.guideLicenseFrontUrl ?? null },
      { label: "License back", url: appStatus.guideLicenseBackUrl ?? null },
    ]

    return (
      <div className="min-h-dvh w-full bg-zinc-50">
        <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Button asChild variant="outline" className="h-11 rounded-full bg-white px-6">
              <Link href="/become-a-partner" className="inline-flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            {!isPending && (
              <Button asChild className="h-11 rounded-full bg-zinc-950 px-6 text-sm font-semibold">
                <Link href="/partner-dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>

          <div className="mt-6 rounded-4xl bg-white p-6 shadow-xl ring-1 ring-zinc-200/70 sm:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "grid size-14 place-items-center rounded-full",
                    isPending ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}
                >
                  {isPending ? <Sparkles className="size-7 animate-pulse" /> : <CheckCircle2 className="size-7" />}
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                    {isPending ? "Application Under Review" : "You are a Verified Guide!"}
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {isPending
                      ? "Your guide application is being reviewed. You can't submit another while this one is pending."
                      : "Your guide application has been approved. You can't submit another application."}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  isPending
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                )}
              >
                {isPending ? "Pending" : "Approved"}
              </span>
            </div>

            {(submittedAt || updatedAt) && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
                {submittedAt && (
                  <span>
                    <span className="font-semibold text-zinc-700">Submitted:</span> {submittedAt}
                  </span>
                )}
                {updatedAt && updatedAt !== submittedAt && (
                  <span>
                    <span className="font-semibold text-zinc-700">Last updated:</span> {updatedAt}
                  </span>
                )}
              </div>
            )}

            <div className="mt-8">
              <div className="text-sm font-semibold text-zinc-950">Submitted details</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                    <div className="mt-2 text-sm font-medium text-zinc-950">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Address</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{appStatus.address || "-"}</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm font-semibold text-zinc-950">Submitted documents</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {documents.map((doc) => (
                  <div key={doc.label} className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70">
                    <div className="px-4 py-3 text-xs font-semibold text-zinc-950">{doc.label}</div>
                    <div className="border-t border-zinc-200/70 bg-zinc-50 p-3">
                      {doc.url ? (
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl ring-1 ring-zinc-200/70">
                          <Image
                            src={doc.url}
                            alt={doc.label}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 320px"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white p-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                          Not provided
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Array.isArray(appStatus.statusHistory) && appStatus.statusHistory.length > 0 && (
              <div className="mt-8">
                <div className="text-sm font-semibold text-zinc-950">Status history</div>
                <div className="mt-4 grid gap-3">
                  {appStatus.statusHistory.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-4 rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-950">{entry.status}</div>
                        {entry.remark && <div className="mt-1 text-sm text-zinc-600">{entry.remark}</div>}
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="h-11 rounded-full px-6 text-sm font-semibold">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full bg-white">
      <div className="mx-auto w-full px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
          {/* Left stepper panel */}
          <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-4xl bg-zinc-100/80 p-6 ring-1 ring-zinc-200/70">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-white ring-1 ring-zinc-200/80">
                  <div className="size-2 rounded-full bg-blue-600" aria-hidden />
                </div>
                <div className="text-sm font-semibold text-zinc-900">Ceylon Step</div>
              </div>

              <div className="mt-6 relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-px bg-zinc-200" aria-hidden />
                <div className="grid gap-7">
                  {[
                    { n: 1, title: "Your details", desc: "Provide your contact information" },
                    { n: 2, title: "Documents", desc: "Upload NIC and license photos" },
                    { n: 3, title: "Review", desc: "Check your information" },
                    { n: 4, title: "Confirm", desc: "Agree and confirm" },
                    { n: 5, title: "Submit", desc: "Send application" },
                    { n: 6, title: "Done", desc: "Overview" },
                  ].map((s) => {
                    const activeStep = step
                    const isActive = activeStep === s.n
                    return (
                      <div key={s.n} className="relative flex items-start gap-4">
                        <div
                          className={[
                            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1",
                            isActive
                              ? "bg-zinc-950 text-white ring-zinc-950"
                              : "bg-white text-zinc-900 ring-zinc-200/80",
                          ].join(" ")}
                        >
                          {s.n}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="text-sm font-semibold text-zinc-950">{s.title}</div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500">{s.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <div className="flex items-center justify-between gap-4">
              <Button asChild variant="outline" className="h-11 rounded-full bg-white px-6">
                <Link href="/become-a-partner" className="inline-flex items-center gap-2">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              </Button>

              <button
                type="button"
                className="inline-flex h-11 items-center gap-3 rounded-full bg-white px-6 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200/80"
              >
                <span className="grid size-7 place-items-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                  G
                </span>
                Become a guide

              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-b border-zinc-200/80 pb-6">
              <div className="text-xs text-zinc-500">Step {step}/6</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-sky-600 sm:text-3xl">
                    Guide registration form
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Provide your information below. We’ll verify and activate your guide profile.
                  </p>
                </div>
                {appStatus?.status === "REJECTED" && (
                  <div className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle className="size-5" />
                      <span className="text-sm font-semibold">Application Rejected</span>
                    </div>
                    {appStatus.remark && (
                      <p className="mt-2 text-sm text-red-600 leading-6">
                        <span className="font-semibold">Reason:</span> {appStatus.remark}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-red-500">
                      Please correct the issues and resubmit your application.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (step === 1) return onNext()
                if (step === 2) return onNextDocuments()
                void submitApplication()
              }}
              className="pt-6"
            >
              <FieldGroup className="bg-white p-0">
                <div className="text-sm font-semibold text-zinc-950">
                  {step === 1 ? "Your details" : step === 2 ? "Upload documents" : "Review application"}
                </div>

                {step === 1 ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
                      <div className="hidden lg:block rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
                        <div className="text-sm font-semibold text-zinc-950">
                          Customized guide profile
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          Provide accurate details so travelers can find you easily. Your
                          application will be reviewed before publishing.
                        </p>
                        <div className="mt-4 grid gap-3 text-xs text-zinc-500">
                          <div>
                            <span className="font-semibold text-zinc-700">Mobile</span>: Sri Lanka only
                            (+94) and 9 digits starting with 7.
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-700">License</span>: expiry date must be
                            today or a future date.
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-700">Display name</span>: shown publicly.
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
                              className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base"
                              aria-invalid={!!errors.fullName}
                            />
                            <FieldError errors={[errors.fullName ? { message: errors.fullName } : undefined]} />
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.displayName}>
                          <FieldLabel>Display name</FieldLabel>
                          <FieldContent>
                            <Input
                              value={form.displayName}
                              onChange={(ev) => setField("displayName", ev.target.value)}
                              placeholder="Name shown to travelers"
                              className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base"
                              aria-invalid={!!errors.displayName}
                            />
                            <FieldDescription>Example: “Kasun (Kandy Guide)”</FieldDescription>
                            <FieldError
                              errors={[
                                errors.displayName ? { message: errors.displayName } : undefined,
                              ]}
                            />
                          </FieldContent>
                        </Field>

                        {/* Category moved down */}


                        <Field data-invalid={!!errors.mobileNumber}>
                          <FieldLabel>Mobile number</FieldLabel>
                          <FieldContent>
                            <div className="flex h-10 sm:h-12 w-full overflow-hidden rounded-full border border-zinc-200 bg-white ring-offset-white focus-within:ring-2 focus-within:ring-zinc-950/30">
                              <div className="flex shrink-0 items-center gap-2 border-r border-zinc-200 bg-zinc-50 px-3 sm:px-4 text-sm font-medium text-zinc-700">
                                <span className="relative size-5 overflow-hidden rounded-sm ring-1 ring-zinc-200" aria-hidden>
                                  <img
                                    src="https://flagcdn.com/w40/lk.png"
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                </span>
                                <span className="text-sm font-semibold text-zinc-900">
                                  (+94)
                                </span>
                              </div>
                              <Input
                                value={formatSriLankaMobileLocal(form.mobileNumber)}
                                onChange={(ev) =>
                                  setField(
                                    "mobileNumber",
                                    normalizeSriLankaMobileLocal(ev.target.value)
                                  )
                                }
                                placeholder="7X XXX XXXX"
                                inputMode="numeric"
                                maxLength={11}
                                className="h-full flex-1 rounded-none border-0 bg-white px-3 sm:px-4 text-sm sm:text-base text-zinc-950 shadow-none focus-visible:ring-0"
                                aria-invalid={!!errors.mobileNumber}
                              />
                            </div>
                            <FieldDescription>
                              If this number is available on WhatsApp, it’s best.
                            </FieldDescription>
                            <div className="mt-2 flex items-center gap-3">
                              <Checkbox
                                checked={form.whatsappAvailable}
                                onCheckedChange={(checked) =>
                                  setField("whatsappAvailable", checked === true)
                                }
                                id="whatsappAvailable"
                              />
                              <label htmlFor="whatsappAvailable" className="text-sm text-zinc-600">
                                Available on WhatsApp
                              </label>
                            </div>
                            <FieldError errors={[errors.mobileNumber ? { message: errors.mobileNumber } : undefined]} />
                          </FieldContent>
                        </Field>



                        <Field data-invalid={!!errors.email}>
                          <FieldLabel>Email</FieldLabel>
                          <FieldContent>
                            <Input
                              value={form.email}
                              onChange={(ev) => setField("email", ev.target.value)}
                              placeholder="you@email.com"
                              type="email"
                              className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base"
                              aria-invalid={!!errors.email}
                            />
                            <FieldError errors={[errors.email ? { message: errors.email } : undefined]} />
                          </FieldContent>
                        </Field>


                        <Field data-invalid={!!errors.nicNumber}>
                          <FieldLabel>NIC number</FieldLabel>
                          <FieldContent>
                            <Input
                              value={form.nicNumber}
                              onChange={(ev) => setField("nicNumber", ev.target.value)}
                              placeholder="NIC number"
                              className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base"
                              aria-invalid={!!errors.nicNumber}
                            />
                            <FieldError
                              errors={[
                                errors.nicNumber ? { message: errors.nicNumber } : undefined,
                              ]}
                            />
                          </FieldContent>
                        </Field>
                        <div className="md:col-span-2">
                          <Field data-invalid={!!errors.address}>
                            <FieldLabel>Address</FieldLabel>
                            <FieldContent>
                              <Textarea
                                value={form.address}
                                onChange={(ev) => setField("address", ev.target.value)}
                                placeholder="Your address"
                                className="min-h-20 sm:min-h-24 rounded-3xl border border-zinc-200 bg-white px-3 sm:px-4 py-3 text-sm sm:text-base"
                                aria-invalid={!!errors.address}
                              />
                              <FieldError errors={[errors.address ? { message: errors.address } : undefined]} />
                            </FieldContent>
                          </Field>
                        </div>

                        <Field data-invalid={!!errors.category}>
                          <FieldLabel>Select guide type (optional)</FieldLabel>
                          <FieldContent>
                            <Select
                              value={form.category}
                              onValueChange={(value) =>
                                setField("category", value as GuideCategory)
                              }
                            >
                              <SelectTrigger className="h-10 sm:h-12 w-full rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base text-zinc-950">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Area">Area</SelectItem>
                                <SelectItem value="Site">Site</SelectItem>
                                <SelectItem value="Chauffeur">Chauffeur</SelectItem>
                                <SelectItem value="National">National</SelectItem>
                              </SelectContent>
                            </Select>
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.registrationNo}>
                          <FieldLabel>Registration number (optional)</FieldLabel>
                          <FieldContent>
                            <Input
                              value={form.registrationNo}
                              onChange={(ev) =>
                                setField("registrationNo", ev.target.value)
                              }
                              placeholder="Registration number"
                              className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white px-3 sm:px-4 text-sm sm:text-base text-zinc-950 shadow-none"
                            />
                          </FieldContent>
                        </Field>

                        <div className="md:col-span-2">
                          <Field data-invalid={!!errors.guideLicenseExpiryDate}>
                            <FieldLabel>Guide license expiry date (optional)</FieldLabel>
                            <FieldContent>
                              <Popover open={licenseDateOpen} onOpenChange={setLicenseDateOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    id="guideLicenseExpiryDate"
                                    className="h-10 sm:h-12 w-full justify-start rounded-full border border-zinc-200 bg-white px-3 sm:px-4 font-normal text-sm sm:text-base text-zinc-950 hover:bg-zinc-50"
                                  >
                                    {licenseExpiryDate
                                      ? licenseExpiryDate.toLocaleDateString()
                                      : "Select date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={licenseExpiryDate}
                                    defaultMonth={licenseExpiryDate ?? new Date()}
                                    captionLayout="dropdown"
                                    fromYear={new Date().getFullYear()}
                                    toYear={new Date().getFullYear() + 25}
                                    disabled={{ before: new Date() }}
                                    onSelect={(date) => {
                                      setField("guideLicenseExpiryDate", date ? toIsoDateString(date) : "")
                                      setLicenseDateOpen(false)
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                            </FieldContent>
                          </Field>
                        </div>
                      </div>
                    </div>

                    <div className="flex pt-2">
                      <Button
                        type="button"
                        className="group relative ml-auto h-11 w-fit min-w-32 rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900"
                        onClick={onNext}
                      >
                        Next
                        <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                          <ArrowUpRight className="size-4" aria-hidden />
                        </span>
                      </Button>
                    </div>
                  </>
                ) : step === 2 ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
                      <div className="rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-zinc-950">Documents</div>
                          <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
                            <Upload className="size-4" />
                            Uploads
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          Upload clear photos. Files should be readable and match the details you provided.
                        </p>
                        <div className="mt-4 grid gap-3 text-xs text-zinc-500">
                          <div>
                            <span className="font-semibold text-zinc-700">NIC front/back</span>: required
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-700">Guide license front/back</span>: optional
                          </div>
                          <div className="text-zinc-500">
                            Supported: JPG/PNG/WebP. Max 10MB each.
                          </div>
                        </div>
                        {uploadSummary ? (
                          <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200/70">
                            {uploadSummary}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field data-invalid={!!errors.nicFront}>
                          <FieldLabel>NIC front</FieldLabel>
                          <FieldContent>
                            <FileUpload
                              maxFiles={1}
                              maxSize={10 * 1024 * 1024}
                              className="w-full"
                              value={nicFrontFiles}
                              onValueChange={(files) =>
                                setField("nicFront", files[0] ?? null)
                              }
                            >
                              <FileUploadDropzone>
                                <div className="flex flex-col items-center gap-1 text-center">
                                  <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
                                    <Upload className="size-6 text-zinc-500" />
                                  </div>
                                  <p className="text-sm font-medium text-zinc-900">Upload files</p>
                                  <p className="text-xs text-zinc-500">With download and preview actions</p>
                                </div>
                                <FileUploadTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full">
                                    Browse files
                                  </Button>
                                </FileUploadTrigger>
                              </FileUploadDropzone>
                              <FileUploadList>
                                {nicFrontFiles.map((file, index) => (
                                  <FileUploadItem key={index} value={file}>
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
                                        <Button type="button" variant="ghost" size="icon" className="size-7">
                                          <X className="size-4" />
                                        </Button>
                                      </FileUploadItemDelete>
                                    </div>
                                  </FileUploadItem>
                                ))}
                              </FileUploadList>
                            </FileUpload>

                            <FieldError errors={[errors.nicFront ? { message: errors.nicFront } : undefined]} />
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.nicBack}>
                          <FieldLabel>NIC back</FieldLabel>
                          <FieldContent>
                            <FileUpload
                              maxFiles={1}
                              maxSize={10 * 1024 * 1024}
                              className="w-full"
                              value={nicBackFiles}
                              onValueChange={(files) =>
                                setField("nicBack", files[0] ?? null)
                              }
                            >
                              <FileUploadDropzone>
                                <div className="flex flex-col items-center gap-1 text-center">
                                  <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
                                    <Upload className="size-6 text-zinc-500" />
                                  </div>
                                  <p className="text-sm font-medium text-zinc-900">Upload files</p>
                                  <p className="text-xs text-zinc-500">With download and preview actions</p>
                                </div>
                                <FileUploadTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full">
                                    Browse files
                                  </Button>
                                </FileUploadTrigger>
                              </FileUploadDropzone>
                              <FileUploadList>
                                {nicBackFiles.map((file, index) => (
                                  <FileUploadItem key={index} value={file}>
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
                                        <Button type="button" variant="ghost" size="icon" className="size-7">
                                          <X className="size-4" />
                                        </Button>
                                      </FileUploadItemDelete>
                                    </div>
                                  </FileUploadItem>
                                ))}
                              </FileUploadList>
                            </FileUpload>

                            <FieldError errors={[errors.nicBack ? { message: errors.nicBack } : undefined]} />
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.guideLicenseFront}>
                          <FieldLabel>Guide license front (optional)</FieldLabel>
                          <FieldContent>
                            <FileUpload
                              maxFiles={1}
                              maxSize={10 * 1024 * 1024}
                              className="w-full"
                              value={guideLicenseFrontFiles}
                              onValueChange={(files) =>
                                setField("guideLicenseFront", files[0] ?? null)
                              }
                            >
                              <FileUploadDropzone>
                                <div className="flex flex-col items-center gap-1 text-center">
                                  <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
                                    <Upload className="size-6 text-zinc-500" />
                                  </div>
                                  <p className="text-sm font-medium text-zinc-900">Upload license front</p>
                                </div>
                                <FileUploadTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full">
                                    Browse files
                                  </Button>
                                </FileUploadTrigger>
                              </FileUploadDropzone>
                              <FileUploadList>
                                {guideLicenseFrontFiles.map((file, index) => (
                                  <FileUploadItem key={index} value={file}>
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
                                        <Button type="button" variant="ghost" size="icon" className="size-7">
                                          <X className="size-4" />
                                        </Button>
                                      </FileUploadItemDelete>
                                    </div>
                                  </FileUploadItem>
                                ))}
                              </FileUploadList>
                            </FileUpload>
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.guideLicenseBack}>
                          <FieldLabel>Guide license back (optional)</FieldLabel>
                          <FieldContent>
                            <FileUpload
                              maxFiles={1}
                              maxSize={10 * 1024 * 1024}
                              className="w-full"
                              value={guideLicenseBackFiles}
                              onValueChange={(files) =>
                                setField("guideLicenseBack", files[0] ?? null)
                              }
                            >
                              <FileUploadDropzone>
                                <div className="flex flex-col items-center gap-1 text-center">
                                  <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
                                    <Upload className="size-6 text-zinc-500" />
                                  </div>
                                  <p className="text-sm font-medium text-zinc-900">Upload license back</p>
                                </div>
                                <FileUploadTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full">
                                    Browse files
                                  </Button>
                                </FileUploadTrigger>
                              </FileUploadDropzone>
                              <FileUploadList>
                                {guideLicenseBackFiles.map((file, index) => (
                                  <FileUploadItem key={index} value={file}>
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
                                        <Button type="button" variant="ghost" size="icon" className="size-7">
                                          <X className="size-4" />
                                        </Button>
                                      </FileUploadItemDelete>
                                    </div>
                                  </FileUploadItem>
                                ))}
                              </FileUploadList>
                            </FileUpload>
                          </FieldContent>
                        </Field>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-full sm:w-auto sm:min-w-32"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        className="group relative h-11 w-full rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 sm:w-auto sm:min-w-48"
                      >
                        Review application
                        <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                          <ArrowUpRight className="size-4" aria-hidden />
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-full sm:w-auto sm:min-w-32"
                        onClick={() => {
                          setForm({
                            fullName: "",
                            displayName: "",
                            category: "",
                            mobileNumber: "",
                            whatsappAvailable: false,
                            address: "",
                            nicNumber: "",
                            registrationNo: "",
                            email: "",
                            guideLicenseExpiryDate: "",
                            nicFront: null,
                            nicBack: null,
                            guideLicenseFront: null,
                            guideLicenseBack: null,
                          })
                          setErrors({})
                          setStep(1)
                        }}
                      >
                        Clear form
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
                      <div className="rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
                        <div className="text-sm font-semibold text-zinc-950">Before you submit</div>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          Review your details below. If something is wrong, go back and edit it.
                          When you’re ready, submit your application.
                        </p>
                        <div className="mt-4 grid gap-3 text-xs text-zinc-500">
                          <div>
                            <span className="font-semibold text-zinc-700">Note</span>: This information will be
                            used for verification.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.35)] ring-1 ring-zinc-200/80">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                              Application
                            </div>
                            <div className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
                              Guide registration
                            </div>
                          </div>
                          <div className="text-right text-xs text-zinc-500">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-5">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[
                              ["Full name", form.fullName],
                              ["Display name", form.displayName],
                              ["Category", form.category || "-"],
                              ["Mobile", form.mobileNumber ? `+94 ${formatSriLankaMobileLocal(form.mobileNumber)}` : "-"],
                              ["WhatsApp", form.whatsappAvailable ? "Yes" : "No"],
                              ["Email", form.email],
                              ["License expiry", form.guideLicenseExpiryDate || "-"],
                              ["NIC number", form.nicNumber],
                              ["Registration no", form.registrationNo],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                  {String(label)}
                                </div>
                                <div className="mt-2 text-sm font-medium text-zinc-950">
                                  {String(value || "-")}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              Address
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                              {form.address || "-"}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                              { label: "NIC front", file: form.nicFront, preview: nicFrontPreview || appStatus?.nicFrontUrl },
                              { label: "NIC back", file: form.nicBack, preview: nicBackPreview || appStatus?.nicBackUrl },
                              { label: "License front", file: form.guideLicenseFront, preview: licenseFrontPreview || appStatus?.guideLicenseFrontUrl },
                              { label: "License back", file: form.guideLicenseBack, preview: licenseBackPreview || appStatus?.guideLicenseBackUrl },
                            ].map((f) => (
                              <div key={f.label} className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70">
                                <div className="px-4 py-3 text-xs font-semibold text-zinc-950">{f.label}</div>
                                <div className="border-t border-zinc-200/70 bg-zinc-50 p-3">
                                  {f.preview ? (
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl ring-1 ring-zinc-200/70">
                                      <Image
                                        src={f.preview}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 320px"
                                      />
                                    </div>
                                  ) : (
                                    <div className="rounded-xl bg-white p-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                                      {f.file ? f.file.name : "No file selected"}
                                    </div>
                                  )}
                                  {f.file ? (
                                    <div className="mt-2 text-xs text-zinc-500">{f.file.name}</div>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-full sm:w-auto sm:min-w-32"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-full sm:w-auto sm:min-w-32"
                          onClick={() => setStep(1)}
                        >
                          Edit details
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="group relative h-11 w-full rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 disabled:opacity-60 sm:w-auto sm:min-w-48"
                        >
                          {submitting ? "Submitting..." : "Submit application"}
                          <span className="absolute right-2 grid size-7 place-items-center rounded-full bg-white text-zinc-950 transition group-hover:bg-white/90">
                            <ArrowUpRight className="size-4" aria-hidden />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </FieldGroup>
            </form>
          </main>
        </div>
      </div>
      <AlertDialog 
        open={alertConfig.open} 
        onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "grid size-10 place-items-center rounded-full",
                alertConfig.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
              )}>
                {alertConfig.type === "success" ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <AlertCircle className="size-6" />
                )}
              </div>
              <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="mt-2 text-base">
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className={cn(
              "rounded-full px-8",
              alertConfig.type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            )}>
              {alertConfig.type === "success" ? "Great!" : "Try Again"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

