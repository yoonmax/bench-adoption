import { CircleCheck, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

/** Availability indicator: icon + text, so status never relies on color alone. */
export function StatusBadge({ adopted, className }: { adopted: boolean; className?: string }) {
  return adopted ? (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-charcoal-600",
        className,
      )}
    >
      <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
      Adopted
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-forest-100 bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-800",
        className,
      )}
    >
      <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Available
    </span>
  );
}
