"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  transportProviderService,
  type TransportProviderProfile,
  type TransportProviderType,
  type TransportTypeChangeRequest,
} from "@/services/transport-provider.service"

const PROVIDER_LABELS: Record<TransportProviderType, string> = {
  SAFARI_JEEP: "Safari Jeep Operator",
  VEHICLE_WITH_DRIVER: "Driver with Vehicle",
  VEHICLE_FLEET: "Vehicle Rental / Fleet",
}

const PROVIDER_DESCRIPTIONS: Record<TransportProviderType, string> = {
  SAFARI_JEEP:
    "You operate safari jeeps for national park trips. Requires a government-issued safari licence.",
  VEHICLE_WITH_DRIVER:
    "You personally drive travelers. Up to 2 vehicles plus your own services (airport pickups, day tours).",
  VEHICLE_FLEET:
    "You rent out vehicles (with or without drivers). Unlimited fleet, self-drive friendly.",
}

const STATUS_STYLES: Record<
  TransportTypeChangeRequest["status"],
  { label: string; bg: string; text: string; ring: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Under review",
    bg: "bg-amber-50",
    text: "text-amber-900",
    ring: "ring-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    ring: "ring-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-900",
    ring: "ring-rose-200",
    icon: XCircle,
  },
}

export function TransportTypeChangeCard({
  profile,
  onProfileTypeChanged,
}: {
  profile: TransportProviderProfile
  /** Called when an approved request becomes visible — parent should refetch
   * the profile so the new providerType propagates. */
  onProfileTypeChanged: () => void
}) {
  const [request, setRequest] = useState<TransportTypeChangeRequest | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await transportProviderService.getMyTypeChangeRequest()
      setRequest(r)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to load your type change request.")
      } else {
        setError("Failed to load your type change request.")
      }
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  async function cancel() {
    if (!request) return
    if (!window.confirm("Cancel this type change request?")) return
    setCancelling(true)
    try {
      await transportProviderService.cancelMyTypeChangeRequest(request.id)
      setRequest(null)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to cancel.")
      } else {
        setError("Failed to cancel.")
      }
    } finally {
      setCancelling(false)
    }
  }

  function onSubmitted(saved: TransportTypeChangeRequest) {
    setRequest(saved)
    setDialogOpen(false)
  }

  const hasPending = request?.status === "PENDING"
  const approvedTypeNotYetReflected =
    request?.status === "APPROVED" &&
    request.requestedType !== profile.providerType
  // If the latest request was approved but the profile prop is still stale,
  // ask the parent to refetch once.
  useEffect(() => {
    if (approvedTypeNotYetReflected) onProfileTypeChanged()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedTypeNotYetReflected])

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold tracking-tight text-zinc-950">
            Provider type
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Changing your provider type needs admin approval — switching to
            Safari Jeep, for example, requires a safari licence.
          </p>
        </div>
        {!hasPending && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8 rounded-full text-xs"
          >
            Request change
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Current
          </div>
          <div className="mt-0.5 text-sm font-semibold text-zinc-950">
            {PROVIDER_LABELS[profile.providerType]}
          </div>
        </div>
      </div>

      {loading ? null : request ? (
        <RequestStatusCard
          request={request}
          onCancel={cancel}
          cancelling={cancelling}
        />
      ) : null}

      <TypeChangeRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={profile}
        onSubmitted={onSubmitted}
      />
    </section>
  )
}

function RequestStatusCard({
  request,
  onCancel,
  cancelling,
}: {
  request: TransportTypeChangeRequest
  onCancel: () => void
  cancelling: boolean
}) {
  const style = STATUS_STYLES[request.status]
  const Icon = style.icon
  return (
    <div
      className={`mt-3 rounded-2xl p-4 ring-1 ${style.bg} ${style.ring}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${style.text}`} />
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-1.5 text-sm font-semibold ${style.text}`}>
            <span>{style.label}</span>
            <span className="text-xs font-normal opacity-75">
              · {PROVIDER_LABELS[request.currentType]} →{" "}
              {PROVIDER_LABELS[request.requestedType]}
            </span>
          </div>
          {request.providerNotes && (
            <div className={`mt-1 text-xs ${style.text} opacity-90`}>
              <span className="font-semibold">Your note:</span>{" "}
              {request.providerNotes}
            </div>
          )}
          {request.remark && (
            <div className={`mt-1 text-xs ${style.text} opacity-90`}>
              <span className="font-semibold">Admin reply:</span>{" "}
              {request.remark}
            </div>
          )}
          <div className={`mt-1 text-xs ${style.text} opacity-75`}>
            Submitted {new Date(request.createdAt).toLocaleString()}
            {request.reviewedAt
              ? ` · reviewed ${new Date(request.reviewedAt).toLocaleString()}`
              : ""}
          </div>
        </div>
        {request.status === "PENDING" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={cancelling}
            className="h-8 rounded-full bg-white text-xs"
          >
            {cancelling ? "Cancelling…" : "Cancel request"}
          </Button>
        )}
      </div>
    </div>
  )
}

function TypeChangeRequestDialog({
  open,
  onOpenChange,
  profile,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: TransportProviderProfile
  onSubmitted: (saved: TransportTypeChangeRequest) => void
}) {
  const [requestedType, setRequestedType] = useState<TransportProviderType>(
    profile.providerType === "VEHICLE_FLEET"
      ? "VEHICLE_WITH_DRIVER"
      : "VEHICLE_FLEET",
  )
  const [providerNotes, setProviderNotes] = useState("")
  const [safariFile, setSafariFile] = useState<File | null>(null)
  const [brdFile, setBrdFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRequestedType(
        profile.providerType === "VEHICLE_FLEET"
          ? "VEHICLE_WITH_DRIVER"
          : "VEHICLE_FLEET",
      )
      setProviderNotes("")
      setSafariFile(null)
      setBrdFile(null)
      setError(null)
    }
  }, [open, profile.providerType])

  const needsSafariLicense =
    requestedType === "SAFARI_JEEP" && !profile.safariJeepLicenseUrl

  async function submit() {
    if (requestedType === profile.providerType) {
      setError("Pick a different type than your current one.")
      return
    }
    if (needsSafariLicense && !safariFile) {
      setError("A safari licence is required to switch to Safari Jeep Operator.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("requestedType", requestedType)
      if (providerNotes.trim()) fd.append("providerNotes", providerNotes.trim())
      if (safariFile) fd.append("safariJeepLicense", safariFile)
      if (brdFile) fd.append("brdDocument", brdFile)
      const saved =
        await transportProviderService.submitTypeChangeRequest(fd)
      onSubmitted(saved)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setError(msg ?? "Failed to submit request.")
      } else {
        setError("Failed to submit request.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request provider type change</DialogTitle>
          <DialogDescription>
            An admin reviews each change. Your profile and listings stay live
            with your current type until they approve.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-zinc-600">
              Switch to
            </Label>
            <Select
              value={requestedType}
              onValueChange={(v) =>
                setRequestedType(v as TransportProviderType)
              }
            >
              <SelectTrigger className="h-10 w-full rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(PROVIDER_LABELS) as Array<
                    [TransportProviderType, string]
                  >
                )
                  .filter(([t]) => t !== profile.providerType)
                  .map(([t, label]) => (
                    <SelectItem key={t} value={t}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              {PROVIDER_DESCRIPTIONS[requestedType]}
            </p>
          </div>

          {needsSafariLicense && (
            <FileUploadField
              label="Safari licence"
              required
              file={safariFile}
              onChange={setSafariFile}
              hint="Government-issued safari jeep operator licence (PDF or image)."
            />
          )}

          {!profile.hasBusiness && requestedType === "VEHICLE_FLEET" && (
            <FileUploadField
              label="Business registration (optional)"
              required={false}
              file={brdFile}
              onChange={setBrdFile}
              hint="Upload a Business Registration Document if you'd like to also be marked as a registered fleet business."
            />
          )}

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-zinc-600">
              Reason for change (optional)
            </Label>
            <Textarea
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder="A short note helps the admin understand your switch."
              rows={3}
              className="rounded-2xl"
            />
          </div>

          {requestedType === "SAFARI_JEEP" && profile.safariJeepLicenseUrl && (
            <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                We already have your safari licence on file from your original
                application — no need to re-upload unless it&apos;s renewed.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving}
            className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            {saving ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FileUploadField({
  label,
  required,
  hint,
  file,
  onChange,
}: {
  label: string
  required: boolean
  hint: string
  file: File | null
  onChange: (f: File | null) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-zinc-600">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 p-2 ring-1 ring-zinc-200/70">
        {file ? (
          <>
            <FileText className="size-4 text-zinc-600" />
            <span className="flex-1 truncate text-xs text-zinc-700">
              {file.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="h-7 rounded-full text-xs text-zinc-500 hover:text-red-600"
            >
              Remove
            </Button>
          </>
        ) : (
          <>
            <AlertCircle className="size-4 text-zinc-400" />
            <span className="flex-1 text-xs text-zinc-500">No file chosen</span>
            <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100">
              <Upload className="size-3.5" />
              Choose file
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </>
        )}
      </div>
    </div>
  )
}
