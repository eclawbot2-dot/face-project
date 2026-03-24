#!/usr/bin/env ts-node
/**
 * One-time setup script for Holy Face Church Faith Formation Platform
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup.ts
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const root = path.join(__dirname, "..");

function run(cmd: string, label: string) {
  console.log(`\n→ ${label}...`);
  execSync(cmd, { stdio: "inherit", cwd: root });
  console.log(`✓ ${label} done`);
}

console.log("╔══════════════════════════════════════════════╗");
console.log("║  Holy Face Church Faith Formation Platform  ║");
console.log("║  First-Time Setup                           ║");
console.log("╚══════════════════════════════════════════════╝");

run("npx prisma generate", "Generating Prisma client");
run("npx prisma migrate deploy", "Running migrations");
run("npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts", "Seeding database");

console.log("\n🎉 Setup complete!");
console.log("\nDefault credentials:");
console.log("  Admin:    sheila@holyfacechurch.org / HolyFace2024!");
console.log("  Director: susan@holyfacechurch.org / HolyFace2024!");
console.log("  Catechist: mary.johnson@holyfacechurch.org / HolyFace2024!");
