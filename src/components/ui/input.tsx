import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-cream-300 bg-white px-3 text-sm text-charcoal-900 placeholder:text-charcoal-500",
        "aria-[invalid=true]:border-clay-700 aria-[invalid=true]:bg-clay-100/40",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-cream-300 bg-white px-3 text-sm text-charcoal-900",
        "aria-[invalid=true]:border-clay-700",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-charcoal-800", className)} {...props} />;
}

export function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-charcoal-500">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-clay-700">
      {children}
    </p>
  );
}
