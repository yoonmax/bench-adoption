import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-32 text-charcoal-500" role="status" aria-live="polite">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
      Loading…
    </div>
  );
}
