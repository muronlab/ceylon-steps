"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import axios from "axios"
import { Download, ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import {
  adminActivityProvidersApi,
  type AdminActivityProviderDetail,
  type AdminActivityProviderListItem,
} from "@/lib/admin-activity-providers-api"

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split("/").filter(Boolean)
    return decodeURIComponent(segments[segments.length - 1] ?? url)
  } catch {
    return url
  }
}
function fileKindFromUrl(url: string): "image" | "pdf" | "other" {
  const lower = url.split("?")[0]?.toLowerCase() ?? ""
  if (/\.(jpe?g|png|webp|gif|bmp|svg|avif)$/.test(lower)) return "image"
  if (/\.pdf$/.test(lower)) return "pdf"
  return "other"
}

export function ActivityProviderDetailSheet({
  providerId,
  open,
  onOpenChange,
  onChanged,
}: {
  providerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: (p: AdminActivityProviderListItem) => void
}) {
  const [provider, setProvider] = useState<AdminActivityProviderDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingAdminEnabled, setSavingAdminEnabled] = useState(false)
  const [viewerDoc, setViewerDoc] = useState<{
    label: string
    url: string
  } | null>(null)

  const load = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminActivityProvidersApi.detail(providerId)
      setProvider(data)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load provider."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    if (open && providerId) void load()
    if (!open) {
      setProvider(null)
      setError(null)
      setViewerDoc(null)
    }
  }, [open, providerId, load])

  async function toggleAdminEnabled(next: boolean) {
    if (!provider) return
    setSavingAdminEnabled(true)
    setError(null)
    try {
      const updated = await adminActivityProvidersApi.setAdminEnabled(
        provider.id,
        next,
      )
      setProvider(updated)
      onChanged(updated)
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to update visibility."
      setError(msg)
    } finally {
      setSavingAdminEnabled(false)
    }
  }

  const docs = provider
    ? [
        { label: "NIC front", url: provider.nicFrontUrl as string | null },
        { label: "NIC back", url: provider.nicBackUrl as string | null },
        { label: "Business registration", url: provider.brdDocumentUrl },
      ]
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="text-lg">Activity provider</SheetTitle>
            <SheetDescription className="text-sm">
              Full profile, owner account, and the original application.
            </SheetDescription>
          </SheetHeader>

          <div className="p-5">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : !provider ? (
              <div className="text-sm text-muted-foreground">
                No provider selected.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Header card */}
                <section className="rounded-2xl border bg-card p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold">
                        {provider.fullName}
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {provider.businessName}
                      </Badge>
                      {provider.isActive &&
                      provider.adminEnabled &&
                      provider.user.status === "ACTIVE" ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          Listed
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Approved {new Date(provider.approvedAt).toLocaleString()}
                    </div>
                  </div>
                </section>

                {/* Visibility — two independent gates */}
                <section className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 text-sm font-semibold">Public listing</div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    The profile only shows on the public site when both flags are
                    on and the owner account is active.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">Admin visibility</div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Admin-controlled. Off hides this profile from the
                          public site even if the owner wants it listed.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {provider.adminEnabled ? "On" : "Off"}
                        </span>
                        <Switch
                          checked={provider.adminEnabled}
                          disabled={savingAdminEnabled}
                          onCheckedChange={toggleAdminEnabled}
                          aria-label="Toggle admin visibility"
                        />
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-md border bg-card/50 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">Owner visibility</div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Owner-controlled. The partner can hide their own
                          profile from their dashboard — only they can change
                          this.
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          provider.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {provider.isActive ? "On" : "Off"}
                      </Badge>
                    </div>

                    {provider.user.status === "DISABLED" && (
                      <p className="text-xs text-amber-700">
                        The owner account is disabled, so this profile is hidden
                        from the public site regardless.
                      </p>
                    )}
                  </div>
                </section>

                {/* Owner */}
                <Section title="Owner account">
                  <KV label="Name" value={provider.user.name ?? "—"} />
                  <KV label="Email" value={provider.user.email} />
                  <KV label="Phone" value={provider.user.phone ?? "—"} />
                </Section>

                {/* Business / profile */}
                <Section title="Business">
                  <KV label="Business name" value={provider.businessName} />
                  <KV
                    label="Nature of business"
                    value={provider.natureOfBusiness}
                  />
                  <KV label="Mobile" value={provider.mobileNumber} />
                  <KV
                    label="WhatsApp"
                    value={provider.whatsappAvailable ? "Yes" : "No"}
                  />
                  <KV label="Contact email" value={provider.contactEmail ?? "—"} />
                  <KV label="NIC number" value={provider.nicNumber} />
                  <KV label="Address" value={provider.address} />
                  {provider.description && (
                    <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-700">
                      {provider.description}
                    </div>
                  )}
                </Section>

                {/* Documents */}
                <Section title="Documents">
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>File name</TableHead>
                          <TableHead className="w-0 text-right">{""}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docs.map((doc) => (
                          <DocRow
                            key={doc.label}
                            label={doc.label}
                            url={doc.url}
                            onView={setViewerDoc}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Section>

                {/* Application status history */}
                {provider.application?.statusHistory &&
                  provider.application.statusHistory.length > 0 && (
                    <Section title="Application history">
                      <div className="grid gap-1.5">
                        {provider.application.statusHistory.map((h) => (
                          <div
                            key={h.id}
                            className="rounded-md border bg-card px-3 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="font-normal">
                                {h.status}
                              </Badge>
                              <span className="text-muted-foreground">
                                {new Date(h.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {h.remark && (
                              <div className="mt-1 text-zinc-700">{h.remark}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <FileViewerDialog
        doc={viewerDoc}
        onOpenChange={(o) => {
          if (!o) setViewerDoc(null)
        }}
      />
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-2 border-t pt-4">
      <div className="text-sm font-semibold">{title}</div>
      {children}
    </section>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-medium">{value}</span>
    </div>
  )
}

function DocRow({
  label,
  url,
  onView,
}: {
  label: string
  url: string | null
  onView: (doc: { label: string; url: string }) => void
}) {
  if (!url) {
    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell className="text-muted-foreground">—</TableCell>
        <TableCell className="text-muted-foreground">Not provided</TableCell>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
      </TableRow>
    )
  }
  const kind = fileKindFromUrl(url)
  const kindLabel = kind === "image" ? "Image" : kind === "pdf" ? "PDF" : "File"
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {kindLabel}
        </Badge>
      </TableCell>
      <TableCell className="max-w-55 truncate text-muted-foreground">
        {fileNameFromUrl(url)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          className="h-7"
          onClick={() => onView({ label, url })}
        >
          <Eye className="size-3.5" />
          View
        </Button>
      </TableCell>
    </TableRow>
  )
}

function FileViewerDialog({
  doc,
  onOpenChange,
}: {
  doc: { label: string; url: string } | null
  onOpenChange: (open: boolean) => void
}) {
  const open = doc !== null
  const kind = doc ? fileKindFromUrl(doc.url) : "other"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] p-0 sm:max-w-[80vw]">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="text-base">
            {doc?.label ?? "Document"}
          </DialogTitle>
          <DialogDescription className="truncate text-xs">
            {doc ? fileNameFromUrl(doc.url) : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 p-4">
          {!doc ? null : kind === "image" ? (
            <div className="relative mx-auto h-[70vh] w-full">
              <Image
                src={doc.url}
                alt={doc.label}
                fill
                className="object-contain"
                sizes="1024px"
                unoptimized
              />
            </div>
          ) : kind === "pdf" ? (
            <iframe
              src={doc.url}
              title={doc.label}
              className="h-[70vh] w-full rounded border bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-card py-12 text-center">
              <div className="text-sm font-medium">
                Preview not available for this file type
              </div>
              <div className="text-xs text-muted-foreground">
                Open or download to view it.
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t p-3">
          {doc && (
            <>
              <Button asChild variant="outline" size="sm" className="h-8">
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </a>
              </Button>
              <Button asChild size="sm" className="h-8">
                <a href={doc.url} download>
                  <Download className="size-3.5" />
                  Download
                </a>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
