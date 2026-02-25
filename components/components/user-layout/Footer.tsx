import { footerCategory, footerHelp } from "@/Constants/Data";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center bg-gray-100">
        <div className="flex flex-row w-full px-12 py-8 gap-12 justify-between text-sm text-gray-700">
            <div className="flex flex-col gap-3 w-1/4"    >
                <h1 className="text-xl font-semibold">MICRODATA <span className="text-white bg-gray-500 py-1 px-2 rounded-sm text-sm"> Store <span className="font-bold text-2xl">.</span> </span> </h1>
                <p>Telusuri dan pilih produk yang kamu inginkan.</p>
                <div className="flex flex-row gap-6">
                    <img src="/icon-twiter.png" alt="Twitter Icon" className="w-7 h-7" />
                    <img src="/icon-tiktok.png" alt="TikTok Icon" className="w-8 h-8" />
                    <img src="/icon-instagram.png" alt="Instagram Icon" className="w-8 h-8" />
                </div>
            </div>  

            <div className="flex flex-row justify-between w-3/4">
                <div className="flex flex-col gap-2">
                    <p className="font-semibold pb-1">Kategori Populer</p>
                    {footerCategory.map((item) => (
                    <Link key={item.href} href={item.href}>
                        {item.title}
                    </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-semibold pb-1">Bantuan</p>
                    {footerHelp.map((item) => (
                    <Link key={item.href} href={item.href}>
                        {item.title}
                    </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2 max-w-sm">
                    <p className="font-semibold pb-1">Dapatkan Info Promo Terbaru</p>
                    <p className="w-fit">Figma ipsum component variant main layer. Link union invite layout group select.</p>
                    <div className="flex flex-row items-center gap-2 my-3">
                        <Input type="search" placeholder="Masukkan Email" className="bg-white" />
                        <Button>Sumbit</Button>
                    </div>
                </div>    
            </div>

        </div>

        <div className="pt-6 pb-4 border-t w-full text-center text-sm text-gray-500">
            <p> <img src="/icon-copyright.png" alt="Copyright Icon" className="w-4 h-4 inline mr-1 mb-1" />2025 Microdata Store. All rights reserved.</p>
        </div>
    </footer>
  );
}