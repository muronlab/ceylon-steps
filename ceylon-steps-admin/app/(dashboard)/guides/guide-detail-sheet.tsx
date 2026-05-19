"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import axios from "axios"
import { Award, Download, ExternalLink, Eye, FileText, MapPin } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
    adminGuidesApi,
    type AdminGuideDetail,
} from "@/lib/admin-guides-api"

function formatMoney(value: string | null, currency: string | null) {
    if (!value) return null
    const num = Number(value)
    if (!Number.isFinite(num)) return null
    const code = currency || "LKR"
    try {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: code,
            maximumFractionDigits: num % 1 === 0 ? 0 : 2,
        }).format(num)
    } catch {
        return `${num.toLocaleString()} ${code}`
    }
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] ?? "G"
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
    return (a + b).toUpperCase()
}

function flagUrl(code: string) {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
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

function levelLabel(level: "CONVERSATIONAL" | "FLUENT" | "NATIVE") {
    return level[0] + level.slice(1).toLowerCase()
}

export function GuideDetailSheet({
    guideId,
    open,
    onOpenChange,
}: {
    guideId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [guide, setGuide] = useState<AdminGuideDetail | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savingAdminEnabled, setSavingAdminEnabled] = useState(false)
    const [viewerDoc, setViewerDoc] = useState<{ label: string; url: string } | null>(
        null,
    )

    async function toggleAdminEnabled(next: boolean) {
        if (!guide) return
        setSavingAdminEnabled(true)
        setError(null)
        try {
            const updated = await adminGuidesApi.setAdminEnabled(guide.id, next)
            setGuide(updated)
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

    const load = useCallback(async () => {
        if (!guideId) return
        setLoading(true)
        setError(null)
        try {
            const data = await adminGuidesApi.detail(guideId)
            setGuide(data)
        } catch (err) {
            const msg =
                (axios.isAxiosError(err) &&
                    (err.response?.data as { message?: string })?.message) ||
                "Failed to load guide details."
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [guideId])

    useEffect(() => {
        if (open && guideId) {
            void load()
        }
        if (!open) {
            setGuide(null)
            setError(null)
            setViewerDoc(null)
        }
    }, [open, guideId, load])

    const dayPrice = guide ? formatMoney(guide.pricePerDay, guide.currency) : null
    const hourPrice = guide ? formatMoney(guide.pricePerHour, guide.currency) : null
    const regions = guide && Array.isArray(guide.regionsSpecialized) ? guide.regionsSpecialized : []
    const languages = guide?.languages ?? []
    const galleryImages = guide?.galleryImages ?? []
    const itineraries = guide?.itineraries ?? []
    const docs = guide
        ? [
            { label: "NIC front", url: guide.nicFrontUrl as string | null },
            { label: "NIC back", url: guide.nicBackUrl as string | null },
            { label: "License front", url: guide.guideLicenseFrontUrl },
            { label: "License back", url: guide.guideLicenseBackUrl },
        ]
        : []

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
                    <SheetHeader className="border-b p-5">
                        <SheetTitle className="text-lg">Guide profile</SheetTitle>
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
                        ) : !guide ? (
                            <div className="text-sm text-muted-foreground">
                                No guide selected.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {/* Hero — cover + avatar */}
                                <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-200">
                                    <div className="relative h-32">
                                        {guide.coverPhotoUrl ? (
                                            <Image
                                                src={guide.coverPhotoUrl}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="600px"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%)]" />
                                        )}
                                    </div>
                                    <div className="flex items-end gap-4 bg-white px-4 pb-4">
                                        <div className="relative -mt-10 size-20 shrink-0 overflow-hidden rounded-full ring-4 ring-white">
                                            {guide.profilePhotoUrl ? (
                                                <Image
                                                    src={guide.profilePhotoUrl}
                                                    alt={guide.displayName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            ) : (
                                                <div className="grid size-full place-items-center bg-zinc-100 text-sm font-semibold text-zinc-700">
                                                    {getInitials(guide.displayName)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 pb-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-base font-semibold">
                                                    {guide.displayName}
                                                </div>
                                                {guide.tagline && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 font-normal text-blue-700"
                                                    >
                                                        {guide.tagline}
                                                    </Badge>
                                                )}
                                                {guide.isActive &&
                                                guide.adminEnabled &&
                                                guide.user.status === "ACTIVE" ? (
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
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span>{guide.category ?? "Other"} guide</span>
                                                {typeof guide.yearsOfExperience === "number" &&
                                                    guide.yearsOfExperience > 0 && (
                                                        <>
                                                            <span className="size-1 rounded-full bg-zinc-300" />
                                                            <span className="inline-flex items-center gap-1">
                                                                <Award className="size-3 text-amber-500" />
                                                                {guide.yearsOfExperience} yr
                                                                {guide.yearsOfExperience === 1 ? "" : "s"}
                                                            </span>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile visibility — two independent gates */}
                                <section className="rounded-2xl border bg-card p-4">
                                    <div className="mb-3 text-sm font-semibold">
                                        Public listing
                                    </div>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        The profile only shows on the public site when both
                                        flags are on and the owner account is active.
                                    </p>

                                    <div className="grid gap-2">
                                        <div className="flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2.5">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">
                                                    Admin visibility
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Admin-controlled. Off hides this profile from
                                                    the public site even if the owner wants it
                                                    listed. Cascades automatically from the
                                                    owner&apos;s account status.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {guide.adminEnabled ? "On" : "Off"}
                                                </span>
                                                <Switch
                                                    checked={guide.adminEnabled}
                                                    disabled={savingAdminEnabled}
                                                    onCheckedChange={toggleAdminEnabled}
                                                    aria-label="Toggle admin visibility"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between gap-3 rounded-md border bg-card/50 px-3 py-2.5">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">
                                                    Owner visibility
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Owner-controlled. The guide can hide their own
                                                    profile from their dashboard — only they can
                                                    change this.
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    guide.isActive
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-amber-200 bg-amber-50 text-amber-700"
                                                }
                                            >
                                                {guide.isActive ? "On" : "Off"}
                                            </Badge>
                                        </div>

                                        {guide.user.status === "DISABLED" && (
                                            <p className="text-xs text-amber-700">
                                                The owner account is disabled, so this profile is
                                                hidden from the public site regardless.
                                            </p>
                                        )}
                                    </div>
                                </section>

                                {/* Owner */}
                                <Section title="Owner account">
                                    <KV label="Name" value={guide.user.name ?? "—"} />
                                    <KV label="Email" value={guide.user.email} />
                                    <KV label="Phone" value={guide.user.phone ?? "—"} />
                                    <KV
                                        label="Account status"
                                        value={
                                            guide.user.status === "ACTIVE" ? "Active" : "Disabled"
                                        }
                                    />
                                    <KV
                                        label="Email verified"
                                        value={
                                            guide.user.emailVerifiedAt
                                                ? new Date(guide.user.emailVerifiedAt).toLocaleString()
                                                : "Not verified"
                                        }
                                    />
                                    <KV
                                        label="Joined"
                                        value={new Date(guide.user.createdAt).toLocaleString()}
                                    />
                                </Section>

                                {/* Identity */}
                                <Section title="Identity">
                                    <KV label="Full name" value={guide.fullName} />
                                    <KV label="Display name" value={guide.displayName} />
                                    <KV label="Category" value={guide.category ?? "Other"} />
                                    <KV label="Tagline" value={guide.tagline ?? "—"} />
                                </Section>

                                {/* Contact */}
                                <Section title="Contact">
                                    <KV label="Email" value={guide.email} />
                                    <KV label="Mobile" value={guide.mobileNumber} />
                                    <KV
                                        label="WhatsApp"
                                        value={
                                            guide.whatsappNumber ??
                                            (guide.whatsappAvailable ? guide.mobileNumber : "—")
                                        }
                                    />
                                    <KV label="Address" value={guide.address} />
                                </Section>

                                {/* Pricing + experience */}
                                <Section title="Experience & rates">
                                    <KV
                                        label="Years of experience"
                                        value={
                                            typeof guide.yearsOfExperience === "number"
                                                ? `${guide.yearsOfExperience} year${guide.yearsOfExperience === 1 ? "" : "s"}`
                                                : "—"
                                        }
                                    />
                                    <KV label="Currency" value={guide.currency ?? "—"} />
                                    <KV
                                        label="Hourly rate"
                                        value={hourPrice ?? "—"}
                                    />
                                    <KV label="Daily rate" value={dayPrice ?? "—"} />
                                </Section>

                                {/* Regions */}
                                <Section title="Regions specialised">
                                    {regions.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">—</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {regions.map((r) => (
                                                <Badge
                                                    key={r}
                                                    variant="secondary"
                                                    className="gap-1 font-normal"
                                                >
                                                    <MapPin className="size-3" />
                                                    {r}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Section>

                                {/* Languages */}
                                <Section title="Spoken languages">
                                    {languages.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">—</div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {languages.map((l) => (
                                                <div
                                                    key={l.id}
                                                    className="flex items-center justify-between gap-2"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {l.countryCode && (
                                                            <div className="relative h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                                                                <Image
                                                                    src={flagUrl(l.countryCode)}
                                                                    alt=""
                                                                    fill
                                                                    className="object-cover"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="text-sm">{l.language}</span>
                                                    </div>
                                                    <Badge variant="outline" className="font-normal">
                                                        {levelLabel(l.level)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Section>

                                {/* Bio */}
                                {guide.bio && (
                                    <Section title="Bio">
                                        {/<\w+[^>]*>/.test(guide.bio) ? (
                                            <div
                                                className="bio-content space-y-3 text-sm leading-6 text-zinc-700"
                                                dangerouslySetInnerHTML={{ __html: guide.bio }}
                                            />
                                        ) : (
                                            <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                                                {guide.bio}
                                            </div>
                                        )}
                                    </Section>
                                )}

                                {/* Itineraries */}
                                {itineraries.length > 0 && (
                                    <Section title={`Itineraries (${itineraries.length})`}>
                                        <div className="grid gap-2">
                                            {itineraries.map((it) => (
                                                <div
                                                    key={it.id}
                                                    className="rounded-md border bg-card px-3 py-2"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">
                                                                {it.title}
                                                            </div>
                                                            {it.subtitle && (
                                                                <div className="truncate text-xs text-muted-foreground">
                                                                    {it.subtitle}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            {it.durationLabel && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="font-normal"
                                                                >
                                                                    {it.durationLabel}
                                                                </Badge>
                                                            )}
                                                            {formatMoney(it.price, it.currency) && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-normal"
                                                                >
                                                                    {formatMoney(it.price, it.currency)}
                                                                </Badge>
                                                            )}
                                                            {!it.isActive && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-200 bg-amber-50 text-amber-700"
                                                                >
                                                                    Hidden
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-muted-foreground">
                                                        {it.days.length > 0 && (
                                                            <span>{it.days.length} days</span>
                                                        )}
                                                        {it.inclusions.length > 0 && (
                                                            <span>{it.inclusions.length} inclusions</span>
                                                        )}
                                                        {it.galleryImages.length > 0 && (
                                                            <span>
                                                                {it.galleryImages.length} images
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Gallery */}
                                {galleryImages.length > 0 && (
                                    <Section title={`Gallery (${galleryImages.length})`}>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                            {galleryImages.map((img) => (
                                                <a
                                                    key={img.id}
                                                    href={img.imageUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="relative aspect-4/3 overflow-hidden rounded-md ring-1 ring-zinc-200"
                                                >
                                                    <Image
                                                        src={img.imageUrl}
                                                        alt={img.caption ?? ""}
                                                        fill
                                                        className="object-cover"
                                                        sizes="200px"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Application */}
                                <Section title="Original application">
                                    <KV label="Status" value={guide.application.status} />
                                    <KV
                                        label="Submitted"
                                        value={new Date(guide.application.createdAt).toLocaleString()}
                                    />
                                    <KV
                                        label="Last updated"
                                        value={new Date(guide.application.updatedAt).toLocaleString()}
                                    />
                                    <KV
                                        label="NIC number"
                                        value={guide.application.nicNumber}
                                    />
                                    <KV
                                        label="Registration no"
                                        value={guide.application.registrationNo ?? "—"}
                                    />
                                    <KV
                                        label="Guide licence expiry"
                                        value={
                                            guide.application.guideLicenseExpiryDate
                                                ? new Date(
                                                      guide.application.guideLicenseExpiryDate,
                                                  ).toLocaleDateString()
                                                : "—"
                                        }
                                    />
                                    {guide.application.remark && (
                                        <KV label="Remark" value={guide.application.remark} />
                                    )}

                                    <div className="mt-3">
                                        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Submitted documents
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {docs.map((doc) =>
                                                doc.url ? (
                                                    <button
                                                        key={doc.label}
                                                        type="button"
                                                        onClick={() =>
                                                            setViewerDoc({ label: doc.label, url: doc.url! })
                                                        }
                                                        className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-left hover:bg-accent"
                                                    >
                                                        <div className="grid size-9 place-items-center rounded-md bg-zinc-100 text-zinc-700">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-medium">
                                                                {doc.label}
                                                            </div>
                                                            <div className="truncate text-[0.7rem] text-muted-foreground">
                                                                {fileNameFromUrl(doc.url)}
                                                            </div>
                                                        </div>
                                                        <Eye className="size-3.5 text-muted-foreground" />
                                                    </button>
                                                ) : (
                                                    <div
                                                        key={doc.label}
                                                        className="flex items-center gap-3 rounded-md border bg-card/40 px-3 py-2 text-muted-foreground"
                                                    >
                                                        <div className="grid size-9 place-items-center rounded-md bg-zinc-100">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm">{doc.label}</div>
                                                            <div className="text-[0.7rem]">Not provided</div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {guide.application.statusHistory.length > 0 && (
                                        <div className="mt-3">
                                            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Status history
                                            </div>
                                            <div className="grid gap-1.5">
                                                {guide.application.statusHistory.map((h) => (
                                                    <div
                                                        key={h.id}
                                                        className="rounded-md border bg-card px-3 py-2 text-xs"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="font-normal"
                                                            >
                                                                {h.status}
                                                            </Badge>
                                                            <span className="text-muted-foreground">
                                                                {new Date(h.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {h.remark && (
                                                            <div className="mt-1 text-zinc-700">
                                                                {h.remark}
                                                            </div>
                                                        )}
                                                        {h.updatedByUser && (
                                                            <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
                                                                by {h.updatedByUser.name ?? h.updatedByUser.email}
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
