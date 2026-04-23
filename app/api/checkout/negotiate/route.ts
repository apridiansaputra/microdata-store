import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { validateCheckoutCartItems } from "@/lib/cart/availability";
import { createNegotiationNumber, NEGOTIATION_MIN_TOTAL } from "@/lib/negotiations/utils";
import { checkoutNegotiateSchema } from "@/lib/negotiations/validation";
import { prisma } from "@/lib/prisma";
import { getShippingProviderConfig } from "@/lib/shipping/config";
import {
  calculateDomesticCosts,
  resolveDomesticDestinationId,
} from "@/lib/shipping/rajaongkir";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const shippingConfig = await getShippingProviderConfig();
  if (!shippingConfig) {
    return NextResponse.json(
      { error: "Konfigurasi ongkir server belum lengkap." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = checkoutNegotiateSchema.safeParse(body);
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
    return NextResponse.json(
      { error: "Alamat pengiriman tidak ditemukan." },
      { status: 404 },
    );
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
          id: true,
          name: true,
          basePrice: true,
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

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + Number(item.product.basePrice) * Math.max(1, item.quantity);
  }, 0);

  const totalWeightGrams = cartItems.reduce((sum, item) => {
    const productWeight = Math.max(1, item.product.weightGrams);
    return sum + productWeight * Math.max(1, item.quantity);
  }, 0);

  let shippingCost = 0;
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
    const selectedCost = [...costs].sort((left, right) => left.cost - right.cost)[0] ?? null;
    if (!selectedCost) {
      return NextResponse.json(
        { error: "Layanan pengiriman tidak tersedia untuk alamat ini." },
        { status: 404 },
      );
    }
    shippingCost = selectedCost.cost;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkir untuk negosiasi.",
      },
      { status: 502 },
    );
  }

  const totalTransaction = subtotal + shippingCost;
  if (totalTransaction <= NEGOTIATION_MIN_TOTAL) {
    return NextResponse.json(
      {
        error: "Negosiasi hanya tersedia untuk transaksi di atas Rp. 50.000.000.",
      },
      { status: 409 },
    );
  }

  const negotiationNumber = createNegotiationNumber();
  const requestedTotal = subtotal;

  const negotiation = await prisma.negotiation.create({
    data: {
      userId: auth.user.id,
      negotiationNumber,
      status: "OPEN",
      requestedTotalAmount: BigInt(requestedTotal),
      notes: `Checkout threshold: ${totalTransaction}; address: ${address.id}`,
      items: {
        create: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: Math.max(1, item.quantity),
          baseUnitPrice: item.product.basePrice,
        })),
      },
      messages: {
        create: {
          senderId: auth.user.id,
          senderRole: "USER",
          message: "Pengajuan negosiasi dibuat dari checkout.",
        },
      },
    },
    select: {
      negotiationNumber: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      negotiationNumber: negotiation.negotiationNumber,
      redirectUrl: `/account/negotiation/${encodeURIComponent(negotiation.negotiationNumber)}`,
    },
    { status: 201 },
  );
}
