import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/normalize";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/auth/password";
import { getPasswordResetSession } from "@/lib/auth/password-reset";
import { forgotPasswordResetSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = forgotPasswordResetSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const emailNormalized = normalizeEmail(payload.email);

  if (!isStrongPassword(payload.newPassword)) {
    return NextResponse.json(
      {
        error:
          "Password baru harus minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.",
      },
      { status: 400 },
    );
  }

  const resetSession = await getPasswordResetSession(payload.resetToken);
  if (!resetSession || !resetSession.user) {
    return NextResponse.json(
      { error: "Sesi reset password tidak valid atau sudah kedaluwarsa." },
      { status: 401 },
    );
  }

  if (resetSession.user.emailNormalized !== emailNormalized) {
    return NextResponse.json(
      { error: "Sesi reset password tidak cocok dengan email." },
      { status: 401 },
    );
  }

  if (
    resetSession.user.role !== "USER" ||
    resetSession.user.status !== "ACTIVE"
  ) {
    await prisma.session.delete({
      where: { id: resetSession.id },
    });

    return NextResponse.json(
      { error: "Akun tidak dapat memproses reset password." },
      { status: 403 },
    );
  }

  if (resetSession.user.passwordHash) {
    const isSameAsOld = await verifyPassword(
      payload.newPassword,
      resetSession.user.passwordHash,
    );
    if (isSameAsOld) {
      return NextResponse.json(
        { error: "Password baru tidak boleh sama dengan password lama." },
        { status: 400 },
      );
    }
  }

  const nextPasswordHash = await hashPassword(payload.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetSession.user.id },
      data: {
        passwordHash: nextPasswordHash,
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: resetSession.user.id,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Password berhasil direset. Silakan login kembali.",
    },
    { status: 200 },
  );
}
