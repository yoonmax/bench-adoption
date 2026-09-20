import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { DURATION_OPTIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-charcoal-900">About this project</h1>

      <div className="prose-custom mt-6 space-y-6 text-charcoal-800">
        <section>
          <h2 className="text-lg font-semibold text-charcoal-900">What it is</h2>
          <p className="mt-2 leading-relaxed">
            Van Cortlandt Park runs a bench adoption program covering more than 500 benches. This site is a
            demonstration of a single source of truth for that program: which benches are adopted, by whom, for how
            long, and which are still available — plus a way to adopt an available bench.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-charcoal-900">How it works</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
            <li>Browse or search the directory and open a bench marked <strong>Available</strong>.</li>
            <li>Click <strong>Adopt This Bench</strong> and fill in your name, email, and preferred duration.</li>
            <li>Choose whether your recognition name is shown publicly. If not, the listing says &ldquo;Anonymous Donor.&rdquo;</li>
            <li>Confirm. The bench is immediately marked adopted for everyone who visits the site.</li>
          </ol>
          <p className="mt-2 leading-relaxed">
            Adoptions start on the day they&apos;re submitted and last{" "}
            {DURATION_OPTIONS.map((d) => d.label.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " or $1")}. When
            an adoption ends, the bench automatically becomes available again.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-charcoal-900">Important disclaimers</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
            <li>
              This is an <strong>independent demonstration</strong> built for a Columbia Software Solutions take-home
              project. It is not affiliated with Van Cortlandt Park, NYC Parks, or any conservancy.
            </li>
            <li>
              All 520 benches, their locations, and every donor shown are <strong>fictional sample data</strong>.
              Park-area names are illustrative labels, not verified bench locations.
            </li>
            <li>The adoption durations offered are sample options, not official program rules.</li>
            <li>No payment is collected and no real adoption is created when you submit the form.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-charcoal-900">Privacy</h2>
          <p className="mt-2 leading-relaxed">
            Email addresses entered on the adoption form are stored as contact information only and are never shown on
            the site or returned by any public endpoint. Recognition names appear only when the donor opts in.
          </p>
        </section>
      </div>

      <Link href="/#directory" className={`${buttonVariants()} mt-8`}>
        Browse Benches
      </Link>
    </div>
  );
}
