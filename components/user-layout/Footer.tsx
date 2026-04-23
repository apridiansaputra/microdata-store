import { footerCategory, footerHelp } from "@/constants/data";
import Link from "next/link";
import Container from "./Container";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center bg-light-grey">
        <Container className="flex flex-col md:flex-row w-full py-8 gap-8 md:gap-12 justify-between text-sm text-gray-700">
            <div className="flex flex-col gap-3 justify-around">
                <div className="flex flex-col gap-4">
                    <Image src="/logo.png" alt="Logo" width={80} height={20} />
                    <p className="text-xs">Telusuri dan pilih produk yang kamu inginkan.</p>
                </div>
                <div className="flex flex-row gap-6">
                    <Image src="/icon-twiter.png" alt="Twitter Icon" width={24} height={24} className="w-6 h-6" />
                    <Image src="/icon-tiktok.png" alt="TikTok Icon" width={24} height={24} className="w-6 h-6" />
                    <Image src="/icon-instagram.png" alt="Instagram Icon" width={24} height={24} className="w-6 h-6" />
                </div>
            </div>  

            <div className="flex flex-col md:flex-row justify-between w-full md:w-2/3 gap-8 md:gap-0">
                <div className="flex flex-col gap-2">
                    <p className="font-semibold pb-1 text-primary-orange text-xs">Kategori Populer</p>
                    {footerCategory.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:text-dark-grey text-xs">
                        {item.title}
                    </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-semibold pb-1 text-primary-orange text-xs">Bantuan</p>
                    {footerHelp.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:text-dark-grey text-xs">
                        {item.title}
                    </Link>
                    ))}
                </div>
            </div>

        </Container>

        <Container className="pt-6 pb-4 border-t w-full text-center text-xs text-gray-500">
            <p> <Image src="/icon-copyright.png" alt="Copyright Icon" width={16} height={16} className="w-4 h-4 inline mr-1 mb-1" />2025 Microdata Store. All rights reserved.</p>
        </Container>
    </footer>
  );
}
