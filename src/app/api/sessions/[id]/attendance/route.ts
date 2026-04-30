import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

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

  return NextResponse.json(upserts);
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

  await recordAudit({
    actorId: authz.userId,
    action: "attendance.bulk-set",
    entityType: "ClassSession",
    entityId: sessionId,
    metadata: { count: upserts.length, status },
  });

  return NextResponse.json({ updated: upserts.length });
}
