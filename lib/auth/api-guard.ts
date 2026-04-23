import type { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { SessionKind } from "@/lib/auth/config";
import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
  getSessionWithUser,
  toSafeAuthUser,
} from "@/lib/auth/session";

type GuardedUser = ReturnType<typeof toSafeAuthUser>;

type AuthGuardFailure = {
  ok: false;
  response: NextResponse;
};

type AuthGuardSuccess = {
  ok: true;
  user: GuardedUser;
  sessionToken: string;
};

export type AuthGuardResult = AuthGuardFailure | AuthGuardSuccess;

function buildAuthErrorResponse(input: {
  status: number;
  error: string;
  clearCookieKind?: SessionKind;
}) {
  const response = NextResponse.json({ error: input.error }, { status: input.status });
  if (input.clearCookieKind) {
    clearSessionCookie(response, input.clearCookieKind);
  }
  return response;
}

async function requireSessionByKind(input: {
  request: NextRequest;
  kind: SessionKind;
  allowedRoles: Role[];
}) {
  const sessionToken = getSessionTokenFromRequest(input.request, input.kind);
  if (!sessionToken) {
    return {
      ok: false,
      response: buildAuthErrorResponse({
        status: 401,
        error: "Unauthorized",
      }),
    } satisfies AuthGuardFailure;
  }

  const session = await getSessionWithUser(sessionToken);
  if (!session || session.expiresAt <= new Date()) {
    await deleteSessionByToken(sessionToken);

    return {
      ok: false,
      response: buildAuthErrorResponse({
        status: 401,
        error: "Unauthorized",
        clearCookieKind: input.kind,
      }),
    } satisfies AuthGuardFailure;
  }

  if (session.user.status !== "ACTIVE") {
    await deleteSessionByToken(sessionToken);

    return {
      ok: false,
      response: buildAuthErrorResponse({
        status: 403,
        error: "Forbidden",
        clearCookieKind: input.kind,
      }),
    } satisfies AuthGuardFailure;
  }

  if (!input.allowedRoles.includes(session.user.role)) {
    return {
      ok: false,
      response: buildAuthErrorResponse({
        status: 403,
        error: "Forbidden",
      }),
    } satisfies AuthGuardFailure;
  }

  return {
    ok: true,
    user: toSafeAuthUser(session.user),
    sessionToken,
  } satisfies AuthGuardSuccess;
}

export async function requireUser(request: NextRequest): Promise<AuthGuardResult> {
  return requireSessionByKind({
    request,
    kind: "user",
    allowedRoles: ["USER", "ADMIN", "SUPER_ADMIN"],
  });
}

export async function requireAdmin(request: NextRequest): Promise<AuthGuardResult> {
  return requireSessionByKind({
    request,
    kind: "admin",
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  });
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthGuardResult> {
  return requireSessionByKind({
    request,
    kind: "admin",
    allowedRoles: ["SUPER_ADMIN"],
  });
}
