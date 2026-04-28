import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Nama depan wajib diisi").max(60),
  lastName: z.string().trim().max(60).optional().default(""),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Username harus 3-30 karakter (a-z, 0-9, _)")
    .optional(),
  email: z.string().trim().email("Format email tidak valid").max(320),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,24}$/, "Nomor telepon tidak valid")
    .optional(),
  password: z.string().min(12, "Password minimal 12 karakter").max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email().max(320),
  code: z.string().trim().regex(/^\d{6}$/, "Kode OTP harus 6 digit"),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(320),
  password: z.string().min(1).max(128),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const forgotPasswordVerifyOtpSchema = z.object({
  email: z.string().trim().email().max(320),
  code: z.string().trim().regex(/^\d{6}$/, "Kode OTP harus 6 digit"),
});

export const forgotPasswordResetSchema = z
  .object({
    email: z.string().trim().email().max(320),
    resetToken: z.string().trim().min(24).max(256),
    newPassword: z.string().min(12, "Password baru minimal 12 karakter").max(128),
    confirmNewPassword: z
      .string()
      .min(1, "Konfirmasi password baru wajib diisi.")
      .max(128),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "Konfirmasi password baru tidak sama.",
    path: ["confirmNewPassword"],
  });

