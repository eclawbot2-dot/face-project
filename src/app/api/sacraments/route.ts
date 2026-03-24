import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const sacramentType = searchParams.get("type");

  const records = await prisma.sacramentRecord.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(sacramentType && { sacramentType }),
    },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { studentId, sacramentType, status, startDate, completionDate, notes, milestones } = body;

  const record = await prisma.sacramentRecord.upsert({
    where: { studentId_sacramentType: { studentId, sacramentType } },
    create: {
      studentId,
      sacramentType,
      status: status ?? "NOT_STARTED",
      startDate: startDate ? new Date(startDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      notes,
      milestones: JSON.stringify(milestones ?? []),
    },
    update: {
      status: status ?? "NOT_STARTED",
      startDate: startDate ? new Date(startDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      notes,
      milestones: JSON.stringify(milestones ?? []),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
