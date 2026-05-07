import { ProductStatus } from "@prisma/client";
import { z } from "zod";

import { isLocalImagePath } from "@/lib/products/utils";

const MAX_PRICE = 999_999_999_999;

const imagePathSchema = z
  .string()
  .trim()
  .min(1, "Path gambar wajib diisi.")
  .max(2048, "Path gambar terlalu panjang.")
  .refine(
    (value) => isLocalImagePath(value),
    "Path gambar tidak valid.",
  );

const baseProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(3, "SKU minimal 3 karakter.")
      .max(64, "SKU maksimal 64 karakter.")
      .regex(/^[A-Za-z0-9._-]+$/, "SKU hanya boleh huruf, angka, titik, underscore, atau dash."),
    name: z.string().trim().min(3, "Nama produk minimal 3 karakter.").max(180),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug harus format kebab-case.")
      .optional(),
    shortSpec: z.string().trim().max(255).optional().nullable(),
    description: z.string().trim().max(100000).optional().nullable(),
    basePrice: z.coerce.number().int().min(0).max(MAX_PRICE),
    compareAtPrice: z.coerce.number().int().min(0).max(MAX_PRICE).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(10_000_000),
    weightGrams: z.coerce.number().int().min(0).max(500_000),
    categoryId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(ProductStatus),
    coverImageUrl: imagePathSchema,
    galleryImageUrls: z.array(imagePathSchema).max(12).default([]),
  })
  .refine(
    (value) =>
      value.compareAtPrice === null ||
      value.compareAtPrice === undefined ||
      value.compareAtPrice >= value.basePrice,
    {
      message: "Harga coret harus lebih besar atau sama dengan harga jual.",
      path: ["compareAtPrice"],
    },
  );

export const adminCreateProductSchema = baseProductSchema;
export const adminUpdateProductSchema = baseProductSchema;

export const adminProductsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const publicProductsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categorySlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.coerce.number().int().min(1).max(99).optional(),
    isSelected: z.boolean().optional(),
  })
  .refine((value) => value.quantity !== undefined || value.isSelected !== undefined, {
    message: "Minimal satu field harus diubah.",
  });

export const adminCategoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(80, "Nama kategori maksimal 80 karakter."),
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema;
