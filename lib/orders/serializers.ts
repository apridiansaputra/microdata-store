import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";

import { toSafeNumber } from "@/lib/products/utils";

export type OrderStatusTone = "green" | "neutral" | "yellow" | "blue" | "red";

type ListOrderRecord = {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShipmentStatus;
  placedAt: Date;
  expiresAt: Date | null;
  grandTotalAmount: bigint;
  items: Array<{
    productSlug: string;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
  }>;
  shipment: {
    trackingNumber: string | null;
    trackingUrl: string | null;
    courierName: string;
    serviceName: string;
  } | null;
};

type DetailOrderRecord = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShipmentStatus;
  placedAt: Date;
  paidAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date | null;
  subtotalAmount: bigint;
  shippingAmount: bigint;
  discountAmount: bigint;
  taxAmount: bigint;
  grandTotalAmount: bigint;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingProvinceName: string;
  shippingCityName: string;
  shippingDistrictName: string;
  shippingSubdistrictName: string | null;
  shippingPostalCode: string;
  shippingStreet: string;
  shippingDetail: string | null;
  shipment: {
    courierCode: string;
    courierName: string;
    serviceCode: string;
    serviceName: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShipmentStatus;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  items: Array<{
    id: string;
    productId: string | null;
    productSlug: string;
    productSku: string;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: bigint;
    lineSubtotal: bigint;
  }>;
};

function normalizeLocalImage(url: string | null) {
  if (!url || !url.trim()) return "/image.png";
  const normalized = url.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/image.png";
  }
  return normalized;
}

export function getOrderStatusMeta(status: OrderStatus): {
  label: string;
  tone: OrderStatusTone;
  progressStep: number;
} {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Belum Bayar", tone: "yellow", progressStep: 1 };
    case "PAID":
      return { label: "Sudah Dibayar", tone: "blue", progressStep: 2 };
    case "PROCESSING":
      return { label: "Sedang Diproses", tone: "blue", progressStep: 2 };
    case "SHIPPED":
      return { label: "Sedang Dikirim", tone: "green", progressStep: 3 };
    case "DELIVERED":
      return { label: "Terkirim", tone: "green", progressStep: 4 };
    case "COMPLETED":
      return { label: "Selesai", tone: "green", progressStep: 4 };
    case "CANCELLED":
      return { label: "Dibatalkan", tone: "neutral", progressStep: 1 };
    case "EXPIRED":
      return { label: "Kedaluwarsa", tone: "red", progressStep: 1 };
    case "REFUNDED":
      return { label: "Dikembalikan", tone: "neutral", progressStep: 4 };
    default:
      return { label: status, tone: "neutral", progressStep: 1 };
  }
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "PENDING":
      return "Menunggu Pembayaran";
    case "AUTHORIZED":
      return "Pembayaran Diotorisasi";
    case "CHALLENGE":
      return "Pembayaran Ditinjau";
    case "CAPTURED":
      return "Pembayaran Tertangkap";
    case "SETTLED":
      return "Pembayaran Lunas";
    case "DENIED":
      return "Pembayaran Ditolak";
    case "CANCELLED":
      return "Pembayaran Dibatalkan";
    case "EXPIRED":
      return "Pembayaran Kedaluwarsa";
    case "FAILED":
      return "Pembayaran Gagal";
    case "REFUNDED":
      return "Dana Dikembalikan";
    case "PARTIAL_REFUNDED":
      return "Sebagian Dana Dikembalikan";
    case "CHARGEBACK":
      return "Terkena Chargeback";
    default:
      return status;
  }
}

export function getShippingStatusLabel(status: ShipmentStatus) {
  switch (status) {
    case "WAITING_FULFILLMENT":
      return "Menunggu Diproses";
    case "READY_TO_SHIP":
      return "Siap Dikirim";
    case "SHIPPED":
      return "Sedang Dikirim";
    case "DELIVERED":
      return "Terkirim";
    case "CANCELLED":
      return "Pengiriman Dibatalkan";
    default:
      return status;
  }
}

export function serializeOrderListItem(
  order: ListOrderRecord,
  options?: { defaultTrackingUrl?: string | null },
) {
  const now = Date.now();
  const isDisplayExpired =
    order.status === "PENDING_PAYMENT" &&
    order.paymentStatus === "PENDING" &&
    !!order.expiresAt &&
    order.expiresAt.getTime() <= now;
  const effectiveOrderStatus: OrderStatus = isDisplayExpired ? "EXPIRED" : order.status;
  const effectivePaymentStatus: PaymentStatus = isDisplayExpired ? "EXPIRED" : order.paymentStatus;
  const statusMeta = getOrderStatusMeta(effectiveOrderStatus);
  const firstItem = order.items[0] ?? null;
  const itemCount = order.items.length;
  const totalQuantity = order.items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
  const totalAmount = toSafeNumber(order.grandTotalAmount) ?? 0;

  return {
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    status: effectiveOrderStatus,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    paymentStatus: effectivePaymentStatus,
    paymentStatusLabel: getPaymentStatusLabel(effectivePaymentStatus),
    shippingStatus: order.shippingStatus,
    shippingStatusLabel: getShippingStatusLabel(order.shippingStatus),
    totalAmount,
    totalQuantity,
    itemCount,
    previewTitle: firstItem
      ? itemCount > 1
        ? `${firstItem.productName} +${itemCount - 1} produk lainnya`
        : firstItem.productName
      : "Produk tidak tersedia",
    previewProductSlug: firstItem?.productSlug ?? null,
    previewImageUrl: normalizeLocalImage(firstItem?.productImageUrl ?? null),
    trackingNumber: order.shipment?.trackingNumber ?? null,
    trackingUrl: order.shipment?.trackingUrl ?? options?.defaultTrackingUrl ?? null,
    courierName: order.shipment?.courierName ?? null,
    serviceName: order.shipment?.serviceName ?? null,
  };
}

export function serializeOrderDetail(
  order: DetailOrderRecord,
  options?: { defaultTrackingUrl?: string | null },
) {
  const now = Date.now();
  const isDisplayExpired =
    order.status === "PENDING_PAYMENT" &&
    order.paymentStatus === "PENDING" &&
    !!order.expiresAt &&
    order.expiresAt.getTime() <= now;
  const effectiveOrderStatus: OrderStatus = isDisplayExpired ? "EXPIRED" : order.status;
  const effectivePaymentStatus: PaymentStatus = isDisplayExpired ? "EXPIRED" : order.paymentStatus;
  const statusMeta = getOrderStatusMeta(effectiveOrderStatus);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    status: effectiveOrderStatus,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    progressStep: statusMeta.progressStep,
    paymentStatus: effectivePaymentStatus,
    paymentStatusLabel: getPaymentStatusLabel(effectivePaymentStatus),
    shippingStatus: order.shippingStatus,
    shippingStatusLabel: getShippingStatusLabel(order.shippingStatus),
    subtotalAmount: toSafeNumber(order.subtotalAmount) ?? 0,
    shippingAmount: toSafeNumber(order.shippingAmount) ?? 0,
    discountAmount: toSafeNumber(order.discountAmount) ?? 0,
    taxAmount: toSafeNumber(order.taxAmount) ?? 0,
    grandTotalAmount: toSafeNumber(order.grandTotalAmount) ?? 0,
    shippingAddress: {
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      provinceName: order.shippingProvinceName,
      cityName: order.shippingCityName,
      districtName: order.shippingDistrictName,
      subdistrictName: order.shippingSubdistrictName,
      postalCode: order.shippingPostalCode,
      street: order.shippingStreet,
      detail: order.shippingDetail,
    },
    shipment: order.shipment
      ? {
          courierCode: order.shipment.courierCode,
          courierName: order.shipment.courierName,
          serviceCode: order.shipment.serviceCode,
          serviceName: order.shipment.serviceName,
          trackingNumber: order.shipment.trackingNumber,
          trackingUrl: order.shipment.trackingUrl ?? options?.defaultTrackingUrl ?? null,
          status: order.shipment.status,
          statusLabel: getShippingStatusLabel(order.shipment.status),
          shippedAt: order.shipment.shippedAt ? order.shipment.shippedAt.toISOString() : null,
          deliveredAt: order.shipment.deliveredAt
            ? order.shipment.deliveredAt.toISOString()
            : null,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.productSlug,
      productSku: item.productSku,
      productName: item.productName,
      productImageUrl: normalizeLocalImage(item.productImageUrl),
      quantity: Math.max(1, item.quantity),
      unitPrice: toSafeNumber(item.unitPrice) ?? 0,
      lineSubtotal: toSafeNumber(item.lineSubtotal) ?? 0,
    })),
  };
}
