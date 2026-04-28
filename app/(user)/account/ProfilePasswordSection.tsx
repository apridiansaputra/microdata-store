"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Eye, EyeOff, Loader2 } from "lucide-react";

import { useUserAuth } from "@/components/auth/user-auth-context";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccountSection from "./AccountSection";

export default function ProfilePasswordSection() {
  const { user } = useUserAuth();
  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const togglePasswordVisibility = (key: "old" | "next" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const passwordRules = [
    { label: "Minimal 12 karakter", isValid: form.newPassword.length >= 12 },
    { label: "Mengandung huruf kapital (A-Z)", isValid: /[A-Z]/.test(form.newPassword) },
    { label: "Mengandung huruf kecil (a-z)", isValid: /[a-z]/.test(form.newPassword) },
    { label: "Mengandung angka (0-9)", isValid: /\d/.test(form.newPassword) },
    {
      label: "Mengandung simbol (contoh: !@#$%)",
      isValid: /[^A-Za-z0-9]/.test(form.newPassword),
    },
  ];

  const handleSavePassword = async () => {
    setIsSaving(true);
    const response = await fetch("/api/account/password", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Mengubah Password",
        description: data.error ?? "Coba lagi beberapa saat.",
      });
      return;
    }

    setForm({
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    setFeedback({
      open: true,
      variant: "success",
      title: "Password Berhasil Diubah",
      description: "Password akun kamu sudah diperbarui.",
    });
  };

  return (
    <>
      <AccountSection
        title="Ubah Password"
        action={<ChevronDown className="h-5 w-5 text-gray-600" />}
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSavePassword();
          }}
        >
          <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
            <label htmlFor="password-lama" className="text-xs text-dark-grey">
              Password Lama
            </label>
            <div className="relative">
              <Input
                id="password-lama"
                name="passwordLama"
                type={showPassword.old ? "text" : "password"}
                value={form.oldPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, oldPassword: event.target.value }))
                }
                placeholder="Masukkan password lama"
                className="h-10 border-0 bg-white pr-10 text-xs text-gray-700 shadow-none"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("old")}
                aria-label={
                  showPassword.old
                    ? "Sembunyikan password lama"
                    : "Tampilkan password lama"
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
              >
                {showPassword.old ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
            <label htmlFor="password-baru" className="pt-2 text-xs text-dark-grey">
              Password Baru
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  id="password-baru"
                  name="passwordBaru"
                  type={showPassword.next ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                  placeholder="Masukkan password baru"
                  className="h-10 border-0 bg-white pr-10 text-xs text-gray-700 shadow-none"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("next")}
                  aria-label={
                    showPassword.next
                      ? "Sembunyikan password baru"
                      : "Tampilkan password baru"
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                >
                  {showPassword.next ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
            <label htmlFor="password-konfirmasi" className="text-xs text-dark-grey">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <Input
                id="password-konfirmasi"
                name="passwordKonfirmasi"
                type={showPassword.confirm ? "text" : "password"}
                value={form.confirmNewPassword}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    confirmNewPassword: event.target.value,
                  }))
                }
                placeholder="Ketik ulang password baru"
                className="h-10 border-0 bg-white pr-10 text-xs text-gray-700 shadow-none"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                aria-label={
                  showPassword.confirm
                    ? "Sembunyikan konfirmasi password"
                    : "Tampilkan konfirmasi password"
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/forgot-password${user?.email ? `?email=${encodeURIComponent(user.email)}` : ""}`}
              className="text-xs font-medium text-primary-orange hover:underline"
            >
              Lupa password?
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-primary-orange px-5 text-sm text-white hover:bg-primary-orange/90"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Simpan Password"}
            </Button>
          </div>
        </form>
      </AccountSection>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </>
  );
}
