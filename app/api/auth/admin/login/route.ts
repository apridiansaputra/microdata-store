import { NextResponse } from "next/server";

import { createAdminAuthAuditLog } from "@/lib/auth/admin-audit";
import {
  clearLoginRateLimit,
  createLoginRateLimitKey,
  getClientIpAddress,
  getLoginRateLimitStatus,
  registerLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/normalize";
import { verifyPassword } from "@/lib/auth/password";
import { isAdminRole } from "@/lib/auth/server-auth";
import {
  createUserSession,
  setSessionCookie,
  toSafeAuthUser,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

const INVALID_CREDENTIALS_MESSAGE = "Email/username atau password salah.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Input login admin tidak valid." },
      { status: 400 },
    );
  }

  const { identifier, password } = parsedBody.data;
  const isEmail = identifier.includes("@");
  const ipAddress = getClientIpAddress(request);
  const rateLimitKey = createLoginRateLimitKey({
    scope: "admin_login",
    identifier,
    ipAddress,
  });
  const rateLimitStatus = getLoginRateLimitStatus(rateLimitKey);

  if (rateLimitStatus.isBlocked) {
    return NextResponse.json(
      {
        error: "Terlalu banyak percobaan login admin. Coba lagi beberapa saat lagi.",
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

  if (!isAdminRole(user.role)) {
    registerLoginFailure(rateLimitKey);
    await createAdminAuthAuditLog({
      actorUserId: user.id,
      action: "ADMIN_LOGIN_DENIED_ROLE",
      request,
      metadata: {
        role: user.role,
      },
    });

    return NextResponse.json(
      { error: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  if (user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    registerLoginFailure(rateLimitKey);
    await createAdminAuthAuditLog({
      actorUserId: user.id,
      action: "ADMIN_LOGIN_DENIED_STATUS",
      request,
      metadata: {
        status: user.status,
      },
    });

    return NextResponse.json(
      { error: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  const passwordMatched = await verifyPassword(password, user.passwordHash);
  if (!passwordMatched) {
    registerLoginFailure(rateLimitKey);
    await createAdminAuthAuditLog({
      actorUserId: user.id,
      action: "ADMIN_LOGIN_FAILED_PASSWORD",
      request,
    });

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
  await createAdminAuthAuditLog({
    actorUserId: user.id,
    action: "ADMIN_LOGIN_SUCCESS",
    request,
    metadata: {
      role: user.role,
    },
  });
  clearLoginRateLimit(rateLimitKey);

  const response = NextResponse.json(
    {
      success: true,
      message: "Login admin berhasil.",
      user: toSafeAuthUser(user),
    },
    { status: 200 },
  );
  setSessionCookie(response, session.sessionToken, session.expiresAt, "admin");
  return response;
}
