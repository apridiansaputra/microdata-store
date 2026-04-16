import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  const sessionToken =
    auth.ok ? auth.sessionToken : getSessionTokenFromRequest(request, "admin");

  if (sessionToken) {
    await deleteSessionByToken(sessionToken);
  }

  const response = NextResponse.json(
    { success: true, message: "Berhasil logout admin." },
    { status: 200 },
  );
  clearSessionCookie(response, "admin");
  return response;
}
