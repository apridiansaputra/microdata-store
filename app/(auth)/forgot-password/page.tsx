"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type ForgotStep = "request" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoRequestedRef = useRef(false);

  const [step, setStep] = useState<ForgotStep>("request");
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    next: false,
    confirm: false,
  });
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
    redirectTo?: string;
  } | null>(null);

  const passwordRules = useMemo(
    () => [
      {
        label: "Minimal 12 karakter",
        isValid: passwordForm.newPassword.length >= 12,
      },
      {
        label: "Mengandung huruf kapital (A-Z)",
        isValid: /[A-Z]/.test(passwordForm.newPassword),
      },
      {
        label: "Mengandung huruf kecil (a-z)",
        isValid: /[a-z]/.test(passwordForm.newPassword),
      },
      {
        label: "Mengandung angka (0-9)",
        isValid: /\d/.test(passwordForm.newPassword),
      },
      {
        label: "Mengandung simbol (contoh: !@#$%)",
        isValid: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
      },
    ],
    [passwordForm.newPassword],
  );

  const handleRequestOtp = useCallback(async () => {
    if (!email.trim()) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Email Wajib Diisi",
        description: "Masukkan email akun terlebih dahulu.",
      });
      return;
    }

    setIsRequestingOtp(true);
    setDevOtp(null);

    try {
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        devOtp?: string;
        devCanReset?: boolean;
        devReason?: string;
      };

      if (!response.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Gagal Mengirim OTP",
          description: data.error ?? "Permintaan belum bisa diproses.",
        });
        return;
      }

      if (data.devOtp) {
        setDevOtp(String(data.devOtp));
      }
      setStep("verify");
      setFeedback({
        open: true,
        variant: "success",
        title: "OTP Dikirim",
        description:
          process.env.NODE_ENV !== "production" && data.devCanReset === false
            ? `${data.message ?? "Silakan cek email untuk kode OTP."} (dev: ${data.devReason ?? "not_eligible"})`
            : (data.message ?? "Silakan cek email untuk kode OTP."),
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Terjadi Gangguan",
        description: "Terjadi gangguan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsRequestingOtp(false);
    }
  }, [email]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        resetToken?: string;
      };

      if (!response.ok || !data.resetToken) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Verifikasi OTP Gagal",
          description: data.error ?? "Kode OTP tidak valid.",
        });
        return;
      }

      setResetToken(data.resetToken);
      setStep("reset");
      setFeedback({
        open: true,
        variant: "success",
        title: "OTP Terverifikasi",
        description: data.message ?? "Silakan buat password baru.",
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Terjadi Gangguan",
        description: "Terjadi gangguan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Sesi Reset Tidak Valid",
        description: "Silakan ulangi proses lupa password dari awal.",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Reset Password Gagal",
          description: data.error ?? "Password baru belum bisa disimpan.",
        });
        return;
      }

      setFeedback({
        open: true,
        variant: "success",
        title: "Reset Password Berhasil",
        description: data.message ?? "Silakan login dengan password baru Anda.",
        redirectTo: "/login",
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Terjadi Gangguan",
        description: "Terjadi gangguan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  useEffect(() => {
    if (step !== "request" || autoRequestedRef.current) return;
    if (!email.trim()) return;

    autoRequestedRef.current = true;
    void handleRequestOtp();
  }, [email, handleRequestOtp, step]);

  return (
    <div className="grid min-h-screen grid-cols-1 items-end gap-8 px-4 py-6 md:px-8 lg:grid-cols-2 lg:items-center">
      <div className="mx-auto flex h-fit w-full max-w-[500px] flex-col justify-center">
        <h1 className="mb-2 text-2xl text-primary-orange">Lupa Password</h1>
        <p className="mb-12 font-light text-dark-grey/80">
          {step === "request"
            ? "Masukkan email akun Anda untuk menerima OTP reset password."
            : step === "verify"
              ? `Masukkan OTP 6 digit yang dikirim ke ${email || "-"}`
              : "Buat password baru untuk akun Anda."}
        </p>

        {step === "request" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRequestOtp();
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              className="py-5"
            />
            <Button
              type="submit"
              disabled={isRequestingOtp}
              className="mt-6 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:opacity-70"
            >
              {isRequestingOtp ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengirim OTP...
                </>
              ) : (
                "Kirim OTP"
              )}
            </Button>
          </form>
        ) : null}

        {step === "verify" ? (
          <div className="space-y-6">
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
              onClick={() => {
                void handleRequestOtp();
              }}
              disabled={isRequestingOtp}
              className="w-fit text-xs text-dark-grey"
            >
              Belum menerima kode?{" "}
              <span className="font-semibold hover:underline">
                {isRequestingOtp ? "Mengirim..." : "Kirim ulang"}
              </span>
            </button>

            {devOtp ? (
              <p className="text-xs text-emerald-700">
                OTP dev: <span className="font-semibold">{devOtp}</span>
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  void handleVerifyOtp();
                }}
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:opacity-70"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Verifikasi OTP"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("request");
                  setOtpCode("");
                }}
                className="h-11 w-full border-dark-grey/20 text-dark-grey"
              >
                Kembali
              </Button>
            </div>
          </div>
        ) : null}

        {step === "reset" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleResetPassword();
            }}
          >
            <div className="relative">
              <Input
                type={showPassword.next ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
                placeholder="Password baru"
                required
                className="py-5 pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, next: !prev.next }))
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
              >
                {showPassword.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirmNewPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmNewPassword: event.target.value,
                  }))
                }
                placeholder="Konfirmasi password baru"
                required
                className="py-5 pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="rounded-md border border-dark-grey/10 bg-white px-3 py-2">
              <p className="mb-2 text-xs font-medium text-dark-grey/70">
                Kata sandi harus memenuhi:
              </p>
              <div className="space-y-1">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${
                      rule.isValid ? "text-emerald-700" : "text-dark-grey/65"
                    }`}
                  >
                    {rule.isValid ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Circle className="size-3.5" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isResettingPassword}
              className="mt-6 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:opacity-70"
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </Button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm">
          Ingat password?{" "}
          <Link
            href="/login"
            className="text-base font-semibold text-primary-orange hover:underline"
          >
            Kembali ke Masuk
          </Link>
        </p>
      </div>

      <aside className="hidden h-full items-center justify-center rounded-xl bg-dark-grey lg:flex" />

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open && feedback?.redirectTo) {
            router.push(feedback.redirectTo);
            router.refresh();
          }
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </div>
  );
}
