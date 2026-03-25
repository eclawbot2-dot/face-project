import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

// Additional lessons to bring each grade to exactly 24
const additions: Record<string, { unitTitle: string; lessons: { title: string; objective: string; scriptureRef: string; cccParagraphs: string; materials: string; activities: string; prayerFocus: string; takeHome: string }[] }[]> = {
  KINDERGARTEN: [
    { unitTitle: "God Made the World", lessons: [
      { title: "God Made Day and Night", objective: "Know God created day for work and night for rest", scriptureRef: "Genesis 1:3-5", cccParagraphs: "CCC 296-298", materials: '["Christ Our Life K","Sun/moon craft","Yellow/black paper"]', activities: '["Day and night sorting game","Sun and moon craft","Bedtime prayer practice"]', prayerFocus: "Now I lay me down to sleep", takeHome: "Say a bedtime prayer and a morning prayer every day" },
    ]},
    { unitTitle: "Jesus Is Always with Us", lessons: [
      { title: "We Go to Church on Sunday", objective: "Understand why Catholics go to Mass every Sunday", scriptureRef: "Hebrews 10:25", cccParagraphs: "CCC 2177-2183", materials: '["Christ Our Life K","Church picture","Sunday best discussion"]', activities: '["What we do at church discussion","Church quiet practice","Sunday ritual drawing"]', prayerFocus: "Thank you God for our church", takeHome: "Draw a picture of what you see at Mass on Sunday" },
      { title: "Holy Water Reminds Us of Baptism", objective: "Connect holy water to our Baptism", scriptureRef: "Ezekiel 36:25", cccParagraphs: "CCC 1217-1222", materials: '["Christ Our Life K","Holy water font","Water blessing"]', activities: '["Holy water sign of cross practice","Water blessing demonstration","Baptism connection discussion"]', prayerFocus: "Sign of the Cross with holy water", takeHome: "Bless yourself with holy water when you enter church on Sunday" },
    ]},
  ],
  GRADE_2: [
    { unitTitle: "God's Wonderful Plan", lessons: [
      { title: "God Made Us for Heaven", objective: "Know that God wants us to be with Him in heaven forever", scriptureRef: "John 14:2-3", cccParagraphs: "CCC 1023-1029", materials: '["Christ Our Life Gr. 2","Ch. 3b","Heaven discussion","Cloud craft"]', activities: '["What is heaven discussion","Mansion in heaven craft","Heavenly goal-setting"]', prayerFocus: "Eternal rest prayer", takeHome: "Talk with your family about what heaven might be like" },
    ]},
    { unitTitle: "The Sacraments of Initiation", lessons: [
      { title: "The Holy Spirit Helps Us", objective: "Know the Holy Spirit guides us to make good choices", scriptureRef: "John 14:26", cccParagraphs: "CCC 1830-1832", materials: '["Christ Our Life Gr. 2","Flame craft","Wind sounds"]', activities: '["Holy Spirit as helper discussion","Flame craft","Good choices scenarios"]', prayerFocus: "Come Holy Spirit, guide me", takeHome: "Ask the Holy Spirit for help when you need to make a choice" },
    ]},
    { unitTitle: "The Mass and the Eucharist", lessons: [
      { title: "We Say Thank You at Mass", objective: "Understand Eucharist means thanksgiving", scriptureRef: "1 Thessalonians 5:18", cccParagraphs: "CCC 1360", materials: '["Christ Our Life Gr. 2","Thank you cards","Gratitude list"]', activities: '["Eucharist = thanksgiving lesson","Gratitude list making","Thank you card for priest"]', prayerFocus: "Thank you Jesus for everything", takeHome: "Say thank you to 5 people this week" },
    ]},
    { unitTitle: "Living as God's Children", lessons: [
      { title: "We Are Called to Forgive", objective: "Learn that Jesus calls us to forgive others as God forgives us", scriptureRef: "Matthew 18:21-22", cccParagraphs: "CCC 2838-2845", materials: '["Christ Our Life Gr. 2","Forgiveness scenarios","Heart mending craft"]', activities: '["70 times 7 discussion","Torn heart mending activity","Forgiveness role plays"]', prayerFocus: "Lord, help me forgive", takeHome: "Forgive someone who has hurt your feelings" },
      { title: "The Holy Family — Our Model", objective: "See the Holy Family as a model for our families", scriptureRef: "Luke 2:39-40, 51-52", cccParagraphs: "CCC 531-534", materials: '["Christ Our Life Gr. 2","Holy Family picture","Family prayer card"]', activities: '["Holy Family story","What makes a holy family discussion","Family prayer card making"]', prayerFocus: "Holy Family, pray for our family", takeHome: "Pray together as a family this week" },
    ]},
  ],
  GRADE_6: [
    { unitTitle: "Beatitudes and Social Teaching", lessons: [
      { title: "Solidarity — We Are One Human Family", objective: "Understand solidarity as a key principle of Catholic Social Teaching", scriptureRef: "1 Corinthians 12:26", cccParagraphs: "CCC 1939-1942", materials: '["Christ Our Life Gr. 6","Ch. 18b","Global solidarity stories","World map"]', activities: '["Global solidarity discussion","One human family activity","Solidarity project planning"]', prayerFocus: "Prayer for unity among all peoples", takeHome: "Learn about a culture different from yours and find common ground" },
    ]},
    { unitTitle: "Prayer and Spiritual Growth", lessons: [
      { title: "The Examen — Reviewing Your Day with God", objective: "Practice the Daily Examen as a tool for spiritual growth", scriptureRef: "Psalm 139:23-24", cccParagraphs: "CCC 2699", materials: '["Christ Our Life Gr. 6","Examen guide","Journal"]', activities: '["Examen walkthrough","Guided Examen practice","Examen journaling"]', prayerFocus: "Daily Examen", takeHome: "Practice the Examen every night for one week" },
      { title: "Spiritual Direction and Growth", objective: "Understand the value of spiritual guidance and accountability", scriptureRef: "Proverbs 11:14", cccParagraphs: "CCC 2690", materials: '["Christ Our Life Gr. 6","Spiritual growth assessment","Growth plan"]', activities: '["Spiritual maturity discussion","Personal growth assessment","Growth goal setting"]', prayerFocus: "Lord, help me grow in holiness", takeHome: "Set 3 spiritual growth goals for the next month" },
      { title: "Year Review — We Live!", objective: "Review the year's moral and spiritual formation", scriptureRef: "Micah 6:8", cccParagraphs: "CCC review", materials: '["Review materials","Certificates","Celebration snacks"]', activities: '["Year review game","Personal testimony sharing","Commissioning prayer service"]', prayerFocus: "Prayer of St. Ignatius (Suscipe)", takeHome: "Share 3 things you learned about living your faith" },
    ]},
  ],
  GRADE_8: [
    { unitTitle: "Church History — The Early Church", lessons: [
      { title: "The Councils — Defining Our Faith", objective: "Learn how ecumenical councils defined Catholic doctrine", scriptureRef: "Acts 15:1-29", cccParagraphs: "CCC 884-887", materials: '["Christ Our Life Gr. 8","Ch. 3b","Council timeline","Creed development"]', activities: '["Council of Nicaea study","Creed development timeline","Heresy vs orthodoxy discussion"]', prayerFocus: "Nicene Creed (pray meditatively)", takeHome: "Research the Council of Nicaea and its significance" },
    ]},
    { unitTitle: "Confirmed in the Spirit — Discipleship", lessons: [
      { title: "The Sacrament of Confirmation — Final Review", objective: "Comprehensive review of Confirmation theology and preparation", scriptureRef: "Acts 8:14-17; CCC 1285-1321", cccParagraphs: "CCC 1285-1321", materials: '["Confirmed in the Spirit review","Study guide","Practice questions"]', activities: '["Confirmation theology review","Sponsor final meeting","Prayer and fasting before Confirmation"]', prayerFocus: "Veni Sancte Spiritus", takeHome: "Fast and pray the day before your Confirmation" },
    ]},
  ],
};

async function main() {
  console.log("Adding missing lessons to reach 24 per grade...\n");

  for (const [gradeLevel, unitAdditions] of Object.entries(additions)) {
    for (const ua of unitAdditions) {
      // Find the unit
      const unit = await prisma.curriculumUnit.findFirst({
        where: { gradeLevel: gradeLevel as any, title: ua.unitTitle },
        include: { lessons: { orderBy: { lessonNumber: "desc" }, take: 1 } },
      });

      if (!unit) {
        console.log(`  WARNING: Unit "${ua.unitTitle}" not found for ${gradeLevel}`);
        continue;
      }

      const startNum = (unit.lessons[0]?.lessonNumber ?? 0) + 1;

      for (let i = 0; i < ua.lessons.length; i++) {
        const l = ua.lessons[i];
        await prisma.lesson.create({
          data: {
            unitId: unit.id,
            lessonNumber: startNum + i,
            title: l.title,
            objective: l.objective,
            scriptureRef: l.scriptureRef,
            cccParagraphs: l.cccParagraphs,
            materials: l.materials,
            activities: l.activities,
            prayerFocus: l.prayerFocus,
            takeHome: l.takeHome,
            durationMinutes: 60,
          },
        });
        console.log(`  ${gradeLevel} — ${ua.unitTitle}: +${l.title}`);
      }
    }
  }

  // Verify counts
  console.log("\nFinal lesson count per grade:");
  const grades = ["PRE_K", "KINDERGARTEN", "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6", "GRADE_7", "GRADE_8"];
  for (const g of grades) {
    const count = await prisma.lesson.count({
      where: { unit: { gradeLevel: g as any } },
    });
    const name = g.replace("GRADE_", "Gr ").replace("KINDERGARTEN", "K").replace("PRE_K", "Pre-K");
    console.log(`  ${name}: ${count} lessons ${count === 24 ? "✓" : `⚠ (${count})`}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
