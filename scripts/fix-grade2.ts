import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const unit = await prisma.curriculumUnit.findFirst({
    where: { gradeLevel: "GRADE_2", title: "The Sacraments of Initiation" },
    include: { lessons: { orderBy: { lessonNumber: "desc" }, take: 1 } },
  });
  if (unit) {
    const nextNum = (unit.lessons[0]?.lessonNumber ?? 0) + 1;
    await prisma.lesson.create({
      data: {
        unitId: unit.id, lessonNumber: nextNum,
        title: "We Are Part of the Body of Christ",
        objective: "Understand that through Baptism we become part of the Church, the Body of Christ",
        scriptureRef: "1 Corinthians 12:12-27",
        cccParagraphs: "CCC 787-795",
        materials: JSON.stringify(["Christ Our Life Gr. 2", "Body of Christ puzzle", "Church community pictures"]),
        activities: JSON.stringify(["Body of Christ puzzle activity", "Each part is important discussion", "How we serve the Church brainstorm"]),
        prayerFocus: "We are the Body of Christ prayer",
        takeHome: "Identify one way you serve the Body of Christ",
        durationMinutes: 60,
      },
    });
    console.log("Added 1 lesson to Grade 2");
  }
  const count = await prisma.lesson.count({ where: { unit: { gradeLevel: "GRADE_2" } } });
  console.log(`Grade 2 total: ${count}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
