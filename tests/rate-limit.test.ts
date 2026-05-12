/**
 * Tests for the lightweight in-memory rate limiter and its helpers.
 * The limiter is a token bucket — these tests exercise: first hit
 * (bucket creation), repeated hits within window, exhaustion, reset
 * after window, and helper functions for keying and 429 response.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";

function uniqueKey() {
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

describe("rateLimit", () => {
  it("allows the first hit and decrements", () => {
    const key = uniqueKey();
    const a = rateLimit({ key, max: 3, windowMs: 60_000 });
    expect(a.ok).toBe(true);
    expect(a.remaining).toBe(2);
    expect(a.retryAfter).toBe(0);
  });

  it("exhausts after `max` hits in window and returns 429-shape", () => {
    const key = uniqueKey();
    rateLimit({ key, max: 2, windowMs: 60_000 }); // 1
    rateLimit({ key, max: 2, windowMs: 60_000 }); // 2 - bucket empty
    const blocked = rateLimit({ key, max: 2, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window expires", async () => {
    const key = uniqueKey();
    rateLimit({ key, max: 1, windowMs: 10 }); // exhaust
    rateLimit({ key, max: 1, windowMs: 10 });
    await new Promise((r) => setTimeout(r, 20));
    const fresh = rateLimit({ key, max: 1, windowMs: 60_000 });
    expect(fresh.ok).toBe(true);
  });
});

describe("clientKey", () => {
  const fakeReq = (headers: Record<string, string>) =>
    new NextRequest("http://l/x", { headers });

  it("prefers userId when provided", () => {
    expect(clientKey(fakeReq({}), "api", "u123")).toBe("api:u:u123");
  });

  it("falls back to x-forwarded-for first hop", () => {
    expect(
      clientKey(fakeReq({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }), "api"),
    ).toBe("api:ip:203.0.113.5");
  });

  it("falls back further to x-real-ip", () => {
    expect(clientKey(fakeReq({ "x-real-ip": "198.51.100.7" }), "api")).toBe("api:ip:198.51.100.7");
  });

  it("falls back to 'unknown' when no IP headers", () => {
    expect(clientKey(fakeReq({}), "api")).toBe("api:ip:unknown");
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 with Retry-After and X-RateLimit-* headers", async () => {
    const res = rateLimitResponse({ ok: false, remaining: 0, resetAt: 1700000000_000, retryAfter: 42 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("X-RateLimit-Reset")).toBe(String(Math.ceil(1700000000_000 / 1000)));
    const body = await res.json();
    expect(body.retryAfter).toBe(42);
  });
});
