import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { serializeUserNegotiationListItem } from "@/lib/negotiations/serializers";
import { userNegotiationsQuerySchema } from "@/lib/negotiations/validation";
import { prisma } from "@/lib/prisma";

function getOrderBy(sort: "newest" | "oldest"): Prisma.NegotiationOrderByWithRelationInput[] {
  return sort === "oldest" ? [{ submittedAt: "asc" }] : [{ submittedAt: "desc" }];
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedQuery = userNegotiationsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Query tidak valid." },
      { status: 400 },
    );
  }

  const { status, sort, page, pageSize } = parsedQuery.data;

  const where: Prisma.NegotiationWhereInput = {
    userId: auth.user.id,
    ...(status ? { status } : {}),
  };

  const [total, negotiations] = await prisma.$transaction([
    prisma.negotiation.count({ where }),
    prisma.negotiation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: getOrderBy(sort),
      select: {
        negotiationNumber: true,
        status: true,
        submittedAt: true,
        requestedTotalAmount: true,
        counterTotalAmount: true,
        finalTotalAmount: true,
        items: {
          select: {
            id: true,
            quantity: true,
            baseUnitPrice: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json(
    {
      items: negotiations.map((item) => serializeUserNegotiationListItem(item)),
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
