import { VerificationPurpose } from "@prisma/client";
import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/normalize";
import { verifyOtpCode } from "@/lib/auth/otp";
import { verifyOtpSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = verifyOtpSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Kode OTP tidak valid." },
      { status: 400 },
    );
  }

  const emailNormalized = normalizeEmail(parsedBody.data.email);
  const code = parsedBody.data.code;
  const now = new Date();

  const verification = await prisma.emailVerification.findFirst({
    where: {
      emailNormalized,
      purpose: VerificationPurpose.REGISTER,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!verification || !verification.user) {
    return NextResponse.json(
      { error: "Kode OTP tidak ditemukan. Silakan minta OTP baru." },
      { status: 404 },
    );
  }

  if (verification.expiresAt <= now) {
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { consumedAt: now },
    });

    return NextResponse.json(
      { error: "Kode OTP sudah kedaluwarsa. Silakan minta OTP baru." },
      { status: 400 },
    );
  }

  if (verification.attemptCount >= verification.maxAttempts) {
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { consumedAt: now },
    });

    return NextResponse.json(
      { error: "Batas percobaan OTP tercapai. Silakan minta OTP baru." },
      { status: 429 },
    );
  }

  const otpMatched = verifyOtpCode(
    {
      code,
      emailNormalized,
      purpose: VerificationPurpose.REGISTER,
    },
    verification.codeHash,
  );

  if (!otpMatched) {
    const nextAttemptCount = verification.attemptCount + 1;
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        attemptCount: nextAttemptCount,
        consumedAt: nextAttemptCount >= verification.maxAttempts ? now : null,
      },
    });

    return NextResponse.json(
      { error: "Kode OTP salah. Coba lagi." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.emailVerification.update({
      where: { id: verification.id },
      data: { consumedAt: now },
    });

    await tx.user.update({
      where: { id: verification.user!.id },
      data: {
        status: "ACTIVE",
        emailVerifiedAt: now,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Email berhasil diverifikasi. Silakan login untuk melanjutkan.",
    },
    { status: 200 },
  );
}
