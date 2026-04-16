import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { serializeAdminProductListItem } from "@/lib/products/serializers";
import {
  adminCreateProductSchema,
  adminProductsQuerySchema,
} from "@/lib/products/validation";
import {
  createUniqueProductSlug,
  dedupeImagePaths,
  normalizeImagePath,
} from "@/lib/products/utils";

function getOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "price_asc":
      return [{ basePrice: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ basePrice: "desc" }, { createdAt: "desc" }];
    case "name_asc":
      return [{ name: "asc" }];
    case "name_desc":
      return [{ name: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedQuery = adminProductsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Query tidak valid." },
      { status: 400 },
    );
  }

  const { q, categoryId, categorySlug, status, sort, page, pageSize } = parsedQuery.data;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(categorySlug
      ? {
          category: {
            slug: categorySlug,
          },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
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
        sku: true,
        name: true,
        status: true,
        stock: true,
        soldCount: true,
        basePrice: true,
        createdAt: true,
        updatedAt: true,
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
      items: products.map((product) => serializeAdminProductListItem(product)),
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

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminCreateProductSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;

  if (payload.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.categoryId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau tidak aktif." },
        { status: 400 },
      );
    }
  }

  const finalSlug = await createUniqueProductSlug({
    source: payload.slug ?? payload.name,
  });

  const coverImageUrl = normalizeImagePath(payload.coverImageUrl);
  const galleryImageUrls = dedupeImagePaths(payload.galleryImageUrls).filter(
    (url) => url !== coverImageUrl,
  );

  try {
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          sku: payload.sku,
          slug: finalSlug,
          name: payload.name,
          shortSpec: payload.shortSpec ?? null,
          description: payload.description ?? null,
          basePrice: BigInt(payload.basePrice),
          compareAtPrice:
            payload.compareAtPrice === null || payload.compareAtPrice === undefined
              ? null
              : BigInt(payload.compareAtPrice),
          stock: payload.stock,
          weightGrams: payload.weightGrams,
          status: payload.status,
          categoryId: payload.categoryId ?? null,
          createdById: auth.user.id,
          updatedById: auth.user.id,
        },
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          status: true,
          stock: true,
          soldCount: true,
          basePrice: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      const allImages = [coverImageUrl, ...galleryImageUrls];
      await tx.productImage.createMany({
        data: allImages.map((url, index) => ({
          productId: createdProduct.id,
          url,
          altText: payload.name,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });

      return createdProduct;
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          ...serializeAdminProductListItem({
            ...product,
            images: [
              {
                url: coverImageUrl,
                isPrimary: true,
                sortOrder: 0,
              },
            ],
          }),
          coverImageUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "SKU atau slug sudah digunakan produk lain." },
          { status: 409 },
        );
      }
    }

    console.error("Admin create product error:", error);
    return NextResponse.json(
      { error: "Gagal membuat produk. Coba lagi." },
      { status: 500 },
    );
  }
}
