import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [students, catechists, classes, events, recentAnnouncements] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.catechist.count({ where: { user: { active: true } } }),
    prisma.class.count({ where: { active: true } }),
    prisma.event.findMany({
      where: { startDate: { gte: now, lte: thirtyDays } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Attendance rate (last 30 sessions)
  const recentSessions = await prisma.classSession.findMany({
    where: { date: { lte: now } },
    include: { attendance: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  let totalRecords = 0;
  let presentRecords = 0;
  for (const s of recentSessions) {
    totalRecords += s.attendance.length;
    presentRecords += s.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  }

  const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  return NextResponse.json({
    stats: { students, catechists, classes, attendanceRate },
    upcomingEvents: events,
    recentAnnouncements,
  });
}
