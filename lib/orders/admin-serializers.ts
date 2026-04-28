import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";

import {
  getOrderStatusMeta,
  getPaymentStatusLabel,
  getShippingStatusLabel,
} from "@/lib/orders/serializers";
import { toSafeNumber } from "@/lib/products/utils";

type AdminListOrderRecord = {
  id: string;
  orderNumber: string;
  placedAt: Date;
  expiresAt: Date | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShipmentStatus;
  grandTotalAmount: bigint;
  user: {
    fullName: string;
    email: string;
  };
  items: Array<{
    id: string;
  }>;
};

type AdminOrderDetailRecord = {
  id: string;
  orderNumber: string;
  placedAt: Date;
  paidAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShipmentStatus;
  subtotalAmount: bigint;
  shippingAmount: bigint;
  discountAmount: bigint;
  taxAmount: bigint;
  grandTotalAmount: bigint;
  adminNote: string | null;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingProvinceName: string;
  shippingCityName: string;
  shippingDistrictName: string;
  shippingSubdistrictName: string | null;
  shippingPostalCode: string;
  shippingStreet: string;
  shippingDetail: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: bigint;
    lineSubtotal: bigint;
  }>;
  shipment: {
    id: string;
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
};

function normalizeImage(url: string | null) {
  if (!url || !url.trim()) return "/image.png";
  const normalized = url.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/image.png";
  }
  return normalized;
}

function getEffectiveOrderState(input: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  expiresAt: Date | null;
}) {
  const now = Date.now();
  const isDisplayExpired =
    input.status === "PENDING_PAYMENT" &&
    input.paymentStatus === "PENDING" &&
    !!input.expiresAt &&
    input.expiresAt.getTime() <= now;

  return {
    status: isDisplayExpired ? ("EXPIRED" as const) : input.status,
    paymentStatus: isDisplayExpired ? ("EXPIRED" as const) : input.paymentStatus,
  };
}

export function serializeAdminOrderListItem(order: AdminListOrderRecord) {
  const effective = getEffectiveOrderState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    expiresAt: order.expiresAt,
  });
  const orderStatus = getOrderStatusMeta(effective.status);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    status: effective.status,
    statusLabel: orderStatus.label,
    paymentStatus: effective.paymentStatus,
    paymentStatusLabel: getPaymentStatusLabel(effective.paymentStatus),
    shippingStatus: order.shippingStatus,
    shippingStatusLabel: getShippingStatusLabel(order.shippingStatus),
    customerName: order.user.fullName,
    customerEmail: order.user.email,
    itemCount: order.items.length,
    totalAmount: toSafeNumber(order.grandTotalAmount) ?? 0,
  };
}

export function serializeAdminOrderDetail(order: AdminOrderDetailRecord) {
  const effective = getEffectiveOrderState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    expiresAt: order.expiresAt,
  });
  const orderStatus = getOrderStatusMeta(effective.status);
  const shippingStatusLabel = getShippingStatusLabel(order.shippingStatus);
  const paymentStatusLabel = getPaymentStatusLabel(effective.paymentStatus);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    status: effective.status,
    statusLabel: orderStatus.label,
    paymentStatus: effective.paymentStatus,
    paymentStatusLabel,
    shippingStatus: order.shippingStatus,
    shippingStatusLabel,
    canUpdateShipment:
      !["CANCELLED", "EXPIRED", "REFUNDED", "COMPLETED"].includes(effective.status) &&
      effective.paymentStatus === "SETTLED",
    totals: {
      subtotalAmount: toSafeNumber(order.subtotalAmount) ?? 0,
      shippingAmount: toSafeNumber(order.shippingAmount) ?? 0,
      discountAmount: toSafeNumber(order.discountAmount) ?? 0,
      taxAmount: toSafeNumber(order.taxAmount) ?? 0,
      grandTotalAmount: toSafeNumber(order.grandTotalAmount) ?? 0,
    },
    adminNote: order.adminNote ?? "",
    customer: {
      id: order.user.id,
      fullName: order.user.fullName,
      email: order.user.email,
      phone: order.user.phone,
    },
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
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      imageUrl: normalizeImage(item.productImageUrl),
      quantity: item.quantity,
      unitPrice: toSafeNumber(item.unitPrice) ?? 0,
      lineSubtotal: toSafeNumber(item.lineSubtotal) ?? 0,
    })),
    shipment: order.shipment
      ? {
          id: order.shipment.id,
          courierCode: order.shipment.courierCode,
          courierName: order.shipment.courierName,
          serviceCode: order.shipment.serviceCode,
          serviceName: order.shipment.serviceName,
          trackingNumber: order.shipment.trackingNumber,
          trackingUrl: order.shipment.trackingUrl,
          status: order.shipment.status,
          statusLabel: getShippingStatusLabel(order.shipment.status),
          shippedAt: order.shipment.shippedAt
            ? order.shipment.shippedAt.toISOString()
            : null,
          deliveredAt: order.shipment.deliveredAt
            ? order.shipment.deliveredAt.toISOString()
            : null,
        }
      : null,
  };
}
