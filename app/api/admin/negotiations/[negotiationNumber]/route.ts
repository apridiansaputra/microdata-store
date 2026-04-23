import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
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
  const auth = await requireAdmin(request);
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
      processedById: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          addresses: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            take: 1,
            select: {
              provinceName: true,
              cityName: true,
              districtName: true,
              subdistrictName: true,
              postalCode: true,
              street: true,
              detail: true,
            },
          },
        },
      },
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
  const address = negotiation.user.addresses[0] ?? null;
  const customerAddress = address
    ? [
        [address.street, address.detail].filter(Boolean).join(", "),
        [
          address.subdistrictName,
          address.districtName,
          address.cityName,
          address.provinceName,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(" | ")
    : null;

  return NextResponse.json(
    {
      negotiation: {
        ...detail,
        customer: {
          id: negotiation.user.id,
          fullName: negotiation.user.fullName,
          email: negotiation.user.email,
          phone: negotiation.user.phone,
          address: customerAddress,
        },
        canRespond: !isNegotiationClosed(negotiation.status),
      },
    },
    { status: 200 },
  );
}
