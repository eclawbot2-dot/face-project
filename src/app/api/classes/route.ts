import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade");
  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;

  // Catechists only see their assigned classes
  let catechistFilter = {};
  if (role === "CATECHIST") {
    const catechist = await prisma.catechist.findUnique({ where: { userId } });
    if (!catechist) return NextResponse.json([]);
    catechistFilter = { catechists: { some: { catechistId: catechist.id } } };
  }

  const classes = await prisma.class.findMany({
    where: {
      active: true,
      ...(grade && { gradeLevel: grade as any }),
      ...catechistFilter,
    },
    include: {
      catechists: { include: { catechist: { include: { user: { select: { name: true, email: true } } } } } },
      enrollments: { where: { active: true }, include: { student: true } },
      sessions: { orderBy: { date: "desc" }, take: 5 },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, gradeLevel, program, description, room, dayOfWeek, startTime, endTime, academicYear } = body;

  const cls = await prisma.class.create({
    data: {
      name,
      gradeLevel,
      program,
      description,
      room,
      dayOfWeek,
      startTime,
      endTime,
      academicYear: academicYear ?? "2024-2025",
    },
  });

  return NextResponse.json(cls, { status: 201 });
}
