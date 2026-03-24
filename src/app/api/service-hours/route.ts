import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const serviceHourSchema = z.object({
  studentId: z.string().min(1),
  date: z.string(),
  hours: z.number().positive(),
  description: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const hours = await prisma.serviceHour.findMany({
    where: {
      ...(studentId && { studentId }),
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, gradeLevel: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(hours);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = serviceHourSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const serviceHour = await prisma.serviceHour.create({
    data: {
      studentId: parsed.data.studentId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      description: parsed.data.description,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(serviceHour, { status: 201 });
}
