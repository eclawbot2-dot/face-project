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

  const { id: studentId } = await params;
  const { parentUserId, relationship } = await req.json();

  const record = await prisma.studentParent.upsert({
    where: { studentId_userId: { studentId, userId: parentUserId } },
    create: { studentId, userId: parentUserId, relationship: relationship ?? "Parent" },
    update: { relationship: relationship ?? "Parent" },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const { searchParams } = new URL(req.url);
  const parentUserId = searchParams.get("parentUserId") ?? "";

  await prisma.studentParent.deleteMany({
    where: { studentId, userId: parentUserId },
  });

  return NextResponse.json({ success: true });
}
