import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { assertEmailDeliveryConfigured, sendOtpEmail } from "@/lib/auth/email";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/normalize";
import { isStrongPassword, hashPassword } from "@/lib/auth/password";
import { generateOtpCode } from "@/lib/auth/otp";
import { registerSchema } from "@/lib/auth/validation";
import {
  assertOtpRequestLimit,
  createRegisterOtp,
} from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const emailNormalized = normalizeEmail(payload.email);
  const usernameNormalized = payload.username
    ? normalizeUsername(payload.username)
    : null;
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  if (!isStrongPassword(payload.password)) {
    return NextResponse.json(
      {
        error:
          "Password harus minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.",
      },
      { status: 400 },
    );
  }

  if (usernameNormalized) {
    const usernameOwner = await prisma.user.findFirst({
      where: {
        username: usernameNormalized,
        NOT: { emailNormalized },
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

  try {
    await assertOtpRequestLimit(emailNormalized);
  } catch (error) {
    if (error instanceof Error && error.message === "OTP_RATE_LIMIT") {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." },
        { status: 429 },
      );
    }

    throw error;
  }

  const passwordHash = await hashPassword(payload.password);
  const otpCode = generateOtpCode();
  const ipAddress = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  const existingUser = await prisma.user.findUnique({
    where: { emailNormalized },
    select: { status: true, emailVerifiedAt: true },
  });

  if (existingUser?.status === "ACTIVE" && existingUser.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan login." },
      { status: 409 },
    );
  }

  try {
    const upsertedUser = await prisma.user.upsert({
      where: { emailNormalized },
      update: {
        fullName,
        username: usernameNormalized,
        phone: payload.phone ?? null,
        passwordHash,
        status: "PENDING_VERIFICATION",
        emailVerifiedAt: null,
        deletedAt: null,
      },
      create: {
        email: emailNormalized,
        emailNormalized,
        fullName,
        username: usernameNormalized,
        phone: payload.phone ?? null,
        passwordHash,
        role: "USER",
        status: "PENDING_VERIFICATION",
      },
      select: {
        id: true,
        email: true,
      },
    });

    const { expiresAt } = await createRegisterOtp({
      emailNormalized,
      userId: upsertedUser.id,
      code: otpCode,
      requestedByIp: ipAddress,
      requestedUserAgent: userAgent,
    });

    assertEmailDeliveryConfigured();
    await sendOtpEmail({
      to: upsertedUser.email,
      code: otpCode,
      purpose: "register",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kode OTP berhasil dikirim ke email.",
        email: upsertedUser.email,
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devOtp: otpCode } : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Data duplikat terdeteksi. Coba gunakan data lain." },
          { status: 409 },
        );
      }
    }

    if (error instanceof Error) {
      if (error.message === "EMAIL_CONFIG_MISSING") {
        return NextResponse.json(
          { error: "Konfigurasi email OTP belum lengkap di server." },
          { status: 500 },
        );
      }


    }

    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mendaftar. Coba lagi." },
      { status: 500 },
    );
  }
}
