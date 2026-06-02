"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TABS = [
  { value: "tours", label: "Tours" },
  { value: "transport", label: "Transport" },
  { value: "activities", label: "Activities" },
] as const;

const GUEST_OPTIONS = [
  "1 person",
  "2 people",
  "3 people",
  "4 people",
  "5 people",
  "6+ people",
] as const;

const fieldLabel = "text-sm font-semibold text-zinc-900";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Single date trigger + calendar popover, styled to match the card fields. */
function DateField({
  value,
  onChange,
  placeholder,
  fromDate,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder: string;
  fromDate: Date;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm font-medium text-zinc-900"
        >
          <CalendarDays className="size-4 shrink-0 text-zinc-400" aria-hidden />
          <span className={value ? "truncate" : "truncate text-zinc-400"}>
            {value ? formatDate(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={{ before: fromDate }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Hero "find the best place" card — a compact booking panel that sits to the
 * right of the hero copy. Selections are passed to /explore as query params;
 * the explore page is the source of truth for results.
 */
export function HeroSearchBar() {
  const router = useRouter();
  const today = React.useMemo(() => new Date(), []);
  const [tab, setTab] = React.useState<string>("tours");
  const [destination, setDestination] = React.useState("");
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [guests, setGuests] = React.useState<string>();

  const handleExplore = () => {
    const params = new URLSearchParams();
    params.set("type", tab);
    if (destination.trim()) params.set("destination", destination.trim());
    if (startDate) params.set("from", startDate.toISOString().slice(0, 10));
    if (endDate) params.set("to", endDate.toISOString().slice(0, 10));
    if (guests) params.set("guests", guests);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-3xl bg-white p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] ring-1 ring-zinc-200/70 sm:p-6">
      <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
        Find the best place
      </h3>

      {/* Tabs */}
      <div className="mt-4 flex rounded-full bg-zinc-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
            className={[
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
              tab === t.value
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Destination */}
      <div className="mt-5">
        <label className={fieldLabel} htmlFor="hero-destination">
          Destination
        </label>
        <Input
          id="hero-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Sigiriya, Ella, Galle"
          className="mt-2 h-11 rounded-xl border-zinc-200"
        />
      </div>

      {/* Date range */}
      <div className="mt-4">
        <span className={fieldLabel}>Date</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <DateField
            value={startDate}
            onChange={(d) => {
              setStartDate(d);
              if (d && endDate && endDate < d) setEndDate(undefined);
            }}
            placeholder="Start date"
            fromDate={today}
          />
          <DateField
            value={endDate}
            onChange={setEndDate}
            placeholder="End date"
            fromDate={startDate ?? today}
          />
        </div>
      </div>

      {/* Travellers */}
      <div className="mt-4">
        <span className={fieldLabel}>Travellers</span>
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger className="mt-2 h-11 w-full rounded-xl border-zinc-200 text-sm font-medium text-zinc-900 data-placeholder:text-zinc-400">
            <SelectValue placeholder="Select guests" />
          </SelectTrigger>
          <SelectContent>
            {GUEST_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={handleExplore}
        className="mt-5 h-12 w-full rounded-xl bg-primary-2 text-sm font-semibold text-primary-2-foreground hover:bg-primary-2/90"
      >
        Explore
      </Button>
    </div>
  );
}
