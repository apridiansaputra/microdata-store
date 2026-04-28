import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { serializeAdminOrderListItem } from "@/lib/orders/admin-serializers";
import { adminOrdersQuerySchema } from "@/lib/orders/admin-validation";
import { prisma } from "@/lib/prisma";

function getOrderBy(sort: "newest" | "oldest"): Prisma.OrderOrderByWithRelationInput[] {
  return sort === "oldest"
    ? [{ placedAt: "asc" }]
    : [{ placedAt: "desc" }];
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedQuery = adminOrdersQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Query tidak valid." },
      { status: 400 },
    );
  }

  const { paymentStatus, shippingStatus, sort, page, pageSize } = parsedQuery.data;

  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(shippingStatus ? { shippingStatus } : {}),
  };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: getOrderBy(sort),
      select: {
        id: true,
        orderNumber: true,
        placedAt: true,
        expiresAt: true,
        status: true,
        paymentStatus: true,
        shippingStatus: true,
        grandTotalAmount: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json(
    {
      items: orders.map((order) => serializeAdminOrderListItem(order)),
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
    { status: 200 },
  );
}
