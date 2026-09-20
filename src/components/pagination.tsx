import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  /** Current query params, so page links preserve search and filters. */
  params: Record<string, string>;
};

function hrefFor(params: Record<string, string>, page: number) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/?${qs}#directory` : "/#directory";
}

export function Pagination({ page, pageCount, params }: Props) {
  if (pageCount <= 1) return null;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4">
      <Link
        href={hrefFor(params, page - 1)}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), prevDisabled && "pointer-events-none opacity-50")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </Link>
      <p className="text-sm text-charcoal-600" aria-live="polite">
        Page <span className="font-medium text-charcoal-900">{page}</span> of{" "}
        <span className="font-medium text-charcoal-900">{pageCount}</span>
      </p>
      <Link
        href={hrefFor(params, page + 1)}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), nextDisabled && "pointer-events-none opacity-50")}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
