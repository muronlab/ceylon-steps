"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  adminGuidesApi,
  type AdminGuideFacets,
  type AdminGuideListItem,
  type GuideSort,
  type GuideStatusFilter,
} from "@/lib/admin-guides-api";
import { GuideDetailSheet } from "./guide-detail-sheet";

const PAGE_SIZE = 20;

const SORT_OPTIONS: Array<{ value: GuideSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "experience-desc", label: "Most experience" },
  { value: "price-asc", label: "Price low → high" },
  { value: "price-desc", label: "Price high → low" },
];

const EXPERIENCE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+" },
  { value: 3, label: "3+" },
  { value: 5, label: "5+" },
  { value: 10, label: "10+" },
];

function formatMoney(value: string | null, currency: string | null) {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const code = currency || "LKR";
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: code,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num);
  } catch {
    return `${num.toLocaleString()} ${code}`;
  }
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "G";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

type StatusTab = "all" | GuideStatusFilter;

export function GuidesTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [category, setCategory] = useState<string>("all");
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<GuideSort>("relevance");
  const [skip, setSkip] = useState(0);

  const [facets, setFacets] = useState<AdminGuideFacets | null>(null);
  const [items, setItems] = useState<AdminGuideListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    adminGuidesApi
      .facets()
      .then(setFacets)
      .catch(() => setFacets(null));
  }, []);

  const queryParams = useMemo(() => {
    const maxNum = Number(maxPrice.replaceAll(",", "").trim());
    const hasMax = currency !== "any" && Number.isFinite(maxNum) && maxNum > 0;
    return {
      search: debouncedSearch || undefined,
      category: category === "all" ? undefined : category,
      regions: selectedRegions.length > 0 ? selectedRegions : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      minExperience: minExperience > 0 ? minExperience : undefined,
      currency: currency !== "any" ? currency : undefined,
      maxPrice: hasMax ? maxNum : undefined,
      status:
        statusTab === "all" ? undefined : (statusTab as GuideStatusFilter),
      sort,
    };
  }, [
    debouncedSearch,
    category,
    selectedRegions,
    selectedLanguages,
    minExperience,
    currency,
    maxPrice,
    statusTab,
    sort,
  ]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setSkip(0);
  }, [queryParams]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGuidesApi.search({
        ...queryParams,
        take: PAGE_SIZE,
        skip,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load guides.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [queryParams, skip]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function resetFilters() {
    setSearch("");
    setStatusTab("all");
    setCategory("all");
    setMinExperience(0);
    setSelectedRegions([]);
    setSelectedLanguages([]);
    setCurrency("any");
    setMaxPrice("");
    setSort("relevance");
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterCount =
    (statusTab !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (selectedRegions.length > 0 ? 1 : 0) +
    (selectedLanguages.length > 0 ? 1 : 0) +
    (currency !== "any" ? 1 : 0) +
    (maxPrice.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, tagline, region, language"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-80 pl-7"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive"] as StatusTab[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusTab === s ? "default" : "outline"}
              onClick={() => setStatusTab(s)}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : "Inactive"}
            </Button>
          ))}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-7 w-36 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(
              facets?.categories ?? ["National", "Chauffeur", "Area", "Site"]
            ).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(minExperience)}
          onValueChange={(v) => setMinExperience(Number(v))}
        >
          <SelectTrigger className="h-7 w-32 text-sm">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.value === 0 ? "Any experience" : `${o.label} years`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-sm">
              <Filter className="size-3" />
              Regions
              {selectedRegions.length > 0 && (
                <Badge variant="secondary" className="ml-1 font-normal">
                  {selectedRegions.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Regions specialised</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facets?.regions?.length ? (
              facets.regions.map((r) => {
                const checked = selectedRegions.includes(r);
                return (
                  <DropdownMenuCheckboxItem
                    key={r}
                    checked={checked}
                    onCheckedChange={(v) =>
                      setSelectedRegions((prev) =>
                        v === true ? [...prev, r] : prev.filter((x) => x !== r),
                      )
                    }
                  >
                    {r}
                  </DropdownMenuCheckboxItem>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No regions yet.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-sm">
              <Filter className="size-3" />
              Languages
              {selectedLanguages.length > 0 && (
                <Badge variant="secondary" className="ml-1 font-normal">
                  {selectedLanguages.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Spoken languages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facets?.languages?.length ? (
              facets.languages.map((l) => {
                const checked = selectedLanguages.includes(l);
                return (
                  <DropdownMenuCheckboxItem
                    key={l}
                    checked={checked}
                    onCheckedChange={(v) =>
                      setSelectedLanguages((prev) =>
                        v === true ? [...prev, l] : prev.filter((x) => x !== l),
                      )
                    }
                  >
                    {l}
                  </DropdownMenuCheckboxItem>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No languages yet.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-7 w-28 text-sm">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any currency</SelectItem>
              {(facets?.currencies?.length
                ? facets.currencies
                : ["LKR", "USD", "EUR", "GBP"]
              ).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Max / day"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            disabled={currency === "any"}
            inputMode="numeric"
            className="h-7 w-24 text-sm"
          />
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as GuideSort)}>
          <SelectTrigger className="h-7 w-40 text-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-sm text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="size-3" />
            Clear {activeFilterCount}
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {loading ? "Loading…" : `${total} guide${total === 1 ? "" : "s"}`}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guide</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Regions</TableHead>
              <TableHead>Speaks</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Rates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead className="w-0">{""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No guides match these filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((g) => (
                <GuideRow
                  key={g.id}
                  guide={g}
                  onClick={() => setSelectedId(g.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={skip === 0 || loading}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
          >
            <ChevronLeft className="size-3" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={skip + PAGE_SIZE >= total || loading}
            onClick={() => setSkip(skip + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>

      <GuideDetailSheet
        guideId={selectedId}
        open={selectedId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      />
    </div>
  );
}

function GuideRow({
  guide,
  onClick,
}: {
  guide: AdminGuideListItem;
  onClick: () => void;
}) {
  const dayPrice = formatMoney(guide.pricePerDay, guide.currency);
  const hourPrice = formatMoney(guide.pricePerHour, guide.currency);
  const regions = Array.isArray(guide.regionsSpecialized)
    ? guide.regionsSpecialized
    : [];
  const languages = guide.languages ?? [];

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200">
            {guide.profilePhotoUrl ? (
              <Image
                src={guide.profilePhotoUrl}
                alt={guide.displayName}
                fill
                className="object-cover"
                sizes="36px"
              />
            ) : (
              <div className="grid size-full place-items-center bg-gradient-to-br from-zinc-200 to-zinc-300 text-[10px] font-semibold text-zinc-700">
                {getInitials(guide.displayName)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-sm font-medium">
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
            </div>
            <div className="truncate text-[0.7rem] text-muted-foreground">
              {guide.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{guide.category ?? "Other"}</span>
      </TableCell>
      <TableCell>
        {regions.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {regions.slice(0, 3).map((r) => (
              <Badge key={r} variant="secondary" className="font-normal">
                {r}
              </Badge>
            ))}
            {regions.length > 3 && (
              <span className="text-[0.7rem] text-muted-foreground">
                +{regions.length - 3}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {languages.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {languages.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-1">
                {l.countryCode && (
                  <div className="relative h-3 w-4 shrink-0 overflow-hidden rounded-[1px] ring-1 ring-zinc-200">
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
            ))}
            {languages.length > 3 && (
              <span className="text-[0.7rem] text-muted-foreground">
                +{languages.length - 3}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {typeof guide.yearsOfExperience === "number" &&
        guide.yearsOfExperience > 0 ? (
          <div className="inline-flex items-center gap-1 text-sm font-medium">
            <Award className="size-3 text-amber-500" />
            {guide.yearsOfExperience} yr
            {guide.yearsOfExperience === 1 ? "" : "s"}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5 text-sm">
          {dayPrice ? (
            <span>
              {dayPrice}
              <span className="ml-1 text-[0.65rem] text-muted-foreground">
                /day
              </span>
            </span>
          ) : null}
          {hourPrice ? (
            <span>
              {hourPrice}
              <span className="ml-1 text-[0.65rem] text-muted-foreground">
                /hour
              </span>
            </span>
          ) : null}
          {!dayPrice && !hourPrice && (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {new Date(guide.approvedAt).toLocaleDateString()}
        </span>
      </TableCell>
      <TableCell>{""}</TableCell>
    </TableRow>
  );
}
