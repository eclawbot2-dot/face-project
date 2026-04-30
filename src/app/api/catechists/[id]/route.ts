import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

const PatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    bio: z.string().trim().max(2000).optional(),
    backgroundCheckDate: z.string().datetime().nullable().optional(),
    backgroundCheckExp: z.string().datetime().nullable().optional(),
    certifications: z.array(z.string().max(200)).max(50).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  const { id } = await params;

  // Catechists may view their own profile; ADMIN/DIRECTOR may view any.
  // Background-check dates and notes are sensitive personnel data and must not
  // leak to other catechists or to PARENT users.
  const isPrivileged = ["ADMIN", "DIRECTOR"].includes(role ?? "");

  const catechist = await prisma.catechist.findUnique({
    where: { id },
    include: {
      user: true,
      classes: { include: { class: { include: { enrollments: true } } } },
    },
  });
  if (!catechist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSelf = userId !== undefined && catechist.userId === userId;
  if (!isPrivileged && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(catechist);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || !["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.catechist.findUnique({ where: { id }, include: { user: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const { name, phone, bio, backgroundCheckDate, backgroundCheckExp, certifications, notes } = parsed.data;

  const catechist = await prisma.catechist.update({
    where: { id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(notes !== undefined && { notes }),
      ...(certifications !== undefined && { certifications: JSON.stringify(certifications) }),
      ...(backgroundCheckDate !== undefined && {
        backgroundCheckDate: backgroundCheckDate ? new Date(backgroundCheckDate) : null,
      }),
      ...(backgroundCheckExp !== undefined && {
        backgroundCheckExp: backgroundCheckExp ? new Date(backgroundCheckExp) : null,
      }),
      ...((name !== undefined || phone !== undefined) && {
        user: {
          update: {
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
          },
        },
      }),
    },
  });

  await recordAudit({
    actorId: userId,
    action: "catechist.update",
    entityType: "Catechist",
    entityId: id,
    before: existing,
    after: catechist,
  });

  return NextResponse.json(catechist);
}
