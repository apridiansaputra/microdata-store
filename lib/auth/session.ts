import type { Role, UserStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionCookieName, SESSION_TTL_MS, shouldCookieBeSecure, type SessionKind } from "@/lib/auth/config";
import { maybeCleanupExpiredSessions } from "@/lib/auth/session-cleanup";
import { hashSessionToken } from "@/lib/auth/session-token";
import { prisma } from "@/lib/prisma";

function sanitizeIpAddress(rawIp: string | null) {
  if (!rawIp) return null;
  const firstIp = rawIp.split(",")[0]?.trim();
  if (!firstIp) return null;
  return firstIp.slice(0, 45);
}

function sanitizeUserAgent(rawUserAgent: string | null) {
  if (!rawUserAgent) return null;
  return rawUserAgent.slice(0, 500);
}

export function createSessionToken() {
  return randomBytes(48).toString("base64url");
}

export function createSessionExpiryDate() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: Date,
  kind: SessionKind = "user",
) {
  response.cookies.set({
    name: getSessionCookieName(kind),
    value: sessionToken,
    httpOnly: true,
    secure: shouldCookieBeSecure(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse, kind: SessionKind = "user") {
  response.cookies.set({
    name: getSessionCookieName(kind),
    value: "",
    httpOnly: true,
    secure: shouldCookieBeSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function createUserSession(input: {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  void maybeCleanupExpiredSessions();

  const rawSessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(rawSessionToken);
  const expiresAt = createSessionExpiryDate();

  await prisma.session.create({
    data: {
      userId: input.userId,
      sessionToken: sessionTokenHash,
      expiresAt,
      ipAddress: sanitizeIpAddress(input.ipAddress),
      userAgent: sanitizeUserAgent(input.userAgent),
    },
  });

  return { sessionToken: rawSessionToken, expiresAt };
}

export async function getSessionWithUser(sessionToken: string) {
  void maybeCleanupExpiredSessions();

  const sessionTokenHash = hashSessionToken(sessionToken);

  return prisma.session.findUnique({
    where: { sessionToken: sessionTokenHash },
    include: { user: true },
  });
}

export async function deleteSessionByToken(sessionToken: string) {
  const sessionTokenHash = hashSessionToken(sessionToken);

  await prisma.session.deleteMany({
    where: { sessionToken: sessionTokenHash },
  });
}

export function getSessionTokenFromRequest(
  request: { cookies: { get: (name: string) => { value: string } | undefined } },
  kind: SessionKind = "user",
) {
  return request.cookies.get(getSessionCookieName(kind))?.value;
}

type SafeAuthUserInput = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  role: Role;
  status: UserStatus;
};

export function toSafeAuthUser(user: SafeAuthUserInput) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    status: user.status,
  };
}
