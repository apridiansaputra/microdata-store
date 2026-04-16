import { NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const sessionToken = getSessionTokenFromRequest(request, "user");

  if (sessionToken) {
    await deleteSessionByToken(sessionToken);
  }

  const response = NextResponse.json(
    { success: true, message: "Berhasil logout." },
    { status: 200 },
  );
  clearSessionCookie(response, "user");
  return response;
}
