/**
 * Lightweight, best-effort rate limit for adoption submissions.
 *
 * Keeps a small in-memory window per client IP. On serverless hosting each
 * instance has its own memory, so this is a speed bump against casual abuse,
 * not a hard guarantee. See README → Security for production recommendations.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow forever.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}
