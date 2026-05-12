/**
 * Tests for the audit-log helper. Prisma is mocked so these run in
 * isolation from the real DB.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const { auditCreate } = vi.hoisted(() => ({ auditCreate: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: auditCreate } },
}));

import { recordAudit } from "@/lib/audit";

describe("recordAudit", () => {
  beforeEach(() => {
    auditCreate.mockReset();
  });

  it("stringifies before/after/metadata and forwards optional fields", async () => {
    auditCreate.mockResolvedValue({});
    await recordAudit({
      actorId: "u1",
      action: "UPDATE",
      entityType: "Student",
      entityId: "s7",
      before: { name: "Old" },
      after: { name: "New" },
      metadata: { reason: "typo" },
      ip: "1.2.3.4",
      userAgent: "ua",
    });
    expect(auditCreate).toHaveBeenCalledTimes(1);
    const args = auditCreate.mock.calls[0][0].data;
    expect(args.actorId).toBe("u1");
    expect(args.entityType).toBe("Student");
    expect(args.entityId).toBe("s7");
    expect(JSON.parse(args.before)).toEqual({ name: "Old" });
    expect(JSON.parse(args.after)).toEqual({ name: "New" });
    expect(JSON.parse(args.metadata)).toEqual({ reason: "typo" });
    expect(args.ip).toBe("1.2.3.4");
    expect(args.userAgent).toBe("ua");
  });

  it("collapses missing/optional fields to null", async () => {
    auditCreate.mockResolvedValue({});
    await recordAudit({ action: "CREATE", entityType: "Announcement" });
    const args = auditCreate.mock.calls[0][0].data;
    expect(args.actorId).toBeNull();
    expect(args.entityId).toBeNull();
    expect(args.before).toBeNull();
    expect(args.after).toBeNull();
    expect(args.metadata).toBeNull();
    expect(args.ip).toBeNull();
    expect(args.userAgent).toBeNull();
  });

  it("safely handles bigint via the JSON replacer", async () => {
    auditCreate.mockResolvedValue({});
    await recordAudit({ action: "X", entityType: "Y", after: { n: 9007199254740993n } });
    const args = auditCreate.mock.calls[0][0].data;
    // bigint converted to its string form so the row is still
    // serializable.
    expect(args.after).toContain('"9007199254740993"');
  });

  it("never throws when prisma fails", async () => {
    auditCreate.mockRejectedValue(new Error("DB down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordAudit({ action: "TEST", entityType: "X" })).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
