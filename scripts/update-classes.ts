import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Updating classes to Sheila's spec...\n");

  // First, remove all existing class-catechist assignments, enrollments, sessions
  await prisma.attendanceRecord.deleteMany({});
  await prisma.classSession.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.classCatechist.deleteMany({});
  await prisma.class.deleteMany({});
  console.log("Cleared old classes and related data.\n");

  const classes = [
    { name: "Pre-K", gradeLevel: "PRE_K", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:00" },
    { name: "Kindergarten", gradeLevel: "KINDERGARTEN", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:00" },
    { name: "1st Grade", gradeLevel: "GRADE_1", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "2nd Grade", gradeLevel: "GRADE_2", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:30" },
    { name: "2nd Grade LFS", gradeLevel: "GRADE_2", program: "Liturgy of the Word for Children (LFS)", room: "", dayOfWeek: "Sunday", startTime: "11:30", endTime: "12:30" },
    { name: "3rd Grade", gradeLevel: "GRADE_3", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "4th Grade", gradeLevel: "GRADE_4", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "5th Grade", gradeLevel: "GRADE_5", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "6th Grade", gradeLevel: "GRADE_6", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "7th Grade", gradeLevel: "GRADE_7", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "8th Grade", gradeLevel: "GRADE_8", program: "Faith Formation", room: "", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "8th Grade LFS", gradeLevel: "GRADE_8", program: "Liturgy of the Word for Children (LFS)", room: "", dayOfWeek: "Sunday", startTime: "11:30", endTime: "12:30" },
  ];

  for (const cls of classes) {
    const created = await prisma.class.create({
      data: {
        ...cls,
        gradeLevel: cls.gradeLevel as any,
        academicYear: "2025-2026",
        active: true,
      },
    });
    console.log(`  Created: ${created.name} (${cls.program})`);
  }

  console.log(`\nDone! ${classes.length} classes created.`);
  console.log("\nClasses:");
  classes.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}${c.program !== "Faith Formation" ? ` — ${c.program}` : ""}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
