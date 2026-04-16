import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function buildExpiredPendingOrdersWhere(now: Date): Prisma.OrderWhereInput {
  return {
    deletedAt: null,
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    OR: [
      {
        expiresAt: {
          lte: now,
        },
      },
      {
        payments: {
          some: {
            status: "PENDING",
            expiryTime: {
              lte: now,
            },
          },
        },
      },
    ],
  };
}

export async function syncExpiredPendingOrders(now = new Date()) {
  const staleOrders = await prisma.order.findMany({
    where: buildExpiredPendingOrdersWhere(now),
    select: { id: true },
  });

  if (staleOrders.length === 0) {
    return 0;
  }

  const staleOrderIds = staleOrders.map((order) => order.id);

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: {
        orderId: {
          in: staleOrderIds,
        },
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
        transactionTime: now,
        expiryTime: now,
      },
    }),
    prisma.shipment.updateMany({
      where: {
        orderId: {
          in: staleOrderIds,
        },
      },
      data: {
        status: "CANCELLED",
      },
    }),
    prisma.order.updateMany({
      where: {
        id: {
          in: staleOrderIds,
        },
      },
      data: {
        status: "EXPIRED",
        paymentStatus: "EXPIRED",
        shippingStatus: "CANCELLED",
        expiresAt: now,
      },
    }),
  ]);

  return staleOrderIds.length;
}
