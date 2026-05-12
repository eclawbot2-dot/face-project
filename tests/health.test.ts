/**
 * Tests for /api/health. Prisma is mocked so we can drive both the
 * happy path (returns "ok") and the failure path (returns
 * "degraded") deterministically.
 */
import { describe, expect, it, vi } from "vitest";

const { queryRawMock } = vi.hoisted(() => ({ queryRawMock: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRawMock },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports ok when prisma responds", async () => {
    queryRawMock.mockReset();
    queryRawMock.mockResolvedValueOnce([{ "1": 1 }]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.db).toBe("ok");
    expect(typeof body.dbLatencyMs).toBe("number");
    expect(typeof body.version).toBe("string");
    expect(body.node).toMatch(/^v\d+\./);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("reports degraded when prisma throws", async () => {
    queryRawMock.mockReset();
    queryRawMock.mockRejectedValueOnce(new Error("boom"));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("down");
    expect(body.dbLatencyMs).toBeNull();
  });
});
