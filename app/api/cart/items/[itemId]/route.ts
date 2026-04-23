import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { getCartPayloadByUserId } from "@/lib/cart/service";
import { prisma } from "@/lib/prisma";
import { updateCartItemSchema } from "@/lib/products/validation";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

const OUT_OF_STOCK_MESSAGE = "Stok produk sudah habis karena dibeli pengguna lain.";

async function getOwnedCartItem(itemId: string, userId: string) {
  return prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        userId,
      },
    },
    select: {
      id: true,
      product: {
        select: {
          stock: true,
        },
      },
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { itemId } = await context.params;
  const existingItem = await getOwnedCartItem(itemId, auth.user.id);
  if (!existingItem) {
    return NextResponse.json({ error: "Item keranjang tidak ditemukan." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updateCartItemSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const isOutOfStock = existingItem.product.stock <= 0;

  if (isOutOfStock && payload.isSelected === true) {
    return NextResponse.json({ error: OUT_OF_STOCK_MESSAGE }, { status: 409 });
  }

  if (isOutOfStock && payload.quantity !== undefined) {
    return NextResponse.json({ error: OUT_OF_STOCK_MESSAGE }, { status: 409 });
  }

  const nextQuantity =
    payload.quantity !== undefined
      ? Math.min(payload.quantity, Math.max(1, existingItem.product.stock))
      : undefined;

  await prisma.cartItem.update({
    where: { id: existingItem.id },
    data: {
      ...(nextQuantity !== undefined ? { quantity: nextQuantity } : {}),
      ...(payload.isSelected !== undefined
        ? { isSelected: payload.isSelected }
        : {}),
    },
  });

  const cart = await getCartPayloadByUserId(auth.user.id);
  return NextResponse.json({ success: true, cart }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { itemId } = await context.params;
  const deleteResult = await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cart: {
        userId: auth.user.id,
      },
    },
  });

  if (deleteResult.count === 0) {
    return NextResponse.json({ error: "Item keranjang tidak ditemukan." }, { status: 404 });
  }

  const cart = await getCartPayloadByUserId(auth.user.id);
  return NextResponse.json({ success: true, cart }, { status: 200 });
}
