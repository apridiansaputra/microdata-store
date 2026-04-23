"use client";

import type { HTMLInputTypeAttribute } from "react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccountSection from "./AccountSection";

type ProfilePayload = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
  birthDate: string | null;
};

type ProfileForm = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
  birthDate: string;
};

function FieldRow({
  label,
  name,
  type = "text",
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  value: string;
  onChange?: (nextValue: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
      <label htmlFor={name} className="text-xs text-dark-grey">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 border-0 bg-white text-xs text-gray-700 shadow-none"
      />
    </div>
  );
}

function toForm(payload: ProfilePayload): ProfileForm {
  return {
    username: payload.username ?? "",
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone ?? "",
    gender: payload.gender,
    birthDate: payload.birthDate ?? "",
  };
}

export default function ProfileGeneralSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setIsLoading(true);
      const response = await fetch("/api/account/profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as {
        profile?: ProfilePayload;
        error?: string;
      };

      if (!mounted) return;

      if (!response.ok || !data.profile) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Gagal Memuat Profil",
          description: data.error ?? "Data profil belum tersedia.",
        });
        setIsLoading(false);
        return;
      }

      setForm(toForm(data.profile));
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!form) return;

    setIsSaving(true);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: form.username.trim() || null,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        gender: form.gender,
        birthDate: form.birthDate || null,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      profile?: ProfilePayload;
      error?: string;
    };
    setIsSaving(false);

    if (!response.ok || !data.profile) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Profil",
        description: data.error ?? "Periksa kembali data yang diisi.",
      });
      return;
    }

    setForm(toForm(data.profile));
    setFeedback({
      open: true,
      variant: "success",
      title: "Profil Tersimpan",
      description: "Informasi umum berhasil diperbarui.",
    });
  };

  return (
    <>
      <AccountSection title="Informasi Umum">
        {isLoading || !form ? (
          <div className="flex items-center gap-2 text-xs text-dark-grey/70">
            <Loader2 className="size-4 animate-spin" />
            Memuat data profil...
          </div>
        ) : (
          <div className="space-y-5">
            <FieldRow
              label="Username"
              name="username"
              value={form.username}
              onChange={(nextValue) => setForm((prev) => (prev ? { ...prev, username: nextValue } : prev))}
            />
            <FieldRow
              label="Nama"
              name="nama"
              value={form.fullName}
              onChange={(nextValue) => setForm((prev) => (prev ? { ...prev, fullName: nextValue } : prev))}
            />
            <FieldRow
              label="Email"
              name="email"
              type="email"
              value={form.email}
              readOnly
            />
            <FieldRow
              label="Nomor Telepon"
              name="phone"
              value={form.phone}
              onChange={(nextValue) => setForm((prev) => (prev ? { ...prev, phone: nextValue } : prev))}
            />

            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
              <p className="text-xs text-dark-grey">Jenis Kelamin</p>
              <div className="flex h-10 items-center gap-6 rounded-md bg-white px-4">
                <label htmlFor="gender-male" className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    id="gender-male"
                    name="gender"
                    type="radio"
                    value="MALE"
                    checked={form.gender === "MALE"}
                    onChange={() => setForm((prev) => (prev ? { ...prev, gender: "MALE" } : prev))}
                    className="h-3.5 w-3.5 accent-primary-orange"
                  />
                  Laki-laki
                </label>
                <label htmlFor="gender-female" className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    id="gender-female"
                    name="gender"
                    type="radio"
                    value="FEMALE"
                    checked={form.gender === "FEMALE"}
                    onChange={() => setForm((prev) => (prev ? { ...prev, gender: "FEMALE" } : prev))}
                    className="h-3.5 w-3.5 accent-primary-orange"
                  />
                  Perempuan
                </label>
                <label htmlFor="gender-other" className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    id="gender-other"
                    name="gender"
                    type="radio"
                    value="OTHER"
                    checked={form.gender === "OTHER"}
                    onChange={() => setForm((prev) => (prev ? { ...prev, gender: "OTHER" } : prev))}
                    className="h-3.5 w-3.5 accent-primary-orange"
                  />
                  Lainnya
                </label>
              </div>
            </div>

            <FieldRow
              label="Tanggal Lahir"
              name="tanggalLahir"
              type="date"
              value={form.birthDate}
              onChange={(nextValue) => setForm((prev) => (prev ? { ...prev, birthDate: nextValue } : prev))}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={isSaving}
                className="rounded-md bg-primary-orange px-5 text-sm text-white hover:bg-primary-orange/90"
                onClick={() => {
                  void handleSave();
                }}
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Simpan Informasi Umum"}
              </Button>
            </div>
          </div>
        )}
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
