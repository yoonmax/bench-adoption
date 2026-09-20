/**
 * Date helpers. All dates are plain "YYYY-MM-DD" strings (what Postgres `date`
 * columns come back as) so no timezone shifting can creep in.
 *
 * `end_date` is EXCLUSIVE: an adoption covers start_date up to, but not
 * including, end_date. The last day a donor "has" the bench is end_date - 1.
 */

export const PARK_TIME_ZONE = "America/New_York";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

/** Today's calendar date in New York (matches `park_today()` in the database). */
export function parkToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function toIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month
}

/**
 * Calendar-month arithmetic, clamping the day like Postgres does:
 * 2026-01-31 + 1 month = 2026-02-28.
 */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toIso(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** The last day covered by an adoption (end_date is exclusive). */
export function lastCoveredDay(endDateExclusive: string): string {
  return addDays(endDateExclusive, -1);
}

/** Mirrors the SQL rule: start_date <= today AND end_date > today. */
export function isAdoptionActive(startDate: string, endDateExclusive: string, today: string): boolean {
  return startDate <= today && endDateExclusive > today;
}

export function formatDate(iso: string): string {
  const [y, m, d] = parts(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatDuration(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${months} months`;
}
