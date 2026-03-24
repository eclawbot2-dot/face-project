import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifySchema = z.object({
  verified: z.boolean(),
  verifiedBy: z.string().optional().nullable(),
  hours: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR", "CATECHIST"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (parsed.data.verified !== undefined) updateData.verified = parsed.data.verified;
  if (parsed.data.verifiedBy !== undefined) updateData.verifiedBy = parsed.data.verifiedBy;
  if (parsed.data.hours !== undefined) updateData.hours = parsed.data.hours;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.date !== undefined) updateData.date = new Date(parsed.data.date);

  const serviceHour = await prisma.serviceHour.update({
    where: { id },
    data: updateData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(serviceHour);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.serviceHour.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
