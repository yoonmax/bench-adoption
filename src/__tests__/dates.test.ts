import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatDate,
  formatDuration,
  isAdoptionActive,
  lastCoveredDay,
  parkToday,
} from "@/lib/dates";

describe("addMonths (calendar-month arithmetic, mirrors Postgres)", () => {
  it("adds whole months", () => {
    expect(addMonths("2026-09-20", 6)).toBe("2027-03-20");
    expect(addMonths("2026-09-20", 12)).toBe("2027-09-20");
    expect(addMonths("2026-09-20", 60)).toBe("2031-09-20");
  });

  it("clamps the day when the target month is shorter", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29"); // leap year
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
    expect(addMonths("2026-03-31", 6)).toBe("2026-09-30");
  });

  it("rolls over years correctly", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-11-30", 24)).toBe("2028-11-30");
  });
});

describe("addDays / lastCoveredDay (end_date is exclusive)", () => {
  it("steps back across month and year boundaries", () => {
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(lastCoveredDay("2027-09-20")).toBe("2027-09-19");
  });
});

describe("isAdoptionActive", () => {
  const start = "2026-09-20";
  const end = "2027-09-20"; // exclusive

  it("is active on the start date and the last covered day", () => {
    expect(isAdoptionActive(start, end, "2026-09-20")).toBe(true);
    expect(isAdoptionActive(start, end, "2027-09-19")).toBe(true);
  });

  it("is NOT active on the end date (exclusive) or before start", () => {
    expect(isAdoptionActive(start, end, "2027-09-20")).toBe(false);
    expect(isAdoptionActive(start, end, "2026-09-19")).toBe(false);
  });

  it("treats a fully expired adoption as inactive", () => {
    expect(isAdoptionActive("2023-01-01", "2023-07-01", "2026-09-20")).toBe(false);
  });
});

describe("parkToday", () => {
  it("uses the New York calendar date, not UTC", () => {
    // 2026-09-20T02:30Z is still the evening of Sept 19 in New York (UTC-4).
    expect(parkToday(new Date("2026-09-20T02:30:00Z"))).toBe("2026-09-19");
    expect(parkToday(new Date("2026-09-20T12:00:00Z"))).toBe("2026-09-20");
  });
});

describe("formatting", () => {
  it("formats dates without timezone drift", () => {
    expect(formatDate("2026-09-20")).toBe("September 20, 2026");
    expect(formatDate("2027-02-28")).toBe("February 28, 2027");
  });

  it("formats durations in months or years", () => {
    expect(formatDuration(6)).toBe("6 months");
    expect(formatDuration(12)).toBe("1 year");
    expect(formatDuration(24)).toBe("2 years");
    expect(formatDuration(60)).toBe("5 years");
  });
});
