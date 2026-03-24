import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const catechist = await prisma.catechist.findUnique({
    where: { id },
    include: {
      user: true,
      classes: { include: { class: { include: { enrollments: true } } } },
    },
  });

  if (!catechist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(catechist);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, phone, bio, backgroundCheckDate, backgroundCheckExp, certifications, notes } = body;

  const catechist = await prisma.catechist.update({
    where: { id },
    data: {
      bio,
      notes,
      certifications: JSON.stringify(certifications ?? []),
      backgroundCheckDate: backgroundCheckDate ? new Date(backgroundCheckDate) : null,
      backgroundCheckExp: backgroundCheckExp ? new Date(backgroundCheckExp) : null,
      user: { update: { name, phone } },
    },
  });

  return NextResponse.json(catechist);
}
