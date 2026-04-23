"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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

function mapOAuthErrorMessage(errorCode: string | null) {
  if (!errorCode) return null;

  switch (errorCode) {
    case "google_not_configured":
      return "Konfigurasi Google OAuth belum lengkap di server.";
    case "google_state_invalid":
      return "Sesi login Google tidak valid. Silakan coba lagi.";
    case "google_account_conflict":
      return "Akun Google tidak dapat dihubungkan karena konflik data akun.";
    case "account_blocked":
      return "Akun Anda tidak dapat digunakan. Hubungi admin.";
    case "google_oauth_failed":
      return "Login Google gagal. Silakan coba lagi.";
    default:
      return "Terjadi kesalahan autentikasi.";
  }
}

function sanitizeNextPath(rawPath: string | null, fallback: string) {
  if (!rawPath) return fallback;
  if (!rawPath.startsWith("/")) return fallback;
  if (rawPath.startsWith("//")) return fallback;
  return rawPath;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
    redirectTo?: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"), "/");
  const oauthError = useMemo(
    () => mapOAuthErrorMessage(searchParams.get("error")),
    [searchParams],
  );

  useEffect(() => {
    if (!oauthError) return;

    setFeedback({
      open: true,
      variant: "error",
      title: "Login Google Gagal",
      description: oauthError,
    });
  }, [oauthError]);

  useEffect(() => {
    if (!feedback?.open || !feedback.redirectTo) return;

    const timer = setTimeout(() => {
      router.push(feedback.redirectTo!);
      router.refresh();
    }, 1400);

    return () => clearTimeout(timer);
  }, [feedback, router]);

  const handleGoogleLogin = () => {
    const returnTo = nextPath;
    window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Login Gagal",
          description: data.error ?? "Login gagal. Silakan coba lagi.",
        });
        return;
      }

      setFeedback({
        open: true,
        variant: "success",
        title: "Login Berhasil",
        description: "Anda akan diarahkan ke halaman utama.",
        redirectTo: nextPath,
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
    //Container utama untuk halaman register
    <div className="grid min-h-screen grid-cols-1 items-end gap-8 px-4 py-6 md:px-8 lg:grid-cols-2 lg:items-center"> 
      {/* Bagian kiri dengan judul dan deskripsi */}
      <div className="mx-auto flex h-fit w-full max-w-[500px] flex-col justify-center"> 
        <h1 className="text-2xl mb-2 text-primary-orange">Masuk</h1>
        <p className="text-dark-grey/80 mb-16 font-light">
          Masuk ke akun Anda untuk melanjutkan berbelanja di Microdata Store.
        </p>

        {/* Formulir pendaftaran */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            name="identifier"
            type="text"
            placeholder="Email atau Username"
            required
            className="py-5"
          />
          <div className="relative">
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Kata Sandi"
          required className="py-5"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 cursor-pointer"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-5 mt-10 bg-primary-orange hover:bg-primary-orange/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
          </Button>
        </form>
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="mt-4 h-11 w-full justify-center items-center border-dark-grey/7 bg-white-100 text-sm text-secondary hover:bg-light-grey/90 cursor-pointer"
        >
          <GoogleIcon />
          Lanjut dengan Google
        </Button>
        <p className="text-sm mt-4 text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary-orange font-semibold hover:underline text-base cursor-pointer">
        Daftar
          </Link>
        </p>
      </div>

      {/* Bagian kanan gambar atau ilustrasi (bisa diganti dengan gambar yang sesuai) */}
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
