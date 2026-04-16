import { prisma } from "@/lib/prisma";
import { serializeCartItem } from "@/lib/products/serializers";

export async function getOrCreateCartByUserId(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
}

export async function getCartPayloadByUserId(userId: string) {
  const existingCart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existingCart) {
    await prisma.cartItem.updateMany({
      where: {
        cartId: existingCart.id,
        isSelected: true,
        product: {
          stock: {
            lte: 0,
          },
        },
      },
      data: {
        isSelected: false,
      },
    });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        where: {
          product: {
            deletedAt: null,
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quantity: true,
          isSelected: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              shortSpec: true,
              basePrice: true,
              stock: true,
              images: {
                orderBy: { sortOrder: "asc" },
                select: {
                  url: true,
                  isPrimary: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
      updatedAt: true,
    },
  });

  const items = cart?.items.map((item) => serializeCartItem(item)) ?? [];

  return {
    cartId: cart?.id ?? null,
    items,
    updatedAt: cart?.updatedAt ?? null,
  };
}
