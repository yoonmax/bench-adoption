import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, PARK_AREAS, type StatusFilter } from "@/lib/constants";

/**
 * Data access for benches. Everything here reads from the `benches_public`
 * view, which joins each bench to its currently-active adoption and never
 * includes donor email addresses.
 */

export type BenchSummary = {
  id: string;
  bench_number: string;
  area: string;
  adoption_id: string | null;
  /** Recognition name if the donor opted in; null means "Anonymous Donor". */
  public_display_name: string | null;
  duration_months: number | null;
  start_date: string | null;
  end_date: string | null;
  adoption_source: "seed" | "web" | null;
};

export type BenchDetail = BenchSummary & { description: string };

export type DirectoryQuery = {
  q: string;
  status: StatusFilter;
  area: string;
  page: number;
};

export type DirectoryResult = {
  benches: BenchSummary[];
  total: number;
  page: number;
  pageCount: number;
};

export type Stats = { total: number; adopted: number; available: number };

const SUMMARY_COLUMNS =
  "id, bench_number, area, adoption_id, public_display_name, duration_months, start_date, end_date, adoption_source";

class DatabaseError extends Error {
  constructor(context: string, cause: unknown) {
    super(`Database error while ${context}`);
    this.name = "DatabaseError";
    this.cause = cause;
  }
}

function fail(context: string, error: unknown): never {
  // Log details server-side (no donor data is involved in read paths).
  console.error(`[db] ${context}:`, error);
  throw new DatabaseError(context, error);
}

/** Turn a raw search string into a safe ILIKE term. "42" becomes "VC-042". */
export function normalizeSearch(raw: string): string {
  const cleaned = raw.trim().replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 40);
  if (/^\d{1,3}$/.test(cleaned)) return `VC-${cleaned.padStart(3, "0")}`;
  return cleaned;
}

export async function listBenches(params: DirectoryQuery): Promise<DirectoryResult> {
  const db = getAdminClient();
  const page = Math.max(1, params.page);
  const from = (page - 1) * PAGE_SIZE;

  let query = db
    .from("benches_public")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .order("bench_number", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (params.status === "available") query = query.is("adoption_id", null);
  if (params.status === "adopted") query = query.not("adoption_id", "is", null);
  if (params.area && (PARK_AREAS as readonly string[]).includes(params.area)) {
    query = query.eq("area", params.area);
  }

  const term = normalizeSearch(params.q);
  if (term) {
    query = query.or(`bench_number.ilike.%${term}%,area.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) fail("listing benches", error);

  const total = count ?? 0;
  return {
    benches: (data ?? []) as BenchSummary[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getBenchByNumber(benchNumber: string): Promise<BenchDetail | null> {
  const normalized = normalizeSearch(benchNumber).toUpperCase();
  if (!/^VC-\d{3}$/.test(normalized)) return null;

  const db = getAdminClient();
  const { data, error } = await db
    .from("benches_public")
    .select(`${SUMMARY_COLUMNS}, description`)
    .eq("bench_number", normalized)
    .maybeSingle();

  if (error) fail("loading bench", error);
  return (data as BenchDetail | null) ?? null;
}

export async function getStats(): Promise<Stats> {
  const db = getAdminClient();
  const [all, adopted] = await Promise.all([
    db.from("benches_public").select("id", { count: "exact", head: true }),
    db.from("benches_public").select("id", { count: "exact", head: true }).not("adoption_id", "is", null),
  ]);
  if (all.error) fail("counting benches", all.error);
  if (adopted.error) fail("counting adoptions", adopted.error);

  const total = all.count ?? 0;
  const adoptedCount = adopted.count ?? 0;
  return { total, adopted: adoptedCount, available: total - adoptedCount };
}

export type AdoptionReceipt = {
  id: string;
  bench_id: string;
  donor_name: string;
  public_recognition_name: string | null;
  display_name_publicly: boolean;
  duration_months: number;
  start_date: string;
  end_date: string;
};

/**
 * Loads a single adoption for the confirmation page. Only reachable with the
 * adoption's UUID (returned to the submitter), and never returns the email.
 */
export async function getAdoptionReceipt(adoptionId: string, benchId: string): Promise<AdoptionReceipt | null> {
  if (!/^[0-9a-f-]{36}$/i.test(adoptionId)) return null;
  const db = getAdminClient();
  const { data, error } = await db
    .from("adoptions")
    .select(
      "id, bench_id, donor_name, public_recognition_name, display_name_publicly, duration_months, start_date, end_date",
    )
    .eq("id", adoptionId)
    .eq("bench_id", benchId)
    .maybeSingle();
  if (error) fail("loading adoption receipt", error);
  return (data as AdoptionReceipt | null) ?? null;
}

/** What the public sees as the donor for an active adoption. */
export function recognitionLabel(publicDisplayName: string | null): string {
  return publicDisplayName ?? "Anonymous Donor";
}
