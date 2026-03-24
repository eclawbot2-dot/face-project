import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const catechists = await prisma.catechist.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, active: true } },
      classes: { include: { class: true } },
    },
    where: { user: { active: true } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(catechists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, password, bio, certifications, notes } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: "CATECHIST",
      catechist: {
        create: {
          bio,
          certifications: JSON.stringify(certifications ?? []),
          notes,
        },
      },
    },
    include: { catechist: true },
  });

  return NextResponse.json(user, { status: 201 });
}
