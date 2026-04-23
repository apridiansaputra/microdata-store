import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

function normalizeOrderNumber(raw: string) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { orderNumber } = await context.params;
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: normalizedOrderNumber,
      userId: auth.user.id,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      shipment: {
        select: {
          id: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (order.status === "COMPLETED") {
    return NextResponse.json(
      { success: true, message: "Pesanan ini sudah dikonfirmasi selesai." },
      { status: 200 },
    );
  }

  if (["CANCELLED", "EXPIRED", "REFUNDED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Pesanan dengan status ini tidak bisa dikonfirmasi." },
      { status: 409 },
    );
  }

  if (order.paymentStatus !== "SETTLED") {
    return NextResponse.json(
      { error: "Pesanan belum lunas, tidak bisa dikonfirmasi diterima." },
      { status: 409 },
    );
  }

  if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Pesanan belum berada pada tahap pengiriman." },
      { status: 409 },
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (order.shipment) {
      await tx.shipment.update({
        where: {
          id: order.shipment.id,
        },
        data: {
          status: "DELIVERED",
          shippedAt: order.shipment.shippedAt ?? now,
          deliveredAt: order.shipment.deliveredAt ?? now,
        },
      });
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "COMPLETED",
        shippingStatus: "DELIVERED",
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Terima kasih. Pesanan sudah dikonfirmasi diterima.",
    },
    { status: 200 },
  );
}
