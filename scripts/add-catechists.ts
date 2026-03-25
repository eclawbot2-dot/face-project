import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

const catechists = [
  { name: "Sarah Naiva", className: "Pre-K" },
  { name: "Stephanie Mousseau", className: "Kindergarten" },
  { name: "Linda Thompson", className: "1st Grade" },
  { name: "Makayla Estrada", className: "1st Grade" },
  { name: "Larissa Bartodziej", className: "2nd Grade" },
  { name: "Stefanie Ragusa", className: "3rd Grade" },
  { name: "Max Schnitker", className: "3rd Grade" },
  { name: "Ann Fucito", className: "4th Grade" },
  { name: "Donna Seremet", className: "5th Grade" },
  { name: "Cheryl Toner", className: "5th Grade" },
  { name: "Stephanie Thomas", className: "6th Grade" },
  { name: "Gwen Maciejewski", className: "7th Grade" },
  { name: "Suzanne Moebius", className: "8th Grade" },
];

function makeEmail(name: string): string {
  const parts = name.toLowerCase().split(" ");
  return `${parts[0]}.${parts[parts.length - 1]}@holyfacechurch.org`;
}

async function main() {
  console.log("Adding catechists for Sheila...\n");

  // Get all classes
  const allClasses = await prisma.class.findMany({ where: { active: true } });

  // Remove old sample catechist users (but keep Sheila and Susan)
  const oldCatechists = await prisma.user.findMany({ where: { role: "CATECHIST" } });
  for (const old of oldCatechists) {
    // Delete catechist record first (cascade)
    await prisma.catechist.deleteMany({ where: { userId: old.id } });
    await prisma.user.delete({ where: { id: old.id } });
  }
  console.log(`Removed ${oldCatechists.length} old sample catechists.\n`);

  const defaultPassword = "HolyFace2025!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  for (const c of catechists) {
    const email = makeEmail(c.name);

    // Find the class
    const cls = allClasses.find(cl => cl.name === c.className);
    if (!cls) {
      console.log(`  WARNING: Class "${c.className}" not found — skipping ${c.name}`);
      continue;
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: c.name,
          email,
          password: hashedPassword,
          role: "CATECHIST",
        },
      });
    }

    // Create catechist record if not exists
    let catechist = await prisma.catechist.findUnique({ where: { userId: user.id } });
    if (!catechist) {
      catechist = await prisma.catechist.create({
        data: { userId: user.id },
      });
    }

    // Assign to class
    await prisma.classCatechist.upsert({
      where: { classId_catechistId: { classId: cls.id, catechistId: catechist.id } },
      update: {},
      create: { classId: cls.id, catechistId: catechist.id, isPrimary: true },
    });

    console.log(`  ${c.name} → ${c.className} (${email})`);
  }

  console.log(`\nDone! All 13 catechists created and assigned.`);
  console.log(`\nDefault password for all: ${defaultPassword}`);
  console.log(`\nLogin credentials:`);
  for (const c of catechists) {
    console.log(`  ${c.name.padEnd(22)} ${makeEmail(c.name).padEnd(42)} ${c.className}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
