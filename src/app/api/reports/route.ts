import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "enrollment";

  if (type === "enrollment") {
    const classes = await prisma.class.findMany({
      where: { active: true },
      include: {
        enrollments: { where: { active: true } },
        catechists: { include: { catechist: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: [{ gradeLevel: "asc" }],
    });

    return NextResponse.json(classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      program: c.program,
      enrolled: c.enrollments.length,
      catechists: c.catechists.map((cc) => cc.catechist.user.name),
    })));
  }

  if (type === "attendance") {
    const sessions = await prisma.classSession.findMany({
      include: {
        class: true,
        attendance: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json(sessions.map((s) => {
      const total = s.attendance.length;
      const present = s.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      return {
        sessionId: s.id,
        className: s.class.name,
        date: s.date,
        total,
        present,
        absent: total - present,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }));
  }

  if (type === "sacraments") {
    const sacraments = await prisma.sacramentRecord.findMany({
      include: { student: true },
      orderBy: [{ sacramentType: "asc" }, { status: "asc" }],
    });

    const grouped: Record<string, { type: string; total: number; completed: number; inProgress: number; notStarted: number }> = {};
    for (const s of sacraments) {
      if (!grouped[s.sacramentType]) {
        grouped[s.sacramentType] = { type: s.sacramentType, total: 0, completed: 0, inProgress: 0, notStarted: 0 };
      }
      grouped[s.sacramentType].total++;
      if (s.status === "COMPLETED") grouped[s.sacramentType].completed++;
      else if (s.status === "IN_PROGRESS") grouped[s.sacramentType].inProgress++;
      else grouped[s.sacramentType].notStarted++;
    }

    return NextResponse.json(Object.values(grouped));
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
