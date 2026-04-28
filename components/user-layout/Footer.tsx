import { footerCategory, footerHelp } from "@/constants/data";
import Link from "next/link";
import Container from "./Container";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-light-grey text-dark-grey">
      <Container className="grid w-full grid-cols-1 gap-9 py-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:gap-14">
        <div className="space-y-4">
          <Image src="/logo.png" alt="Logo Microdata" width={120} height={40} />
          <p className="max-w-xs text-sm leading-relaxed text-dark-grey/95">
            Telusuri dan pilih produk yang kamu inginkan.
          </p>
        </div>

        <div className="space-y-2 md:pt-1">
          <p className="pb-1 text-sm font-semibold text-primary-orange">Kategori Populer</p>
          {footerCategory.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-dark-grey/95 transition-colors hover:text-secondary"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="space-y-2 md:pt-1">
          <p className="pb-1 text-sm font-semibold text-primary-orange">Bantuan</p>
          {footerHelp.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-dark-grey/95 transition-colors hover:text-secondary"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-start md:justify-end md:pt-1">
          <div className="flex items-center gap-6">
            <Link
              href="#"
              aria-label="X / Twitter"
              className="inline-flex rounded-md p-1 transition-opacity hover:opacity-80"
            >
              <Image src="/icon-twiter.png" alt="Twitter Icon" width={24} height={24} />
            </Link>
            <Link
              href="#"
              aria-label="TikTok"
              className="inline-flex rounded-md p-1 transition-opacity hover:opacity-80"
            >
              <Image src="/icon-tiktok.png" alt="TikTok Icon" width={24} height={24} />
            </Link>
            <Link
              href="#"
              aria-label="Instagram"
              className="inline-flex rounded-md p-1 transition-opacity hover:opacity-80"
            >
              <Image src="/icon-instagram.png" alt="Instagram Icon" width={24} height={24} />
            </Link>
          </div>
        </div>
      </Container>

      <Container className="w-full border-t border-border-grey py-5 text-center text-sm text-dark-grey/90">
        <p>(c) 2025 Microdata Store. All rights reserved.</p>
      </Container>
    </footer>
  );
}
