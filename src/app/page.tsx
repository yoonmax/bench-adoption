import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, SearchX, TriangleAlert } from "lucide-react";
import { getStats, listBenches, type DirectoryResult, type Stats } from "@/lib/benches";
import { PAGE_SIZE, STATUS_FILTERS, type StatusFilter } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { BenchCard } from "@/components/bench-card";
import { DirectoryControls } from "@/components/directory-controls";
import { Pagination } from "@/components/pagination";
import { DemoNotice } from "@/components/demo-notice";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = first(sp.q).slice(0, 40);
  const statusRaw = first(sp.status);
  const status: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(statusRaw)
    ? (statusRaw as StatusFilter)
    : "all";
  const area = first(sp.area);
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);

  let stats: Stats | null = null;
  let result: DirectoryResult | null = null;
  let loadError = false;
  try {
    [stats, result] = await Promise.all([getStats(), listBenches({ q, status, area, page })]);
  } catch {
    loadError = true;
  }

  const params = { q, status: status === "all" ? "" : status, area };

  return (
    <>
      {/* Hero */}
      <section className="border-b border-cream-300 bg-gradient-to-b from-forest-50 to-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-forest-700">Van Cortlandt Park · Bronx, NY</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-charcoal-900 sm:text-4xl">
            Leave your mark on Van Cortlandt Park.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal-600 sm:text-lg">
            Explore available benches, recognize existing donors, and adopt a bench of your own.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#directory" className={buttonVariants({ size: "lg" })}>
              Explore Benches
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg" })}>
              How it works
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Stats */}
        <section aria-label="Program statistics" className="-mt-7">
          <dl className="grid grid-cols-3 divide-x divide-cream-300 rounded-lg border border-cream-300 bg-white shadow-card">
            <StatTile label="Total Benches" value={stats?.total} />
            <StatTile label="Adopted" value={stats?.adopted} />
            <StatTile label="Available" value={stats?.available} highlight />
          </dl>
        </section>

        {/* Directory */}
        <section id="directory" className="scroll-mt-6 pt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-charcoal-900">Bench Directory</h2>
              <p className="mt-1 text-sm text-charcoal-600">
                Search by bench number, filter by availability, and open a bench to see its adoption details.
              </p>
            </div>
            {result ? (
              <p className="text-sm text-charcoal-600" aria-live="polite">
                <span className="font-medium text-charcoal-900">{result.total}</span>{" "}
                {result.total === 1 ? "bench" : "benches"} found
              </p>
            ) : null}
          </div>

          <Suspense fallback={<div className="h-32 rounded-lg border border-cream-300 bg-white" />}>
            <DirectoryControls q={q} status={status} area={area} />
          </Suspense>

          <DemoNotice className="mt-4">
            The 520 benches and all donors listed here are fictional sample records created for this demonstration. They
            do not correspond to real benches or real supporters of the park.
          </DemoNotice>

          <div className="mt-6">
            {loadError ? (
              <ErrorPanel />
            ) : result && result.benches.length === 0 ? (
              <EmptyState />
            ) : result ? (
              <>
                <p className="mb-3 text-xs text-charcoal-500">
                  Showing {(result.page - 1) * PAGE_SIZE + 1}–{Math.min(result.page * PAGE_SIZE, result.total)} of{" "}
                  {result.total}
                </p>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.benches.map((bench) => (
                    <li key={bench.id}>
                      <BenchCard bench={bench} />
                    </li>
                  ))}
                </ul>
                <Pagination page={result.page} pageCount={result.pageCount} params={params} />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}

function StatTile({ label, value, highlight = false }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
      <dd className={`text-2xl font-semibold tabular-nums sm:text-3xl ${highlight ? "text-forest-700" : "text-charcoal-900"}`}>
        {value === undefined ? "—" : value.toLocaleString("en-US")}
      </dd>
      <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-charcoal-500 sm:text-sm">{label}</dt>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-cream-300 bg-white px-6 py-14 text-center">
      <SearchX className="mx-auto h-8 w-8 text-charcoal-500" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-charcoal-900">No benches match your search.</h3>
      <p className="mt-1 text-sm text-charcoal-600">Try a different bench number, area, or availability filter.</p>
      <Link href="/#directory" className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-5`}>
        Clear filters
      </Link>
    </div>
  );
}

function ErrorPanel() {
  return (
    <div role="alert" className="rounded-lg border border-clay-700/30 bg-clay-100/60 px-6 py-10 text-center">
      <TriangleAlert className="mx-auto h-8 w-8 text-clay-700" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-charcoal-900">We couldn&apos;t load the bench directory.</h3>
      <p className="mt-1 text-sm text-charcoal-600">
        The database is temporarily unavailable. Please refresh the page or try again in a moment.
      </p>
      <Link href="/" className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-5`}>
        Try again
      </Link>
    </div>
  );
}
