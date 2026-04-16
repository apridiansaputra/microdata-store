import { NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
  getSessionWithUser,
  toSafeAuthUser,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const sessionToken = getSessionTokenFromRequest(request, "user");
  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = await getSessionWithUser(sessionToken);
  if (!session || session.expiresAt <= new Date()) {
    if (sessionToken) {
      await deleteSessionByToken(sessionToken);
    }

    const response = NextResponse.json({ user: null }, { status: 200 });
    clearSessionCookie(response, "user");
    return response;
  }

  return NextResponse.json(
    { user: toSafeAuthUser(session.user) },
    { status: 200 },
  );
}
