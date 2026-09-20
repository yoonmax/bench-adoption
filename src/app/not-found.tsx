import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-charcoal-900">Page not found</h1>
      <p className="mt-2 text-charcoal-600">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Go to homepage
      </Link>
    </div>
  );
}
