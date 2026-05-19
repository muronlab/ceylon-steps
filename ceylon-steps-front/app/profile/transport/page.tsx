"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  transportProviderService,
  type TransportProviderApplication,
  type TransportProviderProfile,
} from "@/services/transport-provider.service";
import { TransportProfileEditor } from "./transport-profile-editor";

const STATUS_STYLES: Record<
  TransportProviderApplication["status"],
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
};

export default function TransportProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] =
    useState<TransportProviderApplication | null>(null);
  const [profile, setProfile] = useState<TransportProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/profile/transport");
      return;
    }
    const isTransport =
      Array.isArray(user.roles) && user.roles.includes("TRANSPORT_PROVIDER");
    if (!isTransport) {
      router.replace("/profile");
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const app = await transportProviderService.getMine();
      setApplication(app);
      if (app?.status === "APPROVED") {
        try {
          const prof = await transportProviderService.getMyProfile();
          setProfile(prof);
        } catch (err) {
          // If the profile row hasn't been created for some reason, we still
          // want to show the approved application banner — fall through.
          if (axios.isAxiosError(err) && err.response?.status !== 404) {
            const msg = (err.response?.data as { message?: string })?.message;
            setError(msg ?? "Failed to load your transport profile.");
          }
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setError(
            "No transport application yet. Once your application is approved, your profile will appear here.",
          );
        } else if (status === 403) {
          setError("Only verified transport providers can view this page.");
        } else {
          const msg = (err.response?.data as { message?: string })?.message;
          setError(msg ?? "Failed to load your transport profile.");
        }
      } else {
        setError("Failed to load your transport profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const isTransport =
      Array.isArray(user.roles) && user.roles.includes("TRANSPORT_PROVIDER");
    if (isTransport) void load();
  }, [user, load]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <div className="text-sm font-semibold text-amber-900">
          Can&apos;t load your transport profile
        </div>
        <div className="mt-1 text-sm text-amber-800">{error}</div>
      </div>
    );
  }

  if (!application) return null;

  // Approved + profile loaded → show the editor.
  if (application.status === "APPROVED" && profile) {
    return (
      <div className="flex w-full flex-col gap-5 py-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Transport profile
          </h1>
          <p className="text-sm text-zinc-500">
            Edit how travelers see you. Changes save instantly.
          </p>
        </div>

        <TransportProfileEditor
          profile={profile}
          onChange={(next) => setProfile(next)}
          onReload={() => void load()}
        />

        {/* Documents — read-only */}
        <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
          <div className="mb-3 text-sm font-semibold tracking-tight text-zinc-950">
            Verification documents
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Read-only. Contact support if any of these need to be updated.
          </p>
          <div className="grid gap-2.5">
            <DocRow label="NIC front" url={profile.nicFrontUrl} />
            <DocRow label="NIC back" url={profile.nicBackUrl} />
            {profile.providerType === "SAFARI_JEEP" && (
              <DocRow
                label="Safari licence"
                url={profile.safariJeepLicenseUrl}
              />
            )}
            {profile.hasBusiness && (
              <DocRow
                label="Business registration"
                url={profile.brdDocumentUrl}
              />
            )}
          </div>
        </section>
      </div>
    );
  }

  // Pending or rejected → keep the read-only status view.
  const status = STATUS_STYLES[application.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex w-full flex-col gap-5 py-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Transport profile
        </h1>
        <p className="text-sm text-zinc-500">
          Your application details. Once approved, you can edit your public
          profile from here.
        </p>
      </div>

      <section
        className={`flex items-start gap-3 rounded-3xl p-4 ring-1 ${status.bg} ${status.ring}`}
      >
        <StatusIcon className={`mt-0.5 size-5 shrink-0 ${status.text}`} />
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${status.text}`}>
            {status.label}
          </div>
          {application.remark && (
            <div className={`mt-0.5 text-sm ${status.text}`}>
              {application.remark}
            </div>
          )}
          <div className={`mt-1 text-xs ${status.text} opacity-75`}>
            Last updated {new Date(application.updatedAt).toLocaleString()}
          </div>
        </div>
      </section>

      <ReadOnlyApplicationSummary application={application} />
    </div>
  );
}

function ReadOnlyApplicationSummary({
  application,
}: {
  application: TransportProviderApplication;
}) {
  return (
    <>
      <Section title="Identity">
        <KV label="Full name" value={application.fullName} />
        <KV label="Provider type" value={application.providerType} />
      </Section>

      <Section title="Contact">
        <KV label="Mobile" value={application.mobileNumber} />
        <KV
          label="WhatsApp available"
          value={application.whatsappAvailable ? "Yes" : "No"}
        />
        <KV label="Contact email" value={application.contactEmail} />
      </Section>

      {application.hasBusiness && (
        <Section title="Business">
          <KV label="Business name" value={application.businessName ?? "—"} />
          {application.businessDescription && (
            <div className="rounded-2xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {application.businessDescription}
            </div>
          )}
        </Section>
      )}

      <Section title="Documents">
        <DocRow label="NIC front" url={application.nicFrontUrl} />
        <DocRow label="NIC back" url={application.nicBackUrl} />
        {application.providerType === "SAFARI_JEEP" && (
          <DocRow
            label="Safari licence"
            url={application.safariJeepLicenseUrl}
          />
        )}
        {application.hasBusiness && (
          <DocRow
            label="Business registration"
            url={application.brdDocumentUrl}
          />
        )}
      </Section>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="mb-3 text-sm font-semibold tracking-tight text-zinc-950">
        {title}
      </div>
      <div className="grid gap-2.5">{children}</div>
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="break-words font-medium text-zinc-950">{value}</span>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 ring-1 ring-zinc-200">
        <FileText className="size-4" />
        <span className="flex-1">{label}</span>
        <span className="text-xs">Not provided</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
    >
      <div className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
        <FileText className="size-4" />
      </div>
      <span className="flex-1 font-medium text-zinc-950">{label}</span>
      <span className="text-xs text-zinc-500">View</span>
    </a>
  );
}
