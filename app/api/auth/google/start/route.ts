import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_MS,
  shouldCookieBeSecure,
} from "@/lib/auth/config";
import { createGoogleAuthUrl } from "@/lib/auth/google";
import {
  createEncodedOAuthState,
  createOAuthErrorRedirect,
} from "@/lib/auth/oauth-state";

function createOAuthState() {
  return randomBytes(32).toString("hex");
}

export function GET(request: NextRequest) {
  const state = createOAuthState();
  const encodedState = createEncodedOAuthState({
    state,
    returnTo: request.nextUrl.searchParams.get("returnTo"),
  });
  let authUrl = "";

  try {
    authUrl = createGoogleAuthUrl(encodedState);
  } catch {
    return NextResponse.redirect(createOAuthErrorRedirect("google_not_configured"));
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: OAUTH_STATE_COOKIE_NAME,
    value: encodedState,
    httpOnly: true,
    secure: shouldCookieBeSecure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });

  return response;
}
