/**
 * GET /api/dashboard/summary
 *
 * Single-call parish-ops snapshot for the director dashboard:
 *   - active students enrolled this year
 *   - class count + average attendance rate (last 30 days)
 *   - sacrament prep progress (per-track in-progress / complete counts)
 *   - top 5 absent students this month (intervention list)
 *   - upcoming sessions (next 7 days)
 *   - announcements published this week
 *
 * Director-facing — admin-only. Replaces 5 separate fetches the
 * dashboard was issuing on every refresh.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const today = startOfDay(now);
  const last30 = new Date(now.getTime() - 30 * 86_400_000);
  const last7Start = startOfDay(new Date(now.getTime() - 7 * 86_400_000));
  const next7End = new Date(today.getTime() + 7 * 86_400_000);

  const [
    activeStudents,
    classCount,
    attendanceRecent,
    sacramentStatuses,
    absentByStudent,
    upcomingSessions,
    recentAnnouncements,
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.class.count({ where: { active: true } }),
    prisma.attendanceRecord.findMany({
      where: { createdAt: { gte: last30 } },
      select: { status: true },
    }),
    prisma.sacramentRecord.groupBy({
      by: ["sacramentType", "status"],
      _count: true,
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: last30 }, status: "ABSENT" },
      _count: true,
      orderBy: { _count: { studentId: "desc" } },
      take: 5,
    }),
    prisma.classSession.findMany({
      where: { date: { gte: today, lte: next7End } },
      orderBy: { date: "asc" },
      take: 20,
      select: {
        id: true, date: true,
        class: { select: { id: true, name: true } },
      },
    }),
    prisma.announcement.count({
      where: { publishedAt: { gte: last7Start } },
    }),
  ]);

  const present = (attendanceRecent as Array<{ status: string }>).filter((r) => r.status === "PRESENT").length;
  const attendanceRate =
    attendanceRecent.length > 0 ? present / attendanceRecent.length : null;

  // Bucket sacrament rows by type → status → count.
  const sacramentByTrack: Record<string, Record<string, number>> = {};
  for (const row of sacramentStatuses as Array<{ sacramentType: string; status: string; _count: number }>) {
    const t = row.sacramentType;
    sacramentByTrack[t] = sacramentByTrack[t] ?? {};
    sacramentByTrack[t][row.status] = (row._count as unknown as number) ?? 0;
  }

  // Hydrate names for the top-5 absent students.
  const absentDetail: Array<{ studentId: string; name: string; absences: number }> = [];
  if (absentByStudent.length > 0) {
    const ids = (absentByStudent as Array<{ studentId: string }>).map((r) => r.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameById = new Map<string, string>(
      (students as Array<{ id: string; firstName: string; lastName: string }>).map(
        (s) => [s.id, `${s.firstName} ${s.lastName}`],
      ),
    );
    for (const row of absentByStudent) {
      absentDetail.push({
        studentId: row.studentId,
        name: nameById.get(row.studentId) ?? "(unknown)",
        absences: (row._count as unknown as number) ?? 0,
      });
    }
  }

  return NextResponse.json(
    {
      asOf: now.toISOString(),
      enrollment: {
        activeStudents,
        activeClasses: classCount,
      },
      attendance: {
        last30Records: attendanceRecent.length,
        presentRate: attendanceRate,
        topAbsent: absentDetail,
      },
      sacraments: {
        byTrack: sacramentByTrack,
      },
      schedule: {
        upcomingSessions: (upcomingSessions as Array<{ id: string; date: Date; class: { id: string; name: string } }>).map((s) => ({
          sessionId: s.id,
          classId: s.class.id,
          className: s.class.name,
          date: s.date.toISOString(),
        })),
      },
      announcements: {
        publishedLast7Days: recentAnnouncements,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
