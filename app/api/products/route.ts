import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializePublicProductListItem } from "@/lib/products/serializers";
import { publicProductsQuerySchema } from "@/lib/products/validation";

function getOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "price_asc":
      return [{ basePrice: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ basePrice: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function GET(request: NextRequest) {
  const parsedQuery = publicProductsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Query tidak valid." },
      { status: 400 },
    );
  }

  const { q, categorySlug, sort, page, pageSize } = parsedQuery.data;
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    stock: {
      gt: 0,
    },
    ...(categorySlug
      ? {
          category: {
            slug: categorySlug,
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { shortSpec: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: getOrderBy(sort),
      select: {
        id: true,
        slug: true,
        name: true,
        shortSpec: true,
        basePrice: true,
        compareAtPrice: true,
        stock: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: {
            url: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json(
    {
      items: products.map((product) => serializePublicProductListItem(product)),
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
