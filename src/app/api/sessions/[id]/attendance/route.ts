import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    include: { student: true },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const body = await req.json();
  const { records } = body as { records: { studentId: string; status: string; notes?: string }[] };

  const upserts = await Promise.all(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        create: { sessionId, studentId: r.studentId, status: r.status as any, notes: r.notes },
        update: { status: r.status as any, notes: r.notes },
      })
    )
  );

  return NextResponse.json(upserts);
}
