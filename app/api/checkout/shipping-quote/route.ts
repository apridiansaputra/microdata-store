import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/api-guard";
import { validateCheckoutCartItems } from "@/lib/cart/availability";
import { prisma } from "@/lib/prisma";
import { getShippingProviderConfig } from "@/lib/shipping/config";
import { getCourierDisplayName } from "@/lib/shipping/couriers";
import {
  calculateDomesticCosts,
  resolveDomesticDestinationId,
  toReadableEtd,
} from "@/lib/shipping/rajaongkir";

const requestSchema = z.object({
  addressId: z.string().uuid("addressId tidak valid."),
  cartItemIds: z.array(z.string().uuid("Format cart item tidak valid.")).min(1).max(100),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const shippingConfig = await getShippingProviderConfig();
  if (!shippingConfig) {
    return NextResponse.json(
      { error: "Konfigurasi RajaOngkir belum lengkap di server." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const address = await prisma.address.findFirst({
    where: {
      id: payload.addressId,
      userId: auth.user.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      provinceName: true,
      cityName: true,
      districtName: true,
      postalCode: true,
      street: true,
      detail: true,
    },
  });

  if (!address) {
    return NextResponse.json({ error: "Alamat pengiriman tidak ditemukan." }, { status: 404 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: {
      id: { in: payload.cartItemIds },
      cart: {
        userId: auth.user.id,
      },
      product: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      quantity: true,
      isSelected: true,
      product: {
        select: {
          name: true,
          stock: true,
          weightGrams: true,
        },
      },
    },
  });

  const cartValidation = validateCheckoutCartItems({
    requestedItemIds: payload.cartItemIds,
    cartItems: cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      isSelected: item.isSelected,
      product: {
        name: item.product.name,
        stock: item.product.stock,
      },
    })),
  });
  if (!cartValidation.ok) {
    return NextResponse.json({ error: cartValidation.error }, { status: cartValidation.status });
  }

  const totalWeightGrams = cartItems.reduce((sum, item) => {
    const productWeight = Math.max(1, item.product.weightGrams);
    return sum + productWeight * Math.max(1, item.quantity);
  }, 0);

  try {
    const destinationId = await resolveDomesticDestinationId({
      apiKey: shippingConfig.apiKey,
      provinceName: address.provinceName,
      cityName: address.cityName,
      districtName: address.districtName,
      postalCode: address.postalCode,
      street: address.street,
      detail: address.detail,
    });

    const costs = await calculateDomesticCosts({
      apiKey: shippingConfig.apiKey,
      originId: shippingConfig.originId,
      destinationId,
      weightGrams: totalWeightGrams,
      courierCode: shippingConfig.courierCode,
    });

    const bestCost = [...costs].sort((left, right) => left.cost - right.cost)[0];
    if (!bestCost) {
      return NextResponse.json(
        { error: "Layanan pengiriman tidak tersedia untuk alamat ini." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        shipping: {
          courierCode: bestCost.code,
          courierName: getCourierDisplayName(bestCost.code, bestCost.name),
          serviceCode: bestCost.service,
          serviceName: bestCost.description,
          cost: bestCost.cost,
          etdRaw: bestCost.etd,
          etdLabel: toReadableEtd(bestCost.etd),
          weightGrams: totalWeightGrams,
          destinationId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkir. Coba lagi beberapa saat.",
      },
      { status: 502 },
    );
  }
}
