import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/api-guard";
import { getOrderStatusMeta } from "@/lib/orders/serializers";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

const submitOrderReviewsSchema = z.object({
  reviews: z
    .array(
      z.object({
        orderItemId: z.string().uuid("Item pesanan tidak valid."),
        rating: z
          .number()
          .int("Rating harus bilangan bulat.")
          .min(1, "Rating minimal 1 bintang.")
          .max(5, "Rating maksimal 5 bintang."),
        title: z.preprocess(
          (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
          z.string().trim().max(120, "Judul ulasan maksimal 120 karakter.").optional(),
        ),
        content: z.preprocess(
          (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
          z.string().trim().max(2000, "Isi ulasan maksimal 2000 karakter.").optional(),
        ),
        imageUrls: z.array(z.string().trim().max(2048)).max(6).default([]),
      }),
    )
    .min(1, "Minimal kirim 1 ulasan.")
    .max(50, "Terlalu banyak item ulasan dalam 1 request."),
});

function normalizeOrderNumber(raw: string) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function normalizeLocalImage(url: string | null) {
  if (!url || !url.trim()) return "/image.png";
  const normalized = url.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/image.png";
  }
  return normalized;
}

function canReviewOrderStatus(status: string) {
  return status === "COMPLETED" || status === "DELIVERED";
}

function isLocalImagePath(value: string) {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("..")) return false;
  return true;
}

function isAllowedReviewImagePath(value: string) {
  return isLocalImagePath(value) && value.startsWith("/uploads/reviews/");
}

function dedupeImagePaths(imagePaths: string[]) {
  const unique = new Set<string>();
  const output: string[] = [];
  for (const imagePath of imagePaths) {
    const normalized = imagePath.trim();
    if (!normalized || unique.has(normalized)) continue;
    unique.add(normalized);
    output.push(normalized);
  }
  return output;
}

async function syncProductRatingStats(
  tx: Prisma.TransactionClient,
  productIds: string[],
) {
  if (productIds.length === 0) return;

  const uniqueProductIds = [...new Set(productIds)];
  const stats = await tx.review.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: uniqueProductIds,
      },
      status: "PUBLISHED",
      deletedAt: null,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const statMap = new Map(
    stats.map((item) => [
      item.productId,
      {
        ratingAverage: item._avg.rating,
        ratingCount: item._count.rating,
      },
    ]),
  );

  await Promise.all(
    uniqueProductIds.map((productId) => {
      const stat = statMap.get(productId);
      const average = stat?.ratingAverage ?? null;
      const count = stat?.ratingCount ?? 0;

      return tx.product.update({
        where: {
          id: productId,
        },
        data: {
          ratingAverage:
            average === null ? null : new Prisma.Decimal(average.toFixed(2)),
          ratingCount: count,
        },
      });
    }),
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { orderNumber } = await context.params;
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: normalizedOrderNumber,
      userId: auth.user.id,
      deletedAt: null,
    },
    select: {
      orderNumber: true,
      status: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          productId: true,
          productSlug: true,
          productName: true,
          productImageUrl: true,
          quantity: true,
          review: {
            select: {
              id: true,
              userId: true,
              rating: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const statusMeta = getOrderStatusMeta(order.status);
  const canReview = canReviewOrderStatus(order.status);

  return NextResponse.json(
    {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: statusMeta.label,
      canReview,
      items: order.items.map((item) => ({
        orderItemId: item.id,
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.productName,
        productImageUrl: normalizeLocalImage(item.productImageUrl),
        quantity: item.quantity,
        existingReview:
          item.review && item.review.userId === auth.user.id
            ? {
                id: item.review.id,
                rating: item.review.rating,
                title: item.review.title,
                content: item.review.content,
                createdAt: item.review.createdAt.toISOString(),
                updatedAt: item.review.updatedAt.toISOString(),
                images: item.review.images.map((image) => normalizeLocalImage(image.url)),
              }
            : null,
      })),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { orderNumber } = await context.params;
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
  if (!normalizedOrderNumber) {
    return NextResponse.json({ error: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsedBody = submitOrderReviewsSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload ulasan tidak valid." },
      { status: 400 },
    );
  }

  const duplicateCheck = new Set<string>();
  for (const item of parsedBody.data.reviews) {
    if (duplicateCheck.has(item.orderItemId)) {
      return NextResponse.json(
        { error: "Terdapat item pesanan yang dikirim berulang." },
        { status: 400 },
      );
    }
    duplicateCheck.add(item.orderItemId);

    if (item.imageUrls.some((url) => !isAllowedReviewImagePath(url))) {
      return NextResponse.json(
        {
          error:
            "Path foto ulasan tidak valid. Upload foto melalui form ulasan terlebih dahulu.",
        },
        { status: 400 },
      );
    }
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
      items: {
        select: {
          id: true,
          productId: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (!canReviewOrderStatus(order.status)) {
    return NextResponse.json(
      { error: "Ulasan hanya bisa diberikan untuk pesanan selesai." },
      { status: 409 },
    );
  }

  const orderItemMap = new Map(order.items.map((item) => [item.id, item]));
  const reviewsToSave = parsedBody.data.reviews.map((reviewItem) => {
    const orderItem = orderItemMap.get(reviewItem.orderItemId);
    if (!orderItem || !orderItem.productId) {
      return null;
    }

    return {
      orderItemId: reviewItem.orderItemId,
      productId: orderItem.productId,
      rating: reviewItem.rating,
      title: reviewItem.title?.trim() || null,
      content: reviewItem.content?.trim() || null,
      imageUrls: dedupeImagePaths(reviewItem.imageUrls ?? []).slice(0, 6),
    };
  });

  if (reviewsToSave.some((item) => item === null)) {
    return NextResponse.json(
      { error: "Ada item ulasan yang tidak valid untuk pesanan ini." },
      { status: 400 },
    );
  }

  const normalizedReviews = reviewsToSave.filter((item) => item !== null);
  if (normalizedReviews.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada item ulasan yang bisa disimpan." },
      { status: 400 },
    );
  }

  const affectedProductIds = normalizedReviews.map((item) => item.productId);
  const orderItemIds = normalizedReviews.map((item) => item.orderItemId);

  const existingReviews = await prisma.review.findMany({
    where: {
      orderItemId: {
        in: orderItemIds,
      },
    },
    select: {
      orderItemId: true,
      userId: true,
    },
  });
  if (existingReviews.some((review) => review.userId !== auth.user.id)) {
    return NextResponse.json(
      { error: "Akses ulasan untuk item ini tidak valid." },
      { status: 403 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of normalizedReviews) {
        await tx.review.upsert({
          where: {
            orderItemId: item.orderItemId,
          },
          update: {
            rating: item.rating,
            title: item.title,
            content: item.content,
            status: "PUBLISHED",
            deletedAt: null,
            images: {
              deleteMany: {},
              ...(item.imageUrls.length > 0
                ? {
                    create: item.imageUrls.map((url, index) => ({
                      url,
                      sortOrder: index,
                    })),
                  }
                : {}),
            },
          },
          create: {
            userId: auth.user.id,
            productId: item.productId,
            orderItemId: item.orderItemId,
            rating: item.rating,
            title: item.title,
            content: item.content,
            status: "PUBLISHED",
            ...(item.imageUrls.length > 0
              ? {
                  images: {
                    create: item.imageUrls.map((url, index) => ({
                      url,
                      sortOrder: index,
                    })),
                  },
                }
              : {}),
          },
        });
      }

      await syncProductRatingStats(tx, affectedProductIds);
    });
  } catch (error) {
    console.error("Submit order reviews error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          {
            error:
              "Struktur database ulasan belum sinkron. Jalankan migrasi terbaru terlebih dahulu.",
          },
          { status: 503 },
        );
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error:
            "Format data ulasan tidak sesuai. Coba kirim ulang ulasanmu.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan ulasan." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      reviewedCount: normalizedReviews.length,
      message: "Ulasan berhasil disimpan.",
    },
    { status: 200 },
  );
}
