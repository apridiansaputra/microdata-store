"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function OTPPage() {
  const router = useRouter();

  const handleVerifyOTP = () => {
    router.push("/login");
  };

  const handleBackToRegister = () => {
    router.push("/register");
  };

  return (
    //Container utama untuk halaman register
    <div className="grid min-h-screen grid-cols-1 items-end gap-8 px-4 py-6 md:px-8 lg:grid-cols-2 lg:items-center"> 
      {/* Bagian kiri dengan judul dan deskripsi */}
      <div className="mx-auto flex h-fit w-full max-w-[500px] flex-col gap-4 justify-center"> 
        <h1 className="text-2xl mb-2 text-primary-orange">Masukan Kode OTP</h1>
        <p className="text-dark-grey/80 mb-12 font-light">
            Masukan kode OTP yang telah di kirim ke email Anda mangudin20@gmail.com
        </p>

        {/* Input OTP */}
        <div className="flex flex-col gap-4"> {/*input otp*/}
            <p className="text-xs text-dark-grey/80"> <span className="font-semibold">02.00</span> menit tersisa</p>
            <InputOTP maxLength={6}>
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
            <p className="text-dark-grey text-xs">Belum menerima kode? <span className=" hover:underline cursor-pointer font-semibold">Kirim ulang</span></p>
        </div>

        <div className="flex flex-col gap-4 mt-12"> {/*button*/}
            <Button
              type="button"
              onClick={handleVerifyOTP}
              className="w-full py-5 bg-primary-orange hover:bg-primary-orange/90 cursor-pointer"
            >
              Kirim
            </Button>
            <Button
              type="button"
              onClick={handleBackToRegister}
              className="w-full py-5 text-dark-grey bg-dark-grey/20 hover:bg-dark-grey/10 cursor-pointer"
            >
              Kembali
            </Button>
        </div>
      </div>

      {/* Bagian kanan gambar atau ilustrasi (bisa diganti dengan gambar yang sesuai) */}
      <aside className="hidden h-full items-center justify-center rounded-xl bg-dark-grey lg:flex" />

    </div>
  );
}
