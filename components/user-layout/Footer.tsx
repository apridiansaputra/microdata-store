import { footerCategory, footerHelp } from "@/constants/data";
import Link from "next/link";
import Container from "./Container";
import Image from "next/image";

const SOCIAL_LINKS = [
  { href: "#", label: "X / Twitter", icon: "/icon-twiter.png", alt: "Twitter Icon" },
  { href: "#", label: "TikTok", icon: "/icon-tiktok.png", alt: "TikTok Icon" },
  { href: "#", label: "Instagram", icon: "/icon-instagram.png", alt: "Instagram Icon" },
];

const ADDRESS =
  "Jl. Endro Suratmin No.52d, Way Dadi, Kec. Sukarame, Kota Bandar Lampung, Lampung 35131";

export default function Footer() {
  return (
    <footer className="w-full bg-light-grey text-dark-grey">
      <Container className="grid w-full grid-cols-1 gap-9 py-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:gap-14">
        {/* Kolom 1: Logo, tagline, social */}
        <div className="space-y-4">
          <Image src="/logo.png" alt="Logo Microdata" width={120} height={40} />
          <p className="max-w-xs text-sm leading-relaxed text-dark-grey/95">
            Telusuri dan pilih produk yang kamu inginkan.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="inline-flex rounded-md p-1 transition-opacity hover:opacity-70"
              >
                <Image src={s.icon} alt={s.alt} width={22} height={22} />
              </Link>
            ))}
          </div>
        </div>

        {/* Kolom 2: Kategori Populer */}
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

        {/* Kolom 3: Bantuan */}
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

        {/* Kolom 4: Alamat */}
        <div className="space-y-2 md:pt-1">
          <p className="pb-1 text-sm font-semibold text-primary-orange">Alamat</p>
          <p className="max-w-[200px] text-sm leading-relaxed text-dark-grey/95">{ADDRESS}</p>
        </div>
      </Container>

      {/* Copyright bar */}
      <Container className="w-full border-t border-border-grey py-5 text-center text-sm text-dark-grey/90">
        <p>© 2025 Microdata Store. All rights reserved.</p>
      </Container>
    </footer>
  );
}
