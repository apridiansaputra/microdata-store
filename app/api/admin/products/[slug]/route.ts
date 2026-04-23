import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { serializeAdminProductDetail } from "@/lib/products/serializers";
import { adminUpdateProductSchema } from "@/lib/products/validation";
import {
  createUniqueProductSlug,
  dedupeImagePaths,
  normalizeImagePath,
} from "@/lib/products/utils";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

async function findAdminProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      sku: true,
      name: true,
      shortSpec: true,
      description: true,
      basePrice: true,
      compareAtPrice: true,
      stock: true,
      weightGrams: true,
      soldCount: true,
      status: true,
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
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { slug } = await context.params;
  const product = await findAdminProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(
    {
      product: serializeAdminProductDetail(product),
    },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { slug } = await context.params;
  const existing = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminUpdateProductSchema.safeParse(body);
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
    excludeProductId: existing.id,
  });

  const coverImageUrl = normalizeImagePath(payload.coverImageUrl);
  const galleryImageUrls = dedupeImagePaths(payload.galleryImageUrls).filter(
    (url) => url !== coverImageUrl,
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existing.id },
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
          updatedById: auth.user.id,
        },
      });

      await tx.productImage.deleteMany({
        where: { productId: existing.id },
      });

      const allImages = [coverImageUrl, ...galleryImageUrls];
      await tx.productImage.createMany({
        data: allImages.map((url, index) => ({
          productId: existing.id,
          url,
          altText: payload.name,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    });

    const updated = await findAdminProductBySlug(finalSlug);
    if (!updated) {
      return NextResponse.json(
        { error: "Produk berhasil disimpan, tetapi gagal dimuat ulang." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: serializeAdminProductDetail(updated),
      },
      { status: 200 },
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

    console.error("Admin update product error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui produk. Coba lagi." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { slug } = await context.params;
  const existing = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Hapus item keranjang terkait agar tidak melanggar FK Restrict.
      await tx.cartItem.deleteMany({
        where: { productId: existing.id },
      });

      // Hapus permanen produk.
      await tx.product.delete({
        where: { id: existing.id },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Produk tidak bisa dihapus permanen karena sudah terhubung ke data transaksi/negosiasi/ulasan.",
          },
          { status: 409 },
        );
      }
    }

    console.error("Admin hard delete product error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus produk permanen. Coba lagi." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, message: "Produk berhasil dihapus permanen." },
    { status: 200 },
  );
}
