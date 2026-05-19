"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  Building2,
  Camera,
  ImageIcon,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@/app/profile/guide/sections/photo-upload";
import {
  transportProviderService,
  type TransportProviderProfile,
  type UpdateTransportProviderProfilePayload,
} from "@/services/transport-provider.service";
import { FleetSection } from "./fleet-section";
import { DriverServicesSection } from "./driver-services-section";
import { SafariJeepsSection } from "./safari-jeeps-section";
import { TransportTypeChangeCard } from "./transport-type-change-card";

const PROVIDER_LABELS: Record<TransportProviderProfile["providerType"], string> =
  {
    SAFARI_JEEP: "Safari Jeep Operator",
    VEHICLE_WITH_DRIVER: "Driver with Vehicle",
    VEHICLE_FLEET: "Vehicle Rental / Fleet",
  };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "T";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export function TransportProfileEditor({
  profile,
  onChange,
  onReload,
}: {
  profile: TransportProviderProfile;
  onChange: (next: TransportProviderProfile) => void;
  /** Triggered when the type change card detects an approved request that
   * hasn't been reflected yet — page should re-fetch the profile. */
  onReload?: () => void;
}) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [savingActive, setSavingActive] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  async function patchProfile(payload: UpdateTransportProviderProfilePayload) {
    setTopError(null);
    try {
      const next = await transportProviderService.updateMyProfile(payload);
      onChange(next);
      return next;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message;
        setTopError(msg ?? "Failed to save changes.");
      } else {
        setTopError("Failed to save changes.");
      }
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

  return (
    <div className="w-full pb-12">
      {topError && (
        <div className="mb-4 rounded-3xl bg-red-50 px-5 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {topError}
        </div>
      )}

      {/* Visibility banner */}
      <div
        className={cn(
          "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-3 ring-1",
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
              ? "Travelers can find you on the public transport listing."
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

      <div className="overflow-hidden rounded-4xl bg-white shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)]">
        {/* Cover */}
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
              <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
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
              pathPrefix={`transport/${profile.id}/cover`}
              onUploaded={(url) => patchProfile({ coverPhotoUrl: url })}
              icon={<ImageIcon className="size-4" />}
            />
          </div>
        </div>

        <div className="relative px-3 pb-8 sm:px-7">
          {/* Avatar */}
          <div className="-mt-20 sm:-mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm sm:size-48">
                    {profile.profilePhotoUrl ? (
                      <div className="relative size-full">
                        <Image
                          src={profile.profilePhotoUrl}
                          alt={profile.fullName}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    ) : (
                      <div className="grid size-[132px] place-items-center rounded-full bg-zinc-950/5 text-4xl font-semibold text-zinc-800 ring-1 ring-zinc-200 sm:size-[180px] sm:text-6xl">
                        {getInitials(profile.fullName)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 right-0 flex items-center gap-1">
                    <PhotoUpload
                      label={
                        profile.profilePhotoUrl
                          ? "Change photo"
                          : "Add photo"
                      }
                      uploading={profileUploading}
                      setUploading={setProfileUploading}
                      pathPrefix={`transport/${profile.id}/profile`}
                      onUploaded={(url) =>
                        patchProfile({ profilePhotoUrl: url })
                      }
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
                <div className="min-w-0 pb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {PROVIDER_LABELS[profile.providerType] ??
                      profile.providerType}
                  </div>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                    {profile.fullName}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Editable sections — single column below xl, two columns from xl up.
              Wide list sections (fleet / services / safari jeeps) span the full
              row since their card lists need the room. */}
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            <IdentitySection profile={profile} onSave={patchProfile} />
            <TransportTypeChangeCard
              profile={profile}
              onProfileTypeChanged={() => onReload?.()}
            />
            <ContactSection profile={profile} onSave={patchProfile} />
            <BusinessSection profile={profile} onSave={patchProfile} />
            {profile.providerType === "VEHICLE_FLEET" && (
              <div className="xl:col-span-2">
                <FleetSection profileId={profile.id} mode="fleet" />
              </div>
            )}
            {profile.providerType === "VEHICLE_WITH_DRIVER" && (
              <div className="xl:col-span-2">
                <FleetSection
                  profileId={profile.id}
                  mode="driver"
                  maxVehicles={2}
                />
              </div>
            )}
            {profile.providerType === "VEHICLE_WITH_DRIVER" && (
              <div className="xl:col-span-2">
                <DriverServicesSection profileId={profile.id} />
              </div>
            )}
            {profile.providerType === "SAFARI_JEEP" && (
              <div className="xl:col-span-2">
                <SafariJeepsSection
                  profileId={profile.id}
                  providerFullName={profile.fullName}
                  providerHasBusiness={profile.hasBusiness}
                  providerProfilePhotoUrl={profile.profilePhotoUrl}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline editable sections                                           */
/* ------------------------------------------------------------------ */

function SectionShell({
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
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function IdentitySection({
  profile,
  onSave,
}: {
  profile: TransportProviderProfile;
  onSave: (
    payload: UpdateTransportProviderProfilePayload,
  ) => Promise<TransportProviderProfile>;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [saving, setSaving] = useState(false);
  const dirty = fullName.trim() !== profile.fullName.trim();

  async function save() {
    if (!dirty) return;
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await onSave({ fullName: fullName.trim() });
    } catch {
      // top error already shown
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell title="Identity">
      <div className="grid gap-1.5">
        <Label
          htmlFor="transport-fullName"
          className="text-xs font-semibold text-zinc-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3.5" /> Display name
          </span>
        </Label>
        <Input
          id="transport-fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-10 rounded-2xl"
          placeholder="Your name as travelers will see it"
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold text-zinc-600">
          Provider type
        </Label>
        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
          <span className="text-sm font-medium text-zinc-950">
            {PROVIDER_LABELS[profile.providerType] ?? profile.providerType}
          </span>
          <span className="text-xs text-zinc-500">
            Use the &quot;Provider type&quot; section below to request a change.
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={!dirty || saving || !fullName.trim()}
          className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </SectionShell>
  );
}

function ContactSection({
  profile,
  onSave,
}: {
  profile: TransportProviderProfile;
  onSave: (
    payload: UpdateTransportProviderProfilePayload,
  ) => Promise<TransportProviderProfile>;
}) {
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber);
  const [whatsappAvailable, setWhatsappAvailable] = useState(
    profile.whatsappAvailable,
  );
  const [contactEmail, setContactEmail] = useState(profile.contactEmail);
  const [saving, setSaving] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const mobileValid = /^\+947\d{8}$/.test(mobileNumber.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());
  const dirty =
    mobileNumber.trim() !== profile.mobileNumber ||
    contactEmail.trim().toLowerCase() !==
      profile.contactEmail.trim().toLowerCase();

  async function save() {
    if (!dirty) return;
    if (!mobileValid || !emailValid) return;
    setSaving(true);
    try {
      await onSave({
        mobileNumber: mobileNumber.trim(),
        contactEmail: contactEmail.trim(),
      });
    } catch {
      // top error already shown
    } finally {
      setSaving(false);
    }
  }

  async function toggleWhatsapp(next: boolean) {
    setSavingWhatsapp(true);
    try {
      await onSave({ whatsappAvailable: next });
      setWhatsappAvailable(next);
    } catch {
      // top error already shown
    } finally {
      setSavingWhatsapp(false);
    }
  }

  return (
    <SectionShell title="Contact">
      <div className="grid gap-1.5">
        <Label
          htmlFor="transport-mobile"
          className="text-xs font-semibold text-zinc-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" /> Mobile number
          </span>
        </Label>
        <Input
          id="transport-mobile"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="h-10 rounded-2xl"
          placeholder="+9477XXXXXXX"
        />
        {!mobileValid && mobileNumber.length > 0 && (
          <p className="text-xs text-red-600">
            Must be a Sri Lankan number in +947XXXXXXXX format.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> WhatsApp available
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            Let travelers message you on WhatsApp using your mobile number.
          </div>
        </div>
        <Switch
          checked={whatsappAvailable}
          disabled={savingWhatsapp}
          onCheckedChange={toggleWhatsapp}
        />
      </div>

      <div className="grid gap-1.5">
        <Label
          htmlFor="transport-email"
          className="text-xs font-semibold text-zinc-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" /> Contact email
          </span>
        </Label>
        <Input
          id="transport-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="h-10 rounded-2xl"
          placeholder="hello@example.com"
        />
        {!emailValid && contactEmail.length > 0 && (
          <p className="text-xs text-red-600">
            Enter a valid email address.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={!dirty || saving || !mobileValid || !emailValid}
          className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
        >
          {saving ? "Saving…" : "Save contact"}
        </Button>
      </div>
    </SectionShell>
  );
}

function BusinessSection({
  profile,
  onSave,
}: {
  profile: TransportProviderProfile;
  onSave: (
    payload: UpdateTransportProviderProfilePayload,
  ) => Promise<TransportProviderProfile>;
}) {
  const [hasBusiness, setHasBusiness] = useState(profile.hasBusiness);
  const [businessName, setBusinessName] = useState(profile.businessName ?? "");
  const [businessDescription, setBusinessDescription] = useState(
    profile.businessDescription ?? "",
  );
  const [savingToggle, setSavingToggle] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    hasBusiness &&
    (businessName.trim() !== (profile.businessName ?? "").trim() ||
      businessDescription.trim() !==
        (profile.businessDescription ?? "").trim());

  async function toggle(next: boolean) {
    setSavingToggle(true);
    try {
      await onSave({ hasBusiness: next });
      setHasBusiness(next);
      if (!next) {
        setBusinessName("");
        setBusinessDescription("");
      }
    } catch {
      // top error already shown
    } finally {
      setSavingToggle(false);
    }
  }

  async function save() {
    if (!dirty) return;
    setSaving(true);
    try {
      await onSave({
        businessName: businessName.trim() || null,
        businessDescription: businessDescription.trim() || null,
      });
    } catch {
      // top error already shown
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell title="Business">
      <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Operate as a business
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            Show a registered business name and description on your profile.
          </div>
        </div>
        <Switch
          checked={hasBusiness}
          disabled={savingToggle}
          onCheckedChange={toggle}
        />
      </div>

      {hasBusiness && (
        <>
          <div className="grid gap-1.5">
            <Label
              htmlFor="transport-businessName"
              className="text-xs font-semibold text-zinc-600"
            >
              Business name
            </Label>
            <Input
              id="transport-businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-10 rounded-2xl"
              placeholder="e.g. Lanka Safari Co."
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="transport-businessDescription"
              className="text-xs font-semibold text-zinc-600"
            >
              Business description
            </Label>
            <Textarea
              id="transport-businessDescription"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              className="rounded-2xl"
              rows={4}
              placeholder="A short paragraph about what your business offers."
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
            >
              {saving ? "Saving…" : "Save business"}
            </Button>
          </div>
        </>
      )}
    </SectionShell>
  );
}
