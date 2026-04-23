import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { getCartPayloadByUserId, getOrCreateCartByUserId } from "@/lib/cart/service";
import { prisma } from "@/lib/prisma";
import { addCartItemSchema } from "@/lib/products/validation";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsedBody = addCartItemSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const product = await prisma.product.findFirst({
    where: {
      id: payload.productId,
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      id: true,
      stock: true,
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Produk tidak ditemukan atau belum dipublikasikan." },
      { status: 404 },
    );
  }

  if (product.stock <= 0) {
    return NextResponse.json(
      { error: "Stok produk sedang habis." },
      { status: 409 },
    );
  }

  const cart = await getOrCreateCartByUserId(auth.user.id);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    const nextQuantity = Math.min(
      product.stock,
      (existing?.quantity ?? 0) + payload.quantity,
    );

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: nextQuantity,
          isSelected: true,
        },
      });
      return;
    }

    await tx.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: nextQuantity,
        isSelected: true,
      },
    });
  });

  const latestCart = await getCartPayloadByUserId(auth.user.id);
  return NextResponse.json({ success: true, cart: latestCart }, { status: 200 });
}
