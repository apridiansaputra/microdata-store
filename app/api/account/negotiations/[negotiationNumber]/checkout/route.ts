import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { normalizeNegotiationNumber } from "@/lib/negotiations/utils";
import { createXenditInvoice, getXenditConfig } from "@/lib/payment/xendit";
import { prisma } from "@/lib/prisma";
import { getShippingProviderConfig } from "@/lib/shipping/config";
import {
  calculateDomesticCosts,
  resolveDomesticDestinationId,
  toReadableEtd,
} from "@/lib/shipping/rajaongkir";

type RouteContext = {
  params: Promise<{
    negotiationNumber: string;
  }>;
};

function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MDS-${timestamp}-${random}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  const { negotiationNumber } = await context.params;
  const normalizedNumber = normalizeNegotiationNumber(negotiationNumber);
  if (!normalizedNumber) {
    return NextResponse.json({ error: "ID negosiasi tidak valid." }, { status: 400 });
  }

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      negotiationNumber: normalizedNumber,
      userId: auth.user.id,
    },
    select: {
      id: true,
      status: true,
      finalOrderId: true,
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          baseUnitPrice: true,
          buyerOfferUnitPrice: true,
          adminCounterUnitPrice: true,
          finalUnitPrice: true,
          product: {
            select: {
              id: true,
              sku: true,
              slug: true,
              name: true,
              weightGrams: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!negotiation) {
    return NextResponse.json({ error: "Data negosiasi tidak ditemukan." }, { status: 404 });
  }

  if (!["ACCEPTED", "COUNTERED"].includes(negotiation.status)) {
    return NextResponse.json(
      { error: "Negosiasi belum dapat dilanjutkan ke checkout." },
      { status: 409 },
    );
  }

  if (negotiation.finalOrderId) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: negotiation.finalOrderId },
      select: {
        orderNumber: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            paymentUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderNumber: existingOrder?.orderNumber ?? null,
        paymentUrl: existingOrder?.payments[0]?.paymentUrl ?? null,
      },
      { status: 200 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      email: true,
      fullName: true,
      phone: true,
      addresses: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  const address = user.addresses[0] ?? null;
  if (!address) {
    return NextResponse.json(
      { error: "Alamat pengiriman aktif tidak ditemukan. Atur alamat utama terlebih dahulu." },
      { status: 409 },
    );
  }

  const subtotal = negotiation.items.reduce((sum, item) => {
    const quantity = Math.max(1, item.quantity);
    const unitPrice = Number(
      negotiation.status === "COUNTERED"
        ? item.adminCounterUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice
        : item.finalUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice,
    );
    return sum + unitPrice * quantity;
  }, 0);

  const totalWeightGrams = negotiation.items.reduce((sum, item) => {
    const quantity = Math.max(1, item.quantity);
    const weight = Math.max(1, item.product.weightGrams);
    return sum + weight * quantity;
  }, 0);

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

    selectedCost = [...costs].sort((left, right) => left.cost - right.cost)[0] ?? null;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkir untuk checkout negosiasi.",
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
        description: `Pembayaran Order ${orderNumber} (Negosiasi ${negotiationNumber})`,
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

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
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
        notes: `Xendit invoice: ${invoice.id}; negotiation: ${negotiationNumber}`,
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
          create: negotiation.items.map((item) => {
            const quantity = Math.max(1, item.quantity);
            const baseUnitPrice = Number(item.baseUnitPrice);
            const negotiatedUnitPrice = Number(
              negotiation.status === "COUNTERED"
                ? item.adminCounterUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice
                : item.finalUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice,
            );
            const productImage =
              item.product.images.find((image) => image.isPrimary)?.url ??
              item.product.images[0]?.url ??
              null;

            return {
              productId: item.product.id,
              productSku: item.product.sku,
              productSlug: item.product.slug,
              productName: item.product.name,
              productImageUrl: productImage,
              quantity,
              unitPrice: BigInt(baseUnitPrice),
              negotiatedUnitPrice:
                negotiatedUnitPrice !== baseUnitPrice ? BigInt(negotiatedUnitPrice) : null,
              lineSubtotal: BigInt(negotiatedUnitPrice * quantity),
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
      select: {
        id: true,
      },
    });

    await tx.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
        closedAt: new Date(),
        finalOrderId: order.id,
        finalTotalAmount: BigInt(subtotal),
      },
    });

    await Promise.all(
      negotiation.items.map((item) => {
        const finalUnitPrice = Number(
          negotiation.status === "COUNTERED"
            ? item.adminCounterUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice
            : item.finalUnitPrice ?? item.buyerOfferUnitPrice ?? item.baseUnitPrice,
        );

        return tx.negotiationItem.update({
          where: { id: item.id },
          data: {
            finalUnitPrice: BigInt(finalUnitPrice),
          },
        });
      }),
    );

    await tx.negotiationMessage.create({
      data: {
        negotiationId: negotiation.id,
        senderId: auth.user.id,
        senderRole: "USER",
        message: `Pengguna menyetujui tawaran toko dan checkout dibuat: ${orderNumber}.`,
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        cart: {
          userId: auth.user.id,
        },
        productId: {
          in: negotiation.items.map((item) => item.productId),
        },
      },
    });

    return order;
  });

  return NextResponse.json(
    {
      success: true,
      orderNumber,
      paymentUrl: invoice.invoice_url,
      negotiationId: negotiation.id,
      finalOrderId: createdOrder.id,
    },
    { status: 200 },
  );
}
