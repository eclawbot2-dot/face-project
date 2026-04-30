import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(5000).optional(),
    targetGroup: z.string().trim().max(50).optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || !["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Catechists can only edit their own announcements; directors/admins can edit any.
  if (role === "CATECHIST" && existing.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const { title, body: content, targetGroup } = parsed.data;

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { body: content }),
      ...(targetGroup !== undefined && { targetGroup }),
    },
    include: { author: { select: { name: true } } },
  });

  await recordAudit({
    actorId: userId,
    action: "announcement.update",
    entityType: "Announcement",
    entityId: id,
    before: existing,
    after: announcement,
  });

  return NextResponse.json(announcement);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || !["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.announcement.delete({ where: { id } });

  await recordAudit({
    actorId: userId,
    action: "announcement.delete",
    entityType: "Announcement",
    entityId: id,
    before: existing,
    after: null,
  });

  return NextResponse.json({ success: true });
}
