"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccountSection from "./AccountSection";

export default function ProfilePasswordSection() {
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
              <ul className="list-inside list-disc space-y-1 text-xs text-dark-grey">
                <li>Biar kata sandimu makin kuat, pastikan ada:</li>
                <li>Minimal 12 karakter</li>
                <li>1 huruf besar</li>
                <li>1 huruf kecil</li>
                <li>1 simbol khusus</li>
                <li>1 angka</li>
              </ul>
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

          <div className="flex justify-end">
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
