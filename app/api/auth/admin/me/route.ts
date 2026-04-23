import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json(
    { user: auth.user },
    { status: 200 },
  );
}
