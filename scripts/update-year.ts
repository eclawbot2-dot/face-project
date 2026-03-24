import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const r = await prisma.class.updateMany({
    where: { academicYear: "2024-2025" },
    data: { academicYear: "2025-2026" },
  });
  console.log(`Updated ${r.count} classes to 2025-2026`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
