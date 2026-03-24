import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonSchema = z.object({
  lessonNumber: z.number().int().positive(),
  title: z.string().min(1),
  objective: z.string().optional().nullable(),
  scriptureRef: z.string().optional().nullable(),
  cccParagraphs: z.string().optional().nullable(),
  materials: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  prayerFocus: z.string().optional().nullable(),
  takeHome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { unitId } = await params;

  const lessons = await prisma.lesson.findMany({
    where: { unitId },
    orderBy: { lessonNumber: "asc" },
  });

  return NextResponse.json(lessons);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { unitId } = await params;
  const body = await req.json();
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const lesson = await prisma.lesson.create({
    data: {
      unitId,
      lessonNumber: parsed.data.lessonNumber,
      title: parsed.data.title,
      objective: parsed.data.objective,
      scriptureRef: parsed.data.scriptureRef,
      cccParagraphs: parsed.data.cccParagraphs,
      materials: JSON.stringify(parsed.data.materials ?? []),
      activities: JSON.stringify(parsed.data.activities ?? []),
      prayerFocus: parsed.data.prayerFocus,
      takeHome: parsed.data.takeHome,
      notes: parsed.data.notes,
      durationMinutes: parsed.data.durationMinutes ?? 60,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
