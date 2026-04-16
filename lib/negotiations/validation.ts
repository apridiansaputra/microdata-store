import { NegotiationStatus } from "@prisma/client";
import { z } from "zod";

export const checkoutNegotiateSchema = z.object({
  addressId: z.string().uuid("addressId tidak valid."),
  cartItemIds: z
    .array(z.string().uuid("Format cart item tidak valid."))
    .min(1)
    .max(100),
});

export const userNegotiationOfferSchema = z.object({
  offers: z
    .array(
      z.object({
        itemId: z.string().uuid("Item negosiasi tidak valid."),
        unitPrice: z.coerce.number().int().min(0).max(999_999_999_999).optional(),
      }),
    )
    .min(1),
});

export const userNegotiationsQuerySchema = z.object({
  status: z.nativeEnum(NegotiationStatus).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const adminNegotiationsQuerySchema = z.object({
  status: z.nativeEnum(NegotiationStatus).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
});

export const adminNegotiationRespondSchema = z.object({
  action: z.enum(["COUNTER", "ACCEPT", "REJECT"]),
  offers: z
    .array(
      z.object({
        itemId: z.string().uuid("Item negosiasi tidak valid."),
        unitPrice: z.coerce.number().int().min(0).max(999_999_999_999).optional(),
      }),
    )
    .default([]),
  note: z.string().trim().max(500).optional(),
});
