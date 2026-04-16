import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/api-guard";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/normalize";
import { hashPassword, isStrongPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { createAdminSchema } from "@/lib/settings/validation";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json({ admins }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const emailNormalized = normalizeEmail(payload.email);
  const usernameNormalized = payload.username
    ? normalizeUsername(payload.username)
    : null;
  const phone = payload.phone ? payload.phone.trim() : null;

  if (!isStrongPassword(payload.password)) {
    return NextResponse.json(
      {
        error:
          "Password harus 12-128 karakter dan mengandung huruf besar, huruf kecil, angka, serta simbol.",
      },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hashPassword(payload.password);

    const admin = await prisma.user.create({
      data: {
        email: payload.email,
        emailNormalized,
        fullName: payload.fullName,
        username: usernameNormalized ?? null,
        phone,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Email atau username sudah digunakan." },
        { status: 409 },
      );
    }

    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan admin baru." },
      { status: 500 },
    );
  }
}
