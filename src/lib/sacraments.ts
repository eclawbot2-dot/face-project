// Typed milestone helper for SacramentRecord. Milestones are stored as a
// JSON string column on the SacramentRecord model so the schema doesn't have
// to know about specific sacrament tracks. This module gives the rest of the
// app a stable shape and prevents milestone arrays from getting mangled by
// stringify/parse round-trips.

export type Milestone = {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string | null;
  notes?: string | null;
};

const FALLBACK_TEMPLATES: Record<string, string[]> = {
  Confirmation: [
    "Sponsor selected",
    "Saint name chosen",
    "Service hours (20 hrs)",
    "Retreat attendance",
    "Letter to bishop",
    "Final interview",
  ],
  "First Communion": [
    "Baptismal certificate on file",
    "Parent meeting attended",
    "Practice mass",
    "First Reconciliation completed",
  ],
  "First Reconciliation": [
    "Examination of conscience reviewed",
    "Practice session attended",
    "Reconciliation completed",
  ],
  Baptism: ["Date scheduled", "Sponsors confirmed", "Baptism completed"],
};

const slug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function defaultMilestones(sacramentType: string): Milestone[] {
  const template = FALLBACK_TEMPLATES[sacramentType] ?? [];
  return template.map((name) => ({ id: slug(name), name, completed: false }));
}

export function parseMilestones(raw: string | null | undefined): Milestone[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((m) => normalizeMilestone(m))
      .filter((m): m is Milestone => m !== null);
  } catch {
    return [];
  }
}

function normalizeMilestone(value: unknown): Milestone | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const name = typeof v.name === "string" ? v.name : null;
  if (!name) return null;
  return {
    id: typeof v.id === "string" && v.id ? v.id : slug(name),
    name,
    completed: Boolean(v.completed),
    completedAt: typeof v.completedAt === "string" ? v.completedAt : null,
    notes: typeof v.notes === "string" ? v.notes : null,
  };
}

export function setMilestoneCompleted(
  milestones: Milestone[],
  id: string,
  completed: boolean,
): Milestone[] {
  return milestones.map((m) =>
    m.id === id
      ? {
          ...m,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        }
      : m,
  );
}

export function progressPercent(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return Math.round((done / milestones.length) * 100);
}

export function serializeMilestones(milestones: Milestone[]): string {
  return JSON.stringify(milestones);
}
