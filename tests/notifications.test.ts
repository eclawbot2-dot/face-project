/**
 * Tests for the notification dispatcher. Drives the missing-field
 * guard, the audit-log persistence path, and the two convenience
 * builders (attendance absent + sacrament milestone). Prisma is
 * mocked so we can assert what gets persisted without a real DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { auditCreate } = vi.hoisted(() => ({ auditCreate: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: auditCreate } },
}));

import {
  notify,
  notifyAttendanceAbsent,
  notifySacramentMilestone,
} from "@/lib/notifications";

beforeEach(() => {
  auditCreate.mockReset();
  auditCreate.mockResolvedValue({});
});

describe("notify", () => {
  it("returns ok:false when to is missing", async () => {
    const r = await notify({ kind: "generic", to: "", subject: "hi", body: "x" });
    expect(r.ok).toBe(false);
  });

  it("returns ok:false when subject is missing", async () => {
    const r = await notify({ kind: "generic", to: "p@x.com", subject: "", body: "x" });
    expect(r.ok).toBe(false);
  });

  it("returns ok:true via log transport when SMTP env missing + records audit", async () => {
    const r = await notify({ kind: "generic", to: "p@x.com", subject: "hi", body: "x" });
    expect(r.ok).toBe(true);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    const data = auditCreate.mock.calls[0][0].data;
    expect(data.action).toBe("notification.sent");
    expect(data.entityType).toBe("Notification");
    const meta = JSON.parse(data.metadata);
    expect(meta.to).toBe("p@x.com");
    expect(meta.subject).toBe("hi");
    expect(meta.transport).toBe("log");
  });

  it("audit failure does not bubble up", async () => {
    auditCreate.mockRejectedValueOnce(new Error("audit down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await notify({ kind: "generic", to: "p@x.com", subject: "hi", body: "x" });
    expect(r.ok).toBe(true); // send still succeeded
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("merges payload metadata into the audit record", async () => {
    await notify({
      kind: "attendance.absent",
      to: "p@x.com",
      subject: "hi",
      body: "x",
      metadata: { className: "Confirmation Year 2", studentId: "s1" },
    });
    const meta = JSON.parse(auditCreate.mock.calls[0][0].data.metadata);
    expect(meta.className).toBe("Confirmation Year 2");
    expect(meta.studentId).toBe("s1");
  });
});

describe("notifyAttendanceAbsent", () => {
  it("formats subject and body for an absent student", async () => {
    await notifyAttendanceAbsent({
      parentEmail: "p@x.com",
      parentName: "Mary",
      studentName: "Lucy",
      className: "Confirmation Year 2",
      sessionDate: new Date("2026-04-12T10:00:00Z"),
    });
    const data = auditCreate.mock.calls[0][0].data;
    expect(data.action).toBe("notification.sent");
    const meta = JSON.parse(data.metadata);
    expect(meta.subject).toContain("Lucy");
    expect(meta.subject).toContain("Confirmation Year 2");
    expect(meta.kind).toBe("attendance.absent");
  });
});

describe("notifySacramentMilestone", () => {
  it("formats subject and persists sacramentType in metadata", async () => {
    await notifySacramentMilestone({
      parentEmail: "p@x.com",
      parentName: "Mary",
      studentName: "Lucy",
      sacramentType: "Confirmation",
      milestoneName: "Sponsor selected",
    });
    const meta = JSON.parse(auditCreate.mock.calls[0][0].data.metadata);
    expect(meta.subject).toContain("Confirmation");
    expect(meta.subject).toContain("Sponsor selected");
    expect(meta.sacramentType).toBe("Confirmation");
    expect(meta.milestoneName).toBe("Sponsor selected");
  });
});
