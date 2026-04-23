import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { normalizeUsername } from "@/lib/auth/normalize";
import { prisma } from "@/lib/prisma";
import { accountProfileUpdateSchema } from "@/lib/account/validation";

function toProfilePayload(user: {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
  birthDate: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    gender: user.gender,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      gender: true,
      birthDate: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ profile: toProfilePayload(user) }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsedBody = accountProfileUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const usernameNormalized = payload.username
    ? normalizeUsername(payload.username)
    : null;

  if (usernameNormalized) {
    const usernameOwner = await prisma.user.findFirst({
      where: {
        username: usernameNormalized,
        NOT: {
          id: auth.user.id,
        },
      },
      select: { id: true },
    });

    if (usernameOwner) {
      return NextResponse.json(
        { error: "Username sudah dipakai. Gunakan username lain." },
        { status: 409 },
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      username: usernameNormalized,
      fullName: payload.fullName.trim(),
      phone: payload.phone ? payload.phone.trim() : null,
      gender: payload.gender,
      birthDate: payload.birthDate ? new Date(`${payload.birthDate}T00:00:00.000Z`) : null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      gender: true,
      birthDate: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      profile: toProfilePayload(updatedUser),
    },
    { status: 200 },
  );
}
