"use client"

import { useState } from "react"
import axios from "axios"
import Image from "next/image"
import { Camera, ImageIcon, Mail, MapPin, Phone, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  guideProfileService,
  type GuideProfile,
} from "@/services/guide-profile.service"
import { ContactEditor } from "./sections/contact-editor"
import { LanguagesEditor } from "./sections/languages-editor"
import { BioEditor } from "./sections/bio-editor"
import { GalleryEditor } from "./sections/gallery-editor"
import { PhotoUpload } from "./sections/photo-upload"
import { ExperienceRatesEditor } from "./sections/experience-rates-editor"
import { ItinerariesEditor } from "./sections/itineraries-editor"
import { IdentityEditor } from "./sections/identity-editor"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "G"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
}

export function GuideProfileEditor({
  profile,
  onChange,
}: {
  profile: GuideProfile
  onChange: (next: GuideProfile) => void
}) {
  const [coverUploading, setCoverUploading] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  const [topError, setTopError] = useState<string | null>(null)
  const [savingActive, setSavingActive] = useState(false)
  const [removingCover, setRemovingCover] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)

  async function patchProfile(payload: Parameters<typeof guideProfileService.updateMe>[0]) {
    setTopError(null)
    try {
      const next = await guideProfileService.updateMe(payload)
      onChange(next)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message
        setTopError(msg ?? "Failed to save changes.")
      } else {
        setTopError("Failed to save changes.")
      }
      throw err
    }
  }

  async function toggleActive(next: boolean) {
    setSavingActive(true)
    try {
      await patchProfile({ isActive: next })
    } catch {
      // top error already rendered
    } finally {
      setSavingActive(false)
    }
  }

  async function removeCover() {
    setRemovingCover(true)
    try {
      await patchProfile({ coverPhotoUrl: null })
    } catch {
      // top error already rendered
    } finally {
      setRemovingCover(false)
    }
  }

  async function removeProfilePhoto() {
    setRemovingPhoto(true)
    try {
      await patchProfile({ profilePhotoUrl: null })
    } catch {
      // top error already rendered
    } finally {
      setRemovingPhoto(false)
    }
  }

  return (
    <div className="w-full pb-12">
      {topError && (
        <div className="mb-4 rounded-3xl bg-red-50 px-5 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {topError}
        </div>
      )}

      {/* Profile visibility banner */}
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
            {profile.isActive ? "Profile is active" : "Profile is hidden from travelers"}
          </div>
          <div className="mt-0.5 text-xs">
            {profile.isActive
              ? "Travelers can find you on the public guides listing."
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
        {/* Cover banner with upload / remove */}
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
              <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(14,165,233,0.42),transparent_55%),radial-gradient(1000px_circle_at_80%_65%,rgba(99,102,241,0.30),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]" />
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
              pathPrefix={`guides/${profile.id}/cover`}
              onUploaded={(url) => patchProfile({ coverPhotoUrl: url })}
              icon={<ImageIcon className="size-4" />}
            />
          </div>
        </div>

        <div className="relative px-3 pb-8 sm:px-7">
          {/* Avatar + name */}
          <div className="-mt-20 sm:-mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm sm:size-48">
                    {profile.profilePhotoUrl ? (
                      <div className="relative size-full">
                        <Image
                          src={profile.profilePhotoUrl}
                          alt={profile.displayName}
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

                  <div className="absolute -bottom-1 right-1 flex flex-col items-end gap-1.5">
                    <PhotoUpload
                      label="Change photo"
                      uploading={profileUploading}
                      setUploading={setProfileUploading}
                      pathPrefix={`guides/${profile.id}/profile`}
                      onUploaded={(url) => patchProfile({ profilePhotoUrl: url })}
                      compact
                      icon={<Camera className="size-3.5" />}
                    />
                    {profile.profilePhotoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full bg-white p-0 ring-1 ring-zinc-200/70 text-red-600 hover:text-red-700"
                        onClick={removeProfilePhoto}
                        disabled={removingPhoto || profileUploading}
                        aria-label="Remove photo"
                        title="Remove photo"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                      {profile.displayName}
                    </div>
                    {profile.tagline && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        {profile.tagline}
                      </span>
                    )}
                    {!profile.isActive && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {profile.category ? `${profile.category} guide` : "Guide"}
                  </div>
                </div>
              </div>

              <div className="pb-2 flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-3xl bg-white px-4 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200/70"
                >
                  <a href="#gallery">
                    <ImageIcon className="size-4 text-zinc-700" />
                    Manage gallery
                  </a>
                </Button>
              </div>
            </div>

            {/* Identity: tagline + regions specialised */}
            <IdentityEditor profile={profile} onSave={patchProfile} />

            {/* Contact + Languages */}
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
              <ContactEditor profile={profile} onSave={patchProfile} />
              <LanguagesEditor
                profile={profile}
                onSaved={(next) => onChange(next)}
              />
            </div>

            {/* Experience & rates */}
            <ExperienceRatesEditor profile={profile} onSave={patchProfile} />

            {/* Bio */}
            <BioEditor profile={profile} onSave={patchProfile} />

            {/* Itineraries */}
            <ItinerariesEditor profile={profile} />

            {/* Gallery */}
            <GalleryEditor profile={profile} onSaved={(next) => onChange(next)} />
          </div>
        </div>
      </div>

      {/* Hide unused icons so TS doesn't complain when sections inline their own */}
      <span className="sr-only">
        <Mail className="size-4" />
        <Phone className="size-4" />
        <MapPin className="size-4" />
      </span>
    </div>
  )
}
