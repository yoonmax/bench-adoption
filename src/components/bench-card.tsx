import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { BenchSummary } from "@/lib/benches";
import { recognitionLabel } from "@/lib/benches";
import { formatDate, lastCoveredDay } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";

export function BenchCard({ bench }: { bench: BenchSummary }) {
  const adopted = bench.adoption_id !== null;
  const href = `/benches/${bench.bench_number}`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-cream-300 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-charcoal-900">
          <Link href={href} className="rounded-sm hover:underline">
            Bench {bench.bench_number}
          </Link>
        </h3>
        <StatusBadge adopted={adopted} />
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal-600">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {bench.area}
      </p>

      <div className="mt-3 flex-1 text-sm">
        {adopted ? (
          <dl className="space-y-1">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-charcoal-500">Adopted by</dt>
              <dd className="font-medium text-charcoal-800">{recognitionLabel(bench.public_display_name)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-charcoal-500">Through</dt>
              <dd className="text-charcoal-800">{bench.end_date ? formatDate(lastCoveredDay(bench.end_date)) : "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-charcoal-600">Open for adoption today.</p>
        )}
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 self-start text-sm font-medium text-forest-700 hover:text-forest-900 hover:underline"
      >
        View details
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
