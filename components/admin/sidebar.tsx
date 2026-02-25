"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, ShoppingBag, Handshake } from "lucide-react";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Pesanan", href: "/orders", icon: ShoppingBag },
  { label: "Produk", href: "/products-admin", icon: Package },
  { label: "Negosiasi", href: "/negotiations", icon: Handshake },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen flex-col border-r border-border-grey bg-white">
        <div className="flex h-16 items-center border-b border-border-grey px-5">
          <Image src="/logo.png" alt="Microdata Store" width={140} height={32} priority className="h-8 w-auto"/>
        </div>

        <nav className="space-y-1 p-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 rounded-lg py-2 text-sm ${
                  isActive
                    ? "font-normal text-primary-orange"
                    : "text-dark-grey hover:text-primary-orange"
                } transition-all duration-200`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border-grey p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#d1d5db]" />
            <div>
              <p className="text-sm font-semibold">Jhon Doe</p>
              <p className="text-xs text-dark-grey">Admin Microdata</p>
            </div>
          </div>
        </div>
    </aside>
  )
}
