import { NextResponse } from "next/server";

import {
  clearLoginRateLimit,
  createLoginRateLimitKey,
  getClientIpAddress,
  getLoginRateLimitStatus,
  registerLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/normalize";
import { verifyPassword } from "@/lib/auth/password";
import { createUserSession, setSessionCookie, toSafeAuthUser } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

const INVALID_CREDENTIALS_MESSAGE = "Email/username atau password salah.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Input login tidak valid." },
      { status: 400 },
    );
  }

  const { identifier, password } = parsedBody.data;
  const isEmail = identifier.includes("@");
  const ipAddress = getClientIpAddress(request);
  const rateLimitKey = createLoginRateLimitKey({
    scope: "user_login",
    identifier,
    ipAddress,
  });
  const rateLimitStatus = getLoginRateLimitStatus(rateLimitKey);

  if (rateLimitStatus.isBlocked) {
    return NextResponse.json(
      {
        error: "Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        },
      },
    );
  }

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { emailNormalized: normalizeEmail(identifier), deletedAt: null }
      : { username: normalizeUsername(identifier), deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      username: true,
      role: true,
      status: true,
      passwordHash: true,
      emailVerifiedAt: true,
    },
  });

  if (!user?.passwordHash) {
    registerLoginFailure(rateLimitKey);

    return NextResponse.json(
      { error: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  if (user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    registerLoginFailure(rateLimitKey);

    return NextResponse.json(
      { error: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  const passwordMatched = await verifyPassword(password, user.passwordHash);
  if (!passwordMatched) {
    registerLoginFailure(rateLimitKey);

    return NextResponse.json(
      { error: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  const session = await createUserSession({
    userId: user.id,
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  clearLoginRateLimit(rateLimitKey);

  const response = NextResponse.json(
    {
      success: true,
      message: "Login berhasil.",
      user: toSafeAuthUser(user),
    },
    { status: 200 },
  );
  setSessionCookie(response, session.sessionToken, session.expiresAt, "user");
  return response;
}
