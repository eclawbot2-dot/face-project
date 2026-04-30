// Lightweight in-memory rate limiter. Suitable for single-instance PM2
// deployments. For multi-instance or serverless, swap to Redis/Upstash.

import { NextRequest, NextResponse } from "next/server";

type Bucket = { tokens: number; resetAt: number };

const BUCKETS = new Map<string, Bucket>();
const SWEEP_INTERVAL = 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, b] of BUCKETS) {
    if (b.resetAt < now) BUCKETS.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

export function rateLimit(opts: {
  key: string;
  max: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = BUCKETS.get(opts.key);
  if (!existing || existing.resetAt < now) {
    const fresh = { tokens: opts.max - 1, resetAt: now + opts.windowMs };
    BUCKETS.set(opts.key, fresh);
    return { ok: true, remaining: fresh.tokens, resetAt: fresh.resetAt, retryAfter: 0 };
  }
  if (existing.tokens <= 0) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.tokens -= 1;
  return { ok: true, remaining: existing.tokens, resetAt: existing.resetAt, retryAfter: 0 };
}

export function clientKey(req: NextRequest, prefix: string, userId?: string | null): string {
  // Prefer authenticated userId; fall back to IP. x-forwarded-for is set by
  // the cloudflared tunnel.
  if (userId) return `${prefix}:u:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `${prefix}:ip:${ip}`;
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Rate limit exceeded. Slow down.", retryAfter: result.retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
