/**
 * Tests for the formatting helpers in lib/utils. These are pure
 * client-side display functions — small but used everywhere, so a
 * regression makes the whole UI look broken (wrong date format,
 * mid-night times rendering as "0:00 PM" etc).
 */
import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatTime,
  gradeLevelLabel,
  SACRAMENT_TYPES,
  DAYS_OF_WEEK,
  PROGRAMS,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names with twMerge precedence", () => {
    // Later class wins for conflicting Tailwind tokens.
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", false && "text-blue-500")).toBe("text-red-500");
  });

  it("handles undefined / falsy / arrays", () => {
    expect(cn(undefined, null, false, "ok")).toBe("ok");
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});

describe("formatDate", () => {
  it("returns em-dash for null/undefined/empty", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a Date with US month-day-year shape", () => {
    const out = formatDate(new Date("2026-04-12T12:00:00Z"));
    expect(out).toMatch(/Apr 12, 2026/);
  });

  it("accepts an ISO string", () => {
    // Use a mid-month time so the local-timezone interpretation
    // doesn't roll over to the previous day.
    expect(formatDate("2026-12-15T12:00:00Z")).toMatch(/Dec 15, 2026/);
  });
});

describe("formatTime", () => {
  it("returns em-dash for null/empty", () => {
    expect(formatTime(null)).toBe("—");
    expect(formatTime(undefined)).toBe("—");
  });

  it("formats AM hours", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
    expect(formatTime("00:05")).toBe("12:05 AM");
  });

  it("formats PM hours", () => {
    expect(formatTime("13:00")).toBe("1:00 PM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("23:45")).toBe("11:45 PM");
  });

  it("zero-pads minutes", () => {
    expect(formatTime("9:5")).toBe("9:05 AM");
  });
});

describe("gradeLevelLabel", () => {
  it("maps known grades to friendly labels", () => {
    expect(gradeLevelLabel("PRE_K")).toBe("Pre-K");
    expect(gradeLevelLabel("KINDERGARTEN")).toBe("Kindergarten");
    expect(gradeLevelLabel("GRADE_1")).toBe("1st Grade");
    expect(gradeLevelLabel("GRADE_8")).toBe("8th Grade");
    expect(gradeLevelLabel("ADULT")).toBe("Adult");
  });

  it("falls back to the raw value for unknown grades", () => {
    expect(gradeLevelLabel("BOGUS")).toBe("BOGUS");
  });
});

describe("static catalogs", () => {
  it("SACRAMENT_TYPES has the 5 standard sacraments tracked here", () => {
    expect(SACRAMENT_TYPES).toContain("Baptism");
    expect(SACRAMENT_TYPES).toContain("First Communion");
    expect(SACRAMENT_TYPES).toContain("Confirmation");
    expect(SACRAMENT_TYPES).toContain("First Reconciliation");
    expect(SACRAMENT_TYPES).toContain("Marriage");
  });

  it("DAYS_OF_WEEK has exactly 7 days starting Sunday", () => {
    expect(DAYS_OF_WEEK.length).toBe(7);
    expect(DAYS_OF_WEEK[0]).toBe("Sunday");
    expect(DAYS_OF_WEEK[6]).toBe("Saturday");
  });

  it("PROGRAMS catalog is non-empty", () => {
    expect(PROGRAMS.length).toBeGreaterThan(0);
  });
});
