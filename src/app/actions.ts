"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseAdoptionForm, type AdoptionFieldErrors } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";

export type AdoptActionState = {
  formError?: string;
  fieldErrors?: AdoptionFieldErrors;
  /** Echo of what the user typed so the form can be re-filled after an error. */
  values?: {
    donorName: string;
    donorEmail: string;
    publicRecognitionName: string;
    displayNamePublicly: boolean;
    durationMonths: number;
  };
};

const UNAVAILABLE_MESSAGE =
  "This bench has just been adopted by another visitor. Please choose another available bench.";

/** Map the error codes raised by adopt_bench() to user-facing messages. */
function messageForDbError(message: string): { formError?: string; fieldErrors?: AdoptionFieldErrors } {
  if (message.includes("BENCH_UNAVAILABLE") || message.includes("adoptions_no_overlap")) {
    return { formError: UNAVAILABLE_MESSAGE };
  }
  if (message.includes("BENCH_NOT_FOUND")) return { formError: "We couldn't find that bench." };
  if (message.includes("INVALID_NAME")) return { fieldErrors: { donorName: "Please enter your full name." } };
  if (message.includes("INVALID_EMAIL")) return { fieldErrors: { donorEmail: "Please enter a valid email address." } };
  if (message.includes("INVALID_RECOGNITION_NAME")) {
    return { fieldErrors: { publicRecognitionName: "Recognition name must be 120 characters or fewer." } };
  }
  if (message.includes("INVALID_DURATION")) {
    return { fieldErrors: { durationMonths: "Please choose one of the listed adoption durations." } };
  }
  return { formError: "Something went wrong while saving your adoption. Please try again." };
}

/**
 * Server action behind the adoption form.
 *
 * 1. Honeypot + rate limit (anti-spam)
 * 2. Validate with zod (the database validates again)
 * 3. Call adopt_bench() — one atomic, row-locked transaction
 * 4. Redirect to the confirmation page
 */
export async function adoptBenchAction(
  _prev: AdoptActionState,
  formData: FormData,
): Promise<AdoptActionState> {
  const parsed = parseAdoptionForm(formData);
  const values = {
    donorName: parsed.raw.donorName,
    donorEmail: parsed.raw.donorEmail,
    publicRecognitionName: parsed.raw.publicRecognitionName,
    displayNamePublicly: parsed.raw.displayNamePublicly,
    durationMonths: parsed.raw.durationMonths,
  };

  // Honeypot: real users never see or fill this field.
  if (String(formData.get("website") ?? "").length > 0) {
    return { formError: "Something went wrong. Please try again.", values };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return { formError: "Too many adoption requests from your connection. Please wait a few minutes and try again.", values };
  }

  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, values };
  }

  const input = parsed.data;
  const benchNumber = String(formData.get("benchNumber") ?? "");

  let adoptionId: string | null = null;
  try {
    const db = getAdminClient();
    const { data, error } = await db.rpc("adopt_bench", {
      p_bench_id: input.benchId,
      p_donor_name: input.donorName,
      p_donor_email: input.donorEmail,
      p_public_recognition_name: input.publicRecognitionName,
      p_display_name_publicly: input.displayNamePublicly,
      p_duration_months: input.durationMonths,
    });

    if (error) {
      // Log the code, not the donor's details.
      console.warn(`[adopt] rejected for bench ${input.benchId}: ${error.message}`);
      return { ...messageForDbError(error.message), values };
    }

    const row = Array.isArray(data) ? data[0] : data;
    adoptionId = row?.adoption_id ?? null;
    if (!adoptionId) {
      console.error("[adopt] adopt_bench returned no adoption id");
      return { formError: "Something went wrong while saving your adoption. Please try again.", values };
    }
  } catch (err) {
    console.error("[adopt] unexpected failure:", err);
    return { formError: "We couldn't reach the database. Please try again in a moment.", values };
  }

  // Make sure the directory, stats, and detail page reflect the new adoption immediately.
  revalidatePath("/");
  revalidatePath(`/benches/${benchNumber}`);

  redirect(`/benches/${encodeURIComponent(benchNumber)}/confirmation?adoption=${adoptionId}`);
}
