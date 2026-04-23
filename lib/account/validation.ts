import { Gender } from "@prisma/client";
import { z } from "zod";

export const accountProfileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Username harus 3-30 karakter (a-z, 0-9, _).")
    .optional()
    .nullable(),
  fullName: z.string().trim().min(1, "Nama wajib diisi.").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,24}$/, "Nomor telepon tidak valid.")
    .optional()
    .nullable(),
  gender: z.nativeEnum(Gender),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir tidak valid (YYYY-MM-DD).")
    .optional()
    .nullable(),
});

export const accountPasswordUpdateSchema = z
  .object({
    oldPassword: z.string().min(1, "Password lama wajib diisi.").max(128),
    newPassword: z.string().min(12, "Password baru minimal 12 karakter.").max(128),
    confirmNewPassword: z.string().min(1, "Konfirmasi password baru wajib diisi.").max(128),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "Konfirmasi password baru tidak sama.",
    path: ["confirmNewPassword"],
  });

export const accountAddressCreateSchema = z.object({
  fullName: z.string().trim().min(1, "Nama penerima wajib diisi.").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,24}$/, "Nomor telepon tidak valid."),
  region: z.string().trim().min(3, "Region wajib diisi.").optional().nullable(),
  provinceCode: z.string().trim().min(1).max(16).optional().nullable(),
  provinceName: z.string().trim().min(2, "Provinsi wajib dipilih.").max(100),
  cityCode: z.string().trim().min(1).max(16).optional().nullable(),
  cityName: z.string().trim().min(2, "Kota/Kabupaten wajib dipilih.").max(100),
  districtName: z.string().trim().min(2, "Kecamatan wajib dipilih.").max(100),
  postalCode: z.string().trim().regex(/^\d{4,10}$/, "Kode pos tidak valid."),
  rajaOngkirSubdistrictId: z.string().trim().min(1).max(32).optional().nullable(),
  street: z.string().trim().min(3, "Alamat jalan wajib diisi.").max(255),
  detail: z.string().trim().max(2000).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const accountAddressUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Nama penerima wajib diisi.").max(120).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,24}$/, "Nomor telepon tidak valid.")
    .optional(),
  region: z.string().trim().min(3, "Region wajib diisi.").optional().nullable(),
  provinceCode: z.string().trim().min(1).max(16).optional().nullable(),
  provinceName: z.string().trim().min(2, "Provinsi wajib dipilih.").max(100).optional(),
  cityCode: z.string().trim().min(1).max(16).optional().nullable(),
  cityName: z.string().trim().min(2, "Kota/Kabupaten wajib dipilih.").max(100).optional(),
  districtName: z.string().trim().min(2, "Kecamatan wajib dipilih.").max(100).optional(),
  postalCode: z.string().trim().regex(/^\d{4,10}$/, "Kode pos tidak valid.").optional(),
  rajaOngkirSubdistrictId: z.string().trim().min(1).max(32).optional().nullable(),
  street: z.string().trim().min(3, "Alamat jalan wajib diisi.").max(255).optional(),
  detail: z.string().trim().max(2000).optional().nullable(),
  isPrimary: z.boolean().optional(),
});
