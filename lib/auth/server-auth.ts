import type { Role, UserStatus } from "@prisma/client";
import { cookies } from "next/headers";

import { getSessionCookieName, type SessionKind } from "@/lib/auth/config";
import { maybeCleanupExpiredSessions } from "@/lib/auth/session-cleanup";
import { hashSessionToken } from "@/lib/auth/session-token";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  role: Role;
  status: UserStatus;
};

export function isAdminRole(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function getCurrentSessionUser(kind: SessionKind = "user") {
  void maybeCleanupExpiredSessions();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName(kind))?.value;
  if (!sessionToken) return null;
  const sessionTokenHash = hashSessionToken(sessionToken);

  const session = await prisma.session.findUnique({
    where: { sessionToken: sessionTokenHash },
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

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user satisfies SessionUser;
}
