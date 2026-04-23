import { OrderStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { syncExpiredPendingOrders } from "@/lib/orders/expiration";
import { serializeAdminOrderDetail } from "@/lib/orders/admin-serializers";
import { adminOrderShippingUpdateSchema } from "@/lib/orders/admin-validation";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/settings/app-settings";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

function normalizeOrderNumber(raw: string) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function deriveOrderStatusFromShippingStatus(input: {
  currentOrderStatus: OrderStatus;
  nextShippingStatus:
    | "WAITING_FULFILLMENT"
    | "READY_TO_SHIP"
    | "SHIPPED"
    | "DELIVERED";
}) {
  if (input.currentOrderStatus === "COMPLETED") return "COMPLETED";
  switch (input.nextShippingStatus) {
    case "WAITING_FULFILLMENT":
    case "READY_TO_SHIP":
      return "PROCESSING";
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    default:
      return "PROCESSING";
  }
}

async function findOrderDetail(orderNumber: string) {
  return prisma.order.findFirst({
    where: {
      orderNumber,
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
      adminNote: true,
      shippingRecipientName: true,
      shippingPhone: true,
      shippingProvinceName: true,
      shippingCityName: true,
      shippingDistrictName: true,
      shippingSubdistrictName: true,
      shippingPostalCode: true,
      shippingStreet: true,
      shippingDetail: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          productName: true,
          productImageUrl: true,
          quantity: true,
          unitPrice: true,
          lineSubtotal: true,
        },
      },
      shipment: {
        select: {
          id: true,
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
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  await syncExpiredPendingOrders();

  const { orderNumber } = await context.params;
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const order = await findOrderDetail(normalizedOrderNumber);
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(
    {
      order: serializeAdminOrderDetail(order),
    },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  await syncExpiredPendingOrders();

  const { orderNumber } = await context.params;
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminOrderShippingUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const appSettings = await getAppSettings();
  const trackingBaseUrl = appSettings.shippingTrackingBaseUrl?.trim() || null;

  const existing = await prisma.order.findFirst({
    where: {
      orderNumber: normalizedOrderNumber,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      shipment: {
        select: {
          id: true,
          trackingNumber: true,
          trackingUrl: true,
          shippedAt: true,
          deliveredAt: true,
          courierCode: true,
          courierName: true,
          serviceCode: true,
          serviceName: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (["CANCELLED", "EXPIRED", "REFUNDED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Pesanan dengan status ini tidak bisa diubah lagi." },
      { status: 409 },
    );
  }

  if (existing.paymentStatus !== "SETTLED") {
    return NextResponse.json(
      { error: "Status pengiriman hanya bisa diubah setelah pembayaran lunas." },
      { status: 409 },
    );
  }

  const nextTrackingNumber =
    payload.trackingNumber !== undefined
      ? payload.trackingNumber.trim().replace(/^#/, "") || null
      : existing.shipment?.trackingNumber ?? null;

  const nextTrackingUrl = trackingBaseUrl;

  if (
    (payload.shippingStatus === "SHIPPED" || payload.shippingStatus === "DELIVERED") &&
    (!nextTrackingNumber || !nextTrackingUrl)
  ) {
    return NextResponse.json(
      {
        error:
          !nextTrackingNumber
            ? "Nomor resi wajib diisi untuk status Dikirim/Selesai."
            : "Tautan ekspedisi belum diatur. Silakan isi di Settings admin.",
      },
      { status: 400 },
    );
  }

  const now = new Date();

  let nextShippedAt: Date | null = existing.shipment?.shippedAt ?? null;
  let nextDeliveredAt: Date | null = existing.shipment?.deliveredAt ?? null;
  if (payload.shippingStatus === "SHIPPED") {
    nextShippedAt = existing.shipment?.shippedAt ?? now;
    nextDeliveredAt = null;
  } else if (payload.shippingStatus === "DELIVERED") {
    nextShippedAt = existing.shipment?.shippedAt ?? now;
    nextDeliveredAt = existing.shipment?.deliveredAt ?? now;
  } else {
    nextShippedAt = null;
    nextDeliveredAt = null;
  }

  const nextOrderStatus = deriveOrderStatusFromShippingStatus({
    currentOrderStatus: existing.status,
    nextShippingStatus: payload.shippingStatus,
  });

  try {
    await prisma.$transaction(async (tx) => {
      if (existing.shipment) {
        await tx.shipment.update({
          where: {
            id: existing.shipment.id,
          },
          data: {
            status: payload.shippingStatus,
            trackingNumber: nextTrackingNumber,
            trackingUrl: nextTrackingUrl,
            shippedAt: nextShippedAt,
            deliveredAt: nextDeliveredAt,
          },
        });
      } else {
        await tx.shipment.create({
          data: {
            orderId: existing.id,
            provider: "RAJAONGKIR",
            courierCode: "manual",
            courierName: "Manual",
            serviceCode: "manual",
            serviceName: "Manual Shipping",
            status: payload.shippingStatus,
            trackingNumber: nextTrackingNumber,
            trackingUrl: nextTrackingUrl,
            shippedAt: nextShippedAt,
            deliveredAt: nextDeliveredAt,
          },
        });
      }

      await tx.order.update({
        where: {
          id: existing.id,
        },
        data: {
          shippingStatus: payload.shippingStatus,
          status: nextOrderStatus,
          ...(payload.adminNote !== undefined
            ? { adminNote: payload.adminNote.trim() || null }
            : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Nomor resi sudah digunakan oleh pesanan lain." },
        { status: 409 },
      );
    }

    console.error("Admin update shipment error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pengiriman." },
      { status: 500 },
    );
  }

  const updated = await findOrderDetail(normalizedOrderNumber);
  if (!updated) {
    return NextResponse.json(
      { error: "Status berhasil diubah, tetapi gagal memuat ulang data." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      order: serializeAdminOrderDetail(updated),
    },
    { status: 200 },
  );
}
