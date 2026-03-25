"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/");
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
          <Input type="text" placeholder="Username" required className="py-5" />
          <div className="relative">
        <Input
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
          <Button type="submit" className="w-full p-5 mt-10 bg-primary-orange hover:bg-primary-orange/90 cursor-pointer">
        Masuk
          </Button>
        </form>
        <p className="text-sm mt-4 text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary-orange font-semibold hover:underline text-base cursor-pointer">
        Daftar
          </Link>
        </p>
      </div>

      {/* Bagian kanan gambar atau ilustrasi (bisa diganti dengan gambar yang sesuai) */}
      <aside className="hidden h-full items-center justify-center rounded-xl bg-dark-grey lg:flex" />

    </div>
  );
}
