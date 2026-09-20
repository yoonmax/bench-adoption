import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin } from "lucide-react";
import { getBenchByNumber } from "@/lib/benches";
import { parkToday } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { AdoptionForm } from "@/components/adoption-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Adopt Bench ${decodeURIComponent(id).toUpperCase()}` };
}

export default async function AdoptPage({ params }: Params) {
  const { id } = await params;
  const bench = await getBenchByNumber(decodeURIComponent(id));
  if (!bench) notFound();

  const adopted = bench.adoption_id !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/benches/${bench.bench_number}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to bench
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-charcoal-900">Adopt a Bench</h1>

      {/* Bench summary */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream-300 bg-white px-4 py-3 shadow-card">
        <div>
          <p className="font-semibold text-charcoal-900">Bench {bench.bench_number}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-charcoal-600">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {bench.area}
          </p>
        </div>
        <StatusBadge adopted={adopted} />
      </div>

      {adopted ? (
        <div role="alert" className="mt-6 rounded-lg border border-cream-300 bg-cream-100 p-6">
          <h2 className="font-semibold text-charcoal-900">This bench is already adopted.</h2>
          <p className="mt-1 text-sm text-charcoal-600">
            It isn&apos;t available right now. Please choose another available bench from the directory.
          </p>
          <Link href="/?status=available#directory" className={`${buttonVariants()} mt-4`}>
            See available benches
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-cream-300 bg-white p-6 shadow-card sm:p-8">
          <AdoptionForm benchId={bench.id} benchNumber={bench.bench_number} today={parkToday()} />
        </div>
      )}
    </div>
  );
}
