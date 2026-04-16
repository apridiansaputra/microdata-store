import type { NegotiationStatus } from "@prisma/client";

import { getNegotiationStatusLabel } from "@/lib/negotiations/utils";
import { toSafeNumber } from "@/lib/products/utils";

type NegotiationListRecord = {
  negotiationNumber: string;
  status: NegotiationStatus;
  submittedAt: Date;
  requestedTotalAmount: bigint;
  counterTotalAmount: bigint | null;
  finalTotalAmount: bigint | null;
  items: Array<{
    id: string;
    quantity: number;
    baseUnitPrice: bigint;
  }>;
};

type NegotiationDetailRecord = {
  id: string;
  negotiationNumber: string;
  status: NegotiationStatus;
  submittedAt: Date;
  respondedAt: Date | null;
  closedAt: Date | null;
  requestedTotalAmount: bigint;
  counterTotalAmount: bigint | null;
  finalTotalAmount: bigint | null;
  notes: string | null;
  items: Array<{
    id: string;
    quantity: number;
    baseUnitPrice: bigint;
    buyerOfferUnitPrice: bigint | null;
    adminCounterUnitPrice: bigint | null;
    finalUnitPrice: bigint | null;
    product: {
      name: string;
      images: Array<{
        url: string;
        isPrimary: boolean;
      }>;
    };
  }>;
};

function getResultTotalAmount(input: {
  status: NegotiationStatus;
  requestedTotalAmount: bigint;
  counterTotalAmount: bigint | null;
  finalTotalAmount: bigint | null;
}) {
  if (input.status === "ACCEPTED" && input.finalTotalAmount !== null) {
    return input.finalTotalAmount;
  }
  if (input.counterTotalAmount !== null) {
    return input.counterTotalAmount;
  }
  return input.requestedTotalAmount;
}

function toImageUrl(images: Array<{ url: string; isPrimary: boolean }>) {
  return (
    images.find((image) => image.isPrimary)?.url ??
    images[0]?.url ??
    "/image.png"
  );
}

export function serializeUserNegotiationListItem(item: NegotiationListRecord) {
  const totalBaseAmount = item.items.reduce((sum, line) => {
    return sum + Number(line.baseUnitPrice) * Math.max(1, line.quantity);
  }, 0);
  const resultTotal = toSafeNumber(
    getResultTotalAmount({
      status: item.status,
      requestedTotalAmount: item.requestedTotalAmount,
      counterTotalAmount: item.counterTotalAmount,
      finalTotalAmount: item.finalTotalAmount,
    }),
  ) ?? 0;

  return {
    negotiationNumber: item.negotiationNumber,
    submittedAt: item.submittedAt.toISOString(),
    status: item.status,
    statusLabel: getNegotiationStatusLabel(item.status),
    totalBaseAmount,
    resultTotalAmount: resultTotal,
    itemCount: item.items.length,
  };
}

export function serializeNegotiationDetail(item: NegotiationDetailRecord) {
  const totalBaseAmount = item.items.reduce((sum, line) => {
    return sum + Number(line.baseUnitPrice) * Math.max(1, line.quantity);
  }, 0);
  const requestedTotalAmount = toSafeNumber(item.requestedTotalAmount) ?? 0;
  const counterTotalAmount = toSafeNumber(item.counterTotalAmount);
  const finalTotalAmount = toSafeNumber(item.finalTotalAmount);
  const resultTotalAmount = toSafeNumber(
    getResultTotalAmount({
      status: item.status,
      requestedTotalAmount: item.requestedTotalAmount,
      counterTotalAmount: item.counterTotalAmount,
      finalTotalAmount: item.finalTotalAmount,
    }),
  ) ?? 0;

  return {
    id: item.id,
    negotiationNumber: item.negotiationNumber,
    submissionNo: `#${item.negotiationNumber}`,
    submittedAt: item.submittedAt.toISOString(),
    respondedAt: item.respondedAt ? item.respondedAt.toISOString() : null,
    closedAt: item.closedAt ? item.closedAt.toISOString() : null,
    status: item.status,
    statusLabel: getNegotiationStatusLabel(item.status),
    requestedTotalAmount,
    counterTotalAmount,
    finalTotalAmount,
    totalBaseAmount,
    resultTotalAmount,
    notes: item.notes,
    items: item.items.map((line) => ({
      id: line.id,
      productName: line.product.name,
      productImageUrl: toImageUrl(line.product.images),
      quantity: Math.max(1, line.quantity),
      baseUnitPrice: toSafeNumber(line.baseUnitPrice) ?? 0,
      buyerOfferUnitPrice: toSafeNumber(line.buyerOfferUnitPrice),
      adminCounterUnitPrice: toSafeNumber(line.adminCounterUnitPrice),
      finalUnitPrice: toSafeNumber(line.finalUnitPrice),
    })),
  };
}
