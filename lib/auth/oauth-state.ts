import { timingSafeEqual } from "node:crypto";

import { getAuthBaseUrl } from "@/lib/auth/config";

function sanitizeReturnTo(rawReturnTo: string | null) {
  if (!rawReturnTo) return "/";
  if (!rawReturnTo.startsWith("/")) return "/";
  if (rawReturnTo.startsWith("//")) return "/";
  return rawReturnTo;
}

export function createEncodedOAuthState(input: {
  state: string;
  returnTo: string | null;
}) {
  const returnTo = sanitizeReturnTo(input.returnTo);
  const combinedState = `${input.state}:${returnTo}`;
  return Buffer.from(combinedState, "utf8").toString("base64url");
}

export function isOAuthStateValidFromCookie(input: {
  cookieValue: string | undefined;
  receivedState: string | null;
}) {
  if (!input.cookieValue || !input.receivedState) return false;
  const a = Buffer.from(input.cookieValue, "utf8");
  const b = Buffer.from(input.receivedState, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseReturnToFromState(encodedState: string | null) {
  if (!encodedState) return "/";

  try {
    const decoded = Buffer.from(encodedState, "base64url").toString("utf8");
    const splitIndex = decoded.indexOf(":");
    if (splitIndex < 0) return "/";
    const rawReturnTo = decoded.slice(splitIndex + 1);
    return sanitizeReturnTo(rawReturnTo);
  } catch {
    return "/";
  }
}

export function createOAuthErrorRedirect(error: string) {
  const baseUrl = getAuthBaseUrl();
  const url = new URL("/login", baseUrl);
  url.searchParams.set("error", error);
  return url.toString();
}
