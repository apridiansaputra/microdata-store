import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { normalizeNegotiationNumber } from "@/lib/negotiations/utils";
import { adminNegotiationRespondSchema } from "@/lib/negotiations/validation";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    negotiationNumber: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { negotiationNumber } = await context.params;
  const normalizedNumber = normalizeNegotiationNumber(negotiationNumber);
  if (!normalizedNumber) {
    return NextResponse.json({ error: "ID negosiasi tidak valid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminNegotiationRespondSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload respon tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      negotiationNumber: normalizedNumber,
    },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          id: true,
          quantity: true,
          baseUnitPrice: true,
          buyerOfferUnitPrice: true,
        },
      },
    },
  });

  if (!negotiation) {
    return NextResponse.json({ error: "Data negosiasi tidak ditemukan." }, { status: 404 });
  }

  if (["ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"].includes(negotiation.status)) {
    return NextResponse.json(
      { error: "Negosiasi ini sudah selesai dan tidak bisa diproses lagi." },
      { status: 409 },
    );
  }

  const offerMap = new Map(payload.offers.map((item) => [item.itemId, item.unitPrice]));
  const unknownOffer = payload.offers.find(
    (offer) => !negotiation.items.some((item) => item.id === offer.itemId),
  );
  if (unknownOffer) {
    return NextResponse.json(
      { error: "Ada item penawaran yang tidak sesuai negosiasi." },
      { status: 400 },
    );
  }

  const now = new Date();

  if (payload.action === "REJECT") {
    await prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiation.id },
        data: {
          status: "REJECTED",
          processedById: auth.user.id,
          respondedAt: now,
          closedAt: now,
        },
      });
      await tx.negotiationMessage.create({
        data: {
          negotiationId: negotiation.id,
          senderId: auth.user.id,
          senderRole: "ADMIN",
          message: payload.note?.trim() || "Negosiasi ditolak admin.",
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Negosiasi berhasil ditolak.",
      },
      { status: 200 },
    );
  }

  if (payload.action === "COUNTER") {
    const counterLines = negotiation.items.map((item) => {
      const baseUnitPrice = Number(item.baseUnitPrice);
      const submitted = offerMap.get(item.id);
      const nextUnitPrice = typeof submitted === "number" ? submitted : baseUnitPrice;

      return {
        itemId: item.id,
        quantity: Math.max(1, item.quantity),
        baseUnitPrice,
        nextUnitPrice,
      };
    });

    if (counterLines.some((line) => line.nextUnitPrice < 0)) {
      return NextResponse.json({ error: "Nominal counter tidak valid." }, { status: 400 });
    }
    if (counterLines.some((line) => line.nextUnitPrice > line.baseUnitPrice)) {
      return NextResponse.json(
        { error: "Tawaran admin tidak boleh melebihi harga awal." },
        { status: 400 },
      );
    }

    const counterTotal = counterLines.reduce((sum, line) => {
      return sum + line.nextUnitPrice * line.quantity;
    }, 0);

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        counterLines.map((line) =>
          tx.negotiationItem.update({
            where: { id: line.itemId },
            data: {
              adminCounterUnitPrice: BigInt(line.nextUnitPrice),
              finalUnitPrice: null,
            },
          }),
        ),
      );

      await tx.negotiation.update({
        where: { id: negotiation.id },
        data: {
          status: "COUNTERED",
          processedById: auth.user.id,
          counterTotalAmount: BigInt(counterTotal),
          finalTotalAmount: null,
          respondedAt: now,
        },
      });

      await tx.negotiationMessage.create({
        data: {
          negotiationId: negotiation.id,
          senderId: auth.user.id,
          senderRole: "ADMIN",
          message:
            payload.note?.trim() ||
            `Admin mengirim counter: Rp. ${new Intl.NumberFormat("id-ID").format(counterTotal)},00`,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Counter offer berhasil dikirim ke pengguna.",
      },
      { status: 200 },
    );
  }

  const acceptedLines = negotiation.items.map((item) => {
    const baseUnitPrice = Number(item.baseUnitPrice);
    const buyerOfferUnitPrice = Number(item.buyerOfferUnitPrice ?? item.baseUnitPrice);
    const finalUnitPrice = Math.min(buyerOfferUnitPrice, baseUnitPrice);

    return {
      itemId: item.id,
      quantity: Math.max(1, item.quantity),
      finalUnitPrice,
    };
  });

  const finalTotal = acceptedLines.reduce((sum, line) => {
    return sum + line.finalUnitPrice * line.quantity;
  }, 0);

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      acceptedLines.map((line) =>
        tx.negotiationItem.update({
          where: { id: line.itemId },
          data: {
            finalUnitPrice: BigInt(line.finalUnitPrice),
          },
        }),
      ),
    );

    await tx.negotiation.update({
      where: { id: negotiation.id },
      data: {
        status: "ACCEPTED",
        processedById: auth.user.id,
        finalTotalAmount: BigInt(finalTotal),
        respondedAt: now,
        closedAt: now,
      },
    });

    await tx.negotiationMessage.create({
      data: {
        negotiationId: negotiation.id,
        senderId: auth.user.id,
        senderRole: "ADMIN",
        message:
          payload.note?.trim() ||
          `Admin menyetujui tawaran pengguna: Rp. ${new Intl.NumberFormat("id-ID").format(finalTotal)},00`,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Negosiasi disetujui. Pengguna dapat lanjut checkout.",
    },
    { status: 200 },
  );
}
