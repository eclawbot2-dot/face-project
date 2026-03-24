import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonUpdateSchema = z.object({
  title: z.string().min(1).optional(),
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
  { params }: { params: Promise<{ unitId: string; lessonId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: true },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string; lessonId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId } = await params;
  const body = await req.json();
  const parsed = lessonUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.materials !== undefined) {
    updateData.materials = JSON.stringify(parsed.data.materials);
  }
  if (parsed.data.activities !== undefined) {
    updateData.activities = JSON.stringify(parsed.data.activities);
  }

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: updateData,
  });

  return NextResponse.json(lesson);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ unitId: string; lessonId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId } = await params;
  await prisma.lesson.delete({ where: { id: lessonId } });
  return new NextResponse(null, { status: 204 });
}
