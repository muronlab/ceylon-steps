"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import axios from "axios";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DayRichEditor } from "./day-rich-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import apiClient from "@/services/api-client";
import {
  guideItinerariesService,
  type GuideItinerary,
  type ItineraryCrudService,
  type ItineraryDesignType,
  type ItineraryInclusionKind,
  type ItineraryPriceScope,
  type SaveItineraryPayload,
} from "@/services/guide-itineraries.service";
import { UploadOverlay } from "./upload-overlay";
import { OfferedLanguagesField } from "./offered-languages-field";
import { formatDurationMinutes } from "@/lib/itinerary-duration";

/**
 * Minimal owner-profile shape the editor needs — satisfied by both
 * `GuideProfile` and `ActivityProviderProfile`. Used to seed the default
 * currency, default offered-languages, and the upload path.
 */
export type ItineraryOwnerProfile = {
  id: string;
  currency: string | null;
  languages: { language: string }[];
};

const GRADIENT_PRESETS: Array<{
  id: string;
  label: string;
  className: string;
}> = [
  {
    id: "ocean",
    label: "Ocean",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(900px_circle_at_70%_60%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(120deg,rgba(2,132,199,0.22),rgba(34,197,94,0.14))]",
  },
  {
    id: "sunset",
    label: "Sunset",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(245,158,11,0.38),transparent_55%),radial-gradient(900px_circle_at_75%_65%,rgba(239,68,68,0.22),transparent_60%),linear-gradient(120deg,rgba(245,158,11,0.18),rgba(59,130,246,0.10))]",
  },
  {
    id: "highland",
    label: "Highland",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(34,197,94,0.38),transparent_55%),radial-gradient(900px_circle_at_80%_70%,rgba(99,102,241,0.26),transparent_60%),linear-gradient(120deg,rgba(34,197,94,0.18),rgba(99,102,241,0.12))]",
  },
  {
    id: "midnight",
    label: "Midnight",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(99,102,241,0.38),transparent_55%),radial-gradient(900px_circle_at_80%_60%,rgba(14,165,233,0.26),transparent_60%),linear-gradient(120deg,rgba(99,102,241,0.18),rgba(14,165,233,0.12))]",
  },
  {
    id: "spice",
    label: "Spice",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(244,63,94,0.32),transparent_55%),radial-gradient(900px_circle_at_75%_65%,rgba(245,158,11,0.22),transparent_60%),linear-gradient(120deg,rgba(244,63,94,0.18),rgba(245,158,11,0.12))]",
  },
  {
    id: "forest",
    label: "Forest",
    className:
      "bg-[radial-gradient(900px_circle_at_15%_0%,rgba(5,150,105,0.36),transparent_55%),radial-gradient(900px_circle_at_80%_60%,rgba(2,132,199,0.18),transparent_60%),linear-gradient(120deg,rgba(5,150,105,0.16),rgba(2,132,199,0.10))]",
  },
];

const CURRENCIES = [
  "LKR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "INR",
  "AED",
  "SGD",
  "JPY",
];

type DayDraft = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  /** "HH:mm" — used when designType === "TIME". */
  startTime: string;
  /** "HH:mm" — used when designType === "TIME". */
  endTime: string;
};
type InclusionDraft = {
  id: string;
  kind: ItineraryInclusionKind;
  text: string;
};
type ImageDraft = { id: string; imageUrl: string; caption: string };

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Pick a random gradient preset — used when the guide doesn't upload a cover. */
function randomGradientClass(): string {
  const idx = Math.floor(Math.random() * GRADIENT_PRESETS.length);
  return (GRADIENT_PRESETS[idx] ?? GRADIENT_PRESETS[0]).className;
}

function toDays(it: GuideItinerary | null): DayDraft[] {
  if (!it) return [];
  return it.days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: d.description ?? "",
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
  }));
}
function toInclusions(it: GuideItinerary | null): InclusionDraft[] {
  if (!it) return [];
  return it.inclusions.map((i) => ({ id: i.id, kind: i.kind, text: i.text }));
}
function toImages(it: GuideItinerary | null): ImageDraft[] {
  if (!it) return [];
  return it.galleryImages.map((g) => ({
    id: g.id,
    imageUrl: g.imageUrl,
    caption: g.caption ?? "",
  }));
}

export function ItineraryEditorSheet({
  profile,
  target,
  open,
  onOpenChange,
  onSaved,
  service = guideItinerariesService,
  uploadPathPrefix = "guides",
  defaultDesignType = "DAYS",
}: {
  profile: ItineraryOwnerProfile;
  target: GuideItinerary | "new" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: GuideItinerary) => void;
  /** CRUD surface to persist with. Defaults to the guide service. */
  service?: ItineraryCrudService;
  /** Storage path root, e.g. "guides" or "activity". */
  uploadPathPrefix?: string;
  /**
   * Format new itineraries start in, and which format tab shows first.
   * Guides default to multi-day ("DAYS"); activity providers to a single
   * day with time slots ("TIME").
   */
  defaultDesignType?: ItineraryDesignType;
}) {
  const isCreate = target === "new";
  const itinerary = target === "new" || target === null ? null : target;

  const defaultCurrency = profile.currency ?? "LKR";

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  // Duration is derived from the days/time-slots list + design type, not
  // a free-text input. See `derivedDuration` below.
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [priceScope, setPriceScope] = useState<ItineraryPriceScope>("PER_PERSON");
  const [overview, setOverview] = useState("");
  const [transportation, setTransportation] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  // Picked once when the sheet mounts. Re-shuffled per-open below so each new
  // itinerary gets a different background instead of always Ocean.
  const [imageGradient, setImageGradient] = useState<string | null>(
    randomGradientClass(),
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [designType, setDesignType] = useState<ItineraryDesignType>(defaultDesignType);
  // Hours / minutes inputs for the DURATION design type. Kept as strings so the
  // fields can be cleared; combined into total minutes on save.
  const [durationHours, setDurationHours] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [languagesOffered, setLanguagesOffered] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [days, setDays] = useState<DayDraft[]>([]);
  const [inclusions, setInclusions] = useState<InclusionDraft[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryTotal, setGalleryTotal] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (itinerary) {
      setTitle(itinerary.title);
      setSubtitle(itinerary.subtitle ?? "");
      setPrice(itinerary.price ?? "");
      setCurrency(itinerary.currency ?? defaultCurrency);
      setPriceScope(itinerary.priceScope ?? "PER_PERSON");
      setOverview(itinerary.overview ?? "");
      setTransportation(itinerary.transportation ?? "");
      setMeetingLocation(itinerary.meetingLocation ?? "");
      // Existing itinerary: keep whatever was saved; if it was somehow null,
      // assign a fresh random one rather than always defaulting to Ocean.
      setImageGradient(itinerary.imageGradient ?? randomGradientClass());
      setCoverImageUrl(itinerary.coverImageUrl ?? null);
      setIsActive(itinerary.isActive);
      setDesignType(itinerary.designType ?? "DAYS");
      const mins = itinerary.durationMinutes ?? 0;
      setDurationHours(mins > 0 ? String(Math.floor(mins / 60)) : "");
      setDurationMins(mins > 0 && mins % 60 !== 0 ? String(mins % 60) : "");
      setLanguagesOffered(itinerary.languagesOffered ?? []);
      setTags(itinerary.tags ?? []);
      setDays(toDays(itinerary));
      setInclusions(toInclusions(itinerary));
      setImages(toImages(itinerary));
    } else {
      setTitle("");
      setSubtitle("");
      setPrice("");
      setCurrency(defaultCurrency);
      setPriceScope("PER_PERSON");
      setOverview("");
      setTransportation("");
      setMeetingLocation("");
      // New itinerary: randomly assign a gradient so each card has its own
      // background colour without the guide having to choose one.
      setImageGradient(randomGradientClass());
      setCoverImageUrl(null);
      setIsActive(true);
      setDesignType(defaultDesignType);
      setDurationHours("");
      setDurationMins("");
      // Default the offered languages to what the guide already speaks so
      // they don't have to retype them per itinerary. They can still edit.
      const guideLangs = Array.isArray(profile.languages)
        ? profile.languages.map((l) => l.language).filter(Boolean)
        : [];
      setLanguagesOffered(guideLangs);
      setTags([]);
      setDays([]);
      setInclusions([]);
      setImages([]);
    }
    setTagInput("");
    setError(null);
  }, [open, itinerary, defaultCurrency, profile.languages, defaultDesignType]);

  // Day operations
  function addDay() {
    setDays((d) => [
      ...d,
      {
        id: uid("day"),
        dayNumber: d.length + 1,
        title: "",
        description: "",
        startTime: "",
        endTime: "",
      },
    ]);
  }


  // Tag chip operations — accepts "#tag" or "tag", stores lowercase no-#.
  function addTag(raw: string) {
    const cleaned = raw.trim().replace(/^#+/, "").toLowerCase();
    if (!cleaned) return;
    setTags((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
    setTagInput("");
  }
  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }
  function removeDay(id: string) {
    setDays((d) => d.filter((x) => x.id !== id));
  }
  function patchDay(id: string, p: Partial<DayDraft>) {
    setDays((d) => d.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  // Inclusion operations
  function addInclusion(kind: ItineraryInclusionKind) {
    setInclusions((i) => [...i, { id: uid("inc"), kind, text: "" }]);
  }
  function removeInclusion(id: string) {
    setInclusions((i) => i.filter((x) => x.id !== id));
  }
  function patchInclusion(id: string, p: Partial<InclusionDraft>) {
    setInclusions((i) => i.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }
  /**
   * Insert one new inclusion row immediately after `afterId`. Returns the new
   * row's id so the caller can focus it. Used for Enter-to-add and paste
   * splitting.
   */
  function insertInclusionAfter(
    afterId: string,
    kind: ItineraryInclusionKind,
    text = "",
  ): string {
    const newRow: InclusionDraft = { id: uid("inc"), kind, text };
    setInclusions((prev) => {
      const idx = prev.findIndex((x) => x.id === afterId);
      if (idx < 0) return [...prev, newRow];
      return [...prev.slice(0, idx + 1), newRow, ...prev.slice(idx + 1)];
    });
    return newRow.id;
  }
  /** Insert many rows after `afterId` in one update. Returns the new ids in order. */
  function insertInclusionsAfter(
    afterId: string,
    kind: ItineraryInclusionKind,
    texts: string[],
  ): string[] {
    const newRows: InclusionDraft[] = texts.map((t) => ({
      id: uid("inc"),
      kind,
      text: t,
    }));
    setInclusions((prev) => {
      const idx = prev.findIndex((x) => x.id === afterId);
      if (idx < 0) return [...prev, ...newRows];
      return [...prev.slice(0, idx + 1), ...newRows, ...prev.slice(idx + 1)];
    });
    return newRows.map((r) => r.id);
  }

  // Cover upload
  async function uploadCover(file: File) {
    setCoverUploading(true);
    setCoverProgress(0);
    let drift: ReturnType<typeof setInterval> | null = null;
    const startDrift = () => {
      if (drift) return;
      drift = setInterval(() => {
        setCoverProgress((p) =>
          p >= 95 ? p : Math.min(95, +(p + 0.5).toFixed(1)),
        );
      }, 250);
    };
    const stopDrift = () => {
      if (drift) {
        clearInterval(drift);
        drift = null;
      }
    };
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uploadPathPrefix}/${profile.id}/itineraries/cover/${Date.now()}.${ext}`;
      const body = new FormData();
      body.append("file", file);
      body.append("path", path);
      const res = await apiClient.post<{ url: string }>(
        "/storage/upload",
        body,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            const real = (ev.loaded / ev.total) * 100;
            const display = Math.min(90, Math.round(real * 0.9));
            setCoverProgress((p) => Math.max(p, display));
            if (real >= 100) startDrift();
          },
        },
      );
      stopDrift();
      setCoverProgress(100);
      setCoverImageUrl(res.data.url);
    } catch (err) {
      stopDrift();
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to upload cover.",
        );
      } else {
        setError("Failed to upload cover.");
      }
    } finally {
      stopDrift();
      setCoverUploading(false);
      setCoverProgress(0);
    }
  }

  // Gallery upload (multiple)
  async function uploadGallery(files: File[]) {
    if (files.length === 0) return;
    setGalleryUploading(true);
    setGalleryTotal(files.length);
    setGalleryIndex(0);
    setGalleryProgress(0);
    let drift: ReturnType<typeof setInterval> | null = null;
    const startDrift = () => {
      if (drift) return;
      drift = setInterval(() => {
        setGalleryProgress((p) =>
          p >= 95 ? p : Math.min(95, +(p + 0.5).toFixed(1)),
        );
      }, 250);
    };
    const stopDrift = () => {
      if (drift) {
        clearInterval(drift);
        drift = null;
      }
    };

    try {
      const newImages: ImageDraft[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setGalleryIndex(i + 1);
        setGalleryProgress(0);
        stopDrift();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${uploadPathPrefix}/${profile.id}/itineraries/gallery/${Date.now()}-${i}.${ext}`;
        const body = new FormData();
        body.append("file", file);
        body.append("path", path);
        const res = await apiClient.post<{ url: string }>(
          "/storage/upload",
          body,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (ev) => {
              if (!ev.total) return;
              const real = (ev.loaded / ev.total) * 100;
              const display = Math.min(90, Math.round(real * 0.9));
              setGalleryProgress((p) => Math.max(p, display));
              if (real >= 100) startDrift();
            },
          },
        );
        stopDrift();
        setGalleryProgress(100);
        newImages.push({ id: uid("img"), imageUrl: res.data.url, caption: "" });
      }
      setImages((g) => [...g, ...newImages]);
    } catch (err) {
      stopDrift();
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to upload images.",
        );
      } else {
        setError("Failed to upload images.");
      }
    } finally {
      stopDrift();
      setGalleryUploading(false);
      setGalleryTotal(0);
      setGalleryIndex(0);
      setGalleryProgress(0);
    }
  }

  function removeImage(id: string) {
    setImages((g) => g.filter((x) => x.id !== id));
  }

  function moveImage(id: string, dir: -1 | 1) {
    setImages((g) => {
      const idx = g.findIndex((x) => x.id === id);
      if (idx < 0) return g;
      const swap = idx + dir;
      if (swap < 0 || swap >= g.length) return g;
      const next = [...g];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function patchImageCaption(id: string, caption: string) {
    setImages((g) => g.map((x) => (x.id === id ? { ...x, caption } : x)));
  }

  // Save
  async function save() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    let priceValue: number | null = null;
    if (price.trim() !== "") {
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) {
        setError("Price must be a non-negative number.");
        return;
      }
      priceValue = Math.round(p * 100) / 100;
    }

    // For TIME mode, sort by start time so the saved order matches what the
    // guide expects to see on the public page.
    const orderedDays =
      designType === "TIME"
        ? [...days].sort((a, b) => {
            // Empty times sort to the end so guides can leave them blank
            // temporarily without losing position relative to others.
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          })
        : days;

    const cleanDays = orderedDays
      .map((d, i) => ({
        // dayNumber tracks array order — the UI no longer exposes editing it.
        dayNumber: i + 1,
        title: d.title.trim(),
        description: d.description.trim() || null,
        startTime: designType === "TIME" ? d.startTime || null : null,
        endTime: designType === "TIME" ? d.endTime || null : null,
      }))
      .filter((d) => d.title.length > 0);

    const cleanInclusions = inclusions
      .map((inc) => ({ kind: inc.kind, text: inc.text.trim() }))
      .filter((inc) => inc.text.length > 0);

    const cleanImages = images
      .map((img) => ({
        imageUrl: img.imageUrl,
        caption: img.caption.trim() ? img.caption.trim() : null,
      }))
      .filter((img) => img.imageUrl);

    const payload: SaveItineraryPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      designType,
      languagesOffered,
      tags,
      durationDays: derivedDuration.days,
      durationMinutes: derivedDuration.minutes,
      durationLabel: derivedDuration.label,
      price: priceValue,
      currency: priceValue !== null ? currency : null,
      priceScope,
      overview: overview.trim() || null,
      transportation: transportation.trim() || null,
      meetingLocation: meetingLocation.trim() || null,
      imageGradient: coverImageUrl ? null : imageGradient,
      coverImageUrl: coverImageUrl,
      isActive,
      days: cleanDays,
      inclusions: cleanInclusions,
      galleryImages: cleanImages,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = isCreate
        ? await service.create(payload)
        : await service.update(itinerary!.id, payload);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to save itinerary.",
        );
      } else {
        setError("Failed to save itinerary.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inclusionsIncluded = useMemo(
    () => inclusions.filter((i) => i.kind === "INCLUDED"),
    [inclusions],
  );
  const inclusionsExcluded = useMemo(
    () => inclusions.filter((i) => i.kind === "EXCLUDED"),
    [inclusions],
  );

  // Total minutes for the DURATION design type, combined from the hours / mins
  // inputs. Minutes are capped at 59 on save; hours are unbounded here.
  const durationTotalMinutes = useMemo(() => {
    const h = Math.max(0, parseInt(durationHours, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(durationMins, 10) || 0));
    return h * 60 + m;
  }, [durationHours, durationMins]);

  /**
   * Duration auto-derived from designType + the schedule inputs. The guide
   * never edits the stored fields directly — keeping them in sync with what
   * they actually planned avoids stale labels.
   * - DAYS: count = days.length, label = "N day(s)".
   * - TIME: a single-day plan, so always 1 day.
   * - DURATION: total minutes, label "Xh Ym" (no day count).
   */
  const derivedDuration = useMemo(() => {
    if (designType === "DURATION") {
      const label = formatDurationMinutes(durationTotalMinutes);
      return {
        days: null as number | null,
        minutes:
          durationTotalMinutes > 0 ? (durationTotalMinutes as number | null) : null,
        label: (label || null) as string | null,
      };
    }
    if (designType === "TIME") {
      return {
        days: 1 as number | null,
        minutes: null as number | null,
        label: "1 day" as string | null,
      };
    }
    const count = days.length;
    if (count === 0)
      return {
        days: null as number | null,
        minutes: null as number | null,
        label: null as string | null,
      };
    return {
      days: count as number | null,
      minutes: null as number | null,
      label: `${count} day${count === 1 ? "" : "s"}` as string | null,
    };
  }, [designType, days.length, durationTotalMinutes]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl min-w-[60vw]">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">
            {isCreate ? "Add itinerary" : "Edit itinerary"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            Describe a sample tour package. Travelers see this on your public
            profile.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5">
          {error && (
            <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
            <div>
              <div className="text-sm font-semibold">Show on profile</div>
              <div className="text-xs text-zinc-500">
                Hide this itinerary while you&apos;re still working on it.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* 1. Basics — what's this itinerary called */}
          <Section title="Basics">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kandy Highlights"
                className="h-10 rounded-2xl"
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Temple of the Tooth • Lake walk • Local markets"
                className="h-10 rounded-2xl"
              />
            </Field>
          </Section>

          {/* 2. Schedule — format toggle + day/time-slot list. Duration auto-
              derived from this section and shown as a chip in the header. */}
          <Section
            title={
              designType === "TIME"
                ? "Time slots"
                : designType === "DURATION"
                  ? "Duration & steps"
                  : "Days"
            }
            action={
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-full bg-zinc-100 px-3 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200/70">
                  {derivedDuration.label ?? "No duration yet"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  className="h-8 rounded-full text-xs"
                >
                  <Plus className="size-3.5" />
                  {designType === "TIME"
                    ? "Add slot"
                    : designType === "DURATION"
                      ? "Add step"
                      : "Add day"}
                </Button>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70">
              <span className="text-xs font-semibold text-zinc-600">
                Format
              </span>
              <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-zinc-200/70">
                {(
                  (defaultDesignType === "TIME"
                    ? [
                        { value: "TIME", label: "Single day with times" },
                        { value: "DURATION", label: "By duration" },
                        { value: "DAYS", label: "Multi-day" },
                      ]
                    : [
                        { value: "DAYS", label: "Multi-day" },
                        { value: "TIME", label: "Single day with times" },
                        { value: "DURATION", label: "By duration" },
                      ]) as { value: ItineraryDesignType; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDesignType(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      designType === opt.value
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-950"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                {designType === "TIME"
                  ? "Each row is a time-of-day slot for one day."
                  : designType === "DURATION"
                    ? "Set one total duration; list optional steps without fixed times."
                    : "Each row is one day in a multi-day plan."}
              </span>
            </div>

            {designType === "DURATION" && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70">
                <span className="text-xs font-semibold text-zinc-600">
                  Total duration
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="4"
                    className="h-9 w-20 rounded-lg"
                    aria-label="Duration hours"
                  />
                  <span className="text-xs text-zinc-500">hours</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    placeholder="30"
                    className="h-9 w-20 rounded-lg"
                    aria-label="Duration minutes"
                  />
                  <span className="text-xs text-zinc-500">mins</span>
                </div>
              </div>
            )}
            {days.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                {designType === "TIME"
                  ? "Add time slots like 09:00 – 10:30 for what happens during the day."
                  : designType === "DURATION"
                    ? "Set the total duration above. Optionally add steps for what happens during the experience."
                    : "Add a day-by-day breakdown for the tour."}
              </p>
            ) : (
              <div className="grid gap-3">
                {days.map((d, i) => (
                  <div
                    key={d.id}
                    className="grid gap-2 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70"
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                      {designType === "TIME" ? (
                        <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-semibold text-zinc-950 ring-1 ring-zinc-200">
                          <Input
                            type="time"
                            value={d.startTime}
                            onChange={(e) =>
                              patchDay(d.id, { startTime: e.target.value })
                            }
                            className="h-9 w-36 rounded-lg border-0 bg-zinc-50 px-3 text-left text-sm font-medium text-zinc-950 ring-1 ring-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400"
                          />
                          <span className="text-zinc-400">–</span>
                          <Input
                            type="time"
                            value={d.endTime}
                            onChange={(e) =>
                              patchDay(d.id, { endTime: e.target.value })
                            }
                            className="h-9 w-36 rounded-lg border-0 bg-zinc-50 px-3 text-left text-sm font-medium text-zinc-950 ring-1 ring-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400"
                          />
                        </span>
                      ) : (
                        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-zinc-950 px-3 text-xs font-semibold text-white">
                          {designType === "DURATION"
                            ? `Step ${i + 1}`
                            : `Day ${i + 1}`}
                        </span>
                      )}
                      <Input
                        value={d.title}
                        onChange={(e) =>
                          patchDay(d.id, { title: e.target.value })
                        }
                        placeholder={
                          designType === "TIME"
                            ? "Slot title (e.g. Pidurangala sunrise hike)"
                            : designType === "DURATION"
                              ? "Step title (e.g. Cooking class)"
                              : "Day title (e.g. Arrival & Sigiriya)"
                        }
                        className="h-9 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDay(d.id)}
                        className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
                        aria-label={
                          designType === "TIME"
                            ? "Remove slot"
                            : designType === "DURATION"
                              ? "Remove step"
                              : "Remove day"
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <DayRichEditor
                      value={d.description}
                      onChange={(html) => patchDay(d.id, { description: html })}
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* 3. Pricing — set after you know what's in the plan */}
          <Section title="Pricing">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="18000"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10 w-32 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="This price is">
              <div className="inline-flex rounded-full bg-zinc-100 p-1 ring-1 ring-zinc-200/70">
                {(
                  [
                    { value: "PER_PERSON", label: "Per person" },
                    { value: "PER_GROUP", label: "Per group" },
                    { value: "PER_DAY", label: "Per day" },
                  ] as { value: ItineraryPriceScope; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriceScope(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      priceScope === opt.value
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-950"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <p className="text-xs text-zinc-500">
              Leave blank to display &quot;On request&quot; on your profile.
            </p>
          </Section>

          {/* 4. Description — descriptive content travelers read on the page */}
          <Section title="Description">
            <Field label="Intro / overview">
              <DayRichEditor
                value={overview}
                onChange={setOverview}
                placeholder="A short paragraph about what makes this itinerary special. Use lists, bold, and headings for structure."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Transportation">
                <Input
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                  placeholder="Private sedan or van (fully air-conditioned)"
                  className="h-10 rounded-2xl"
                />
              </Field>
              <Field label="Meeting location">
                <Input
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Katunayake Airport, Sri Lanka"
                  className="h-10 rounded-2xl"
                />
              </Field>
            </div>
          </Section>

          {/* 5. Discovery — how travelers find this itinerary */}
          <Section title="Discovery">
            <Field label="Languages offered">
              <div className="grid gap-2">
                <p className="text-xs text-zinc-500">
                  Default is the languages you speak. Add or remove any for
                  this itinerary specifically.
                </p>
                <OfferedLanguagesField
                  value={languagesOffered}
                  onChange={setLanguagesOffered}
                />
              </div>
            </Field>

            <Field label="Tags">
              <div className="grid gap-2">
                <p className="text-xs text-zinc-500">
                  Add hashtags to help travelers find this itinerary. Press
                  Enter or comma to confirm — the # is added automatically.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.length === 0 ? (
                    <span className="text-xs text-zinc-400">No tags yet.</span>
                  ) : (
                    tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-200/70"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-blue-500 hover:text-red-600"
                          aria-label={`Remove tag ${t}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="#sigiriya, #wildlife, #beach…"
                    className="h-9 rounded-full text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tagInput)}
                    className="h-9 rounded-full text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Field>
          </Section>

          {/* 6. Inclusions / exclusions */}
          <Section title="What's included / not included">
            <div className="grid gap-3 sm:grid-cols-2">
              <InclusionColumn
                label="Included"
                kind="INCLUDED"
                rows={inclusionsIncluded}
                onAdd={() => addInclusion("INCLUDED")}
                onPatch={patchInclusion}
                onRemove={removeInclusion}
                onInsertAfter={(id, text) =>
                  insertInclusionAfter(id, "INCLUDED", text)
                }
                onInsertManyAfter={(id, texts) =>
                  insertInclusionsAfter(id, "INCLUDED", texts)
                }
              />
              <InclusionColumn
                label="Not included"
                kind="EXCLUDED"
                rows={inclusionsExcluded}
                onAdd={() => addInclusion("EXCLUDED")}
                onPatch={patchInclusion}
                onRemove={removeInclusion}
                onInsertAfter={(id, text) =>
                  insertInclusionAfter(id, "EXCLUDED", text)
                }
                onInsertManyAfter={(id, texts) =>
                  insertInclusionsAfter(id, "EXCLUDED", texts)
                }
              />
            </div>
          </Section>

          {/* 7. Card cover — visual polish near the end */}
          <Section title="Card cover">
            <input
              id="itinerary-cover-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadCover(f);
                e.target.value = "";
              }}
            />
            {coverImageUrl ? (
              <div className="overflow-hidden rounded-3xl ring-1 ring-zinc-200/70">
                <div className="relative h-32 w-full">
                  <Image
                    src={coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="text-xs text-zinc-500">
                    Custom cover image
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={coverUploading}
                      onClick={() =>
                        document
                          .getElementById("itinerary-cover-input")
                          ?.click()
                      }
                      className="h-8 rounded-full text-xs"
                    >
                      <Upload className="size-3.5" />
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverImageUrl(null)}
                      className="h-8 rounded-full text-xs text-zinc-500 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                      Use gradient instead
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="relative h-24 overflow-hidden rounded-2xl ring-1 ring-zinc-200/70">
                  <div
                    className={`absolute inset-0 ${
                      imageGradient ?? GRADIENT_PRESETS[0].className
                    }`}
                  />
                  <div className="absolute inset-0 opacity-65 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                </div>
                <div className="grid gap-1.5">
                  <p className="text-xs font-semibold text-zinc-600">
                    Pick a gradient
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADIENT_PRESETS.map((preset) => {
                      const active = imageGradient === preset.className;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setImageGradient(preset.className)}
                          aria-pressed={active}
                          title={preset.label}
                          className={`relative h-10 w-16 overflow-hidden rounded-xl ring-1 transition ${
                            active
                              ? "ring-2 ring-zinc-950"
                              : "ring-zinc-200/70 hover:ring-zinc-400"
                          }`}
                        >
                          <span
                            className={`absolute inset-0 ${preset.className}`}
                          />
                          <span className="sr-only">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Pick a gradient above, or upload a photo to use as the card
                  cover.
                </p>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={coverUploading}
                    onClick={() =>
                      document.getElementById("itinerary-cover-input")?.click()
                    }
                    className="h-9 rounded-full text-xs"
                  >
                    <Upload className="size-3.5" />
                    Upload cover image
                  </Button>
                </div>
              </div>
            )}
          </Section>

          {/* 8. Gallery */}
          <Section
            title="Gallery"
            action={
              <>
                <input
                  id="itinerary-gallery-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const arr = Array.from(e.target.files ?? []);
                    if (arr.length) void uploadGallery(arr);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={galleryUploading}
                  onClick={() =>
                    document.getElementById("itinerary-gallery-input")?.click()
                  }
                  className="h-8 rounded-full text-xs"
                >
                  <Upload className="size-3.5" />
                  Add images
                </Button>
              </>
            }
          >
            {images.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
                Optional. Upload photos from this tour to help travelers
                visualise it.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/70"
                  >
                    <div className="relative aspect-4/3 w-full">
                      <Image
                        src={img.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                          onClick={() => moveImage(img.id, -1)}
                          aria-label="Move left"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 ring-1 ring-zinc-200/70 hover:text-zinc-950"
                          onClick={() => moveImage(img.id, 1)}
                          aria-label="Move right"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/95 text-red-600 ring-1 ring-red-200/70 hover:bg-red-50"
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <Input
                        value={img.caption}
                        onChange={(e) =>
                          patchImageCaption(img.id, e.target.value)
                        }
                        placeholder={`Caption ${idx + 1} (optional)`}
                        className="h-8 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background/95 p-3 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            {saving
              ? "Saving…"
              : isCreate
                ? "Create itinerary"
                : "Save changes"}
          </Button>
        </div>

        <UploadOverlay
          open={coverUploading}
          title="Uploading cover image"
          progress={coverProgress}
        />
        <UploadOverlay
          open={galleryUploading}
          title={
            galleryTotal > 1 ? "Uploading gallery images" : "Uploading image"
          }
          subtitle={
            galleryTotal > 1
              ? `File ${galleryIndex} of ${galleryTotal}`
              : undefined
          }
          progress={galleryProgress}
        />
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">{title}</div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-zinc-600">{label}</Label>
      {children}
    </div>
  );
}

function InclusionColumn({
  label,
  kind,
  rows,
  onAdd,
  onPatch,
  onRemove,
  onInsertAfter,
  onInsertManyAfter,
}: {
  label: string;
  kind: ItineraryInclusionKind;
  rows: InclusionDraft[];
  onAdd: () => void;
  onPatch: (id: string, p: Partial<InclusionDraft>) => void;
  onRemove: (id: string) => void;
  onInsertAfter: (id: string, text?: string) => string;
  onInsertManyAfter: (id: string, texts: string[]) => string[];
}) {
  // Track an input ref per row so we can focus newly-inserted rows after the
  // state update commits. Refs are cleaned up implicitly when the row unmounts.
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const setRef = (id: string) => (el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(id, el);
    else inputRefs.current.delete(id);
  };
  const focusSoon = (id: string) => {
    // setTimeout 0 lets React commit the new row to the DOM first.
    setTimeout(() => {
      inputRefs.current.get(id)?.focus();
    }, 0);
  };

  function handleKeyDown(
    e: ReactKeyboardEvent<HTMLInputElement>,
    rowId: string,
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      const newId = onInsertAfter(rowId, "");
      focusSoon(newId);
    }
  }

  function handlePaste(
    e: ReactClipboardEvent<HTMLInputElement>,
    rowId: string,
    currentText: string,
  ) {
    const pasted = e.clipboardData.getData("text");
    if (!pasted || !/\r?\n/.test(pasted)) return;
    e.preventDefault();
    // Strip common list-bullet prefixes ("•", "-", "*", "1.", "1)") that
    // people paste from word docs/checklists.
    const lines = pasted
      .split(/\r?\n/)
      .map((l) =>
        l
          .trim()
          .replace(/^[•\-\*]\s+/, "")
          .replace(/^\d+[\.)]\s+/, "")
          .trim(),
      )
      .filter(Boolean);
    if (lines.length === 0) return;

    const input = e.currentTarget;
    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? currentText.length;
    const before = currentText.slice(0, start);
    const after = currentText.slice(end);
    const [first, ...rest] = lines;

    onPatch(rowId, { text: before + first + after });
    if (rest.length > 0) {
      const newIds = onInsertManyAfter(rowId, rest);
      const last = newIds[newIds.length - 1];
      if (last) focusSoon(last);
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-900">{label}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-7 rounded-full text-[0.65rem]"
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>
      <div className="mt-2 grid gap-2">
        {rows.length === 0 ? (
          <div className="text-xs text-zinc-500">
            {kind === "INCLUDED"
              ? "e.g. Private transport, professional guide"
              : "e.g. Air tickets, hotels, entry fees"}
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <Input
                ref={setRef(r.id)}
                value={r.text}
                onChange={(e) => onPatch(r.id, { text: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, r.id)}
                onPaste={(e) => handlePaste(e, r.id, r.text)}
                placeholder={
                  kind === "INCLUDED"
                    ? "What's included"
                    : "What's not included"
                }
                className="h-9 rounded-xl text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(r.id)}
                className="size-9 rounded-full p-0 text-zinc-500 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
