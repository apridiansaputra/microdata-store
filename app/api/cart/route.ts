import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { getCartPayloadByUserId } from "@/lib/cart/service";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const cart = await getCartPayloadByUserId(auth.user.id);
  return NextResponse.json({ cart }, { status: 200 });
}
