"use client";

import { useActionState, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { adoptBenchAction, type AdoptActionState } from "@/app/actions";
import { DURATION_OPTIONS } from "@/lib/constants";
import { addMonths, formatDate, lastCoveredDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select } from "@/components/ui/input";

type Props = {
  benchId: string;
  benchNumber: string;
  /** Today's date in the park's time zone, computed on the server. */
  today: string;
};

const DEFAULT_DURATION = 12;

export function AdoptionForm({ benchId, benchNumber, today }: Props) {
  const [state, formAction, isPending] = useActionState<AdoptActionState, FormData>(adoptBenchAction, {});
  const values = state.values;
  const errors = state.fieldErrors ?? {};

  const [duration, setDuration] = useState<number>(values?.durationMonths || DEFAULT_DURATION);
  const endExclusive = addMonths(today, duration);
  const selectedOption = DURATION_OPTIONS.find((d) => d.months === duration);

  return (
    <form action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="benchId" value={benchId} />
      <input type="hidden" name="benchNumber" value={benchNumber} />
      {/* Honeypot — hidden from people, tempting to bots. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {state.formError ? (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-clay-700/40 bg-clay-100 px-3 py-2.5 text-sm text-charcoal-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-clay-700" aria-hidden="true" />
          <p>{state.formError}</p>
        </div>
      ) : null}

      <div>
        <Label htmlFor="donorName">Your Full Name</Label>
        <Input
          id="donorName"
          name="donorName"
          className="mt-1"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={values?.donorName ?? ""}
          aria-invalid={errors.donorName ? true : undefined}
          aria-describedby={errors.donorName ? "donorName-error" : undefined}
        />
        <FieldError id="donorName-error">{errors.donorName}</FieldError>
      </div>

      <div>
        <Label htmlFor="donorEmail">Email Address</Label>
        <Input
          id="donorEmail"
          name="donorEmail"
          type="email"
          className="mt-1"
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={values?.donorEmail ?? ""}
          aria-invalid={errors.donorEmail ? true : undefined}
          aria-describedby={`donorEmail-hint${errors.donorEmail ? " donorEmail-error" : ""}`}
        />
        <FieldHint id="donorEmail-hint">Used only as contact information for this adoption. Never displayed publicly.</FieldHint>
        <FieldError id="donorEmail-error">{errors.donorEmail}</FieldError>
      </div>

      <div>
        <Label htmlFor="publicRecognitionName">
          Public Recognition Name <span className="font-normal text-charcoal-500">(optional)</span>
        </Label>
        <Input
          id="publicRecognitionName"
          name="publicRecognitionName"
          className="mt-1"
          maxLength={120}
          placeholder='e.g. "The Smith Family" or "In memory of…"'
          defaultValue={values?.publicRecognitionName ?? ""}
          aria-invalid={errors.publicRecognitionName ? true : undefined}
          aria-describedby={`publicRecognitionName-hint${errors.publicRecognitionName ? " publicRecognitionName-error" : ""}`}
        />
        <FieldHint id="publicRecognitionName-hint">
          How you&apos;d like to be recognized on the bench listing. Leave blank to use your full name.
        </FieldHint>
        <FieldError id="publicRecognitionName-error">{errors.publicRecognitionName}</FieldError>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-cream-300 bg-cream-50 p-3">
        <input
          id="displayNamePublicly"
          name="displayNamePublicly"
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-forest-700"
          defaultChecked={values?.displayNamePublicly ?? false}
        />
        <div>
          <Label htmlFor="displayNamePublicly" className="font-medium">
            Display my recognition name publicly on this bench&apos;s adoption listing.
          </Label>
          <p className="mt-0.5 text-xs text-charcoal-500">If left unchecked, the listing will show &ldquo;Anonymous Donor.&rdquo;</p>
        </div>
      </div>

      <div>
        <Label htmlFor="durationMonths">Adoption Duration</Label>
        <Select
          id="durationMonths"
          name="durationMonths"
          className="mt-1"
          required
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          aria-invalid={errors.durationMonths ? true : undefined}
          aria-describedby={`duration-summary${errors.durationMonths ? " durationMonths-error" : ""}`}
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d.months} value={d.months}>
              {d.label}
            </option>
          ))}
        </Select>
        <FieldError id="durationMonths-error">{errors.durationMonths}</FieldError>

        <div id="duration-summary" className="mt-3 rounded-md bg-forest-50 px-3 py-2.5 text-sm text-forest-900" aria-live="polite">
          <p>
            <span className="font-medium">Selected: {selectedOption?.label ?? `${duration} months`}.</span> Your adoption
            will run from <span className="font-medium">{formatDate(today)}</span> through{" "}
            <span className="font-medium">{formatDate(lastCoveredDay(endExclusive))}</span>.
          </p>
        </div>
      </div>

      <div className="border-t border-cream-300 pt-6">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Confirming…
            </>
          ) : (
            "Confirm Adoption"
          )}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-charcoal-500">
          This is a demonstration system. No payment is collected and no official park adoption is created.
        </p>
      </div>
    </form>
  );
}
