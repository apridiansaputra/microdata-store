import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getXenditConfig, mapXenditPaymentStatus } from "@/lib/payment/xendit";

function readExternalId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const asRecord = payload as Record<string, unknown>;

  const direct = asRecord.external_id;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const data = asRecord.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).external_id;
    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }
  }

  return null;
}

function readStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const asRecord = payload as Record<string, unknown>;

  const direct = asRecord.status;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const data = asRecord.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).status;
    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }
  }

  return null;
}

function readInvoiceId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const asRecord = payload as Record<string, unknown>;

  const direct = asRecord.id;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const data = asRecord.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).id;
    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const config = getXenditConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Konfigurasi Xendit webhook belum lengkap." },
      { status: 503 },
    );
  }

  const callbackToken = request.headers.get("x-callback-token");
  if (!callbackToken || callbackToken !== config.webhookToken) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Payload webhook tidak valid." }, { status: 400 });
  }

  const externalId = readExternalId(payload);
  if (!externalId) {
    return NextResponse.json(
      { error: "external_id tidak ditemukan di payload webhook." },
      { status: 400 },
    );
  }

  const incomingStatus = readStatus(payload);
  const invoiceId = readInvoiceId(payload);
  const mapped = mapXenditPaymentStatus(incomingStatus);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findFirst({
      where: {
        orderNumber: externalId,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (existingOrder) {
      const shouldApplySalesImpact =
        mapped.paymentStatus === "SETTLED" &&
        existingOrder.paymentStatus !== "SETTLED";
      const preserveCancelled =
        existingOrder.status === "CANCELLED" && mapped.paymentStatus === "EXPIRED";
      const nextPaymentStatus = preserveCancelled ? "CANCELLED" : mapped.paymentStatus;
      const nextOrderStatus =
        preserveCancelled
          ? "CANCELLED"
          : mapped.orderStatus ?? existingOrder.status;

      await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          paymentStatus: nextPaymentStatus,
          status: nextOrderStatus,
          ...(nextPaymentStatus === "SETTLED" ? { paidAt: now } : {}),
          ...(nextPaymentStatus === "EXPIRED" ? { expiresAt: now } : {}),
          ...(nextPaymentStatus === "FAILED" || nextPaymentStatus === "CANCELLED"
            ? { cancelledAt: now }
            : {}),
        },
      });

      if (shouldApplySalesImpact) {
        const soldItems = await tx.orderItem.findMany({
          where: {
            orderId: existingOrder.id,
            productId: {
              not: null,
            },
          },
          select: {
            productId: true,
            quantity: true,
          },
        });

        for (const item of soldItems) {
          if (!item.productId) continue;
          const quantity = Math.max(1, item.quantity);

          await tx.product.updateMany({
            where: {
              id: item.productId,
              deletedAt: null,
            },
            data: {
              stock: {
                decrement: quantity,
              },
              soldCount: {
                increment: quantity,
              },
            },
          });
        }
      }
    }

    if (invoiceId) {
      await tx.payment.updateMany({
        where: {
          providerOrderId: invoiceId,
          ...(mapped.paymentStatus === "EXPIRED"
            ? {
                status: {
                  not: "CANCELLED",
                },
              }
            : {}),
        },
        data: {
          status: mapped.paymentStatus,
          transactionTime: now,
          ...(mapped.paymentStatus === "SETTLED" ? { settlementTime: now } : {}),
          ...(mapped.paymentStatus === "EXPIRED" ? { expiryTime: now } : {}),
        },
      });
    } else {
      await tx.payment.updateMany({
        where: {
          order: {
            orderNumber: externalId,
          },
          ...(mapped.paymentStatus === "EXPIRED"
            ? {
                status: {
                  not: "CANCELLED",
                },
              }
            : {}),
        },
        data: {
          status: mapped.paymentStatus,
          transactionTime: now,
          ...(mapped.paymentStatus === "SETTLED" ? { settlementTime: now } : {}),
          ...(mapped.paymentStatus === "EXPIRED" ? { expiryTime: now } : {}),
        },
      });
    }
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
