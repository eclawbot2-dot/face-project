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
  const classId = searchParams.get("classId");
  const format = searchParams.get("format") ?? "json"; // json or csv
  const yearStr = searchParams.get("year") ?? new Date().getFullYear().toString();

  const yearStart = new Date(`${yearStr}-01-01T00:00:00`);
  const yearEnd = new Date(`${parseInt(yearStr) + 1}-01-01T00:00:00`);

  // Get classes (filtered or all)
  const classFilter = classId ? { id: classId } : { active: true };
  const classes = await prisma.class.findMany({
    where: classFilter,
    include: {
      enrollments: {
        where: { active: true },
        include: { student: true },
      },
      sessions: {
        where: { date: { gte: yearStart, lt: yearEnd } },
        include: {
          attendance: true,
        },
        orderBy: { date: "asc" },
      },
      catechists: {
        include: { catechist: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  // Build report data per class
  const report = classes.map((cls) => {
    const totalSessions = cls.sessions.length;
    const sessionDates = cls.sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split("T")[0],
      dateFormatted: s.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    const students = cls.enrollments.map((e) => {
      const student = e.student;

      // Build attendance per session
      const sessionRecords: Record<string, string> = {};
      let presentCount = 0;
      let absentCount = 0;
      let excusedCount = 0;
      let lateCount = 0;
      let totalRecorded = 0;

      for (const sess of cls.sessions) {
        const record = sess.attendance.find((a) => a.studentId === student.id);
        const status = record?.status ?? "N/R"; // Not Recorded
        sessionRecords[sess.id] = status;

        if (record) {
          totalRecorded++;
          if (status === "PRESENT") presentCount++;
          else if (status === "ABSENT") absentCount++;
          else if (status === "EXCUSED") excusedCount++;
          else if (status === "LATE") lateCount++;
        }
      }

      const attendanceRate = totalRecorded > 0
        ? Math.round(((presentCount + lateCount) / totalRecorded) * 100)
        : null;

      return {
        id: student.id,
        name: `${student.lastName}, ${student.firstName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        gradeLevel: student.gradeLevel,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        late: lateCount,
        totalRecorded,
        totalSessions,
        attendanceRate,
        sessionRecords,
      };
    });

    // Sort students by last name
    students.sort((a, b) => a.lastName.localeCompare(b.lastName));

    // Class-level summary
    const classTotalPresent = students.reduce((sum, s) => sum + s.present + s.late, 0);
    const classTotalRecorded = students.reduce((sum, s) => sum + s.totalRecorded, 0);
    const classAvgRate = classTotalRecorded > 0
      ? Math.round((classTotalPresent / classTotalRecorded) * 100)
      : null;

    return {
      classId: cls.id,
      className: cls.name,
      program: cls.program,
      gradeLevel: cls.gradeLevel,
      academicYear: cls.academicYear,
      catechists: cls.catechists.map((cc) => cc.catechist.user.name),
      totalSessions,
      totalStudents: students.length,
      avgAttendanceRate: classAvgRate,
      sessionDates,
      students,
      year: yearStr,
    };
  });

  // CSV export
  if (format === "csv") {
    let csv = "";

    for (const cls of report) {
      csv += `"${cls.className} — ${cls.program} — ${cls.academicYear}"\n`;
      csv += `"Catechist(s): ${cls.catechists.join(', ')}"\n`;
      csv += `"Total Sessions: ${cls.totalSessions} | Avg Attendance: ${cls.avgAttendanceRate ?? 'N/A'}%"\n`;
      csv += `"Year: ${cls.year}"\n\n`;

      // Header row
      const headers = ["Student Name", ...cls.sessionDates.map((d) => d.dateFormatted), "Present", "Absent", "Tardy", "Rate"];
      csv += headers.map((h) => `"${h}"`).join(",") + "\n";

      // Student rows
      for (const student of cls.students) {
        const sessionCols = cls.sessionDates.map((d) => {
          const status = student.sessionRecords[d.id] ?? "N/R";
          const shortStatus: Record<string, string> = {
            PRESENT: "P",
            ABSENT: "A",
            LATE: "T",
            "N/R": "-",
          };
          return shortStatus[status] ?? status;
        });

        const row = [
          student.name,
          ...sessionCols,
          student.present.toString(),
          student.absent.toString(),
          student.late.toString(),
          student.attendanceRate !== null ? `${student.attendanceRate}%` : "N/A",
        ];
        csv += row.map((c) => `"${c}"`).join(",") + "\n";
      }

      csv += "\n\n"; // Blank lines between classes
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Holy_Face_Attendance_${yearStr}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
