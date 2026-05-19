"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Check, Download, ExternalLink, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  getGuideApplication,
  updateGuideApplicationStatus,
  type ApplicationStatus,
  type GuideApplication,
} from "@/lib/guide-applications-api";

export function ApplicationDetailSheet({
  applicationId,
  open,
  onOpenChange,
  onChanged,
}: {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: (a: GuideApplication) => void;
}) {
  const [app, setApp] = useState<GuideApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [viewerDoc, setViewerDoc] = useState<{
    label: string;
    url: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGuideApplication(applicationId);
      setApp(data);
    } catch (err) {
      setError(extractMessage(err, "Failed to load application."));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (open && applicationId) void load();
    if (!open) {
      setApp(null);
      setError(null);
      setRejectOpen(false);
      setRejectRemark("");
    }
  }, [open, applicationId, load]);

  async function approve() {
    if (!app) return;
    setWorking(true);
    setError(null);
    try {
      const updated = await updateGuideApplicationStatus(app.id, {
        status: "APPROVED",
      });
      const merged = { ...app, ...updated };
      setApp(merged);
      onChanged(updated);
    } catch (err) {
      setError(extractMessage(err, "Failed to approve."));
    } finally {
      setWorking(false);
    }
  }

  async function reject() {
    if (!app) return;
    if (!rejectRemark.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const updated = await updateGuideApplicationStatus(app.id, {
        status: "REJECTED",
        remark: rejectRemark.trim(),
      });
      const merged = { ...app, ...updated };
      setApp(merged);
      onChanged(updated);
      setRejectOpen(false);
      setRejectRemark("");
    } catch (err) {
      setError(extractMessage(err, "Failed to reject."));
    } finally {
      setWorking(false);
    }
  }

  const canAct = app && app.status === "PENDING";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 min-w-[50vw]">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="text-lg">Guide application</SheetTitle>
            <SheetDescription className="text-sm">
              Verify the submitted details and approve or reject.
            </SheetDescription>
          </SheetHeader>

          <div className="p-5">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner />
              </div>
            ) : !app ? (
              <div className="text-sm text-muted-foreground">
                No application selected.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={app.status} />
                    <span className="text-sm text-muted-foreground">
                      Submitted {new Date(app.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {canAct && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="default"
                        className="h-9 bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                        disabled={working}
                        onClick={approve}
                      >
                        <Check className="size-4" />
                        {working ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        size="default"
                        className="h-9 bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                        disabled={working}
                        onClick={() => setRejectOpen(true)}
                      >
                        <X className="size-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {app.status === "REJECTED" && app.remark && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <div className="font-medium">Rejection reason</div>
                    <div className="mt-0.5">{app.remark}</div>
                  </div>
                )}

                <section className="grid gap-2">
                  <KV label="Display name" value={app.displayName} />
                  <KV label="Full name" value={app.fullName} />
                  <KV label="Email" value={app.email} />
                  <KV label="Mobile" value={app.mobileNumber} />
                  <KV
                    label="WhatsApp"
                    value={app.whatsappAvailable ? "Yes" : "No"}
                  />
                  <KV label="Category" value={app.category ?? "—"} />
                  <KV label="NIC number" value={app.nicNumber} />
                  <KV
                    label="Registration no"
                    value={app.registrationNo ?? "—"}
                  />
                  <KV
                    label="License expiry"
                    value={
                      app.guideLicenseExpiryDate
                        ? new Date(
                            app.guideLicenseExpiryDate,
                          ).toLocaleDateString()
                        : "—"
                    }
                  />
                </section>

                <section className="grid gap-1 border-t pt-4">
                  <div className="text-sm font-semibold">Address</div>
                  <div className="whitespace-pre-wrap text-sm">
                    {app.address}
                  </div>
                </section>

                <section className="grid gap-2 border-t pt-4">
                  <div className="text-sm font-semibold">Documents</div>
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
                        <DocRow
                          label="NIC front"
                          url={app.nicFrontUrl}
                          onView={setViewerDoc}
                        />
                        <DocRow
                          label="NIC back"
                          url={app.nicBackUrl}
                          onView={setViewerDoc}
                        />
                        <DocRow
                          label="License front"
                          url={app.guideLicenseFrontUrl}
                          onView={setViewerDoc}
                        />
                        <DocRow
                          label="License back"
                          url={app.guideLicenseBackUrl}
                          onView={setViewerDoc}
                        />
                      </TableBody>
                    </Table>
                  </div>
                </section>

                {app.createdByUser && (
                  <section className="grid gap-1 border-t pt-4 text-sm">
                    <div className="font-semibold">Submitted by</div>
                    <div className="text-muted-foreground">
                      {app.createdByUser.email}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <FileViewerDialog
        doc={viewerDoc}
        onOpenChange={(o) => {
          if (!o) setViewerDoc(null);
        }}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">Reject application</DialogTitle>
            <DialogDescription className="text-sm">
              The applicant will see this remark and can update their submission
              to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-remark" className="text-sm">
              Reason for rejection
            </Label>
            <Textarea
              id="reject-remark"
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              placeholder="e.g. NIC image is blurry, please re-upload a clearer photo."
              rows={4}
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="default"
              className="h-9"
              disabled={working}
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="default"
              className="h-9 bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              disabled={working || !rejectRemark.trim()}
              onClick={reject}
            >
              {working ? "Rejecting…" : "Reject application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-medium">{value}</span>
    </div>
  );
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    return decodeURIComponent(segments[segments.length - 1] ?? url);
  } catch {
    return url;
  }
}

function fileKindFromUrl(url: string): "image" | "pdf" | "other" {
  const lower = url.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(jpe?g|png|webp|gif|bmp|svg|avif)$/.test(lower)) return "image";
  if (/\.pdf$/.test(lower)) return "pdf";
  return "other";
}

function DocRow({
  label,
  url,
  onView,
}: {
  label: string;
  url: string | null;
  onView: (doc: { label: string; url: string }) => void;
}) {
  if (!url) {
    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell className="text-muted-foreground">—</TableCell>
        <TableCell className="text-muted-foreground">Not provided</TableCell>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
      </TableRow>
    );
  }

  const kind = fileKindFromUrl(url);
  const kindLabel =
    kind === "image" ? "Image" : kind === "pdf" ? "PDF" : "File";

  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {kindLabel}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[220px] truncate text-muted-foreground">
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
  );
}

function FileViewerDialog({
  doc,
  onOpenChange,
}: {
  doc: { label: string; url: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = doc !== null;
  const kind = doc ? fileKindFromUrl(doc.url) : "other";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="text-base">
            {doc?.label ?? "Document"}
          </DialogTitle>
          <DialogDescription className="truncate text-sm">
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
              <div className="text-sm text-muted-foreground">
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
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Approved
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-amber-700"
    >
      Pending
    </Badge>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}
