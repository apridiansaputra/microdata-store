import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { syncExpiredPendingOrders } from "@/lib/orders/expiration";
import { getXenditConfig, getXenditInvoiceById, mapXenditPaymentStatus } from "@/lib/payment/xendit";
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

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: normalizedOrderNumber,
      userId: auth.user.id,
      deletedAt: null,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      expiresAt: true,
      notes: true,
      grandTotalAmount: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          providerOrderId: true,
          paymentUrl: true,
          expiryTime: true,
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
      { error: "Pesanan ini tidak lagi menunggu pembayaran." },
      { status: 409 },
    );
  }

  const latestPayment = order.payments[0] ?? null;
  const now = new Date();
  const effectiveExpiry = latestPayment?.expiryTime ?? order.expiresAt;
  if (effectiveExpiry && effectiveExpiry <= now) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "EXPIRED",
          paymentStatus: "EXPIRED",
          expiresAt: now,
        },
      });
      if (latestPayment) {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: "EXPIRED",
            expiryTime: now,
            transactionTime: now,
          },
        });
      }
    });

    return NextResponse.json(
      { error: "Link pembayaran sudah kedaluwarsa. Silakan checkout ulang." },
      { status: 410 },
    );
  }

  const storedPaymentUrl = latestPayment?.paymentUrl?.trim();
  if (storedPaymentUrl) {
    return NextResponse.json(
      {
        paymentUrl: storedPaymentUrl,
        expiresAt: effectiveExpiry ? effectiveExpiry.toISOString() : null,
      },
      { status: 200 },
    );
  }

  const invoiceId = latestPayment?.providerOrderId ?? parseInvoiceIdFromOrderNotes(order.notes);
  if (!invoiceId) {
    return NextResponse.json(
      { error: "Payment link belum tersedia untuk pesanan ini." },
      { status: 404 },
    );
  }

  const xenditConfig = getXenditConfig();
  if (!xenditConfig) {
    return NextResponse.json(
      { error: "Konfigurasi Xendit server belum lengkap." },
      { status: 503 },
    );
  }

  let invoice;
  try {
    invoice = await getXenditInvoiceById(invoiceId, xenditConfig);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil payment link dari Xendit.",
      },
      { status: 502 },
    );
  }

  const mapped = mapXenditPaymentStatus(invoice.status);
  const invoiceExpiry = invoice.expiry_date ? new Date(invoice.expiry_date) : null;

  await prisma.$transaction(async (tx) => {
    if (latestPayment) {
      await tx.payment.update({
        where: { id: latestPayment.id },
        data: {
          paymentUrl: invoice.invoice_url,
          status: mapped.paymentStatus,
          expiryTime: invoiceExpiry,
          transactionTime: now,
          ...(mapped.paymentStatus === "SETTLED" ? { settlementTime: now } : {}),
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          providerOrderId: invoice.id,
          paymentUrl: invoice.invoice_url,
          status: mapped.paymentStatus,
          grossAmount: order.grandTotalAmount,
          expiryTime: invoiceExpiry,
          transactionTime: now,
          ...(mapped.paymentStatus === "SETTLED" ? { settlementTime: now } : {}),
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: mapped.paymentStatus,
        ...(mapped.orderStatus ? { status: mapped.orderStatus } : {}),
        ...(invoiceExpiry ? { expiresAt: invoiceExpiry } : {}),
        ...(mapped.paymentStatus === "SETTLED" ? { paidAt: now } : {}),
        ...(mapped.paymentStatus === "FAILED" || mapped.paymentStatus === "CANCELLED"
          ? { cancelledAt: now }
          : {}),
      },
    });
  });

  if (mapped.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Pesanan ini tidak lagi menunggu pembayaran." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      paymentUrl: invoice.invoice_url,
      expiresAt: invoiceExpiry ? invoiceExpiry.toISOString() : null,
    },
    { status: 200 },
  );
}
