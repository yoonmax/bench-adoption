import { describe, expect, it } from "vitest";
import { parseAdoptionForm } from "@/lib/validation";

const BENCH_ID = "55c71b42-d9b0-42c9-8c61-5d331c22686b";

function fd(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = {
  benchId: BENCH_ID,
  donorName: "  Jane Smith ",
  donorEmail: "Jane@Example.com",
  publicRecognitionName: "The Smith Family",
  displayNamePublicly: "on",
  durationMonths: "24",
};

describe("parseAdoptionForm", () => {
  it("accepts a valid submission and normalizes it", () => {
    const r = parseAdoptionForm(fd(valid));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.donorName).toBe("Jane Smith");
    expect(r.data.donorEmail).toBe("jane@example.com");
    expect(r.data.displayNamePublicly).toBe(true);
    expect(r.data.durationMonths).toBe(24);
  });

  it("turns an empty recognition name into null and unchecked box into false", () => {
    const r = parseAdoptionForm(fd({ ...valid, publicRecognitionName: "   ", displayNamePublicly: "" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.publicRecognitionName).toBeNull();
    expect(r.data.displayNamePublicly).toBe(false);
  });

  it("rejects an empty name", () => {
    const r = parseAdoptionForm(fd({ ...valid, donorName: "   " }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors.donorName).toBeTruthy();
  });

  it("rejects an invalid email", () => {
    const r = parseAdoptionForm(fd({ ...valid, donorEmail: "not-an-email" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors.donorEmail).toBeTruthy();
  });

  it("rejects unsupported durations", () => {
    for (const bad of ["7", "0", "-12", "abc", ""]) {
      const r = parseAdoptionForm(fd({ ...valid, durationMonths: bad }));
      expect(r.ok, `duration ${bad}`).toBe(false);
      if (r.ok) return;
      expect(r.fieldErrors.durationMonths).toBeTruthy();
    }
  });

  it("rejects an invalid bench identifier", () => {
    const r = parseAdoptionForm(fd({ ...valid, benchId: "VC-042" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors.benchId).toBeTruthy();
  });

  it("rejects a malformed request with missing fields", () => {
    const r = parseAdoptionForm(new FormData());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.fieldErrors).length).toBeGreaterThan(0);
  });
});
