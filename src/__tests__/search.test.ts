import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { normalizeSearch } from "@/lib/benches";

describe("normalizeSearch", () => {
  it("expands a bare number into a bench number", () => {
    expect(normalizeSearch("42")).toBe("VC-042");
    expect(normalizeSearch("7")).toBe("VC-007");
    expect(normalizeSearch("520")).toBe("VC-520");
  });

  it("passes through bench numbers and area names", () => {
    expect(normalizeSearch("VC-042")).toBe("VC-042");
    expect(normalizeSearch("Parade Ground")).toBe("Parade Ground");
  });

  it("strips characters that could break the query filter", () => {
    expect(normalizeSearch("VC-042,area.eq.x")).toBe("VC-042areaeqx");
    expect(normalizeSearch("a%b(c)")).toBe("abc");
  });
});
