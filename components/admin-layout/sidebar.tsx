"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, ShoppingBag, Handshake, Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Pesanan", href: "/orders", icon: ShoppingBag },
  { label: "Produk", href: "/products-admin", icon: Package },
  { label: "Negosiasi", href: "/negotiations", icon: Handshake },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white  hover:bg-gray-100 cursor-pointer transition-all duration-200"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:relative flex min-h-screen flex-col border-r border-border-grey bg-white max-w-60 z-40 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex h-16 items-center border-b border-border-grey px-5">
          <Image src="/logo.png" alt="Microdata Store" width={140} height={32} priority className="h-8 w-auto"/>
        </div>

        <nav className="space-y-1 p-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href}
                onClick={() => setIsOpen(false)}
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
    </>
  )
}
