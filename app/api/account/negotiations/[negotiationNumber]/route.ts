import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { serializeNegotiationDetail } from "@/lib/negotiations/serializers";
import {
  isNegotiationClosed,
  normalizeNegotiationNumber,
} from "@/lib/negotiations/utils";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    negotiationNumber: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { negotiationNumber } = await context.params;
  const normalizedNumber = normalizeNegotiationNumber(negotiationNumber);
  if (!normalizedNumber) {
    return NextResponse.json({ error: "ID negosiasi tidak valid." }, { status: 400 });
  }

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      negotiationNumber: normalizedNumber,
      userId: auth.user.id,
    },
    select: {
      id: true,
      negotiationNumber: true,
      status: true,
      submittedAt: true,
      respondedAt: true,
      closedAt: true,
      requestedTotalAmount: true,
      counterTotalAmount: true,
      finalTotalAmount: true,
      notes: true,
      finalOrderId: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          quantity: true,
          baseUnitPrice: true,
          buyerOfferUnitPrice: true,
          adminCounterUnitPrice: true,
          finalUnitPrice: true,
          product: {
            select: {
              name: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!negotiation) {
    return NextResponse.json({ error: "Data negosiasi tidak ditemukan." }, { status: 404 });
  }

  const detail = serializeNegotiationDetail(negotiation);
  const canSubmitOffer = !isNegotiationClosed(negotiation.status);
  const canCheckout =
    (negotiation.status === "COUNTERED" || negotiation.status === "ACCEPTED") &&
    !negotiation.finalOrderId;

  return NextResponse.json(
    {
      negotiation: {
        ...detail,
        canSubmitOffer,
        canCheckout,
        finalOrderId: negotiation.finalOrderId,
      },
    },
    { status: 200 },
  );
}
