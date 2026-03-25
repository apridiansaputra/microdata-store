"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import AccountSection from "./AccountSection";

export default function ProfilePasswordSection() {
  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });

  const togglePasswordVisibility = (key: "old" | "next" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AccountSection
      title="Ubah Password"
      action={<ChevronDown className="h-5 w-5 text-gray-600" />}
    >
      <form className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
          <label htmlFor="password-lama" className="text-xs text-dark-grey">
            Password Lama
          </label>
          <div className="relative">
            <Input
              id="password-lama"
              name="passwordLama"
              type={showPassword.old ? "text" : "password"}
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
              placeholder="Ketik Ulang Password Baru"
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
      </form>
    </AccountSection>
  );
}
