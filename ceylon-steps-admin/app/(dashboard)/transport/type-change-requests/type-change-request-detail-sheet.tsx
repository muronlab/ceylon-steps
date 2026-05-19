"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { ArrowRight, Check, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  getTransportTypeChangeRequest,
  reviewTransportTypeChangeRequest,
  type ApplicationStatus,
  type TransportProviderType,
  type TransportTypeChangeRequest,
} from "@/lib/transport-applications-api"

const PROVIDER_LABELS: Record<TransportProviderType, string> = {
  SAFARI_JEEP: "Safari Jeep Operator",
  VEHICLE_WITH_DRIVER: "Driver with Vehicle",
  VEHICLE_FLEET: "Vehicle Rental / Fleet",
}

export function TypeChangeRequestDetailSheet({
  requestId,
  open,
  onOpenChange,
  onChanged,
}: {
  requestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: (r: TransportTypeChangeRequest) => void
}) {
  const [req, setReq] = useState<TransportTypeChangeRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectRemark, setRejectRemark] = useState("")

  const load = useCallback(async () => {
    if (!requestId) return
    setLoading(true)
    setError(null)
    try {
      const r = await getTransportTypeChangeRequest(requestId)
      setReq(r)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load request."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    if (open) {
      void load()
      setRejectOpen(false)
      setRejectRemark("")
    } else {
      setReq(null)
    }
  }, [open, load])

  async function approve() {
    if (!req) return
    setWorking(true)
    try {
      const r = await reviewTransportTypeChangeRequest(req.id, {
        status: "APPROVED",
      })
      setReq((prev) => (prev ? { ...prev, ...r } : prev))
      onChanged(r)
      onOpenChange(false)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to approve."
      setError(msg)
    } finally {
      setWorking(false)
    }
  }

  async function reject() {
    if (!req) return
    if (!rejectRemark.trim()) {
      setError("A remark is required when rejecting.")
      return
    }
    setWorking(true)
    try {
      const r = await reviewTransportTypeChangeRequest(req.id, {
        status: "REJECTED",
        remark: rejectRemark.trim(),
      })
      setReq((prev) => (prev ? { ...prev, ...r } : prev))
      onChanged(r)
      setRejectOpen(false)
      onOpenChange(false)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to reject."
      setError(msg)
    } finally {
      setWorking(false)
    }
  }

  const canAct = req?.status === "PENDING"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="text-lg">Type change request</SheetTitle>
            <SheetDescription className="text-sm">
              Review the requested provider type change and any supporting
              documents.
            </SheetDescription>
          </SheetHeader>

          {loading || !req ? (
            <div className="grid h-40 place-items-center">
              {loading ? (
                <Spinner />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {error ?? "No request loaded."}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-5 p-5">
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <section className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Provider
                </div>
                <div className="mt-1 text-sm font-medium">
                  {req.profile?.fullName ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {req.profile?.contactEmail ?? ""}
                  {req.profile?.mobileNumber
                    ? ` · ${req.profile.mobileNumber}`
                    : ""}
                </div>
                {req.profile?.hasBusiness && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Business: {req.profile.businessName ?? "—"}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Requested change
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                  <Badge variant="outline">
                    {PROVIDER_LABELS[req.currentType]}
                  </Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <Badge variant="outline">
                    {PROVIDER_LABELS[req.requestedType]}
                  </Badge>
                </div>
                {req.providerNotes && (
                  <div className="mt-3 text-xs">
                    <div className="font-semibold text-muted-foreground">
                      Provider note
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap">
                      {req.providerNotes}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Documents
                </div>
                <div className="mt-2 grid gap-2">
                  <DocRow
                    label="Safari licence (new upload)"
                    url={req.safariJeepLicenseUrl}
                  />
                  <DocRow
                    label="Business registration (new upload)"
                    url={req.brdDocumentUrl}
                  />
                  {req.profile?.safariJeepLicenseUrl && (
                    <DocRow
                      label="Safari licence (on file)"
                      url={req.profile.safariJeepLicenseUrl}
                    />
                  )}
                  {req.profile?.brdDocumentUrl && (
                    <DocRow
                      label="Business registration (on file)"
                      url={req.profile.brdDocumentUrl}
                    />
                  )}
                </div>
              </section>

              {req.status !== "PENDING" && (
                <section className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Review outcome
                  </div>
                  <div className="mt-1 text-sm">
                    {req.status === "APPROVED"
                      ? "Approved"
                      : "Rejected"}
                    {req.reviewedByUser
                      ? ` by ${req.reviewedByUser.name ?? req.reviewedByUser.email}`
                      : ""}
                  </div>
                  {req.remark && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Remark: {req.remark}
                    </div>
                  )}
                  {req.reviewedAt && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(req.reviewedAt).toLocaleString()}
                    </div>
                  )}
                </section>
              )}

              {canAct && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <Button
                    className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={working}
                    onClick={approve}
                  >
                    <Check className="size-4" />
                    {working ? "Approving…" : "Approve"}
                  </Button>
                  <Button
                    className="h-9 bg-red-600 text-white hover:bg-red-700"
                    disabled={working}
                    onClick={() => setRejectOpen(true)}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject type change request</DialogTitle>
            <DialogDescription>
              The provider will see this remark on their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Remark</Label>
            <Textarea
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              rows={4}
              placeholder="Why are you rejecting this request?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={working}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={reject}
              disabled={working || !rejectRemark.trim()}
            >
              {working ? "Rejecting…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocRow({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs text-muted-foreground ring-1 ring-zinc-200">
        <FileText className="size-3.5" />
        <span className="flex-1">{label}</span>
        <span>Not provided</span>
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs ring-1 ring-zinc-200 transition hover:bg-zinc-50"
    >
      <FileText className="size-3.5" />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-muted-foreground">View</span>
    </a>
  )
}
