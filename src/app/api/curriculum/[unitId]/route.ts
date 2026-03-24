import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unitUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  cccReference: z.string().optional().nullable(),
  program: z.string().min(1).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { unitId } = await params;

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      lessons: { orderBy: { lessonNumber: "asc" } },
    },
  });

  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(unit);
}

export async function PUT(
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
  const parsed = unitUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const unit = await prisma.curriculumUnit.update({
    where: { id: unitId },
    data: parsed.data,
  });

  return NextResponse.json(unit);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { unitId } = await params;

  await prisma.curriculumUnit.delete({ where: { id: unitId } });
  return new NextResponse(null, { status: 204 });
}
