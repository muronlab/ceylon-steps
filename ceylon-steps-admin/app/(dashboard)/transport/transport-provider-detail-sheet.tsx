"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import axios from "axios"
import { Download, ExternalLink, Eye, FileText } from "lucide-react"
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
  adminTransportProvidersApi,
  type AdminTransportProviderDetail,
  type AdminTransportProviderListItem,
  type AdminTransportVehicle,
  type AdminDriverService,
  type AdminSafariJeep,
  type AdminSafariItinerary,
  type AdminTypeChangeRequest,
} from "@/lib/admin-transport-providers-api"
import type { TransportProviderType } from "@/lib/transport-applications-api"

const PROVIDER_LABELS: Record<TransportProviderType, string> = {
  SAFARI_JEEP: "Safari Jeep Operator",
  VEHICLE_WITH_DRIVER: "Driver with Vehicle",
  VEHICLE_FLEET: "Vehicle Rental / Fleet",
}

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

export function TransportProviderDetailSheet({
  providerId,
  open,
  onOpenChange,
  onChanged,
}: {
  providerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: (p: AdminTransportProviderListItem) => void
}) {
  const [provider, setProvider] = useState<AdminTransportProviderDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingAdminEnabled, setSavingAdminEnabled] = useState(false)
  const [viewerDoc, setViewerDoc] = useState<{ label: string; url: string } | null>(
    null,
  )

  const load = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminTransportProvidersApi.detail(providerId)
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
    if (open && providerId) {
      void load()
    }
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
      const updated = await adminTransportProvidersApi.setAdminEnabled(
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
        ...(provider.providerType === "SAFARI_JEEP"
          ? [{ label: "Safari licence", url: provider.safariJeepLicenseUrl }]
          : []),
        ...(provider.hasBusiness
          ? [{ label: "Business registration", url: provider.brdDocumentUrl }]
          : []),
      ]
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="text-lg">Transport provider</SheetTitle>
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
                        {PROVIDER_LABELS[provider.providerType] ??
                          provider.providerType}
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
                          Cascades automatically from the owner&apos;s account
                          status.
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
                  <KV
                    label="Account status"
                    value={
                      provider.user.status === "ACTIVE" ? "Active" : "Disabled"
                    }
                  />
                  <KV
                    label="Email verified"
                    value={
                      provider.user.emailVerifiedAt
                        ? new Date(provider.user.emailVerifiedAt).toLocaleString()
                        : "Not verified"
                    }
                  />
                </Section>

                {/* Contact */}
                <Section title="Contact">
                  <KV label="Mobile" value={provider.mobileNumber} />
                  <KV
                    label="WhatsApp"
                    value={provider.whatsappAvailable ? "Yes" : "No"}
                  />
                  <KV label="Contact email" value={provider.contactEmail} />
                </Section>

                {/* Business */}
                {provider.hasBusiness && (
                  <Section title="Business">
                    <KV
                      label="Business name"
                      value={provider.businessName ?? "—"}
                    />
                    {provider.businessDescription && (
                      <div className="rounded-2xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                        {provider.businessDescription}
                      </div>
                    )}
                  </Section>
                )}

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

                {/* Vehicles (fleet + driver providers) */}
                {provider.vehicles && provider.vehicles.length > 0 && (
                  <Section
                    title={`Vehicles (${provider.vehicles.length})`}
                  >
                    <div className="grid gap-3">
                      {provider.vehicles.map((v) => (
                        <VehicleCard key={v.id} vehicle={v} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Safari jeeps */}
                {provider.safariJeeps && provider.safariJeeps.length > 0 && (
                  <Section
                    title={`Safari jeeps (${provider.safariJeeps.length})`}
                  >
                    <div className="grid gap-3">
                      {provider.safariJeeps.map((j) => (
                        <SafariJeepCard
                          key={j.id}
                          jeep={j}
                          providerHasBusiness={provider.hasBusiness}
                          providerProfilePhotoUrl={provider.profilePhotoUrl}
                        />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Driver services */}
                {provider.driverServices && provider.driverServices.length > 0 && (
                  <Section
                    title={`Driver services (${provider.driverServices.length})`}
                  >
                    <div className="grid gap-2">
                      {provider.driverServices.map((s) => (
                        <DriverServiceCard key={s.id} service={s} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Type change history */}
                {provider.typeChangeRequests &&
                  provider.typeChangeRequests.length > 0 && (
                    <Section
                      title={`Type change requests (${provider.typeChangeRequests.length})`}
                    >
                      <div className="grid gap-2">
                        {provider.typeChangeRequests.map((r) => (
                          <TypeChangeRow key={r.id} req={r} />
                        ))}
                      </div>
                    </Section>
                  )}

                {/* Application */}
                <Section title="Original application">
                  <KV label="Status" value={provider.application.status} />
                  <KV
                    label="Submitted"
                    value={new Date(
                      provider.application.createdAt,
                    ).toLocaleString()}
                  />
                  <KV
                    label="Last updated"
                    value={new Date(
                      provider.application.updatedAt,
                    ).toLocaleString()}
                  />
                  {provider.application.remark && (
                    <KV label="Remark" value={provider.application.remark} />
                  )}

                  {provider.application.statusHistory.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status history
                      </div>
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
                            {h.updatedByUser && (
                              <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
                                by{" "}
                                {h.updatedByUser.name ?? h.updatedByUser.email}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
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
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="grid gap-2">{children}</div>
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
          <DialogTitle className="text-base">{doc?.label ?? "Document"}</DialogTitle>
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

/* ─────────────── Vehicle / safari / service cards ─────────────── */

function formatMoney(amount: string, currency: string) {
  const num = Number(amount)
  if (!Number.isFinite(num)) return `${amount} ${currency}`
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num)
  } catch {
    return `${num.toLocaleString()} ${currency}`
  }
}

function VehicleCard({ vehicle }: { vehicle: AdminTransportVehicle }) {
  const cover = vehicle.images[0]?.imageUrl
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={vehicle.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="text-sm font-semibold">{vehicle.title}</div>
            <Badge variant="outline" className="font-normal">
              {vehicle.vehicleType}
            </Badge>
            {!vehicle.isActive && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Hidden
              </Badge>
            )}
            {vehicle.plateNumber && (
              <Badge variant="outline" className="font-normal">
                {vehicle.plateNumber}
                {!vehicle.plateNumberVisible ? " (private)" : ""}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {vehicle.manufacturedYear ? `${vehicle.manufacturedYear} · ` : ""}
            {vehicle.fuelType.toLowerCase()}
            {vehicle.fuelConsumption ? ` · ${vehicle.fuelConsumption}` : ""}
            {` · ${vehicle.condition.toLowerCase()} condition`}
          </div>
          {(vehicle.pickupLocation || vehicle.allowsAnyLocation) && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Pickup: {vehicle.pickupLocation ?? "—"}
              {vehicle.sameDropoffAsPickup
                ? " · drop off at pickup"
                : vehicle.dropoffLocation
                  ? ` · drop off: ${vehicle.dropoffLocation}`
                  : ""}
              {vehicle.allowsAnyLocation ? " · any location on request" : ""}
            </div>
          )}
          {vehicle.fuelPolicy && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Fuel policy: {vehicle.fuelPolicy}
            </div>
          )}
        </div>
      </div>

      {vehicle.charges.length > 0 && (
        <div className="mt-3 grid gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Charges
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vehicle.charges.map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className="font-normal"
                title={c.notes ?? undefined}
              >
                {formatMoney(c.amount, c.currency)}{" "}
                {c.chargeType.replace("PER_", "/").toLowerCase()}
                {c.nightSurcharge
                  ? ` + ${formatMoney(c.nightSurcharge, c.currency)}/night`
                  : ""}
                {c.includesFuel ? " · with fuel" : ""}
                {c.label ? ` · ${c.label}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ChipBlock label="Facilities" items={[...vehicle.facilities, ...vehicle.extraFacilities]} />
      <ChipBlock label="Included" items={vehicle.inclusions} tone="positive" />
      <ChipBlock label="Not included" items={vehicle.exclusions} tone="negative" />

      {vehicle.images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {vehicle.images.slice(1, 9).map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.imageUrl}
              alt={img.caption ?? ""}
              className="aspect-square w-full rounded object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SafariJeepCard({
  jeep,
  providerHasBusiness,
  providerProfilePhotoUrl,
}: {
  jeep: AdminSafariJeep
  providerHasBusiness: boolean
  providerProfilePhotoUrl: string | null
}) {
  const cover = jeep.images[0]?.imageUrl
  // Solo operators don't upload a per-jeep driver photo — fall back to the
  // provider's profile photo so admin sees the same face travelers will.
  const effectiveDriverPhoto = providerHasBusiness
    ? jeep.driverPhotoUrl
    : providerProfilePhotoUrl
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={jeep.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="text-sm font-semibold">{jeep.title}</div>
            {!jeep.isActive && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Hidden
              </Badge>
            )}
            {jeep.passengerCapacity && (
              <Badge variant="outline" className="font-normal">
                {jeep.passengerCapacity} pax
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {effectiveDriverPhoto && (
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={effectiveDriverPhoto}
                  alt={jeep.driverName}
                  className="size-full object-cover"
                />
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Driver:{" "}
              <span className="text-foreground">{jeep.driverName}</span>
              {jeep.driverYearsExperience
                ? ` · ${jeep.driverYearsExperience} yrs exp.`
                : ""}
              {jeep.driverGuidesAtParks ? " · guides at parks" : ""}
            </div>
          </div>
          {jeep.nationalParks.length > 0 && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Parks: {jeep.nationalParks.join(" · ")}
            </div>
          )}
          {jeep.durationNotes && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Duration: {jeep.durationNotes}
            </div>
          )}
        </div>
      </div>

      {jeep.driverBio && (
        <div className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          {jeep.driverBio}
        </div>
      )}

      {jeep.charges.length > 0 && (
        <div className="mt-3 grid gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Charges
          </div>
          <div className="flex flex-wrap gap-1.5">
            {jeep.charges.map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className="font-normal"
                title={c.notes ?? undefined}
              >
                {formatMoney(c.amount, c.currency)}{" "}
                {c.chargeType.replace("PER_", "/").toLowerCase()}
                {c.includesParkFee ? " · park fee included" : ""}
                {c.label ? ` · ${c.label}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ChipBlock label="Experiences" items={jeep.experiences} />
      <ChipBlock label="Driver languages" items={jeep.driverLanguages} />
      <ChipBlock
        label="Facilities"
        items={[...jeep.facilities, ...jeep.extraFacilities]}
      />
      <ChipBlock label="Included" items={jeep.inclusions} tone="positive" />
      <ChipBlock label="Not included" items={jeep.exclusions} tone="negative" />

      {jeep.itineraries && jeep.itineraries.length > 0 && (
        <div className="mt-3 grid gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Itineraries ({jeep.itineraries.length})
          </div>
          <div className="grid gap-2">
            {jeep.itineraries.map((it) => (
              <SafariItineraryRow key={it.id} itinerary={it} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SafariItineraryRow({
  itinerary,
}: {
  itinerary: AdminSafariItinerary
}) {
  const cover = itinerary.coverImageUrl ?? itinerary.galleryImages[0]?.imageUrl
  const priceLabel = itinerary.price
    ? `${formatMoney(itinerary.price, itinerary.currency ?? "LKR")} ${
        itinerary.priceScope === "PER_PERSON"
          ? "/ person"
          : itinerary.priceScope === "PER_DAY"
            ? "/ day"
            : "/ trip"
      }`
    : null
  return (
    <div className="grid grid-cols-[56px_1fr] items-start gap-2 rounded-md border bg-zinc-50/60 p-2">
      <div className="relative size-14 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={itinerary.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
            No cover
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="truncate text-xs font-semibold">{itinerary.title}</div>
          {!itinerary.isActive && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              Draft
            </Badge>
          )}
          {itinerary.durationLabel && (
            <Badge variant="outline" className="font-normal">
              {itinerary.durationLabel}
            </Badge>
          )}
          {priceLabel && (
            <Badge variant="outline" className="font-normal">
              {priceLabel}
            </Badge>
          )}
        </div>
        {itinerary.subtitle && (
          <div className="mt-0.5 line-clamp-2 text-[11px] text-zinc-600">
            {itinerary.subtitle}
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span>
            {itinerary.designType === "TIME"
              ? `${itinerary.days.length} slot${itinerary.days.length === 1 ? "" : "s"}`
              : itinerary.designType === "DURATION"
                ? `${itinerary.days.length} step${itinerary.days.length === 1 ? "" : "s"}`
                : `${itinerary.days.length} day${itinerary.days.length === 1 ? "" : "s"}`}
          </span>
          <span>
            {itinerary.galleryImages.length} photo
            {itinerary.galleryImages.length === 1 ? "" : "s"}
          </span>
          <span>
            {
              itinerary.inclusions.filter((i) => i.kind === "INCLUDED").length
            }{" "}
            included ·{" "}
            {
              itinerary.inclusions.filter((i) => i.kind === "EXCLUDED").length
            }{" "}
            not included
          </span>
        </div>
      </div>
    </div>
  )
}

function DriverServiceCard({ service }: { service: AdminDriverService }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
          {service.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.coverImageUrl}
              alt={service.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="text-sm font-semibold">{service.title}</div>
            <Badge variant="outline" className="font-normal">
              {service.category.replace(/_/g, " ").toLowerCase()}
            </Badge>
            {!service.isActive && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Hidden
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs">
            {formatMoney(service.basePrice, service.currency)}{" "}
            <span className="text-muted-foreground">
              {service.priceUnit.replace("PER_", "/").toLowerCase()}
              {service.priceNotes ? ` · ${service.priceNotes}` : ""}
            </span>
          </div>
          {service.description && (
            <div className="mt-1 text-xs text-zinc-700">
              {service.description}
            </div>
          )}
        </div>
      </div>
      <ChipBlock label="Included" items={service.inclusions} tone="positive" />
      <ChipBlock label="Not included" items={service.exclusions} tone="negative" />
    </div>
  )
}

function TypeChangeRow({ req }: { req: AdminTypeChangeRequest }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Badge variant="outline" className="font-normal">
            {req.currentType}
          </Badge>{" "}
          → {" "}
          <Badge variant="outline" className="font-normal">
            {req.requestedType}
          </Badge>
        </div>
        <Badge
          variant="outline"
          className={
            req.status === "APPROVED"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : req.status === "REJECTED"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }
        >
          {req.status}
        </Badge>
      </div>
      {req.providerNotes && (
        <div className="mt-1 text-muted-foreground">
          Provider: {req.providerNotes}
        </div>
      )}
      {req.remark && (
        <div className="mt-1 text-muted-foreground">Admin: {req.remark}</div>
      )}
      <div className="mt-1 text-[10px] text-muted-foreground">
        Submitted {new Date(req.createdAt).toLocaleString()}
        {req.reviewedAt
          ? ` · reviewed ${new Date(req.reviewedAt).toLocaleString()}`
          : ""}
      </div>
    </div>
  )
}

function ChipBlock({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone?: "positive" | "negative"
}) {
  if (items.length === 0) return null
  const chipCls =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "negative"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : ""
  return (
    <div className="mt-3 grid gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge
            key={`${label}-${it}`}
            variant="outline"
            className={`font-normal ${chipCls}`}
          >
            {it}
          </Badge>
        ))}
      </div>
    </div>
  )
}
