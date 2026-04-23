import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createUniqueCategorySlug } from "@/lib/products/utils";
import { adminCategoryCreateSchema } from "@/lib/products/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const [categories, groupedCounts] = await Promise.all([
    prisma.category.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const countByCategoryId = new Map<string, number>();
  for (const group of groupedCounts) {
    if (!group.categoryId) continue;
    countByCategoryId.set(group.categoryId, group._count._all);
  }

  return NextResponse.json(
    {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: countByCategoryId.get(category.id) ?? 0,
      })),
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
  const parsedBody = adminCategoryCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const slug = await createUniqueCategorySlug({ source: payload.name });
  const maxSortOrder = await prisma.category.aggregate({
    where: { deletedAt: null },
    _max: {
      sortOrder: true,
    },
  });
  const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  try {
    const category = await prisma.category.create({
      data: {
        name: payload.name,
        slug,
        sortOrder: nextSortOrder,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        category: {
          ...category,
          productCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Nama kategori sudah digunakan. Pilih nama lain." },
          { status: 409 },
        );
      }
    }

    console.error("Admin create category error:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori. Coba lagi." },
      { status: 500 },
    );
  }
}
