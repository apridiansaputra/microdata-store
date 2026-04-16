import { z } from "zod";

export const appSettingsSchema = z.object({
  shippingCourierCode: z.string().trim().min(2, "Kode ekspedisi wajib diisi.").max(32),
  shippingCourierName: z.string().trim().min(2, "Nama ekspedisi wajib diisi.").max(64),
  shippingTrackingBaseUrl: z
    .string()
    .trim()
    .url("Tautan ekspedisi tidak valid.")
    .max(2048, "Tautan ekspedisi terlalu panjang.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  bannerAutoplayMs: z.coerce.number().int().min(2000).max(15000).optional(),
});

export const bannerSchema = z.object({
  title: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(180).optional(),
  imageUrl: z.string().trim().min(1, "Gambar banner wajib diisi.").max(2048),
  altText: z.string().trim().max(255).optional(),
  targetUrl: z.string().trim().url("Link banner tidak valid.").max(2048).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const bannerUpdateSchema = bannerSchema.partial().extend({
  imageUrl: z.string().trim().min(1).max(2048).optional(),
});

export const createAdminSchema = z.object({
  fullName: z.string().trim().min(2, "Nama wajib diisi.").max(120),
  email: z.string().trim().email("Email tidak valid.").max(320),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Username harus 3-30 karakter (a-z, 0-9, _)")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,24}$/, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  password: z.string().min(12, "Password minimal 12 karakter").max(128),
});
