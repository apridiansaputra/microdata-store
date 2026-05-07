import { NextResponse } from "next/server";

import { assertEmailDeliveryConfigured, sendOtpEmail } from "@/lib/auth/email";
import { normalizeEmail } from "@/lib/auth/normalize";
import { generateOtpCode } from "@/lib/auth/otp";
import { resendOtpSchema } from "@/lib/auth/validation";
import {
  assertOtpRequestLimit,
  createRegisterOtp,
} from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = resendOtpSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }

  const emailNormalized = normalizeEmail(parsedBody.data.email);
  const user = await prisma.user.findUnique({
    where: { emailNormalized },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        success: true,
        message: "Jika email terdaftar dan belum terverifikasi, OTP akan dikirim.",
      },
      { status: 200 },
    );
  }

  if (user.status === "ACTIVE" && user.emailVerifiedAt) {
    return NextResponse.json(
      {
        success: true,
        message: "Jika email terdaftar dan belum terverifikasi, OTP akan dikirim.",
      },
      { status: 200 },
    );
  }

  try {
    await assertOtpRequestLimit(emailNormalized);
  } catch {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." },
      { status: 429 },
    );
  }

  try {
    const otpCode = generateOtpCode();
    const ipAddress = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");
    const { expiresAt } = await createRegisterOtp({
      emailNormalized,
      userId: user.id,
      code: otpCode,
      requestedByIp: ipAddress,
      requestedUserAgent: userAgent,
    });

    assertEmailDeliveryConfigured();
    await sendOtpEmail({ to: user.email, code: otpCode, purpose: "register" });

    return NextResponse.json(
      {
        success: true,
        message: "Jika email terdaftar dan belum terverifikasi, OTP akan dikirim.",
        expiresAt,
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

    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim ulang OTP. Coba lagi." },
      { status: 500 },
    );
  }
}
