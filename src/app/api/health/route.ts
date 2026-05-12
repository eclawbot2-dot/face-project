/**
 * GET /api/health — liveness/readiness probe. Reports DB status,
 * latency, and uptime. Always 200 with `cache-control: no-store`
 * so an LB doesn't restart on transient blips.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "down" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch {
    db = "down";
  }

  return NextResponse.json(
    {
      status: db === "ok" ? "ok" : "degraded",
      db,
      dbLatencyMs,
      uptimeSec: Math.round(process.uptime()),
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
