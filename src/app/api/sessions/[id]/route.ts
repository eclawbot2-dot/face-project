import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const classSession = await prisma.classSession.findUnique({
    where: { id },
    include: {
      class: true,
      attendance: { include: { student: true } },
    },
  });

  if (!classSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(classSession);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const classSession = await prisma.classSession.update({
    where: { id },
    data: {
      topic: body.topic,
      notes: body.notes,
      date: body.date ? new Date(body.date) : undefined,
    },
  });

  return NextResponse.json(classSession);
}
