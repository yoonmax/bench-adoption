import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function BenchNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-charcoal-900">Bench not found</h1>
      <p className="mt-2 text-charcoal-600">
        We couldn&apos;t find a bench with that number. Bench numbers look like <span className="font-mono">VC-042</span>.
      </p>
      <Link href="/#directory" className={`${buttonVariants()} mt-6`}>
        Browse all benches
      </Link>
    </div>
  );
}
