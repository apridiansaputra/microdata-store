import { VerificationPurpose } from "@prisma/client";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { OTP_LENGTH, getAuthSecret } from "@/lib/auth/config";

type OtpHashInput = {
  code: string;
  emailNormalized: string;
  purpose: VerificationPurpose;
};

function buildOtpPayload({
  code,
  emailNormalized,
  purpose,
}: OtpHashInput) {
  const secret = getAuthSecret();
  return `${secret}:${emailNormalized}:${purpose}:${code}`;
}

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const value = randomInt(0, max);
  return value.toString().padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(input: OtpHashInput) {
  return createHash("sha256").update(buildOtpPayload(input)).digest("hex");
}

export function verifyOtpCode(input: OtpHashInput, storedHash: string) {
  const computedHash = hashOtpCode(input);
  const stored = Buffer.from(storedHash, "hex");
  const computed = Buffer.from(computedHash, "hex");

  if (stored.length !== computed.length) {
    return false;
  }

  return timingSafeEqual(stored, computed);
}

