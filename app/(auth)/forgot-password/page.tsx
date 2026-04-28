"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const [step, setStep] = useState<ForgotStep>("request");
  const [email, setEmail] = useState("");
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
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
    redirectTo?: string;
  } | null>(null);

  const passwordRules = useMemo(
    () => [
      { label: "Minimal 12 karakter", isValid: passwordForm.newPassword.length >= 12 },
      { label: "Mengandung huruf kapital (A-Z)", isValid: /[A-Z]/.test(passwordForm.newPassword) },
      { label: "Mengandung huruf kecil (a-z)", isValid: /[a-z]/.test(passwordForm.newPassword) },
      { label: "Mengandung angka (0-9)", isValid: /\d/.test(passwordForm.newPassword) },
      { label: "Mengandung simbol (contoh: !@#$%)", isValid: /[^A-Za-z0-9]/.test(passwordForm.newPassword) },
    ],
    [passwordForm.newPassword],
  );

  const passwordsMatch =
    passwordForm.confirmNewPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmNewPassword;

  const passwordsMismatch =
    passwordForm.confirmNewPassword.length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmNewPassword;

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
    try {
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <h1 className="mb-2 text-2xl text-primary-orange">Lupa Password</h1>
        <p className="mb-12 font-light text-dark-grey/80">
          {step === "request"
            ? "Masukkan email akun Anda untuk menerima OTP reset password."
            : step === "verify"
              ? `Masukkan OTP 6 digit yang dikirim ke ${email || "-"}`
              : "Buat password baru untuk akun Anda."}
        </p>

        {/* Step 1: Request OTP */}
        {step === "request" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); void handleRequestOtp(); }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                <><Loader2 className="size-4 animate-spin" /> Mengirim OTP...</>
              ) : "Kirim OTP"}
            </Button>
          </form>
        ) : null}

        {/* Step 2: Verify OTP */}
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
              onClick={() => { void handleRequestOtp(); }}
              disabled={isRequestingOtp}
              className="w-fit text-xs text-dark-grey"
            >
              Belum menerima kode?{" "}
              <span className="font-semibold hover:underline">
                {isRequestingOtp ? "Mengirim..." : "Kirim ulang"}
              </span>
            </button>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="button"
                onClick={() => { void handleVerifyOtp(); }}
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:opacity-70"
              >
                {isVerifyingOtp ? (
                  <><Loader2 className="size-4 animate-spin" /> Memverifikasi...</>
                ) : "Verifikasi OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep("request"); setOtpCode(""); }}
                className="h-11 w-full border-dark-grey/20 text-dark-grey"
              >
                Kembali
              </Button>
            </div>
          </div>
        ) : null}

        {/* Step 3: Reset Password */}
        {step === "reset" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); void handleResetPassword(); }}
          >
            {/* Input Password Baru */}
            <div className="relative">
              <Input
                type={showPassword.next ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Password baru"
                required
                className="py-5 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => ({ ...p, next: !p.next }))}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
              >
                {showPassword.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Syarat Password — di bawah input password baru */}
            <div className="rounded-md border border-dark-grey/10 bg-white px-3 py-2">
              <p className="mb-2 text-xs font-medium text-dark-grey/70">Kata sandi harus memenuhi:</p>
              <div className="space-y-1">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${rule.isValid ? "text-emerald-600" : "text-dark-grey/65"}`}
                  >
                    {rule.isValid
                      ? <CheckCircle2 className="size-3.5" />
                      : <Circle className="size-3.5" />}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Konfirmasi Password */}
            <div className="relative">
              <Input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                placeholder="Ulangi password baru"
                required
                className="py-5 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Hint kesesuaian password — di bawah konfirmasi */}
            {passwordsMatch && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Password cocok
              </p>
            )}
            {passwordsMismatch && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <XCircle className="size-3.5 shrink-0" />
                Password tidak sama, periksa kembali
              </p>
            )}

            <Button
              type="submit"
              disabled={isResettingPassword || passwordsMismatch || !passwordsMatch}
              className="mt-4 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:opacity-70"
            >
              {isResettingPassword ? (
                <><Loader2 className="size-4 animate-spin" /> Menyimpan...</>
              ) : "Simpan Password Baru"}
            </Button>
          </form>
        ) : null}

        <p className="mt-8 text-center text-sm">
          Ingat password?{" "}
          <Link href="/login" className="text-base font-semibold text-primary-orange hover:underline">
            Kembali ke Masuk
          </Link>
        </p>
      </div>

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
