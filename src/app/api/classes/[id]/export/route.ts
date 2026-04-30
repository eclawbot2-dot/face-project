import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { recordAudit } from "@/lib/audit";

// GET /api/classes/[id]/export?format=xlsx
// Returns a roster spreadsheet for the class: students + parent contacts +
// attendance summary. ADMIN/DIRECTOR/CATECHIST (assigned) only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Catechists may only export classes they're assigned to.
  if (role === "CATECHIST" && userId) {
    const catechist = await prisma.catechist.findUnique({
      where: { userId },
      include: { classes: { where: { classId: id }, select: { classId: true } } },
    });
    if (!catechist || catechist.classes.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { active: true },
        include: {
          student: {
            include: {
              parents: { include: { user: true } },
              attendance: { include: { session: true } },
              sacraments: true,
            },
          },
        },
      },
      sessions: { orderBy: { date: "asc" } },
    },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessionIds = new Set(cls.sessions.map((s) => s.id));
  const totalSessions = sessionIds.size;

  const rosterRows = cls.enrollments.map((e) => {
    const student = e.student;
    const present = student.attendance.filter(
      (a) => sessionIds.has(a.sessionId) && a.status === "PRESENT",
    ).length;
    const absent = student.attendance.filter(
      (a) => sessionIds.has(a.sessionId) && a.status === "ABSENT",
    ).length;
    const primaryParent = student.parents.find((p) => p.isPrimary) ?? student.parents[0];
    return {
      "Last name": student.lastName,
      "First name": student.firstName,
      Grade: student.gradeLevel,
      DOB: student.dateOfBirth ? student.dateOfBirth.toISOString().slice(0, 10) : "",
      "Parent / guardian": primaryParent?.user.name ?? "",
      "Parent email": primaryParent?.user.email ?? "",
      "Parent phone": primaryParent?.user.phone ?? "",
      Present: present,
      Absent: absent,
      "Sessions held": totalSessions,
      "Attendance %": totalSessions
        ? Math.round((present / totalSessions) * 100)
        : 0,
      Sacraments: student.sacraments
        .map((s) => `${s.sacramentType}:${s.status}`)
        .join("; "),
    };
  });

  const wb = XLSX.utils.book_new();
  const rosterSheet = XLSX.utils.json_to_sheet(rosterRows);
  XLSX.utils.book_append_sheet(wb, rosterSheet, "Roster");

  const sessionRows = cls.sessions.map((s) => ({
    Date: s.date.toISOString().slice(0, 10),
    Topic: s.topic ?? "",
    Notes: s.notes ?? "",
  }));
  if (sessionRows.length) {
    const sessionSheet = XLSX.utils.json_to_sheet(sessionRows);
    XLSX.utils.book_append_sheet(wb, sessionSheet, "Sessions");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  await recordAudit({
    actorId: userId,
    action: "class.export",
    entityType: "Class",
    entityId: id,
    metadata: { rosterCount: rosterRows.length, sessions: sessionRows.length },
  });

  const safeName = cls.name.replace(/[^\w-]+/g, "_").slice(0, 60);
  const filename = `${safeName}_roster_${cls.academicYear}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
