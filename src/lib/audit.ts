import { prisma } from "@/lib/prisma";

type AuditEntry = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

const safeStringify = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return null;
  }
};

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: safeStringify(entry.before),
        after: safeStringify(entry.after),
        metadata: safeStringify(entry.metadata),
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit failure must never break the request that triggered it.
    console.error("[audit] failed to record entry", { action: entry.action, err });
  }
}
