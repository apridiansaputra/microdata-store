"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginForm() {
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
  const nextPath = sanitizeNextPath(searchParams.get("next"), "/dashboard");

  useEffect(() => {
    if (!feedback?.open || !feedback.redirectTo) return;

    const timer = setTimeout(() => {
      router.push(feedback.redirectTo!);
      router.refresh();
    }, 1200);

    return () => clearTimeout(timer);
  }, [feedback, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Login Admin Gagal",
          description: data.error ?? "Login gagal. Silakan coba lagi.",
        });
        return;
      }

      setFeedback({
        open: true,
        variant: "success",
        title: "Login Admin Berhasil",
        description: "Anda akan diarahkan ke dashboard admin.",
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
    <main className="flex min-h-screen items-center justify-center bg-light-grey px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border-grey bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary-orange/10">
            <ShieldCheck className="size-5 text-primary-orange" />
          </div>
          <h1 className="text-2xl text-primary-orange">Masuk Admin</h1>
          <p className="mt-1 text-sm text-dark-grey/75">
            Gunakan akun admin untuk mengakses dashboard.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            name="identifier"
            type="text"
            placeholder="Email atau Username Admin"
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk Admin"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-dark-grey/70">
          Kembali ke halaman user?{" "}
          <Link href="/login" className="font-medium text-primary-orange hover:underline">
            Masuk User
          </Link>
        </div>
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

function sanitizeNextPath(rawPath: string | null, fallback: string) {
  if (!rawPath) return fallback;
  if (!rawPath.startsWith("/")) return fallback;
  if (rawPath.startsWith("//")) return fallback;
  return rawPath;
}
