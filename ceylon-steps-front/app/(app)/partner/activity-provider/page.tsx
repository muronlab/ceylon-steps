"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Eye,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getApiErrorMessage } from "@/services/error-handler";
import {
  activityProviderService,
  type ActivityProviderApplication,
} from "@/services/activity-provider.service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/diceui/file-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ---------- types ----------

type ActivityProviderFormState = {
  fullName: string;
  mobileNumber: string;
  whatsappAvailable: boolean;
  useAccountEmail: boolean;
  contactEmail: string;
  nicNumber: string;
  businessName: string;
  natureOfBusiness: string;
  description: string;
  address: string;
  nicFront: File | null;
  nicBack: File | null;
  brdDocument: File | null;
};

type FieldErrors = Partial<Record<keyof ActivityProviderFormState, string>>;

// ---------- helpers ----------

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeSriLankaMobileLocal(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits.slice(2, 11);
  if (digits.startsWith("0")) return digits.slice(1, 10);
  return digits.slice(0, 9);
}

function formatSriLankaMobileLocal(value: string) {
  const digits = value.replace(/\D/g, "");
  const match = digits.match(/^(\d{0,2})(\d{0,3})(\d{0,4})$/);
  if (!match) return digits;
  return !match[2]
    ? match[1]
    : !match[3]
      ? `${match[1]} ${match[2]}`
      : `${match[1]} ${match[2]} ${match[3]}`;
}

function validateSriLankaMobileLocal(value: string) {
  return /^7\d{8}$/.test(value);
}

/** Sri Lanka NIC: old (9 digits + V/X) or new (12 digits). */
function validateSriLankaNic(value: string) {
  return /^(\d{9}[VvXx]|\d{12})$/.test(value.trim());
}

function useFilePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

function handleDownload(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

function handlePreview(file: File) {
  const url = URL.createObjectURL(file);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------- page ----------

export default function ActivityProviderPartnerPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [existingApp, setExistingApp] =
    useState<ActivityProviderApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  const [form, setForm] = useState<ActivityProviderFormState>({
    fullName: "",
    mobileNumber: "",
    whatsappAvailable: false,
    useAccountEmail: true,
    contactEmail: "",
    nicNumber: "",
    businessName: "",
    natureOfBusiness: "",
    description: "",
    address: "",
    nicFront: null,
    nicBack: null,
    brdDocument: null,
  });

  const [alertConfig, setAlertConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    type: "success" | "error";
  }>({ open: false, title: "", description: "", type: "success" });

  // Pre-fill name/email from logged-in user
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name?.trim() || "",
      contactEmail: prev.contactEmail || user.email || "",
    }));
  }, [user]);

  // Fetch any existing application so we can gate the form
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const app = await activityProviderService.getMine();
        if (cancelled) return;
        setExistingApp(app);
        // Pre-fill on REJECTED so the user can edit + resubmit.
        if (app && app.status === "REJECTED") {
          setForm((prev) => ({
            ...prev,
            fullName: app.fullName,
            mobileNumber: app.mobileNumber.replace(/^\+94/, ""),
            whatsappAvailable: app.whatsappAvailable,
            useAccountEmail: app.usesAccountEmail,
            contactEmail: app.contactEmail ?? "",
            nicNumber: app.nicNumber,
            businessName: app.businessName,
            natureOfBusiness: app.natureOfBusiness,
            description: app.description ?? "",
            address: app.address,
          }));
        }
      } catch {
        if (!cancelled) setExistingApp(null);
      } finally {
        if (!cancelled) setLoadingApp(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Effective email used at submit time (optional field)
  const effectiveEmail = useMemo(() => {
    if (form.useAccountEmail) return user?.email ?? "";
    return form.contactEmail.trim();
  }, [form.contactEmail, form.useAccountEmail, user?.email]);

  function setField<K extends keyof ActivityProviderFormState>(
    key: K,
    value: ActivityProviderFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }

  // ---------- validation ----------

  function validateDetails(s: ActivityProviderFormState): FieldErrors {
    const e: FieldErrors = {};
    if (!s.fullName.trim()) e.fullName = "Full name is required.";

    if (!s.mobileNumber.trim()) e.mobileNumber = "Mobile number is required.";
    else if (!validateSriLankaMobileLocal(s.mobileNumber))
      e.mobileNumber =
        "Enter a valid Sri Lanka mobile number (starts with 7, 9 digits).";

    // Email is optional — only validate the format when one is provided.
    if (
      !s.useAccountEmail &&
      s.contactEmail.trim() &&
      !isLikelyEmail(s.contactEmail)
    )
      e.contactEmail = "Please enter a valid email address.";

    if (!s.nicNumber.trim()) e.nicNumber = "NIC number is required.";
    else if (!validateSriLankaNic(s.nicNumber))
      e.nicNumber = "Enter a valid NIC (9 digits + V/X, or 12 digits).";

    if (!s.businessName.trim()) e.businessName = "Business name is required.";

    if (!s.natureOfBusiness.trim())
      e.natureOfBusiness = "Please tell us the nature of your business.";

    if (!s.address.trim()) e.address = "Address is required.";

    return e;
  }

  function validateDocuments(s: ActivityProviderFormState): FieldErrors {
    const e: FieldErrors = {};
    if (!s.nicFront) e.nicFront = "NIC front image is required.";
    if (!s.nicBack) e.nicBack = "NIC back image is required.";
    return e;
  }

  function onNext() {
    if (step === 1) {
      const e = validateDetails(form);
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(2);
    } else if (step === 2) {
      const e = validateDocuments(form);
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(3);
    }
  }

  async function submitApplication() {
    const detailErrors = validateDetails(form);
    const docErrors = validateDocuments(form);
    const e: FieldErrors = { ...detailErrors, ...docErrors };
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Jump back to the first step that has an error.
      setStep(Object.keys(detailErrors).length > 0 ? 1 : 2);
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("fullName", form.fullName.trim());
      body.set("mobileNumber", `+94${form.mobileNumber}`);
      body.set("whatsappAvailable", String(form.whatsappAvailable));
      body.set("usesAccountEmail", String(form.useAccountEmail));
      body.set("contactEmail", effectiveEmail);
      body.set("nicNumber", form.nicNumber.trim().toUpperCase());
      body.set("businessName", form.businessName.trim());
      body.set("natureOfBusiness", form.natureOfBusiness.trim());
      body.set("description", form.description.trim());
      body.set("address", form.address.trim());
      if (form.nicFront) body.set("nicFront", form.nicFront);
      if (form.nicBack) body.set("nicBack", form.nicBack);
      if (form.brdDocument) body.set("brdDocument", form.brdDocument);

      const saved = await activityProviderService.apply(body);
      setExistingApp(saved);
      setAlertConfig({
        open: true,
        title: "Application Submitted",
        description:
          "Thanks! We'll review your activity provider application and get back to you by email.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({
        open: true,
        title: "Submission Failed",
        description: `Something went wrong: ${getApiErrorMessage(err)}`,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- derived ----------

  const nicFrontFiles = useMemo(
    () => (form.nicFront ? [form.nicFront] : []),
    [form.nicFront],
  );
  const nicBackFiles = useMemo(
    () => (form.nicBack ? [form.nicBack] : []),
    [form.nicBack],
  );
  const brdFiles = useMemo(
    () => (form.brdDocument ? [form.brdDocument] : []),
    [form.brdDocument],
  );
  const nicFrontPreview = useFilePreviewUrl(form.nicFront);
  const nicBackPreview = useFilePreviewUrl(form.nicBack);
  const brdPreview = useFilePreviewUrl(form.brdDocument);

  // ---------- render: status gate ----------

  if (loadingApp) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    );
  }

  if (
    existingApp &&
    (existingApp.status === "PENDING" || existingApp.status === "APPROVED")
  ) {
    const isPending = existingApp.status === "PENDING";
    return (
      <div className="min-h-dvh w-full bg-zinc-50 p-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full bg-white px-4"
            >
              <Link
                href="/become-a-partner"
                className="inline-flex items-center gap-2"
              >
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
                    : "You're a verified activity partner"}
                </h1>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {isPending
                    ? "Your activity provider application is being reviewed. You can't submit another while this one is pending."
                    : "Your activity provider application has been approved."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryItem label="Full name">
                {existingApp.fullName}
              </SummaryItem>
              <SummaryItem label="Mobile">
                {existingApp.mobileNumber}
              </SummaryItem>
              <SummaryItem label="WhatsApp">
                {existingApp.whatsappAvailable ? "Yes" : "No"}
              </SummaryItem>
              <SummaryItem label="Contact email">
                {existingApp.contactEmail ?? "—"}
              </SummaryItem>
              <SummaryItem label="Business">
                {existingApp.businessName}
              </SummaryItem>
              <SummaryItem label="Nature of business">
                {existingApp.natureOfBusiness}
              </SummaryItem>
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
    );
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
                  <Sparkles className="size-4 text-amber-500" aria-hidden />
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  Ceylon Step
                </div>
              </div>

              <div className="relative mt-6">
                <div
                  className="absolute left-4.5 top-2 bottom-2 w-px bg-zinc-200"
                  aria-hidden
                />
                <div className="grid gap-7">
                  {[
                    {
                      n: 1,
                      title: "Your details",
                      desc: "Contact & business info",
                    },
                    { n: 2, title: "Documents", desc: "NIC and registration" },
                    { n: 3, title: "Review", desc: "Confirm and submit" },
                  ].map((s) => {
                    const isActive = step === s.n;
                    const isComplete = step > s.n;
                    return (
                      <div
                        key={s.n}
                        className="relative flex items-start gap-4"
                      >
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
                          {isComplete ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            s.n
                          )}
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
                    );
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
                <span className="grid size-7 place-items-center rounded-full bg-amber-500 text-white">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                Become an activity partner
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-b border-zinc-200/80 pb-6">
              <div className="text-xs text-zinc-500">Step {step}/3</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-sky-600 sm:text-3xl">
                    Activity provider registration
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Tell us about your activities. We&apos;ll verify and
                    activate your listing.
                  </p>
                </div>
                {existingApp?.status === "REJECTED" && (
                  <div className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <X className="size-4" />
                      <span className="text-sm font-semibold">
                        Application Rejected
                      </span>
                    </div>
                    {existingApp.remark && (
                      <p className="mt-2 text-sm leading-6 text-red-600">
                        <span className="font-semibold">Reason:</span>{" "}
                        {existingApp.remark}
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
                e.preventDefault();
                if (step < 3) onNext();
                else void submitApplication();
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
                  <Step2Documents
                    errors={errors}
                    setField={setField}
                    nicFrontFiles={nicFrontFiles}
                    nicBackFiles={nicBackFiles}
                    brdFiles={brdFiles}
                  />
                )}

                {step === 3 && (
                  <Step3Review
                    form={form}
                    effectiveEmail={effectiveEmail}
                    nicFrontPreview={nicFrontPreview}
                    nicBackPreview={nicBackPreview}
                    brdPreview={brdPreview}
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
                        setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
                      }
                    >
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      className="group relative ml-auto h-11 w-full rounded-full bg-zinc-950 py-2 pl-6 pr-12 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 sm:w-auto sm:min-w-48"
                      onClick={onNext}
                    >
                      {step === 1 ? "Add documents" : "Review application"}
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
  );
}

function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-950">{children}</div>
    </div>
  );
}

// ---------- Step 1: Your details ----------

function Step1Details({
  form,
  errors,
  setField,
  accountEmail,
}: {
  form: ActivityProviderFormState;
  errors: FieldErrors;
  setField: <K extends keyof ActivityProviderFormState>(
    key: K,
    value: ActivityProviderFormState[K],
  ) => void;
  accountEmail: string | undefined;
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
              Travelers see your contact info to book directly. Your NIC is used
              for verification only and is never shown publicly.
            </p>
            <div className="mt-4 grid gap-3 text-xs text-zinc-500">
              <div>
                <span className="font-semibold text-zinc-700">Mobile</span>: Sri
                Lanka only (+94) and 9 digits starting with 7.
              </div>
              <div>
                <span className="font-semibold text-zinc-700">Email</span>:
                optional — leave it to use your account email.
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
              <FieldError
                errors={[
                  errors.fullName ? { message: errors.fullName } : undefined,
                ]}
              />
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  errors.mobileNumber
                    ? { message: errors.mobileNumber }
                    : undefined,
                ]}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.nicNumber}>
            <FieldLabel>NIC number</FieldLabel>
            <FieldContent>
              <Input
                value={form.nicNumber}
                onChange={(ev) => setField("nicNumber", ev.target.value)}
                placeholder="200012345678 or 123456789V"
                className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm uppercase sm:h-12 sm:px-4 sm:text-base"
                aria-invalid={!!errors.nicNumber}
              />
              <FieldDescription>
                Old (9 digits + V/X) or new (12 digits) NIC. Used for
                verification only.
              </FieldDescription>
              <FieldError
                errors={[
                  errors.nicNumber ? { message: errors.nicNumber } : undefined,
                ]}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.businessName}>
            <FieldLabel>Business name</FieldLabel>
            <FieldContent>
              <Input
                value={form.businessName}
                onChange={(ev) => setField("businessName", ev.target.value)}
                placeholder="e.g. Lanka Adventures"
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

          {/* Email block — full width */}
          <div className="md:col-span-2">
            <Field data-invalid={!!errors.contactEmail}>
              <FieldLabel>Contact email (optional)</FieldLabel>
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
                      <span className="font-medium">Use my account email</span>
                      <span className="text-xs text-zinc-500">
                        {accountEmail
                          ? accountEmail
                          : "Sign in to use this option."}
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
                        placeholder="you@email.com (optional)"
                        className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm sm:h-12 sm:px-4 sm:text-base"
                        aria-invalid={!!errors.contactEmail}
                      />
                    </div>
                  )}
                </div>
                <FieldError
                  errors={[
                    errors.contactEmail
                      ? { message: errors.contactEmail }
                      : undefined,
                  ]}
                />
              </FieldContent>
            </Field>
          </div>

          {/* Nature of business — full width */}
          <div className="md:col-span-2">
            <Field data-invalid={!!errors.natureOfBusiness}>
              <FieldLabel>Nature of your business</FieldLabel>
              <FieldContent>
                <Input
                  value={form.natureOfBusiness}
                  onChange={(ev) =>
                    setField("natureOfBusiness", ev.target.value)
                  }
                  placeholder="e.g. Surf school, hot-air balloon rides, pottery workshops"
                  className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm sm:h-12 sm:px-4 sm:text-base"
                  aria-invalid={!!errors.natureOfBusiness}
                />
                <FieldError
                  errors={[
                    errors.natureOfBusiness
                      ? { message: errors.natureOfBusiness }
                      : undefined,
                  ]}
                />
              </FieldContent>
            </Field>
          </div>

          {/* Description — full width, optional */}
          <div className="md:col-span-2">
            <Field data-invalid={!!errors.description}>
              <FieldLabel>Description (optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  value={form.description}
                  onChange={(ev) => setField("description", ev.target.value)}
                  placeholder="Tell travelers more about the activities you offer, your experience, what makes them special…"
                  className="min-h-24 rounded-3xl border border-zinc-200 bg-white px-3 py-3 text-sm sm:text-base"
                  aria-invalid={!!errors.description}
                />
                <FieldError
                  errors={[
                    errors.description
                      ? { message: errors.description }
                      : undefined,
                  ]}
                />
              </FieldContent>
            </Field>
          </div>

          {/* Address — full width */}
          <div className="md:col-span-2">
            <Field data-invalid={!!errors.address}>
              <FieldLabel>Address</FieldLabel>
              <FieldContent>
                <Textarea
                  value={form.address}
                  onChange={(ev) => setField("address", ev.target.value)}
                  placeholder="Street, city, district"
                  className="min-h-20 rounded-3xl border border-zinc-200 bg-white px-3 py-3 text-sm sm:text-base"
                  aria-invalid={!!errors.address}
                />
                <FieldError
                  errors={[
                    errors.address ? { message: errors.address } : undefined,
                  ]}
                />
              </FieldContent>
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Step 2: Documents ----------

function Step2Documents({
  errors,
  setField,
  nicFrontFiles,
  nicBackFiles,
  brdFiles,
}: {
  errors: FieldErrors;
  setField: <K extends keyof ActivityProviderFormState>(
    key: K,
    value: ActivityProviderFormState[K],
  ) => void;
  nicFrontFiles: File[];
  nicBackFiles: File[];
  brdFiles: File[];
}) {
  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">
        Upload documents
      </div>
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
        <DocSlot
          label="Business Registration (BRD)"
          description="Optional. Helps speed up verification."
          files={brdFiles}
          onChange={(f) => setField("brdDocument", f)}
        />
      </div>
    </>
  );
}

function DocSlot({
  label,
  description,
  required,
  files,
  error,
  onChange,
}: {
  label: string;
  description?: string;
  required?: boolean;
  files: File[];
  error?: string;
  onChange: (file: File | null) => void;
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
              <p className="text-xs text-zinc-500">
                JPG, PNG or PDF up to 10MB
              </p>
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

        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError errors={[error ? { message: error } : undefined]} />
      </FieldContent>
    </Field>
  );
}

// ---------- Step 3: Review ----------

function Step3Review({
  form,
  effectiveEmail,
  nicFrontPreview,
  nicBackPreview,
  brdPreview,
}: {
  form: ActivityProviderFormState;
  effectiveEmail: string;
  nicFrontPreview: string | null;
  nicBackPreview: string | null;
  brdPreview: string | null;
}) {
  const docs: Array<{
    label: string;
    file: File | null;
    preview: string | null;
  }> = [
    { label: "NIC front", file: form.nicFront, preview: nicFrontPreview },
    { label: "NIC back", file: form.nicBack, preview: nicBackPreview },
  ];
  if (form.brdDocument) {
    docs.push({
      label: "Business registration",
      file: form.brdDocument,
      preview: brdPreview,
    });
  }
  return (
    <>
      <div className="text-sm font-semibold text-zinc-950">
        Review application
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Make sure everything looks right. You can go back to fix anything.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="rounded-3xl bg-zinc-50/70 p-5 ring-1 ring-zinc-200/70">
          <div className="text-sm font-semibold text-zinc-950">
            Before you submit
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            We&apos;ll review your application and reach out by email. Most
            reviews take 1–3 business days.
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
              ["NIC number", form.nicNumber.toUpperCase() || "—"],
              ["Business name", form.businessName || "—"],
              ["Nature of business", form.natureOfBusiness || "—"],
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

          {form.description && (
            <div className="mt-4 rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Description
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                {form.description}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-zinc-200/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Address
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
              {form.address || "—"}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                        <div className="font-medium text-zinc-700">
                          {doc.file.name}
                        </div>
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
  );
}
