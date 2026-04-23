import { PaymentStatus, ShipmentStatus } from "@prisma/client";
import { z } from "zod";

export const adminOrdersQuerySchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  shippingStatus: z.nativeEnum(ShipmentStatus).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminOrderShippingUpdateSchema = z.object({
  shippingStatus: z.enum([
    "WAITING_FULFILLMENT",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
  ]),
  trackingNumber: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(128, "Nomor resi terlalu panjang.")
      .optional(),
  ),
  adminNote: z
    .string()
    .trim()
    .max(500, "Catatan admin maksimal 500 karakter.")
    .optional(),
});
