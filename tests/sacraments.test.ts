/**
 * Tests for the sacrament-milestone helper. This lib owns the
 * JSON-blob structure of SacramentRecord.milestones — coverage here
 * prevents stringify/parse round-trips from silently mangling
 * milestones (e.g. losing completion flags, dropping notes).
 */
import { describe, it, expect } from "vitest";
import {
  defaultMilestones,
  parseMilestones,
  setMilestoneCompleted,
  progressPercent,
  serializeMilestones,
} from "@/lib/sacraments";

describe("defaultMilestones", () => {
  it("returns the Confirmation template with slugged ids", () => {
    const ms = defaultMilestones("Confirmation");
    expect(ms.length).toBe(6);
    expect(ms[0].id).toBe("sponsor-selected");
    expect(ms[2].name).toBe("Service hours (20 hrs)");
    expect(ms.every((m) => !m.completed)).toBe(true);
  });

  it("returns First Communion template", () => {
    const ms = defaultMilestones("First Communion");
    expect(ms.length).toBe(4);
    expect(ms[0].id).toBe("baptismal-certificate-on-file");
  });

  it("returns First Reconciliation template", () => {
    const ms = defaultMilestones("First Reconciliation");
    expect(ms.length).toBe(3);
  });

  it("returns Baptism template", () => {
    const ms = defaultMilestones("Baptism");
    expect(ms.length).toBe(3);
    expect(ms.map((m) => m.id)).toEqual(["date-scheduled", "sponsors-confirmed", "baptism-completed"]);
  });

  it("returns empty for unknown sacrament", () => {
    expect(defaultMilestones("First Communion Lite")).toEqual([]);
  });
});

describe("parseMilestones", () => {
  it("returns [] for null/undefined/empty/non-JSON inputs", () => {
    expect(parseMilestones(null)).toEqual([]);
    expect(parseMilestones(undefined)).toEqual([]);
    expect(parseMilestones("")).toEqual([]);
    expect(parseMilestones("not json")).toEqual([]);
  });

  it("returns [] when JSON parses to a non-array", () => {
    expect(parseMilestones('{"name":"x"}')).toEqual([]);
    expect(parseMilestones("42")).toEqual([]);
  });

  it("normalizes entries; drops malformed entries silently", () => {
    const raw = JSON.stringify([
      { id: "a", name: "A", completed: true, completedAt: "2026-01-01T00:00:00Z", notes: "n" },
      { name: "B" }, // missing id → slug
      { completed: true }, // missing name → dropped
      "garbage", // not an object → dropped
    ]);
    const parsed = parseMilestones(raw);
    expect(parsed.length).toBe(2);
    expect(parsed[0]).toMatchObject({ id: "a", name: "A", completed: true, notes: "n" });
    expect(parsed[1].id).toBe("b");
    expect(parsed[1].completed).toBe(false);
  });

  it("coerces completed to boolean", () => {
    const parsed = parseMilestones(JSON.stringify([{ name: "X", completed: 1 }, { name: "Y", completed: 0 }]));
    expect(parsed[0].completed).toBe(true);
    expect(parsed[1].completed).toBe(false);
  });
});

describe("setMilestoneCompleted", () => {
  it("flips completion + stamps completedAt", () => {
    const ms = defaultMilestones("Baptism");
    const next = setMilestoneCompleted(ms, "date-scheduled", true);
    const target = next.find((m) => m.id === "date-scheduled");
    expect(target?.completed).toBe(true);
    expect(typeof target?.completedAt).toBe("string");
    // Other milestones untouched.
    expect(next.find((m) => m.id === "sponsors-confirmed")?.completed).toBe(false);
  });

  it("clears completedAt when flipping back to incomplete", () => {
    let ms = defaultMilestones("Baptism");
    ms = setMilestoneCompleted(ms, "date-scheduled", true);
    ms = setMilestoneCompleted(ms, "date-scheduled", false);
    const target = ms.find((m) => m.id === "date-scheduled");
    expect(target?.completed).toBe(false);
    expect(target?.completedAt).toBeNull();
  });

  it("is a no-op for unknown ids (returns array unchanged)", () => {
    const ms = defaultMilestones("Baptism");
    const next = setMilestoneCompleted(ms, "no-such-id", true);
    expect(next).toEqual(ms);
  });
});

describe("progressPercent", () => {
  it("returns 0 for empty", () => {
    expect(progressPercent([])).toBe(0);
  });

  it("rounds half-percent up (HALF_UP via Math.round)", () => {
    const ms = defaultMilestones("Confirmation"); // 6 milestones
    let progress = ms.map((m, i) => ({ ...m, completed: i < 3 })); // 3/6 = 50%
    expect(progressPercent(progress)).toBe(50);
    progress = ms.map((m, i) => ({ ...m, completed: i < 4 })); // 4/6 = 66.67%
    expect(progressPercent(progress)).toBe(67);
  });

  it("returns 100 when all completed", () => {
    const ms = defaultMilestones("Baptism").map((m) => ({ ...m, completed: true }));
    expect(progressPercent(ms)).toBe(100);
  });
});

describe("serializeMilestones round-trips", () => {
  it("a serialize + parse round-trip preserves id/name/completed; fills null defaults for optional fields", () => {
    const original = defaultMilestones("Confirmation");
    const after = parseMilestones(serializeMilestones(original));
    expect(after.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      expect(after[i].id).toBe(original[i].id);
      expect(after[i].name).toBe(original[i].name);
      expect(after[i].completed).toBe(original[i].completed);
      // parseMilestones fills these with null when absent — that's
      // the contract; the JSON-blob round-trip doesn't have to
      // preserve `undefined` vs `null`.
      expect(after[i].completedAt).toBeNull();
      expect(after[i].notes).toBeNull();
    }
  });
});
