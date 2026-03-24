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
  const { catechistId, isPrimary } = await req.json();

  const assignment = await prisma.classCatechist.upsert({
    where: { classId_catechistId: { classId, catechistId } },
    create: { classId, catechistId, isPrimary: isPrimary ?? false },
    update: { isPrimary: isPrimary ?? false },
  });

  return NextResponse.json(assignment, { status: 201 });
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
  const catechistId = searchParams.get("catechistId") ?? "";

  await prisma.classCatechist.deleteMany({ where: { classId, catechistId } });
  return NextResponse.json({ success: true });
}
