import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createUniqueCategorySlug } from "@/lib/products/utils";
import { adminCategoryUpdateSchema } from "@/lib/products/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const existing = await prisma.category.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminCategoryUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const slug = await createUniqueCategorySlug({
    source: payload.name,
    excludeCategoryId: existing.id,
  });

  try {
    const updated = await prisma.category.update({
      where: {
        id: existing.id,
      },
      data: {
        name: payload.name,
        slug,
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
        category: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Nama kategori sudah digunakan." },
          { status: 409 },
        );
      }
    }

    console.error("Admin update category error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori. Coba lagi." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const existing = await prisma.category.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: {
          categoryId: existing.id,
          deletedAt: null,
        },
        data: {
          categoryId: null,
        },
      });

      await tx.category.delete({
        where: {
          id: existing.id,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kategori berhasil dihapus.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin delete category error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori. Coba lagi." },
      { status: 500 },
    );
  }
}
