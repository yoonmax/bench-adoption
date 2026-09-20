import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin, UserRound } from "lucide-react";
import { getBenchByNumber, recognitionLabel } from "@/lib/benches";
import { formatDate, formatDuration, lastCoveredDay } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DemoNotice } from "@/components/demo-notice";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Bench ${decodeURIComponent(id).toUpperCase()}` };
}

export default async function BenchDetailPage({ params }: Params) {
  const { id } = await params;
  const bench = await getBenchByNumber(decodeURIComponent(id));
  if (!bench) notFound();

  const adopted = bench.adoption_id !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/#directory" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to directory
      </Link>

      <article className="mt-6 rounded-lg border border-cream-300 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-forest-700">Bench</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-charcoal-900">{bench.bench_number}</h1>
          </div>
          <StatusBadge adopted={adopted} className="text-sm" />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sage-700" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Park area</dt>
              <dd className="mt-0.5 text-charcoal-900">{bench.area}</dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <div className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Description</dt>
              <dd className="mt-0.5 leading-relaxed text-charcoal-800">{bench.description}</dd>
            </div>
          </div>
        </dl>

        <hr className="my-6 border-cream-300" />

        {adopted ? (
          <section aria-labelledby="adoption-heading">
            <h2 id="adoption-heading" className="text-lg font-semibold text-charcoal-900">
              Currently Adopted
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail icon={UserRound} label="Adopted by" value={recognitionLabel(bench.public_display_name)} />
              <Detail icon={Clock} label="Duration" value={formatDuration(bench.duration_months ?? 0)} />
              <Detail
                icon={CalendarDays}
                label="Adoption period"
                value={`${formatDate(bench.start_date!)} – ${formatDate(lastCoveredDay(bench.end_date!))}`}
                wide
              />
            </dl>
            <p className="mt-4 text-sm text-charcoal-600">
              This bench will become available again on {formatDate(bench.end_date!)}.
            </p>
            {bench.adoption_source === "seed" ? (
              <DemoNotice className="mt-4">
                This adoption is a fictional demonstration record. The donor named here is not a real person.
              </DemoNotice>
            ) : null}
          </section>
        ) : (
          <section aria-labelledby="adoption-heading">
            <h2 id="adoption-heading" className="text-lg font-semibold text-charcoal-900">
              Available for Adoption
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
              No one currently sponsors this bench. Adopt it for 6 months to 5 years and, if you choose, have your
              recognition name shown here.
            </p>
            <Link href={`/benches/${bench.bench_number}/adopt`} className={`${buttonVariants({ size: "lg" })} mt-5`}>
              Adopt This Bench
            </Link>
          </section>
        )}
      </article>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${wide ? "sm:col-span-2" : ""}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-sage-700" aria-hidden="true" />
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">{label}</dt>
        <dd className="mt-0.5 text-charcoal-900">{value}</dd>
      </div>
    </div>
  );
}
