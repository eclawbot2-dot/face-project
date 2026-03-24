import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unitSchema = z.object({
  gradeLevel: z.string(),
  program: z.string().min(1),
  unitNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  cccReference: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade");
  const program = searchParams.get("program");

  const units = await prisma.curriculumUnit.findMany({
    where: {
      ...(grade && { gradeLevel: grade as any }),
      ...(program && { program }),
    },
    include: {
      lessons: {
        orderBy: { lessonNumber: "asc" },
        select: {
          id: true,
          lessonNumber: true,
          title: true,
          objective: true,
          scriptureRef: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { unitNumber: "asc" }],
  });

  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const unit = await prisma.curriculumUnit.create({
    data: {
      gradeLevel: parsed.data.gradeLevel as any,
      program: parsed.data.program,
      unitNumber: parsed.data.unitNumber,
      title: parsed.data.title,
      description: parsed.data.description,
      cccReference: parsed.data.cccReference,
    },
  });

  return NextResponse.json(unit, { status: 201 });
}
