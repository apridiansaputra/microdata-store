import { VerificationPurpose } from "@prisma/client";

import {
  OTP_EXPIRES_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MINUTES,
} from "@/lib/auth/config";
import { hashOtpCode } from "@/lib/auth/otp";
import { prisma } from "@/lib/prisma";

export async function assertOtpRequestLimit(emailNormalized: string) {
  const startedAt = new Date(
    Date.now() - OTP_REQUEST_WINDOW_MINUTES * 60_000,
  );

  const totalInWindow = await prisma.emailVerification.count({
    where: {
      emailNormalized,
      purpose: VerificationPurpose.REGISTER,
      createdAt: { gte: startedAt },
    },
  });

  if (totalInWindow >= OTP_MAX_REQUESTS_PER_WINDOW) {
    throw new Error("OTP_RATE_LIMIT");
  }
}

export async function createRegisterOtp(input: {
  emailNormalized: string;
  userId: string;
  code: string;
  requestedByIp: string | null;
  requestedUserAgent: string | null;
}) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.emailVerification.updateMany({
      where: {
        emailNormalized: input.emailNormalized,
        purpose: VerificationPurpose.REGISTER,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });

    await tx.emailVerification.create({
      data: {
        userId: input.userId,
        emailNormalized: input.emailNormalized,
        purpose: VerificationPurpose.REGISTER,
        codeHash: hashOtpCode({
          code: input.code,
          emailNormalized: input.emailNormalized,
          purpose: VerificationPurpose.REGISTER,
        }),
        attemptCount: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt,
        requestedByIp: input.requestedByIp?.slice(0, 45) ?? null,
        requestedUserAgent: input.requestedUserAgent?.slice(0, 500) ?? null,
      },
    });
  });

  return { expiresAt };
}

