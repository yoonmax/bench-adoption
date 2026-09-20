export const APP_NAME = "Van Cortlandt Bench Adoption";
export const APP_TAGLINE = "Leave your mark on the park.";

/** Adoption durations offered by this demo. Sample program options, not official rules. */
export const DURATION_OPTIONS = [
  { months: 6, label: "6 Months" },
  { months: 12, label: "1 Year" },
  { months: 24, label: "2 Years" },
  { months: 36, label: "3 Years" },
  { months: 60, label: "5 Years" },
] as const;

export const ALLOWED_DURATIONS: readonly number[] = DURATION_OPTIONS.map((d) => d.months);

/** Illustrative park-area labels used by the demo dataset. Not verified bench locations. */
export const PARK_AREAS = [
  "Parade Ground",
  "Van Cortlandt Lake",
  "Old Croton Aqueduct Trail",
  "Northwest Woods",
  "Indian Field",
  "Putnam Trail",
  "Other Park Areas",
] as const;

export const PAGE_SIZE = 18;

export const STATUS_FILTERS = ["all", "available", "adopted"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
