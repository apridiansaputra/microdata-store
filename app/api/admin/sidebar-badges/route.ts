import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const [ordersPendingAction, negotiationsPendingAction] = await prisma.$transaction([
    prisma.order.count({
      where: {
        deletedAt: null,
        paymentStatus: "SETTLED",
        shippingStatus: "WAITING_FULFILLMENT",
      },
    }),
    prisma.negotiation.count({
      where: {
        status: "OPEN",
      },
    }),
  ]);

  return NextResponse.json(
    {
      ordersPendingAction,
      negotiationsPendingAction,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
