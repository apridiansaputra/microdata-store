"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/otp");
  };

  return (
    <main className="min-h-screen bg-light-grey lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-2">
        <section className="no-scrollbar px-4 py-6 md:px-8 md:py-8 lg:h-screen lg:overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[500px] flex-col pb-8 lg:min-h-full lg:justify-end lg:pb-12">
            <h1 className="mb-2 text-2xl text-primary-orange">Daftar</h1>
            <p className="mb-10 font-light text-dark-grey/80">
              Buat akun baru untuk mulai berbelanja di Microdata Store.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input type="text" placeholder="Nama Depan" required className="py-5" />
                <Input type="text" placeholder="Nama Belakang" required className="py-5" />
              </div>
              <Input type="text" placeholder="Username" required className="py-5" />
              <Input type="email" placeholder="Email" required className="py-5" />
              <Input type="text" placeholder="Nomor Telepon" required className="py-5" />
              <div className="relative">
                <Input
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
                className="mt-8 h-11 w-full bg-primary-orange text-white hover:bg-primary-orange/90 cursor-pointer"
              >
                Daftar
              </Button>
            </form>

            <Button
              type="button"
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

        <aside className="hidden h-screen p-6 lg:block">
          <div className="h-full rounded-xl bg-dark-grey" />
        </aside>
      </div>
    </main>
  );
}
