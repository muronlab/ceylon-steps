"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/auth-context";
import {
  guideProfileService,
  type GuideProfile,
} from "@/services/guide-profile.service";
import { GuideProfileEditor } from "./guide-profile-editor";

export default function GuideProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/profile/guide");
      return;
    }
    const isGuide = Array.isArray(user.roles) && user.roles.includes("GUIDE");
    if (!isGuide) {
      router.replace("/profile");
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guideProfileService.getMe();
      setProfile(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setError(
            "No guide profile yet. Once your application is approved, your profile will appear here.",
          );
        } else if (status === 403) {
          setError("Only verified guides can view this page.");
        } else {
          const msg = (err.response?.data as { message?: string })?.message;
          setError(msg ?? "Failed to load your guide profile.");
        }
      } else {
        setError("Failed to load your guide profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const isGuide = Array.isArray(user.roles) && user.roles.includes("GUIDE");
    if (isGuide) void load();
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
          Can&apos;t load your guide profile
        </div>
        <div className="mt-1 text-sm text-amber-800">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  return <GuideProfileEditor profile={profile} onChange={setProfile} />;
}
