import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/api-guard";
import { validateCheckoutCartItems } from "@/lib/cart/availability";
import { prisma } from "@/lib/prisma";
import { getShippingProviderConfig } from "@/lib/shipping/config";
import {
  calculateDomesticCosts,
  resolveDomesticDestinationId,
  toReadableEtd,
} from "@/lib/shipping/rajaongkir";
import { createXenditInvoice, getXenditConfig } from "@/lib/payment/xendit";

const requestSchema = z.object({
  addressId: z.string().uuid("addressId tidak valid."),
  cartItemIds: z.array(z.string().uuid("Format cart item tidak valid.")).min(1).max(100),
});

function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MDS-${timestamp}-${random}`;
}

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

  const xenditConfig = getXenditConfig();
  if (!xenditConfig) {
    return NextResponse.json(
      { error: "Konfigurasi Xendit server belum lengkap." },
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
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  const address = await prisma.address.findFirst({
    where: {
      id: payload.addressId,
      userId: auth.user.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      recipientName: true,
      phone: true,
      provinceName: true,
      cityName: true,
      districtName: true,
      subdistrictName: true,
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
          id: true,
          sku: true,
          slug: true,
          name: true,
          basePrice: true,
          stock: true,
          weightGrams: true,
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

  let destinationId = 0;
  let selectedCost:
    | {
        name: string;
        code: string;
        service: string;
        description: string;
        cost: number;
        etd: string;
      }
    | null = null;
  try {
    destinationId = await resolveDomesticDestinationId({
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

    selectedCost = [...costs].sort((left, right) => left.cost - right.cost)[0] ?? null;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkir saat proses pembayaran.",
      },
      { status: 502 },
    );
  }

  if (!selectedCost) {
    return NextResponse.json(
      { error: "Layanan pengiriman tidak tersedia untuk alamat ini." },
      { status: 404 },
    );
  }

  const shippingCost = selectedCost.cost;
  const grandTotal = subtotal + shippingCost;
  const orderNumber = createOrderNumber();

  let invoice;
  try {
    invoice = await createXenditInvoice(
      {
        externalId: orderNumber,
        amount: grandTotal,
        payerEmail: user.email,
        description: `Pembayaran Order ${orderNumber}`,
        successRedirectUrl: `${xenditConfig.successRedirectUrl}?order=${encodeURIComponent(orderNumber)}`,
        failureRedirectUrl: `${xenditConfig.failureRedirectUrl}?order=${encodeURIComponent(orderNumber)}`,
        customerName: user.fullName,
        customerPhone: user.phone,
      },
      xenditConfig,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat payment link Xendit.",
      },
      { status: 502 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        userId: auth.user.id,
        shippingAddressId: address.id,
        orderNumber,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        shippingStatus: "WAITING_FULFILLMENT",
        currencyCode: "IDR",
        subtotalAmount: BigInt(subtotal),
        shippingAmount: BigInt(shippingCost),
        discountAmount: BigInt(0),
        taxAmount: BigInt(0),
        grandTotalAmount: BigInt(grandTotal),
        notes: `Xendit invoice: ${invoice.id}`,
        shippingRecipientName: address.recipientName,
        shippingPhone: address.phone,
        shippingProvinceName: address.provinceName,
        shippingCityName: address.cityName,
        shippingDistrictName: address.districtName,
        shippingSubdistrictName: address.subdistrictName ?? null,
        shippingPostalCode: address.postalCode,
        shippingStreet: address.street,
        shippingDetail: address.detail ?? null,
        expiresAt: invoice.expiry_date ? new Date(invoice.expiry_date) : null,
        items: {
          create: cartItems.map((item) => {
            const productImage =
              item.product.images.find((image) => image.isPrimary)?.url ??
              item.product.images[0]?.url ??
              null;
            const quantity = Math.max(1, item.quantity);
            const unitPrice = Number(item.product.basePrice);

            return {
              productId: item.product.id,
              productSku: item.product.sku,
              productSlug: item.product.slug,
              productName: item.product.name,
              productImageUrl: productImage,
              quantity,
              unitPrice: BigInt(unitPrice),
              lineSubtotal: BigInt(unitPrice * quantity),
              weightGrams: Math.max(1, item.product.weightGrams),
            };
          }),
        },
        shipment: {
          create: {
            provider: "RAJAONGKIR",
            courierCode: selectedCost.code,
            courierName: selectedCost.name,
            serviceCode: selectedCost.service,
            serviceName: `${selectedCost.description} (${toReadableEtd(selectedCost.etd)})`,
            status: "WAITING_FULFILLMENT",
          },
        },
        payments: {
          create: {
            providerOrderId: invoice.id,
            paymentUrl: invoice.invoice_url,
            status: "PENDING",
            grossAmount: BigInt(grandTotal),
            expiryTime: invoice.expiry_date ? new Date(invoice.expiry_date) : null,
          },
        },
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        id: {
          in: cartItems.map((item) => item.id),
        },
        cart: {
          userId: auth.user.id,
        },
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      paymentUrl: invoice.invoice_url,
      orderNumber,
    },
    { status: 200 },
  );
}
