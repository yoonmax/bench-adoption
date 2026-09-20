"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <TriangleAlert className="mx-auto h-10 w-10 text-clay-700" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-charcoal-900">Something went wrong</h1>
      <p className="mt-2 text-charcoal-600">
        We couldn&apos;t load this page. This is usually temporary — please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
