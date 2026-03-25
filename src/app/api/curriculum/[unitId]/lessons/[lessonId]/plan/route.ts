import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string; lessonId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { unitId, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: true,
    },
  });

  if (!lesson || lesson.unitId !== unitId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let plan = null;
  try {
    if (lesson.lessonPlan) {
      plan = JSON.parse(lesson.lessonPlan);
    }
  } catch {}

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      scriptureRef: lesson.scriptureRef,
      cccParagraphs: lesson.cccParagraphs,
      materials: JSON.parse(lesson.materials || "[]"),
      activities: JSON.parse(lesson.activities || "[]"),
      prayerFocus: lesson.prayerFocus,
      takeHome: lesson.takeHome,
      durationMinutes: lesson.durationMinutes,
      notes: lesson.notes,
    },
    unit: {
      id: lesson.unit.id,
      title: lesson.unit.title,
      gradeLevel: lesson.unit.gradeLevel,
      program: lesson.unit.program,
    },
    plan,
  });
}
