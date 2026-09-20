import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-forest-700 text-white hover:bg-forest-800 active:bg-forest-900 shadow-sm",
  secondary: "bg-sage-200 text-charcoal-900 hover:bg-sage-300",
  outline: "border border-cream-300 bg-white text-charcoal-800 hover:bg-cream-100",
  ghost: "text-charcoal-800 hover:bg-cream-200",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonVariants({ variant = "primary", size = "md" }: { variant?: Variant; size?: Size } = {}) {
  return cn(base, variants[variant], sizes[size]);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
