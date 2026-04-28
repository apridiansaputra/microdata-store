"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthBannerPanel } from "@/components/auth/auth-banner-panel";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.8 2.9 14.6 2 12 2a10 10 0 1 0 0 20c5.8 0 9.7-4.1 9.7-9.8 0-.7-.1-1.3-.2-2H12Z"
      />
      <path
        fill="#34A853"
        d="M3.8 7.3 7 9.6C7.8 7.3 9.7 5.7 12 5.7c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.8 2.9 14.6 2 12 2 8.2 2 4.9 4.1 3.3 7.2l.5.1Z"
      />
      <path
        fill="#4A90E2"
        d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-2 1.1-3.4 1.1-4 0-5.3-2.4-5.5-3.6L3.4 17C5 20 8.2 22 12 22Z"
      />
      <path fill="#FBBC05" d="M3.3 7.2A10 10 0 0 0 2 12c0 1.8.5 3.6 1.4 5l3.1-2.5A6 6 0 0 1 6 12c0-.9.2-1.7.5-2.4L3.3 7.2Z" />
    </svg>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
    redirectTo?: string;
  } | null>(null);
  const router = useRouter();

  const passwordRules = [
    { label: "Minimal 12 karakter", isValid: password.length >= 12 },
    { label: "Mengandung huruf kapital (A-Z)", isValid: /[A-Z]/.test(password) },
    { label: "Mengandung huruf kecil (a-z)", isValid: /[a-z]/.test(password) },
    { label: "Mengandung angka (0-9)", isValid: /\d/.test(password) },
    {
      label: "Mengandung simbol (contoh: !@#$%)",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  useEffect(() => {
    if (!feedback?.open || !feedback.redirectTo) return;

    const timer = setTimeout(() => {
      router.push(feedback.redirectTo!);
      router.refresh();
    }, 1200);

    return () => clearTimeout(timer);
  }, [feedback, router]);

  const handleGoogleRegister = () => {
    const returnTo = "/";
    window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setDevOtp(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      username: String(formData.get("username") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Pendaftaran Gagal",
          description: data.error ?? "Registrasi gagal. Silakan coba lagi.",
        });
        return;
      }

      if (data.devOtp) {
        setDevOtp(String(data.devOtp));
      }

      const encodedEmail = encodeURIComponent(payload.email.trim().toLowerCase());
      setFeedback({
        open: true,
        variant: "success",
        title: "Pendaftaran Berhasil",
        description: "Kode OTP berhasil dikirim. Anda akan diarahkan ke halaman verifikasi.",
        redirectTo: `/otp?email=${encodedEmail}`,
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Terjadi Gangguan",
        description: "Terjadi gangguan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-light-grey lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-2">
        <section className="px-4 py-6 md:px-8 md:py-8 lg:h-screen lg:overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[500px] flex-col pb-8 lg:min-h-full lg:justify-end lg:pb-12">
            <h1 className="mb-2 text-2xl text-primary-orange">Daftar</h1>
            <p className="mb-10 font-light text-dark-grey/80">
              Buat akun baru untuk mulai berbelanja di Microdata Store.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  name="firstName"
                  type="text"
                  placeholder="Nama Depan"
                  required
                  className="py-5"
                />
                <Input
                  name="lastName"
                  type="text"
                  placeholder="Nama Belakang"
                  className="py-5"
                />
              </div>
              <Input
                name="username"
                type="text"
                placeholder="Username"
                required
                className="py-5"
              />
              <Input name="email" type="email" placeholder="Email" required className="py-5" />
              <Input
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Nomor Telepon"
                required
                className="py-5"
              />
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata Sandi"
                  required
                  className="py-5"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      className={`flex items-center gap-2 text-xs ${rule.isValid ? "text-emerald-700" : "text-dark-grey/65"
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

              {devOtp ? (
                <p className="text-xs text-green-700">
                  OTP dev: <span className="font-semibold">{devOtp}</span>
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Daftar"
                )}
              </Button>
            </form>

            <Button
              type="button"
              onClick={handleGoogleRegister}
              variant="outline"
              className="mt-4 h-11 w-full justify-center items-center border-dark-grey/7 bg-white-100 text-sm text-secondary hover:bg-light-grey/90 cursor-pointer"
            >
              <GoogleIcon />
              Lanjut dengan Google
            </Button>

            <p className="mt-4 text-center text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-base font-semibold text-primary-orange hover:underline cursor-pointer">
                Masuk
              </Link>
            </p>
          </div>
        </section>

        {/* Bagian kanan: Auth Banner */}
        <aside className="hidden h-screen p-6 lg:block">
          <AuthBannerPanel />
        </aside>
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
    </main>
  );
}
