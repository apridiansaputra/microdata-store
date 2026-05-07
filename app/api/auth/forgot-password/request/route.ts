import { NextResponse } from "next/server";

import { assertEmailDeliveryConfigured, sendOtpEmail } from "@/lib/auth/email";
import { normalizeEmail } from "@/lib/auth/normalize";
import { generateOtpCode } from "@/lib/auth/otp";
import { forgotPasswordRequestSchema } from "@/lib/auth/validation";
import {
  assertOtpRequestLimit,
  createPasswordResetOtp,
} from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";
import { VerificationPurpose } from "@prisma/client";

const GENERIC_SUCCESS_MESSAGE =
  "Jika email terdaftar, kode OTP reset password akan dikirim.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = forgotPasswordRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }

  const emailNormalized = normalizeEmail(parsedBody.data.email);
  const user = await prisma.user.findUnique({
    where: { emailNormalized },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  let canSendOtp = false;
  let denyReason = "user_not_found";

  if (user) {
    if (user.role !== "USER") {
      denyReason = "role_not_user";
    } else if (user.deletedAt !== null || user.status === "DELETED") {
      denyReason = "user_deleted";
    } else if (user.status === "SUSPENDED") {
      denyReason = "user_suspended";
    } else {
      // Izinkan ACTIVE + PENDING_VERIFICATION agar flow reset tidak false-negative.
      canSendOtp = true;
      denyReason = "eligible";
    }
  }

  if (!canSendOtp) {
    return NextResponse.json(
      {
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
        ...(process.env.NODE_ENV !== "production"
          ? {
              devCanReset: false,
              devReason: denyReason,
            }
          : {}),
      },
      { status: 200 },
    );
  }

  try {
    await assertOtpRequestLimit(
      emailNormalized,
      VerificationPurpose.PASSWORD_RESET,
    );
  } catch {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." },
      { status: 429 },
    );
  }

  // TypeScript cannot infer that `user` is non-null from the `canSendOtp` flag,
  // but at this point user is guaranteed to exist because canSendOtp is true.
  if (!user) {
    return NextResponse.json(
      { success: true, message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 },
    );
  }

  try {
    const otpCode = generateOtpCode();
    const ipAddress = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");

    const { expiresAt } = await createPasswordResetOtp({
      emailNormalized,
      userId: user.id,
      code: otpCode,
      requestedByIp: ipAddress,
      requestedUserAgent: userAgent,
    });

    assertEmailDeliveryConfigured();
    await sendOtpEmail({
      to: user.email,
      code: otpCode,
      purpose: "password_reset",
    });

    return NextResponse.json(
      {
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devCanReset: true } : {}),
        ...(process.env.NODE_ENV !== "production" ? { devOtp: otpCode } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_CONFIG_MISSING") {
        return NextResponse.json(
          { error: "Konfigurasi email OTP belum lengkap di server." },
          { status: 500 },
        );
      }


    }

    console.error("Forgot password request error:", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan lupa password." },
      { status: 500 },
    );
  }
}
