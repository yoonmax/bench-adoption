"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { PARK_AREAS, STATUS_FILTERS, type StatusFilter } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All Benches",
  available: "Available",
  adopted: "Adopted",
};

type Props = { q: string; status: StatusFilter; area: string };

/**
 * Search + filters. State lives in the URL (?q=&status=&area=&page=) so the
 * server renders the right page, links are shareable, and back/forward work.
 */
export function DirectoryControls({ q, status, area }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(q);

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // any change to filters resets to the first page
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/?${qs}#directory` : "/#directory", { scroll: false });
    });
  }

  const hasFilters = Boolean(q || area || status !== "all");

  return (
    <div className="rounded-lg border border-cream-300 bg-white p-4 shadow-card">
      <form
        role="search"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: search.trim() });
        }}
      >
        <div className="flex-1">
          <Label htmlFor="bench-search">Search by bench number or area</Label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-500"
              aria-hidden="true"
            />
            <Input
              id="bench-search"
              name="q"
              type="search"
              placeholder="e.g. VC-042 or Parade Ground"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="sm:w-56">
          <Label htmlFor="area-filter">Park area</Label>
          <Select
            id="area-filter"
            name="area"
            className="mt-1"
            value={area}
            onChange={(e) => navigate({ area: e.target.value })}
          >
            <option value="">All areas</option>
            {PARK_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" variant="secondary" className="sm:w-auto" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by availability" className="inline-flex rounded-md border border-cream-300 p-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => navigate({ status: s === "all" ? "" : s })}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                status === s ? "bg-forest-700 text-white" : "text-charcoal-600 hover:bg-cream-100",
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              navigate({ q: "", status: "", area: "" });
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
