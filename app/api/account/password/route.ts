import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { accountPasswordUpdateSchema } from "@/lib/account/validation";

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsedBody = accountPasswordUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  if (!isStrongPassword(payload.newPassword)) {
    return NextResponse.json(
      {
        error:
          "Password baru harus minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "Akun ini belum memiliki password (login provider). Fitur set password awal belum tersedia.",
      },
      { status: 400 },
    );
  }

  const oldPasswordMatched = await verifyPassword(payload.oldPassword, user.passwordHash);
  if (!oldPasswordMatched) {
    return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
  }

  const newPasswordMatchedOld = await verifyPassword(payload.newPassword, user.passwordHash);
  if (newPasswordMatchedOld) {
    return NextResponse.json(
      { error: "Password baru tidak boleh sama dengan password lama." },
      { status: 400 },
    );
  }

  const nextPasswordHash = await hashPassword(payload.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: nextPasswordHash,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "Password berhasil diperbarui.",
    },
    { status: 200 },
  );
}
