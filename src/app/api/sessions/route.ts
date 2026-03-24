import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const sessions = await prisma.classSession.findMany({
    where: classId ? { classId } : {},
    include: {
      class: true,
      attendance: { include: { student: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { classId, date, topic, notes } = body;

  const classSession = await prisma.classSession.create({
    data: {
      classId,
      date: new Date(date),
      topic,
      notes,
    },
  });

  return NextResponse.json(classSession, { status: 201 });
}
