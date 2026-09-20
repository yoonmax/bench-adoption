import Link from "next/link";
import { TreePine } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-cream-300 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md text-charcoal-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-700 text-white">
            <TreePine className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold leading-tight sm:text-base">
            <span className="hidden sm:inline">{APP_NAME}</span>
            <span className="sm:hidden">Bench Adoption</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Link href="/about" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            About
          </Link>
          <Link href="/#directory" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Browse Benches
          </Link>
        </nav>
      </div>
    </header>
  );
}
