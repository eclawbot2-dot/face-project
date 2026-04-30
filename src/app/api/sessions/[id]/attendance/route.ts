import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { notifyAttendanceAbsent } from "@/lib/notifications";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "EXCUSED", "LATE"] as const;

const RecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES),
  notes: z.string().max(500).optional().nullable(),
});

const PostSchema = z.object({
  records: z.array(RecordSchema).min(1).max(500),
});

const PatchSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(ATTENDANCE_STATUSES),
  notes: z.string().max(500).optional().nullable(),
});

async function authorize(req: NextRequest, sessionId: string) {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || !["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // Catechists can only mutate attendance for sessions in classes they teach.
  if (role === "CATECHIST") {
    const cs = await prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { class: { select: { catechists: { where: { catechist: { userId } }, select: { id: true } } } } },
    });
    if (!cs || cs.class.catechists.length === 0) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { userId, role };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    include: { student: true },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const authz = await authorize(req, sessionId);
  if ("error" in authz) return authz.error;

  const parsed = PostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const upserts = await prisma.$transaction(
    parsed.data.records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        create: {
          sessionId,
          studentId: r.studentId,
          status: r.status,
          notes: r.notes ?? null,
        },
        update: { status: r.status, notes: r.notes ?? null },
      }),
    ),
  );

  await recordAudit({
    actorId: authz.userId,
    action: "attendance.upsert",
    entityType: "ClassSession",
    entityId: sessionId,
    metadata: { count: upserts.length },
  });

  // Fire absence notifications for any newly-absent students. Best-effort
  // and non-blocking — the response returns immediately whether or not the
  // SMTP transport accepts. If SMTP isn't configured the notification is
  // recorded in AuditLog so directors can audit what would have gone out.
  void fireAbsenceNotifications(sessionId, parsed.data.records).catch((err) => {
    console.error("[attendance] absence notification dispatch failed", err);
  });

  return NextResponse.json(upserts);
}

async function fireAbsenceNotifications(
  sessionId: string,
  records: Array<{ studentId: string; status: string }>,
) {
  const absent = records.filter((r) => r.status === "ABSENT");
  if (absent.length === 0) return;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { date: true, class: { select: { name: true } } },
  });
  if (!session) return;

  const studentIds = absent.map((r) => r.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { parents: { include: { user: true } } },
  });

  for (const student of students) {
    const primary = student.parents.find((p) => p.isPrimary) ?? student.parents[0];
    if (!primary?.user.email) continue;
    await notifyAttendanceAbsent({
      parentEmail: primary.user.email,
      parentName: primary.user.name,
      studentName: `${student.firstName} ${student.lastName}`,
      className: session.class.name,
      sessionDate: session.date,
    });
  }
}

// Bulk apply a single status to many students in one call. Useful for
// "mark all present" or "mark these 3 absent" workflows on mobile.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const authz = await authorize(req, sessionId);
  if ("error" in authz) return authz.error;

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const { studentIds, status, notes } = parsed.data;

  const upserts = await prisma.$transaction(
    studentIds.map((studentId) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        create: { sessionId, studentId, status, notes: notes ?? null },
        update: { status, notes: notes ?? null },
      }),
    ),
  );

  if (status === "ABSENT") {
    void fireAbsenceNotifications(
      sessionId,
      studentIds.map((id) => ({ studentId: id, status: "ABSENT" })),
    ).catch((err) => console.error("[attendance] bulk absence notification failed", err));
  }

  await recordAudit({
    actorId: authz.userId,
    action: "attendance.bulk-set",
    entityType: "ClassSession",
    entityId: sessionId,
    metadata: { count: upserts.length, status },
  });

  return NextResponse.json({ updated: upserts.length });
}
