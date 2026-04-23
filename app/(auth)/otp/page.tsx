"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function OTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleVerifyOTP = async () => {
    if (!email) {
      setError("Email tidak ditemukan. Silakan ulangi proses registrasi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Verifikasi OTP gagal.");
        return;
      }

      setMessage("Verifikasi berhasil. Mengarahkan ke halaman login...");
      router.push("/login");
      router.refresh();
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email tidak ditemukan. Silakan ulangi proses registrasi.");
      return;
    }

    setIsResending(true);
    setError(null);
    setMessage(null);
    setDevOtp(null);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Gagal mengirim ulang OTP.");
        return;
      }

      setMessage("Kode OTP baru telah dikirim.");
      if (data.devOtp) {
        setDevOtp(String(data.devOtp));
      }
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    router.push("/register");
  };

  return (
    //Container utama untuk halaman register
    <div className="grid min-h-screen grid-cols-1 items-end gap-8 px-4 py-6 md:px-8 lg:grid-cols-2 lg:items-center"> 
      {/* Bagian kiri dengan judul dan deskripsi */}
      <div className="mx-auto flex h-fit w-full max-w-[500px] flex-col gap-4 justify-center"> 
        <h1 className="text-2xl mb-2 text-primary-orange">Masukan Kode OTP</h1>
        <p className="text-dark-grey/80 mb-12 font-light">
            Masukan kode OTP yang telah di kirim ke email Anda {email || "-"}
        </p>

        {/* Input OTP */}
        <div className="flex flex-col gap-4"> {/*input otp*/}
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
            <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
            </InputOTPGroup>
            </InputOTP>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="w-fit text-dark-grey text-xs"
            >
              Belum menerima kode?{" "}
              <span className="hover:underline cursor-pointer font-semibold">
                {isResending ? "Mengirim..." : "Kirim ulang"}
              </span>
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
            {devOtp ? (
              <p className="text-xs text-green-700">
                OTP dev: <span className="font-semibold">{devOtp}</span>
              </p>
            ) : null}
        </div>

        <div className="flex flex-col gap-4 mt-12"> {/*button*/}
            <Button
              type="button"
              onClick={handleVerifyOTP}
              disabled={isSubmitting || otpCode.length !== 6}
              className="w-full py-5 bg-primary-orange hover:bg-primary-orange/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Memverifikasi..." : "Kirim"}
            </Button>
            <Button
              type="button"
              onClick={handleBackToRegister}
              className="w-full py-5 text-dark-grey bg-dark-grey/20 hover:bg-dark-grey/10 cursor-pointer"
            >
              Kembali
            </Button>
        </div>
      </div>

      {/* Bagian kanan gambar atau ilustrasi (bisa diganti dengan gambar yang sesuai) */}
      <aside className="hidden h-full items-center justify-center rounded-xl bg-dark-grey lg:flex" />

    </div>
  );
}
