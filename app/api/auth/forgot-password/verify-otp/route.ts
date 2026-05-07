import { VerificationPurpose } from "@prisma/client";
import { NextResponse } from "next/server";

import { assertEmailDeliveryConfigured, sendOtpEmail } from "@/lib/auth/email";
import { normalizeEmail } from "@/lib/auth/normalize";
import { verifyOtpCode } from "@/lib/auth/otp";
import { generateOtpCode } from "@/lib/auth/otp";
import { createPasswordResetSession } from "@/lib/auth/password-reset";
import { forgotPasswordVerifyOtpSchema } from "@/lib/auth/validation";
import {
  assertOtpRequestLimit,
  createPasswordResetOtp,
} from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";

async function resendResetOtpBestEffort(input: {
  emailNormalized: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { emailNormalized: input.emailNormalized },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  const eligible =
    !!user &&
    user.role === "USER" &&
    user.deletedAt === null &&
    user.status !== "DELETED" &&
    user.status !== "SUSPENDED";

  if (!eligible || !user) {
    return { resent: false as const };
  }

  await assertOtpRequestLimit(
    input.emailNormalized,
    VerificationPurpose.PASSWORD_RESET,
  );
  const otpCode = generateOtpCode();
  await createPasswordResetOtp({
    emailNormalized: input.emailNormalized,
    userId: user.id,
    code: otpCode,
    requestedByIp: input.ipAddress,
    requestedUserAgent: input.userAgent,
  });
  assertEmailDeliveryConfigured();
  await sendOtpEmail({
    to: user.email,
    code: otpCode,
    purpose: "password_reset",
  });

  return {
    resent: true as const,
    ...(process.env.NODE_ENV !== "production" ? { devOtp: otpCode } : {}),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = forgotPasswordVerifyOtpSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Kode OTP tidak valid." },
      { status: 400 },
    );
  }

  const emailNormalized = normalizeEmail(parsedBody.data.email);
  const code = parsedBody.data.code;
  const now = new Date();

  const verification = await prisma.emailVerification.findFirst({
    where: {
      emailNormalized,
      purpose: VerificationPurpose.PASSWORD_RESET,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!verification || !verification.user) {
    const ipAddress = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");
    let devOtp: string | undefined;
    try {
      const resendResult = await resendResetOtpBestEffort({
        emailNormalized,
        ipAddress,
        userAgent,
      });
      devOtp = resendResult.resent ? resendResult.devOtp : undefined;
    } catch {
      // Best effort resend only.
    }

    return NextResponse.json(
      {
        error:
          "Kode OTP tidak valid atau sudah tidak aktif. Silakan kirim OTP baru.",
        ...(process.env.NODE_ENV !== "production" && devOtp
          ? { devOtp }
          : {}),
      },
      { status: 400 },
    );
  }

  if (
    verification.user.role !== "USER" ||
    verification.user.status === "SUSPENDED" ||
    verification.user.status === "DELETED" ||
    verification.user.deletedAt !== null
  ) {
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { consumedAt: now },
    });

    return NextResponse.json(
      { error: "Akun tidak dapat memproses reset password." },
      { status: 403 },
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
      purpose: VerificationPurpose.PASSWORD_RESET,
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

  const ipAddress = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { consumedAt: now },
  });

  const { resetToken, expiresAt } = await createPasswordResetSession({
    userId: verification.user.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(
    {
      success: true,
      message: "OTP valid. Silakan buat password baru.",
      resetToken,
      expiresAt,
    },
    { status: 200 },
  );
}
