import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { serializeOrderListItem } from "@/lib/orders/serializers";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/settings/app-settings";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), 10), 20);
  const skip = (page - 1) * pageSize;

  const [total, orders, settings] = await Promise.all([
    prisma.order.count({
      where: {
        userId: auth.user.id,
        deletedAt: null,
      },
    }),
    prisma.order.findMany({
      where: {
        userId: auth.user.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
      select: {
        orderNumber: true,
        placedAt: true,
        expiresAt: true,
        status: true,
        paymentStatus: true,
        shippingStatus: true,
        grandTotalAmount: true,
        items: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            productSlug: true,
            productName: true,
            productImageUrl: true,
            quantity: true,
          },
        },
        shipment: {
          select: {
            trackingNumber: true,
            trackingUrl: true,
            courierName: true,
            serviceName: true,
          },
        },
      },
    }),
    getAppSettings(),
  ]);

  return NextResponse.json(
    {
      orders: orders.map((order) =>
        serializeOrderListItem(order, {
          defaultTrackingUrl: settings.shippingTrackingBaseUrl ?? null,
        }),
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
    { status: 200 },
  );
}
