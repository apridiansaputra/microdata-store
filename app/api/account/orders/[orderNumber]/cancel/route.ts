import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { syncExpiredPendingOrders } from "@/lib/orders/expiration";
import { expireXenditInvoice, getXenditConfig, mapXenditPaymentStatus } from "@/lib/payment/xendit";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

function parseInvoiceIdFromOrderNotes(notes: string | null) {
  if (!notes) return null;
  const matched = notes.match(/xendit invoice:\s*([a-z0-9._-]+)/i);
  return matched?.[1] ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
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
      notes: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          providerOrderId: true,
          status: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (order.status !== "PENDING_PAYMENT" || order.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Pesanan ini tidak bisa dibatalkan." },
      { status: 409 },
    );
  }

  const now = new Date();
  const latestPayment = order.payments[0] ?? null;
  const invoiceId = latestPayment?.providerOrderId ?? parseInvoiceIdFromOrderNotes(order.notes);
  const xenditConfig = getXenditConfig();

  if (!xenditConfig) {
    return NextResponse.json(
      { error: "Konfigurasi Xendit server belum lengkap." },
      { status: 503 },
    );
  }

  if (invoiceId) {
    try {
      const invoice = await expireXenditInvoice(invoiceId, xenditConfig);
      const mapped = mapXenditPaymentStatus(invoice.status);

      if (mapped.paymentStatus === "SETTLED") {
        return NextResponse.json(
          { error: "Pembayaran sudah berhasil, pesanan tidak bisa dibatalkan." },
          { status: 409 },
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal membatalkan invoice pada Xendit.";
      const normalizedMessage = message.toLowerCase();
      const alreadyExpired =
        normalizedMessage.includes("already expired") ||
        normalizedMessage.includes("invoice has expired") ||
        normalizedMessage.includes("already been expired");

      if (alreadyExpired) {
        // Invoice memang sudah nonaktif di Xendit, lanjutkan cancel internal.
      } else {
        return NextResponse.json(
          {
            error: message,
          },
          { status: 502 },
        );
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELLED",
        shippingStatus: "CANCELLED",
        cancelledAt: now,
      },
    });

    await tx.payment.updateMany({
      where: {
        orderId: order.id,
      },
      data: {
        status: "CANCELLED",
        transactionTime: now,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Pesanan berhasil dibatalkan.",
    },
    { status: 200 },
  );
}
