import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";

const studentSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  dateOfBirth: z.string().optional().nullable(),
  gradeLevel: z.string().min(1).max(40),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const querySchema = z.object({
  search: z.string().max(120).optional(),
  grade: z.string().max(40).optional(),
  active: z.enum(["true", "false", "all"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const HARD_CAP = 500;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const userId = (session.user as { id?: string })?.id;
  if (!["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const { search = "", grade = "", active: activeParam, page, limit } = parsed.data;

  let catechistStudentFilter = {};
  if (role === "CATECHIST") {
    const catechist = await prisma.catechist.findUnique({ where: { userId } });
    if (!catechist) return NextResponse.json([]);
    const assignedClasses = await prisma.classCatechist.findMany({
      where: { catechistId: catechist.id },
      select: { classId: true },
    });
    const classIds = assignedClasses.map((c) => c.classId);
    catechistStudentFilter = {
      enrollments: { some: { classId: { in: classIds }, active: true } },
    };
  }

  let activeFilter: boolean | undefined = true;
  if (activeParam === "false") activeFilter = false;
  else if (activeParam === "all") activeFilter = undefined;

  const where = {
    ...(activeFilter !== undefined ? { active: activeFilter } : {}),
    ...catechistStudentFilter,
    ...(search && {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ],
    }),
    ...(grade && { gradeLevel: grade as never }),
  };

  const include = {
    parents: { include: { user: { select: { name: true, email: true, phone: true } } } },
    enrollments: { include: { class: true }, where: { active: true } },
    sacraments: true,
  };
  const orderBy = [{ lastName: "asc" }, { firstName: "asc" }] as const;

  // If page/limit are provided, return a paginated payload.
  if (page !== undefined || limit !== undefined) {
    const p = page ?? 1;
    const l = Math.min(limit ?? 50, 200);
    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include,
        orderBy: [...orderBy],
        skip: (p - 1) * l,
        take: l,
      }),
      prisma.student.count({ where }),
    ]);
    return NextResponse.json({ items, total, page: p, limit: l });
  }

  // Backwards-compatible unpaged response, capped to prevent OOM on large rosters.
  const students = await prisma.student.findMany({
    where,
    include,
    orderBy: [...orderBy],
    take: HARD_CAP,
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const userId = (session.user as { id?: string })?.id;
  if (!userId || !["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const student = await prisma.student.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      gradeLevel: parsed.data.gradeLevel as never,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  await recordAudit({
    actorId: userId,
    action: "student.create",
    entityType: "Student",
    entityId: student.id,
    after: student,
  });

  return NextResponse.json(student, { status: 201 });
}
