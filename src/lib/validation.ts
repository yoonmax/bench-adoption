import { z } from "zod";
import { ALLOWED_DURATIONS } from "@/lib/constants";

export const adoptionFormSchema = z.object({
  benchId: z.string().uuid("Invalid bench identifier."),
  donorName: z
    .string()
    .trim()
    .min(1, "Please enter your full name.")
    .max(120, "Name must be 120 characters or fewer."),
  donorEmail: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .email("Please enter a valid email address."),
  publicRecognitionName: z
    .string()
    .trim()
    .max(120, "Recognition name must be 120 characters or fewer.")
    .optional()
    .transform((v) => (v ? v : null)),
  displayNamePublicly: z.boolean(),
  durationMonths: z
    .number()
    .int()
    .refine((m) => ALLOWED_DURATIONS.includes(m), "Please choose one of the listed adoption durations."),
});

export type AdoptionFormInput = z.infer<typeof adoptionFormSchema>;
export type AdoptionFieldErrors = Partial<Record<keyof AdoptionFormInput, string>>;

/** Parse a raw FormData submission into typed, validated input. */
export function parseAdoptionForm(formData: FormData) {
  const raw = {
    benchId: String(formData.get("benchId") ?? ""),
    donorName: String(formData.get("donorName") ?? ""),
    donorEmail: String(formData.get("donorEmail") ?? ""),
    publicRecognitionName: String(formData.get("publicRecognitionName") ?? ""),
    displayNamePublicly: formData.get("displayNamePublicly") === "on",
    durationMonths: Number(formData.get("durationMonths")),
  };
  const result = adoptionFormSchema.safeParse(raw);
  if (result.success) return { ok: true as const, data: result.data, raw };

  const fieldErrors: AdoptionFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof AdoptionFormInput | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false as const, fieldErrors, raw };
}
