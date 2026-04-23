import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  serializePublicProductDetail,
  serializePublicProductListItem,
} from "@/lib/products/serializers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      stock: {
        gt: 0,
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      shortSpec: true,
      description: true,
      basePrice: true,
      compareAtPrice: true,
      stock: true,
      soldCount: true,
      weightGrams: true,
      ratingAverage: true,
      ratingCount: true,
      categoryId: true,
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
  });

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  const similarProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: "PUBLISHED",
      deletedAt: null,
      stock: {
        gt: 0,
      },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    take: 8,
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
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
  });

  return NextResponse.json(
    {
      product: serializePublicProductDetail(product),
      similarProducts: similarProducts.map((item) =>
        serializePublicProductListItem(item),
      ),
    },
    { status: 200 },
  );
}
