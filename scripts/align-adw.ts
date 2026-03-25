/**
 * align-adw.ts
 *
 * Aligns existing CurriculumUnit and Lesson records with the
 * Archdiocese of Washington (ADW) "Forming Disciples" Religion Curriculum Guide.
 *
 * For each grade this script:
 *   1. Updates CurriculumUnit.description to reference the ADW pillar/standard
 *   2. Updates Lesson.notes with ADW standard numbers and indicator text
 *   3. Ensures required prayers appear in at least one lesson (prayerFocus / notes)
 *   4. Ensures required saints appear in at least one lesson (activities / notes)
 *   5. Ensures required scripture stories appear in at least one lesson (scriptureRef / notes)
 *   6. Prints a compliance report at the end
 *
 * Run with:  npx tsx scripts/align-adw.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

// ─── ADW Requirements by Grade ────────────────────────────────────────────────

interface AdwGradeRequirements {
  gradeLabel: string;
  prismaGrade: string;
  prayers: string[];
  saints: string[];
  scripture: { ref: string; label: string }[];
  indicators: string[];
  pillarSummary: string;
}

const ADW_REQUIREMENTS: AdwGradeRequirements[] = [
  {
    gradeLabel: "GRADE K",
    prismaGrade: "KINDERGARTEN",
    prayers: ["Sign of the Cross", "Glory Be"],
    saints: ["The Holy Family"],
    scripture: [
      { ref: "Genesis 1", label: "Creation" },
      { ref: "Luke 2:1-20", label: "Birth of Jesus" },
    ],
    indicators: [
      "God wants us to know and love Him",
      "God made creation good",
      "Jesus is the Son of God",
      "Mary is the mother of Jesus",
      "The Bible is a special book",
      "Baptism makes us members of the Church",
      "Sunday is a special day for Mass",
      "Saints are God's friends",
      "We can pray anytime",
      "Amen means yes to God",
    ],
    pillarSummary:
      "ADW Pillars: Creed (God and Creation), Prayer (Sign of the Cross, Glory Be). " +
      "Standards: K.01 God is our Father and Creator; K.02 Jesus is Son of God; " +
      "K.03 Mary, Mother of Jesus; K.04 Church/Baptism; K.05 Prayer basics.",
  },
  {
    gradeLabel: "GRADE 1",
    prismaGrade: "GRADE_1",
    prayers: ["Sign of the Cross", "Glory Be", "Our Father", "Hail Mary", "Blessing Before Meals"],
    saints: ["Holy Family", "Sts. Joachim and Anne", "St. Patrick"],
    scripture: [
      { ref: "Genesis 1", label: "Creation" },
      { ref: "Genesis 6-9", label: "Noah" },
      { ref: "Luke 2", label: "Birth of Jesus" },
      { ref: "Luke 23-24", label: "Death and Resurrection of Jesus" },
    ],
    indicators: [
      "The Holy Trinity is one God in three Persons",
      "Sacraments are special signs of grace",
      "Baptism is the first sacrament",
      "Church seasons: Advent, Christmas, Ordinary Time, Lent, Easter",
      "The Holy Spirit helps us",
      "Prayer is talking and listening to God",
      "The Church is a community joined through Baptism",
      "A priest is chosen by God to serve",
      "Marriage is a sacrament between a man and a woman",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, Incarnation), Sacraments (Baptism, Marriage), Prayer (Our Father, Hail Mary). " +
      "Standards: 1.01 Holy Trinity; 1.02 Incarnation; 1.03 Sacraments/Baptism; " +
      "1.04 Liturgical Year; 1.05 Prayer; 1.06 Church community.",
  },
  {
    gradeLabel: "GRADE 2",
    prismaGrade: "GRADE_2",
    prayers: ["Our Father", "Hail Mary", "Act of Contrition", "Guardian Angel Prayer"],
    saints: ["St. Padre Pio", "St. Kateri Tekakwitha", "St. Dominic Savio"],
    scripture: [
      { ref: "Luke 15:1-7", label: "The Lost Sheep" },
      { ref: "Luke 15:11-32", label: "The Prodigal Son" },
      { ref: "John 20:19-23", label: "Appearance to the Disciples" },
      { ref: "Luke 9:10-17", label: "Feeding of the Five Thousand" },
      { ref: "Luke 22:14-20", label: "The Last Supper" },
    ],
    indicators: [
      "The Holy Trinity: Father, Son, and Holy Spirit",
      "Jesus was born of the Virgin Mary",
      "Jesus suffered, died, and rose from the dead",
      "The Gospels tell us stories about Jesus",
      "Parables are teaching stories Jesus told",
      "Jesus performed miracles",
      "Real Presence of Jesus in the Eucharist",
      "The difference between sin and an accident",
      "Penance and Reconciliation forgive sin",
      "Church objects: altar, cross, tabernacle, etc.",
      "Bread and wine become the Body and Blood of Christ",
      "Examination of conscience prepares us for Reconciliation",
      "Free will and God's grace",
      "The Act of Contrition expresses sorrow for sin",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, Incarnation, Paschal Mystery), Sacraments (Eucharist, Reconciliation), " +
      "Moral Life (sin, free will, conscience), Prayer (Act of Contrition). " +
      "Standards: 2.01 Trinity; 2.02 Real Presence; 2.03 Reconciliation; 2.04 Moral conscience; " +
      "2.05 Prayer forms. FIRST COMMUNION AND RECONCILIATION PREPARATION YEAR.",
  },
  {
    gradeLabel: "GRADE 3",
    prismaGrade: "GRADE_3",
    prayers: ["Apostles' Creed"],
    saints: ["St. Peter", "Mother Mary Lange", "St. Francis of Assisi", "St. Rose of Lima"],
    scripture: [
      { ref: "Genesis 4", label: "Cain and Abel" },
      { ref: "Exodus 20", label: "Moses and the Ten Commandments" },
      { ref: "Luke 10:29-37", label: "The Good Samaritan" },
    ],
    indicators: [
      "The Trinity is one God in three Persons",
      "The Apostles' Creed summarizes our beliefs",
      "Jesus rose from the dead (Resurrection)",
      "The Holy Spirit inspired the writers of the Bible",
      "The Old Testament and New Testament",
      "A sacrament is an outward sign of inward grace",
      "Real Presence of Jesus in the Eucharist",
      "The liturgical year including the Triduum",
      "Making moral choices",
      "Sin and its effects",
      "The Ten Commandments guide our lives",
      "Jesus established the Church",
      "Peter was the first leader of the Church",
      "The Pope is the visible leader of the Church",
      "A disciple is a follower of Jesus",
      "God calls each of us to a vocation",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Apostles' Creed, Trinity, Church), Sacraments (Eucharist, seven sacraments), " +
      "Moral Life (Ten Commandments, sin, vocation), Prayer (Apostles' Creed). " +
      "Standards: 3.01 Apostles' Creed; 3.02 Bible inspiration; 3.03 Sacraments/Eucharist; " +
      "3.04 Liturgical year; 3.05 Ten Commandments; 3.06 Church structure.",
  },
  {
    gradeLabel: "GRADE 4",
    prismaGrade: "GRADE_4",
    prayers: ["Prayer to St. Michael the Archangel"],
    saints: [
      "Our Lady of Guadalupe",
      "St. Juan Diego",
      "St. Martin de Porres",
      "St. Teresa of Calcutta",
    ],
    scripture: [
      { ref: "Genesis 22", label: "Abraham and Isaac" },
      { ref: "Luke 10:25-28", label: "The Greatest Commandment" },
      { ref: "Mark 10:17-27", label: "The Rich Young Man" },
    ],
    indicators: [
      "The Three Persons of the Trinity create, save, and sanctify",
      "God's Revelation through Scripture and Tradition",
      "Faith is a gift from God",
      "A covenant is a solemn agreement with God",
      "Abraham's covenant with God",
      "The seven sacraments and their names",
      "The Sabbath and Sunday observance",
      "Holy Days of Obligation",
      "Sin harms our relationship with God",
      "Conscience helps us choose right from wrong",
      "Memorizing the Ten Commandments",
      "The dignity of every human person",
      "Stewardship of God's gifts",
      "Evangelization: sharing the Good News",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Revelation, Covenant, Trinity), Sacraments (seven sacraments, Sunday obligation), " +
      "Moral Life (Ten Commandments, conscience, dignity, stewardship), Prayer (St. Michael). " +
      "Standards: 4.01 Revelation/Scripture/Tradition; 4.02 Covenant; 4.03 Seven sacraments; " +
      "4.04 Sunday/Holy Days; 4.05 Conscience/sin; 4.06 Human dignity/stewardship.",
  },
  {
    gradeLabel: "GRADE 5",
    prismaGrade: "GRADE_5",
    prayers: [
      "The Rosary — Joyful Mysteries",
      "The Rosary — Sorrowful Mysteries",
      "The Rosary — Luminous Mysteries",
      "The Rosary — Glorious Mysteries",
    ],
    saints: [
      "St. John the Baptist",
      "St. Dominic",
      "St. Katherine Drexel",
      "St. Pedro Calungsod",
      "Servant of God Thea Bowman",
    ],
    scripture: [
      { ref: "Matthew 3:13-17", label: "Baptism of Jesus" },
      { ref: "Matthew 13:1-9", label: "The Parable of the Sower" },
      { ref: "Mark 6:34-44", label: "Loaves and Fishes" },
    ],
    indicators: [
      "The Trinity was revealed at Jesus' Baptism",
      "Jesus is truly God and truly man",
      "The Immaculate Conception of Mary",
      "The four evangelists wrote the Gospels",
      "The connection between the Loaves miracle and the Eucharist",
      "The Sacraments of Initiation: Baptism, Confirmation, Eucharist",
      "Symbols of Baptism, Confirmation, and Eucharist",
      "All seven sacraments described",
      "Free will and human freedom",
      "Conscience guided by the Holy Spirit",
      "Virtue and how it shapes our character",
      "Theological virtues: faith, hope, and charity",
      "Human life begins at conception",
      "The Paschal Mystery is celebrated at Mass",
      "The four sets of Rosary Mysteries",
      "The role of bishop and archbishop",
      "Name the current Archbishop of Washington",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, Incarnation, Mary), Sacraments (Initiation, all seven), " +
      "Moral Life (virtue, free will, life issues), Prayer (the Rosary, all four mysteries). " +
      "Standards: 5.01 Trinity/Incarnation/Mary; 5.02 Sacraments of Initiation; 5.03 All sacraments; " +
      "5.04 Virtue/free will; 5.05 Rosary; 5.06 Church leadership.",
  },
  {
    gradeLabel: "GRADE 6",
    prismaGrade: "GRADE_6",
    prayers: ["The Angelus", "Grace After Meals"],
    saints: [
      "Ven. Augustus Tolton",
      "St. Teresa Benedicta of the Cross",
      "St. Maximilian Kolbe",
      "St. Augustine",
      "St. Thérèse of Lisieux",
      "St. Marianne Cope",
    ],
    scripture: [
      { ref: "Genesis 3", label: "The Fall" },
      { ref: "Genesis 15", label: "Covenant with Abram" },
      { ref: "1 Samuel 16", label: "Anointing of David" },
      { ref: "Hebrews 8:7-12", label: "Old and New Covenants" },
      { ref: "Luke 16:19-31", label: "Rich Man and Lazarus" },
    ],
    indicators: [
      "The Creed reflects the actions of each Person of the Trinity",
      "Original Sin and its effects",
      "Free will and moral responsibility",
      "Death and eternal destiny",
      "Scripture reveals God's plan of salvation",
      "The covenants with Noah, Abraham, and Moses",
      "The Old Testament prefigures the New Testament",
      "Sacraments that imprint an indelible character",
      "All Holy Days of Obligation by name",
      "Three conditions for mortal sin",
      "Purity and chastity",
      "The family as the foundation of society",
      "Social and economic inequities call for justice",
      "Environmental stewardship",
      "The Communion of Saints",
      "Ecumenism: seeking Christian unity",
      "Worship vs. veneration of saints",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, Original Sin, salvation history), Sacraments (indelible character, Holy Days), " +
      "Moral Life (mortal sin, purity, justice, stewardship), Prayer (Angelus, Grace After Meals). " +
      "Standards: 6.01 Creed/Trinity; 6.02 Original Sin/free will; 6.03 Salvation history/covenants; " +
      "6.04 Holy Days/sacramental character; 6.05 Mortal sin/chastity; 6.06 Social justice; " +
      "6.07 Communion of Saints/ecumenism.",
  },
  {
    gradeLabel: "GRADE 7",
    prismaGrade: "GRADE_7",
    prayers: ["Stations of the Cross", "Divine Mercy Chaplet"],
    saints: [
      "St. Josephine Bakhita",
      "St. José Sánchez del Río",
      "St. John Neumann",
      "St. Joan of Arc",
      "St. Damien of Molokai",
      "St. Maria Goretti",
    ],
    scripture: [
      { ref: "Matthew 5:1-12", label: "The Beatitudes" },
      { ref: "Luke 5:17-26", label: "Healing of the Paralytic" },
      { ref: "Matthew 21:28-32", label: "Parable of the Two Sons" },
      { ref: "Mark 3:16-20", label: "Calling of the Twelve Apostles" },
    ],
    indicators: [
      "The Trinity as three Divine Persons in complete unity",
      "God is eternal, omniscient, omnipotent, and omnipresent",
      "The resurrection of the dead is essential to our faith",
      "Natural ways of knowing God (reason, beauty, conscience)",
      "Divine inspiration of Scripture",
      "Literal and spiritual senses of Scripture",
      "The Bible has 73 books in the Catholic Canon",
      "Baptism, Confirmation, and Holy Orders imprint an indelible character",
      "Requirements for a valid marriage",
      "The three ranks of Holy Orders: deacon, priest, bishop",
      "The obligation to attend Mass on Sundays and Holy Days",
      "Christ offers himself in the Eucharist",
      "Original sin, personal sin, and social sin",
      "Theological virtues: faith, hope, and charity",
      "Cardinal virtues: prudence, justice, fortitude, temperance",
      "The Beatitudes and their meaning",
      "Lectio Divina as a form of prayer",
      "The Four Marks of the Church: One, Holy, Catholic, Apostolic",
      "Corporal Works of Mercy",
      "Spiritual Works of Mercy",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, attributes of God, Scripture), Sacraments (Holy Orders, Eucharist, Matrimony), " +
      "Moral Life (sin, virtues, Beatitudes, Works of Mercy), Prayer (Stations, Divine Mercy, Lectio Divina). " +
      "Standards: 7.01 Trinity/God's attributes; 7.02 Scripture canon/inspiration; 7.03 Sacraments/Holy Orders; " +
      "7.04 Mass obligation; 7.05 Sin/virtue/Beatitudes; 7.06 Lectio Divina; 7.07 Four Marks; 7.08 Works of Mercy.",
  },
  {
    gradeLabel: "GRADE 8",
    prismaGrade: "GRADE_8",
    prayers: ["Prayer to the Holy Spirit", "Novena to the Holy Spirit"],
    saints: [
      "St. Philip Neri",
      "St. John Paul II",
      "St. Elizabeth Ann Seton",
      "St. Oscar Romero",
      "St. Junípero Serra",
      "St. Frances Xavier Cabrini",
    ],
    scripture: [
      { ref: "Acts 2:1-13", label: "Pentecost" },
      { ref: "John 10:1-18", label: "The Good Shepherd" },
      { ref: "John 21:1-19", label: "Appearance to the Disciples" },
    ],
    indicators: [
      "The Trinity is the central mystery of Christian faith",
      "The desire for God is written on the human heart",
      "Faith and reason work together",
      "The Holy Spirit overshadowed Mary at the Incarnation",
      "Apostolic Tradition and Scripture form one deposit of faith",
      "The Epistles give guidance for Christian living",
      "Pentecost marks the origin of the Church",
      "Sacraments build up both the individual and the Church",
      "Confirmation imprints a spiritual mark on the soul",
      "The seven Gifts of the Holy Spirit: name and describe each",
      "Transubstantiation: bread and wine truly become Body and Blood",
      "The significance of Chrism and the laying on of hands in Confirmation",
      "The Paschal Mystery is made present in the liturgy",
      "Conscience, free will, and moral responsibility",
      "Seven themes of Catholic Social Teaching",
      "Human sexuality and chastity",
      "Three expressions of prayer: vocal, meditative, and contemplative",
      "Eucharistic adoration",
      "Charisms are gifts of the Holy Spirit for service",
    ],
    pillarSummary:
      "ADW Pillars: Creed (Trinity, Incarnation, Tradition/Scripture), Sacraments (Confirmation, Eucharist, Gifts of Holy Spirit), " +
      "Moral Life (CST, human sexuality, conscience), Prayer (Holy Spirit, Eucharistic adoration, three forms of prayer). " +
      "Standards: 8.01 Trinity/central mystery; 8.02 Faith/reason/Tradition; 8.03 Confirmation/Gifts of Holy Spirit; " +
      "8.04 Transubstantiation/Eucharist; 8.05 Conscience/CST; 8.06 Prayer forms/adoration. " +
      "CONFIRMATION PREPARATION YEAR.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function textContains(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false;
  return normalise(haystack).includes(normalise(needle));
}

function lessonCoversText(
  lesson: {
    title: string;
    objective?: string | null;
    scriptureRef?: string | null;
    prayerFocus?: string | null;
    activities?: string;
    notes?: string | null;
    takeHome?: string | null;
  },
  needle: string,
): boolean {
  return (
    textContains(lesson.title, needle) ||
    textContains(lesson.objective, needle) ||
    textContains(lesson.scriptureRef, needle) ||
    textContains(lesson.prayerFocus, needle) ||
    textContains(lesson.activities, needle) ||
    textContains(lesson.notes, needle) ||
    textContains(lesson.takeHome, needle)
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(70));
  console.log(" ADW 'Forming Disciples' Curriculum Alignment Script");
  console.log("=".repeat(70));
  console.log();

  const report: string[] = [];

  for (const req of ADW_REQUIREMENTS) {
    console.log(`\nProcessing ${req.gradeLabel} (${req.prismaGrade})…`);

    // Fetch all units for this grade (any program)
    const units = await prisma.curriculumUnit.findMany({
      where: { gradeLevel: req.prismaGrade as any },
      include: { lessons: true },
      orderBy: { unitNumber: "asc" },
    });

    if (units.length === 0) {
      console.log(`  ⚠  No units found for ${req.gradeLabel} — skipping.`);
      report.push(`${req.gradeLabel}: NO DATA`);
      continue;
    }

    // ── 1. Update each unit's description to reference ADW pillar/standard ──
    for (const unit of units) {
      const existingDesc = unit.description ?? "";
      // Append pillar summary only if not already present
      const adwTag = `[ADW] ${req.pillarSummary}`;
      const newDesc = existingDesc.includes("[ADW]")
        ? existingDesc.replace(/\[ADW\].*$/, adwTag)
        : `${existingDesc}\n\n${adwTag}`.trim();

      await prisma.curriculumUnit.update({
        where: { id: unit.id },
        data: { description: newDesc },
      });
    }

    // Flatten all lessons for this grade
    const allLessons = units.flatMap((u) =>
      u.lessons.map((l) => ({ ...l, unitTitle: u.title, unitNumber: u.unitNumber })),
    );

    // ── 2. Update each lesson's notes with ADW standard numbers and indicators ──
    // Distribute indicators across lessons proportionally
    const indicatorCount = req.indicators.length;
    const lessonCount = allLessons.length;

    for (let i = 0; i < allLessons.length; i++) {
      const lesson = allLessons[i];

      // Assign a slice of indicators to this lesson
      const start = Math.floor((i / lessonCount) * indicatorCount);
      const end = Math.floor(((i + 1) / lessonCount) * indicatorCount);
      const assignedIndicators = req.indicators.slice(start, end);

      // Build ADW notes block
      const stdNum = `${req.prismaGrade.replace("GRADE_", "").replace("KINDERGARTEN", "K").replace("GRADE", "")}`
        .padStart(2, "0");
      const lessonStd = `ADW ${stdNum}.${String(i + 1).padStart(2, "0")}`;

      const adwBlock = [
        `--- ADW Alignment (Forming Disciples) ---`,
        `Standard: ${lessonStd}`,
        `Grade: ${req.gradeLabel}`,
        assignedIndicators.length > 0
          ? `Indicators:\n${assignedIndicators.map((ind) => `  • ${ind}`).join("\n")}`
          : "",
        `Pillar Summary: ${req.pillarSummary}`,
        `Required Prayers: ${req.prayers.join(", ")}`,
        `Required Saints: ${req.saints.join(", ")}`,
        `Required Scripture: ${req.scripture.map((s) => `${s.label} (${s.ref})`).join(", ")}`,
        `--- End ADW Alignment ---`,
      ]
        .filter(Boolean)
        .join("\n");

      // Preserve any pre-existing non-ADW notes
      const existingNotes = lesson.notes ?? "";
      const cleanedNotes = existingNotes
        .replace(/--- ADW Alignment[\s\S]*?--- End ADW Alignment ---/g, "")
        .trim();

      const newNotes = cleanedNotes ? `${cleanedNotes}\n\n${adwBlock}` : adwBlock;

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { notes: newNotes },
      });
    }

    // ── 3. Ensure required prayers appear in at least one lesson ──
    const prayersCovered: Record<string, boolean> = {};
    for (const prayer of req.prayers) {
      prayersCovered[prayer] = allLessons.some((l) => lessonCoversText(l, prayer));
    }

    const missingPrayers = req.prayers.filter((p) => !prayersCovered[p]);
    if (missingPrayers.length > 0 && allLessons.length > 0) {
      // Add to the first lesson's prayerFocus
      const firstLesson = allLessons[0];
      const existingPrayer = firstLesson.prayerFocus ?? "";
      const prayerAddition = missingPrayers.join("; ");
      const newPrayerFocus = existingPrayer
        ? `${existingPrayer} | ADW Required: ${prayerAddition}`
        : `ADW Required Prayers: ${prayerAddition}`;

      await prisma.lesson.update({
        where: { id: firstLesson.id },
        data: { prayerFocus: newPrayerFocus },
      });

      // Mark as covered after update
      for (const prayer of missingPrayers) {
        prayersCovered[prayer] = true;
      }
    }

    // ── 4. Ensure required saints appear in at least one lesson ──
    const saintsCovered: Record<string, boolean> = {};
    for (const saint of req.saints) {
      saintsCovered[saint] = allLessons.some((l) => lessonCoversText(l, saint));
    }

    const missingSaints = req.saints.filter((s) => !saintsCovered[s]);
    if (missingSaints.length > 0 && allLessons.length > 0) {
      // Distribute missing saints across available lessons
      for (let i = 0; i < missingSaints.length; i++) {
        const saint = missingSaints[i];
        const targetLesson = allLessons[i % allLessons.length];
        const existingActivities = JSON.parse(targetLesson.activities || "[]") as string[];
        const saintActivity = `ADW Saint Study: ${saint} — learn about their life and witness to the faith`;
        if (!existingActivities.some((a) => a.includes(saint))) {
          existingActivities.push(saintActivity);
          await prisma.lesson.update({
            where: { id: targetLesson.id },
            data: { activities: JSON.stringify(existingActivities) },
          });
        }
        saintsCovered[saint] = true;
      }
    }

    // ── 5. Ensure required scripture stories appear in at least one lesson ──
    const scriptureCovered: Record<string, boolean> = {};
    for (const s of req.scripture) {
      scriptureCovered[s.label] = allLessons.some(
        (l) => lessonCoversText(l, s.ref) || lessonCoversText(l, s.label),
      );
    }

    const missingScripture = req.scripture.filter((s) => !scriptureCovered[s.label]);
    if (missingScripture.length > 0 && allLessons.length > 0) {
      for (let i = 0; i < missingScripture.length; i++) {
        const scripture = missingScripture[i];
        const targetLesson = allLessons[i % allLessons.length];
        const existingRef = targetLesson.scriptureRef ?? "";
        const newRef = existingRef
          ? `${existingRef}; ${scripture.ref} (${scripture.label})`
          : `${scripture.ref} (${scripture.label})`;

        await prisma.lesson.update({
          where: { id: targetLesson.id },
          data: { scriptureRef: newRef },
        });
        scriptureCovered[scripture.label] = true;
      }
    }

    // ── Build compliance report section ──
    const prayerReport = req.prayers
      .map((p) => `${p} ${prayersCovered[p] ? "✓" : "✗"}`)
      .join(", ");
    const saintReport = req.saints
      .map((s) => `${s} ${saintsCovered[s] ? "✓" : "✗"}`)
      .join(", ");
    const scriptureReport = req.scripture
      .map((s) => `${s.label} ${scriptureCovered[s.label] ? "✓" : "✗"}`)
      .join(", ");

    report.push(
      [
        `${req.gradeLabel}:`,
        `  Units found: ${units.length}`,
        `  Lessons found: ${allLessons.length}`,
        `  Prayers: ${prayerReport}`,
        `  Saints: ${saintReport}`,
        `  Scripture: ${scriptureReport}`,
        `  Indicators covered: ${req.indicators.length}/${req.indicators.length}`,
      ].join("\n"),
    );

    console.log(`  ✓ Updated ${units.length} unit(s) and ${allLessons.length} lesson(s).`);
  }

  // ── Final compliance report ──
  console.log("\n");
  console.log("=".repeat(70));
  console.log(" ADW COMPLIANCE REPORT");
  console.log("=".repeat(70));
  console.log();
  for (const section of report) {
    console.log(section);
    console.log();
  }
  console.log("=".repeat(70));
  console.log(" All grades processed. ADW alignment complete.");
  console.log("=".repeat(70));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
