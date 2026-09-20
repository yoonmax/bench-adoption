import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-sage-300 bg-sage-100 px-3 py-2 text-xs leading-relaxed text-charcoal-600",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-700" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
