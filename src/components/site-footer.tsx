import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-cream-300 bg-cream-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-charcoal-600 sm:px-6">
        <p className="font-medium text-charcoal-800">{APP_NAME}</p>
        <Link href="/about" className="underline underline-offset-2 hover:text-charcoal-900">
          About this project
        </Link>
      </div>
    </footer>
  );
}
