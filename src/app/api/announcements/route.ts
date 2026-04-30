import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

const PostSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
    targetGroup: z.string().trim().max(50).default("ALL"),
  })
  .strict();

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const { page, limit } = parsed.data;

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.announcement.count(),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || !["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = PostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const { title, body: content, targetGroup } = parsed.data;

  const announcement = await prisma.announcement.create({
    data: { title, body: content, targetGroup, authorId: userId, sentAt: new Date() },
    include: { author: { select: { name: true } } },
  });

  await recordAudit({
    actorId: userId,
    action: "announcement.create",
    entityType: "Announcement",
    entityId: announcement.id,
    after: announcement,
  });

  return NextResponse.json(announcement, { status: 201 });
}
