/**
 * GET /api/students/export
 *
 * CSV download of student roster with parent contact + enrollment
 * + sacrament-prep status. Admin/director-only — the file includes
 * minor-child names + parent emails so it's tightly gated.
 *
 * Records the export as an audit row (via the existing audit lib)
 * with the requesting actor + IP so a future "who pulled student
 * data?" diocesan compliance check has a deterministic answer.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

function csv(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ipFrom(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return headers.get("x-real-ip");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      parents: { include: { parent: { select: { name: true, email: true, phone: true } } } },
      enrollments: { include: { class: { select: { name: true } } } },
      sacramentRecords: { select: { sacramentType: true, status: true } },
    },
  });

  const header = [
    "studentId",
    "firstName",
    "lastName",
    "gradeLevel",
    "primaryParentName",
    "primaryParentEmail",
    "primaryParentPhone",
    "classes",
    "sacramentTracks",
  ];

  const rows = (students as Array<{
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
    parents: Array<{ parent: { name: string; email: string; phone: string | null } }>;
    enrollments: Array<{ class: { name: string } }>;
    sacramentRecords: Array<{ sacramentType: string; status: string }>;
  }>).map((s) => [
    s.id,
    s.firstName,
    s.lastName,
    s.gradeLevel ?? "",
    s.parents[0]?.parent?.name ?? "",
    s.parents[0]?.parent?.email ?? "",
    s.parents[0]?.parent?.phone ?? "",
    s.enrollments.map((e) => e.class.name).join("; "),
    s.sacramentRecords.map((sr) => `${sr.sacramentType}:${sr.status}`).join("; "),
  ]);

  const body = [header, ...rows].map((r) => r.map(csv).join(",")).join("\r\n");

  await recordAudit({
    action: "students.exported",
    entityType: "Student",
    actorId: (session.user as { id?: string }).id ?? null,
    metadata: { rowCount: rows.length },
    ip: ipFrom(req.headers),
    userAgent: req.headers.get("user-agent"),
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
