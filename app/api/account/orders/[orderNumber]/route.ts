import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { syncExpiredPendingOrders } from "@/lib/orders/expiration";
import { serializeOrderDetail } from "@/lib/orders/serializers";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  await syncExpiredPendingOrders();

  const { orderNumber } = await context.params;
  let normalizedOrderNumber = orderNumber.trim();
  try {
    normalizedOrderNumber = decodeURIComponent(orderNumber).trim();
  } catch {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const [order, settings] = await prisma.$transaction([
    prisma.order.findFirst({
      where: {
        orderNumber: normalizedOrderNumber,
        userId: auth.user.id,
        deletedAt: null,
      },
    select: {
      id: true,
      orderNumber: true,
      placedAt: true,
      paidAt: true,
      cancelledAt: true,
      expiresAt: true,
      status: true,
      paymentStatus: true,
      shippingStatus: true,
      subtotalAmount: true,
      shippingAmount: true,
      discountAmount: true,
      taxAmount: true,
      grandTotalAmount: true,
      shippingRecipientName: true,
      shippingPhone: true,
      shippingProvinceName: true,
      shippingCityName: true,
      shippingDistrictName: true,
      shippingSubdistrictName: true,
      shippingPostalCode: true,
      shippingStreet: true,
      shippingDetail: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          productId: true,
          productSlug: true,
          productSku: true,
          productName: true,
          productImageUrl: true,
          quantity: true,
          unitPrice: true,
          lineSubtotal: true,
        },
      },
      shipment: {
        select: {
          courierCode: true,
          courierName: true,
          serviceCode: true,
          serviceName: true,
          trackingNumber: true,
          trackingUrl: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
        },
      },
      },
    }),
    prisma.appSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        shippingCourierCode: "jne",
        shippingCourierName: "JNE",
        bannerAutoplayMs: 5000,
      },
      update: {},
    }),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(
    {
      order: serializeOrderDetail(order, {
        defaultTrackingUrl: settings.shippingTrackingBaseUrl ?? null,
      }),
    },
    { status: 200 },
  );
}
