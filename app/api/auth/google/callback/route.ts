import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { OAUTH_STATE_COOKIE_NAME, shouldCookieBeSecure } from "@/lib/auth/config";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  upsertGoogleAuthUser,
} from "@/lib/auth/google";
import {
  createOAuthErrorRedirect,
  isOAuthStateValidFromCookie,
  parseReturnToFromState,
} from "@/lib/auth/oauth-state";
import { createUserSession, setSessionCookie } from "@/lib/auth/session";

function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set({
    name: OAUTH_STATE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: shouldCookieBeSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function redirectWithError(errorCode: string) {
  const response = NextResponse.redirect(createOAuthErrorRedirect(errorCode));
  clearOAuthStateCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthStateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (
    !code ||
    !isOAuthStateValidFromCookie({
      cookieValue: oauthStateCookie,
      receivedState: state,
    })
  ) {
    return redirectWithError("google_state_invalid");
  }

  try {
    const token = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(token.accessToken);
    const authUser = await upsertGoogleAuthUser({
      profile,
      token,
    });

    const session = await createUserSession({
      userId: authUser.id,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    });

    const returnTo = parseReturnToFromState(state);
    const targetUrl = new URL(returnTo, request.nextUrl.origin);
    const response = NextResponse.redirect(targetUrl);
    clearOAuthStateCookie(response);
    setSessionCookie(response, session.sessionToken, session.expiresAt, "user");
    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GOOGLE_OAUTH:ACCOUNT_BLOCKED"
    ) {
      return redirectWithError("account_blocked");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return redirectWithError("google_account_conflict");
      }
    }

    return redirectWithError("google_oauth_failed");
  }
}
