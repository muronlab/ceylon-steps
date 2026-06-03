"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import {
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  ImageIcon,
  Trash2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  activityProviderService,
  type ActivityProviderApplication,
  type ActivityProviderProfile,
  type UpdateActivityProviderProfilePayload,
} from "@/services/activity-provider.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { GhostInput } from "@/components/ui/ghost-input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@/app/profile/guide/sections/photo-upload";
import { ActivityDescriptionEditor } from "./activity-description-editor";
import { ActivityExperienceRatesEditor } from "./activity-experience-rates-editor";
import { ActivityLanguagesEditor } from "./activity-languages-editor";
import { ActivityGalleryEditor } from "./activity-gallery-editor";
import { ItinerariesEditor } from "@/app/profile/guide/sections/itineraries-editor";
import { activityItinerariesService } from "@/services/activity-itineraries.service";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

/** Colour swatches for the business-name title. `null` = default text colour. */
const TITLE_COLOURS: { value: string | null; label: string }[] = [
  { value: null, label: "Default" },
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#e11d48", label: "Red" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0891b2", label: "Teal" },
];

const STATUS_STYLES: Record<
  ActivityProviderApplication["status"],
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

export default function ActivityProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] =
    useState<ActivityProviderApplication | null>(null);
  const [profile, setProfile] = useState<ActivityProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/profile/activity");
      return;
    }
    const isActivity =
      Array.isArray(user.roles) && user.roles.includes("ACTIVITY_PROVIDER");
    if (!isActivity) {
      router.replace("/profile");
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const app = await activityProviderService.getMine();
      setApplication(app);
      if (app?.status === "APPROVED") {
        try {
          const prof = await activityProviderService.getMyProfile();
          setProfile(prof);
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status !== 404) {
            const msg = (err.response?.data as { message?: string })?.message;
            setError(msg ?? "Failed to load your activity profile.");
          }
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setError(
            "No activity application yet. Once your application is approved, your profile will appear here.",
          );
        } else if (status === 403) {
          setError("Only verified activity providers can view this page.");
        } else {
          const msg = (err.response?.data as { message?: string })?.message;
          setError(msg ?? "Failed to load your activity profile.");
        }
      } else {
        setError("Failed to load your activity profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const isActivity =
      Array.isArray(user.roles) && user.roles.includes("ACTIVITY_PROVIDER");
    if (isActivity) void load();
  }, [user, load]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <div className="text-sm font-semibold text-amber-900">
          Can&apos;t load your activity profile
        </div>
        <div className="mt-1 text-sm text-amber-800">{error}</div>
      </div>
    );
  }

  if (!application) return null;

  if (application.status === "APPROVED" && profile) {
    return (
      <div className="flex w-full flex-col gap-5 py-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Activity profile
          </h1>
          <p className="text-sm text-zinc-500">
            Edit how travelers see you. Documents are read-only.
          </p>
        </div>

        <ActivityProfileEditor
          profile={profile}
          onChange={(next) => setProfile(next)}
        />
      </div>
    );
  }

  // Pending or rejected → read-only status view.
  const status = STATUS_STYLES[application.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex w-full flex-col gap-5 py-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Activity profile
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

      <Section title="Identity">
        <KV label="Full name" value={application.fullName} />
        <KV label="NIC number" value={application.nicNumber} />
      </Section>
      <Section title="Contact">
        <KV label="Mobile" value={application.mobileNumber} />
        <KV
          label="WhatsApp available"
          value={application.whatsappAvailable ? "Yes" : "No"}
        />
        <KV label="Contact email" value={application.contactEmail ?? "—"} />
      </Section>
      <Section title="Business">
        <KV label="Business name" value={application.businessName} />
        <KV label="Nature of business" value={application.natureOfBusiness} />
        <KV label="Address" value={application.address} />
        {application.description && (
          <div className="rounded-2xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
            {application.description}
          </div>
        )}
      </Section>
      <Section title="Documents">
        <DocRow label="NIC front" url={application.nicFrontUrl} />
        <DocRow label="NIC back" url={application.nicBackUrl} />
        <DocRow label="Business registration" url={application.brdDocumentUrl} />
      </Section>
    </div>
  );
}

function ActivityProfileEditor({
  profile,
  onChange,
}: {
  profile: ActivityProviderProfile;
  onChange: (next: ActivityProviderProfile) => void;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    mobileNumber: profile.mobileNumber,
    whatsappAvailable: profile.whatsappAvailable,
    contactEmail: profile.contactEmail ?? "",
    businessName: profile.businessName,
    natureOfBusiness: profile.natureOfBusiness,
    description: profile.description ?? "",
    address: profile.address,
    businessNameColor: profile.businessNameColor,
    businessEmail: profile.businessEmail,
    businessPhone: profile.businessPhone,
    businessAddress: profile.businessAddress,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [topError, setTopError] = useState<string | null>(null);
  const [savingActive, setSavingActive] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Patch a subset of fields immediately (photos + visibility toggle). */
  async function patchProfile(
    payload: UpdateActivityProviderProfilePayload,
  ): Promise<void> {
    setTopError(null);
    try {
      const next = await activityProviderService.updateMyProfile(payload);
      onChange(next);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to save changes.";
      setTopError(msg);
      throw err;
    }
  }

  async function toggleActive(next: boolean) {
    setSavingActive(true);
    try {
      await patchProfile({ isActive: next });
    } catch {
      // top error already rendered
    } finally {
      setSavingActive(false);
    }
  }

  async function removeCover() {
    setRemovingCover(true);
    try {
      await patchProfile({ coverPhotoUrl: null });
    } catch {
      // top error already rendered
    } finally {
      setRemovingCover(false);
    }
  }

  async function removeProfilePhoto() {
    setRemovingPhoto(true);
    try {
      await patchProfile({ profilePhotoUrl: null });
    } catch {
      // top error already rendered
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await activityProviderService.updateMyProfile({
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        whatsappAvailable: form.whatsappAvailable,
        contactEmail: form.contactEmail.trim() || null,
        businessName: form.businessName.trim(),
        natureOfBusiness: form.natureOfBusiness.trim(),
        description: form.description.trim() || null,
        address: form.address.trim(),
        businessNameColor: form.businessNameColor,
        // Identity is always the business name; the provider-name option was removed.
        displayBusinessName: true,
        businessEmail: form.businessEmail?.trim() || null,
        businessPhone: form.businessPhone?.trim() || null,
        businessAddress: form.businessAddress?.trim() || null,
      });
      onChange(updated);
      setSavedAt(Date.now());
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to save changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {topError && (
        <div className="rounded-3xl bg-red-50 px-5 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {topError}
        </div>
      )}

      {/* Visibility banner */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-3 ring-1",
          profile.isActive
            ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
            : "bg-amber-50 text-amber-900 ring-amber-200",
        )}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {profile.isActive
              ? "Profile is active"
              : "Profile is hidden from travelers"}
          </div>
          <div className="mt-0.5 text-xs">
            {profile.isActive
              ? "Travelers can find you on the public activities listing."
              : "You and the admin team can still see your profile. Re-activate when you're ready to take bookings."}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {profile.isActive ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={profile.isActive}
            disabled={savingActive}
            onCheckedChange={toggleActive}
            aria-label="Toggle profile active state"
          />
        </div>
      </div>

      {/* Cover + avatar + name header */}
      <div className="overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)] ring-1 ring-zinc-200">
        <div className="relative h-52 sm:h-72">
          {profile.coverPhotoUrl ? (
            <Image
              src={profile.coverPhotoUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="1200px"
              priority
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(244,114,182,0.32),transparent_55%),radial-gradient(1000px_circle_at_85%_70%,rgba(99,102,241,0.30),transparent_60%),linear-gradient(120deg,rgba(245,158,11,0.20),rgba(59,130,246,0.16))]" />
              <div className="absolute inset-0 opacity-60 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
            </>
          )}

          <div className="absolute right-3 top-3 flex items-center gap-2">
            {profile.coverPhotoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full bg-white/80 px-3 text-xs font-semibold text-zinc-900 backdrop-blur hover:bg-white"
                onClick={removeCover}
                disabled={removingCover || coverUploading}
              >
                <Trash2 className="size-3.5" />
                {removingCover ? "Removing…" : "Remove cover"}
              </Button>
            )}
            <PhotoUpload
              label={profile.coverPhotoUrl ? "Change cover" : "Add cover"}
              uploading={coverUploading}
              setUploading={setCoverUploading}
              pathPrefix={`activity/${profile.id}/cover`}
              onUploaded={(url) => patchProfile({ coverPhotoUrl: url })}
              icon={<ImageIcon className="size-4" />}
            />
          </div>
        </div>

        <div className="relative px-3 pb-8 sm:px-7">
          <div className="-mt-20 sm:-mt-28">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm sm:size-48">
                  {profile.profilePhotoUrl ? (
                    <div className="relative size-full">
                      <Image
                        src={profile.profilePhotoUrl}
                        alt={form.businessName}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ) : (
                    <div className="grid size-33 place-items-center rounded-full bg-zinc-950/5 text-4xl font-semibold text-zinc-800 ring-1 ring-zinc-200 sm:size-45 sm:text-6xl">
                      {getInitials(form.businessName)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 right-0 flex items-center gap-1">
                  <PhotoUpload
                    label={profile.profilePhotoUrl ? "Change photo" : "Add photo"}
                    uploading={profileUploading}
                    setUploading={setProfileUploading}
                    pathPrefix={`activity/${profile.id}/profile`}
                    onUploaded={(url) => patchProfile({ profilePhotoUrl: url })}
                    icon={<Camera className="size-3.5" />}
                    compact
                  />
                  {profile.profilePhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 rounded-full bg-white p-0 ring-1 ring-zinc-200/70"
                      disabled={removingPhoto || profileUploading}
                      onClick={removeProfilePhoto}
                      aria-label="Remove profile photo"
                      title="Remove profile photo"
                    >
                      <Trash2 className="size-3.5 text-zinc-700" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3 pb-2">
                <div className="min-w-0 flex-1">
                  <GhostInput
                    value={form.natureOfBusiness}
                    onChange={(e) => set("natureOfBusiness", e.target.value)}
                    placeholder="e.g. water rafting"
                    aria-label="Business nature"
                    className="rounded-md text-xs font-semibold uppercase tracking-wider text-zinc-500 transition focus:bg-zinc-50 placeholder:text-zinc-400"
                  />
                  <GhostInput
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Business name"
                    aria-label="Business name"
                    style={{ color: form.businessNameColor ?? undefined }}
                    className="mt-1 rounded-md text-2xl font-bold tracking-tight text-zinc-950 transition focus:bg-zinc-50 sm:text-3xl"
                  />
                </div>
                <div
                  className="flex shrink-0 items-center gap-1 pb-1"
                  role="group"
                  aria-label="Business name colour"
                >
                  {TITLE_COLOURS.map((c) =>
                    c.value === null ? (
                      <button
                        key="default"
                        type="button"
                        onClick={() => set("businessNameColor", null)}
                        title="Default colour"
                        aria-label="Default colour"
                        aria-pressed={form.businessNameColor === null}
                        className={cn(
                          "grid size-5 place-items-center rounded-full text-[10px] font-bold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-100",
                          form.businessNameColor === null && "ring-2 ring-zinc-900",
                        )}
                      >
                        A
                      </button>
                    ) : (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("businessNameColor", c.value)}
                        title={`${c.label} title`}
                        aria-label={`${c.label} title`}
                        aria-pressed={form.businessNameColor === c.value}
                        style={{ backgroundColor: c.value }}
                        className={cn(
                          "size-5 rounded-full ring-1 ring-black/10 transition hover:scale-110",
                          form.businessNameColor === c.value &&
                            "ring-2 ring-zinc-900 ring-offset-1",
                        )}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold tracking-tight text-zinc-950">
          Public profile
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !saving && (
            <span className="text-xs text-emerald-600">Saved</span>
          )}
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-9 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <Tabs defaultValue="business" className="w-full">
        <TabsList>
          <TabsTrigger value="business">Business details</TabsTrigger>
          <TabsTrigger value="provider">Provider details</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          {/* Rich description — the name, nature and title colour are edited in the header. */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-zinc-600">
              Description
            </span>
            <ActivityDescriptionEditor
              value={form.description}
              onChange={(html) => set("description", html)}
            />
          </div>

          {/* Business contact — defaults to the provider's details */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <BusinessContactField
              label="Business email"
              providerLabel="email"
              providerValue={form.contactEmail}
              value={form.businessEmail}
              onChange={(v) => set("businessEmail", v)}
              type="email"
              placeholder="business@email.com"
            />
            <BusinessContactField
              label="Business telephone"
              providerLabel="telephone"
              providerValue={form.mobileNumber}
              value={form.businessPhone}
              onChange={(v) => set("businessPhone", v)}
              placeholder="+9477XXXXXXX"
            />
            <div className="md:col-span-2">
              <BusinessContactField
                label="Business address"
                providerLabel="address"
                providerValue={form.address}
                value={form.businessAddress}
                onChange={(v) => set("businessAddress", v)}
                multiline
                placeholder="Business address"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="provider" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldBlock label="Full name">
          <Input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className="h-11 rounded-xl"
          />
        </FieldBlock>
        <FieldBlock label="Mobile number">
          <Input
            value={form.mobileNumber}
            onChange={(e) => set("mobileNumber", e.target.value)}
            placeholder="+947XXXXXXXX"
            className="h-11 rounded-xl"
          />
        </FieldBlock>
        <FieldBlock label="Contact email (optional)">
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="you@email.com"
            className="h-11 rounded-xl"
          />
        </FieldBlock>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-3 text-sm text-zinc-700">
            <Checkbox
              checked={form.whatsappAvailable}
              onCheckedChange={(c) => set("whatsappAvailable", c === true)}
            />
            Available on WhatsApp
          </label>
        </div>
        <div className="md:col-span-2">
          <FieldBlock label="Address">
            <Textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="min-h-20 rounded-xl"
            />
          </FieldBlock>
        </div>
          </div>

          {/* Verification documents — read-only */}
          <div className="mt-5 border-t border-zinc-100 pt-5">
            <div className="text-sm font-semibold tracking-tight text-zinc-950">
              Verification documents
            </div>
            <p className="mb-3 mt-0.5 text-xs text-zinc-500">
              Read-only. Contact support if any of these need to be updated.
            </p>
            <div className="grid gap-2.5">
              <DocRow label="NIC front" url={profile.nicFrontUrl} />
              <DocRow label="NIC back" url={profile.nicBackUrl} />
              <DocRow
                label="Business registration"
                url={profile.brdDocumentUrl}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>

      <ActivityExperienceRatesEditor profile={profile} onSave={patchProfile} />

      <ActivityLanguagesEditor profile={profile} onSaved={onChange} />

      <ItinerariesEditor
        profile={profile}
        service={activityItinerariesService}
        uploadPathPrefix="activity"
      />

      <ActivityGalleryEditor profile={profile} onSaved={onChange} />
    </div>
  );
}

function BusinessContactField({
  label,
  providerLabel,
  providerValue,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline,
}: {
  label: string;
  /** Word used in the "Same as provider X" toggle, e.g. "email". */
  providerLabel: string;
  /** The provider's current value, shown when "same as provider" is on. */
  providerValue: string;
  /** Business value; null means "same as provider". */
  value: string | null;
  onChange: (v: string | null) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const same = value === null;
  return (
    <FieldBlock label={label}>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <Switch
          checked={same}
          onCheckedChange={(c) => onChange(c ? null : providerValue || "")}
          aria-label={`Same as provider ${providerLabel}`}
        />
        Same as provider {providerLabel}
      </label>
      {same ? (
        <div className="rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 ring-1 ring-zinc-200/70">
          {providerValue.trim() ? (
            providerValue
          ) : (
            <span className="italic">Provider {providerLabel} not set</span>
          )}
        </div>
      ) : multiline ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-20 rounded-xl"
        />
      ) : (
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 rounded-xl"
        />
      )}
    </FieldBlock>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </div>
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
