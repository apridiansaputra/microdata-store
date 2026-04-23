import type { NegotiationStatus } from "@prisma/client";

export const NEGOTIATION_MIN_TOTAL = 50_000_000;

export function createNegotiationNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NGO-${timestamp}-${random}`;
}

export function getNegotiationStatusLabel(status: NegotiationStatus) {
  switch (status) {
    case "OPEN":
      return "Menunggu Tanggapan";
    case "COUNTERED":
      return "Ditanggapi";
    case "ACCEPTED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    case "EXPIRED":
    case "CANCELLED":
      return "Dibatalkan";
    default:
      return status;
  }
}

export function normalizeNegotiationNumber(raw: string) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export function isNegotiationClosed(status: NegotiationStatus) {
  return ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].includes(status);
}
