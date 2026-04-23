import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const SCRYPT_KEYLEN = 64;
const scrypt = promisify(scryptCallback);

async function deriveScryptHash(plainPassword: string, salt: string) {
  const derivedBuffer = (await scrypt(plainPassword, salt, SCRYPT_KEYLEN)) as Buffer;
  return derivedBuffer.toString("hex");
}

export async function hashPassword(plainPassword: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await deriveScryptHash(plainPassword, salt);
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(plainPassword: string, storedHash: string) {
  const [scheme, salt, originalHash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !originalHash) {
    return false;
  }

  const derivedHash = await deriveScryptHash(plainPassword, salt);
  const originalBuffer = Buffer.from(originalHash, "hex");
  const derivedBuffer = Buffer.from(derivedHash, "hex");

  if (originalBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(originalBuffer, derivedBuffer);
}

export function isStrongPassword(password: string) {
  if (password.length < 12 || password.length > 128) {
    return false;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasUpper && hasLower && hasNumber && hasSymbol;
}
