import type { Prisma } from "@prisma/client";

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

export async function createAdminAuthAuditLog(input: {
  actorUserId: string;
  action:
    | "ADMIN_LOGIN_SUCCESS"
    | "ADMIN_LOGIN_FAILED_PASSWORD"
    | "ADMIN_LOGIN_DENIED_ROLE"
    | "ADMIN_LOGIN_DENIED_STATUS";
  request: Request;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: "AUTH",
        entityId: input.actorUserId,
        ipAddress: sanitizeIpAddress(input.request.headers.get("x-forwarded-for")),
        userAgent: sanitizeUserAgent(input.request.headers.get("user-agent")),
        metadata: input.metadata ?? undefined,
      },
    });
  } catch {
    // Best-effort. Login flow must not fail due to audit insertion.
  }
}
