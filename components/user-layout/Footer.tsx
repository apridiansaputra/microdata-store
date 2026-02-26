import { footerCategory, footerHelp } from "@/constants/data";
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Container from "./Container";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center bg-light-grey">
        <Container className="flex flex-col md:flex-row w-full py-8 gap-8 md:gap-12 justify-between text-sm text-gray-700">
            <div className="flex flex-col gap-3">
                <Image src="/logo.png" alt="Logo" width={120} height={40} />
                <p>Telusuri dan pilih produk yang kamu inginkan.</p>
                <div className="flex flex-row gap-6">
                    <img src="/icon-twiter.png" alt="Twitter Icon" className="w-6 h-6" />
                    <img src="/icon-tiktok.png" alt="TikTok Icon" className="w-7 h-7" />
                    <img src="/icon-instagram.png" alt="Instagram Icon" className="w-7 h-7" />
                </div>
            </div>  

            <div className="flex flex-col md:flex-row justify-between w-full md:w-3/4 gap-8 md:gap-0">
                <div className="flex flex-col gap-2">
                    <p className="font-medium pb-1 text-primary-orange">Kategori Populer</p>
                    {footerCategory.map((item) => (
                    <Link key={item.href} href={item.href}>
                        {item.title}
                    </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-medium pb-1 text-primary-orange">Bantuan</p>
                    {footerHelp.map((item) => (
                    <Link key={item.href} href={item.href}>
                        {item.title}
                    </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2 max-w-sm">
                    <p className="font-medium pb-1 text-primary-orange">Dapatkan Info Promo Terbaru</p>
                    <p className="w-fit">Figma ipsum component variant main layer. Link union invite layout group select.</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 my-3">
                        <Input type="search" placeholder="Masukkan Email" className="bg-white w-full sm:w-auto" />
                        <Button className="w-full sm:w-auto">Sumbit</Button>
                    </div>
                </div>    
            </div>

        </Container>

        <Container className="pt-6 pb-4 border-t w-full text-center text-xs text-gray-500">
            <p> <img src="/icon-copyright.png" alt="Copyright Icon" className="w-4 h-4 inline mr-1 mb-1" />2025 Microdata Store. All rights reserved.</p>
        </Container>
    </footer>
  );
}