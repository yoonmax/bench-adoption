/**
 * Concurrency test for adopt_bench().
 *
 * Fires N simultaneous adoption requests at ONE available bench and checks
 * that exactly one succeeds. Run against your real Supabase project:
 *
 *   npm run test:concurrency
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * It creates one real adoption on a random available bench (marked source='web').
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

// Minimal .env.local loader (no extra dependency).
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const N = Number(process.argv[2] ?? 8);

const { data: bench, error: benchErr } = await db
  .from("benches_public")
  .select("id, bench_number")
  .is("adoption_id", null)
  .order("bench_number", { ascending: false })
  .limit(1)
  .maybeSingle();
if (benchErr || !bench) {
  console.error("Could not find an available bench:", benchErr?.message);
  process.exit(1);
}
console.log(`Firing ${N} simultaneous adoption requests at ${bench.bench_number} (${bench.id})…`);

const results = await Promise.all(
  Array.from({ length: N }, (_, i) =>
    db.rpc("adopt_bench", {
      p_bench_id: bench.id,
      p_donor_name: `Concurrent Tester ${i + 1}`,
      p_donor_email: `concurrent-${i + 1}@example.com`,
      p_public_recognition_name: `Concurrency Test ${i + 1}`,
      p_display_name_publicly: true,
      p_duration_months: 6,
    }),
  ),
);

const successes = results.filter((r) => !r.error);
const failures = results.filter((r) => r.error);
results.forEach((r, i) =>
  console.log(`  request ${i + 1}: ${r.error ? "REJECTED (" + r.error.message + ")" : "SUCCESS"}`),
);

const { count } = await db
  .from("adoptions")
  .select("id", { count: "exact", head: true })
  .eq("bench_id", bench.id)
  .gt("end_date", new Date().toISOString().slice(0, 10));

console.log(`\n${successes.length} succeeded, ${failures.length} rejected. Active adoptions on bench: ${count}`);
if (successes.length === 1 && count === 1) {
  console.log("PASS — exactly one adoption was created.");
} else {
  console.log("FAIL — expected exactly one success.");
  process.exit(1);
}
