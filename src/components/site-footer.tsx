import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-cream-300 bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-charcoal-600 sm:px-6">
        <p className="font-medium text-charcoal-800">{APP_NAME}</p>
        <p className="mt-2 max-w-3xl leading-relaxed">
          This site is an independent demonstration built for a Columbia Software Solutions application. It is not
          affiliated with, endorsed by, or operated by Van Cortlandt Park, NYC Parks, or any park conservancy. All
          benches, donors, and adoptions shown are fictional sample data. No payments are collected.
        </p>
        <p className="mt-3">
          <Link href="/about" className="underline underline-offset-2 hover:text-charcoal-900">
            About this project
          </Link>
        </p>
      </div>
    </footer>
  );
}
