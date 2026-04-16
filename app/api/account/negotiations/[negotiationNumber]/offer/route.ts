import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { normalizeNegotiationNumber } from "@/lib/negotiations/utils";
import { userNegotiationOfferSchema } from "@/lib/negotiations/validation";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    negotiationNumber: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { negotiationNumber } = await context.params;
  const normalizedNumber = normalizeNegotiationNumber(negotiationNumber);
  if (!normalizedNumber) {
    return NextResponse.json({ error: "ID negosiasi tidak valid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = userNegotiationOfferSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Payload tawaran tidak valid." },
      { status: 400 },
    );
  }

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      negotiationNumber: normalizedNumber,
      userId: auth.user.id,
    },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          id: true,
          quantity: true,
          baseUnitPrice: true,
        },
      },
    },
  });

  if (!negotiation) {
    return NextResponse.json({ error: "Data negosiasi tidak ditemukan." }, { status: 404 });
  }

  if (["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].includes(negotiation.status)) {
    return NextResponse.json(
      { error: "Negosiasi ini sudah selesai dan tidak dapat diajukan ulang." },
      { status: 409 },
    );
  }

  const offerMap = new Map(
    parsedBody.data.offers.map((item) => [item.itemId, item.unitPrice]),
  );

  const unknownOfferItem = parsedBody.data.offers.find(
    (item) => !negotiation.items.some((line) => line.id === item.itemId),
  );
  if (unknownOfferItem) {
    return NextResponse.json(
      { error: "Ada item tawaran yang tidak termasuk dalam negosiasi." },
      { status: 400 },
    );
  }

  const nextLineOffers = negotiation.items.map((item) => {
    const submittedUnitPrice = offerMap.get(item.id);
    const baseUnitPrice = Number(item.baseUnitPrice);
    const nextUnitPrice =
      typeof submittedUnitPrice === "number" ? submittedUnitPrice : baseUnitPrice;

    return {
      itemId: item.id,
      unitPrice: nextUnitPrice,
      baseUnitPrice,
      quantity: Math.max(1, item.quantity),
    };
  });

  if (nextLineOffers.some((item) => item.unitPrice > item.baseUnitPrice)) {
    return NextResponse.json(
      { error: "Tawaran tidak boleh melebihi harga awal." },
      { status: 400 },
    );
  }

  const requestedTotal = nextLineOffers.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      nextLineOffers.map((item) =>
        tx.negotiationItem.update({
          where: {
            id: item.itemId,
          },
          data: {
            buyerOfferUnitPrice: BigInt(item.unitPrice),
            finalUnitPrice: null,
          },
        }),
      ),
    );

    await tx.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        status: "OPEN",
        requestedTotalAmount: BigInt(requestedTotal),
        finalTotalAmount: null,
      },
    });

    await tx.negotiationMessage.create({
      data: {
        negotiationId: negotiation.id,
        senderId: auth.user.id,
        senderRole: "USER",
        message: `Pengguna mengajukan tawaran baru: Rp. ${new Intl.NumberFormat("id-ID").format(requestedTotal)},00`,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Tawaran baru berhasil dikirim ke admin.",
    },
    { status: 200 },
  );
}
