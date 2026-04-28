import { createHash, randomBytes } from "node:crypto";

import {
  PASSWORD_RESET_SESSION_MS,
  getAuthSecret,
} from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_SESSION_PREFIX = "reset$";

function hashPasswordResetToken(rawToken: string) {
  return createHash("sha256")
    .update(`${getAuthSecret()}:password_reset:${rawToken}`)
    .digest("hex");
}

function buildPasswordResetSessionToken(rawToken: string) {
  return `${PASSWORD_RESET_SESSION_PREFIX}${hashPasswordResetToken(rawToken)}`;
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export async function createPasswordResetSession(input: {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const rawToken = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_SESSION_MS);
  const sessionToken = buildPasswordResetSessionToken(rawToken);

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        userId: input.userId,
        sessionToken: {
          startsWith: PASSWORD_RESET_SESSION_PREFIX,
        },
      },
    });

    await tx.session.create({
      data: {
        userId: input.userId,
        sessionToken,
        expiresAt,
        ipAddress: input.ipAddress?.slice(0, 45) ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
      },
    });
  });

  return {
    resetToken: rawToken,
    expiresAt,
  };
}

export async function getPasswordResetSession(rawToken: string) {
  const sessionToken = buildPasswordResetSessionToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          emailNormalized: true,
          role: true,
          status: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return session;
}
