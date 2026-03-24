import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: classId } = await params;
  const { studentId } = await req.json();

  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId, classId } },
    create: { studentId, classId, active: true },
    update: { active: true },
  });

  return NextResponse.json(enrollment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: classId } = await params;
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? "";

  await prisma.enrollment.updateMany({
    where: { classId, studentId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
