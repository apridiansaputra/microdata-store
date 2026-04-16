"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Handshake,
  Settings,
  Loader2,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/auth/admin-auth-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Pesanan", href: "/orders", icon: ShoppingBag },
  { label: "Produk", href: "/products-admin", icon: Package },
  { label: "Negosiasi", href: "/negotiations", icon: Handshake },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAccountHovered, setIsAccountHovered] = useState(false);
  const [isAccountPinnedOpen, setIsAccountPinnedOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({
    orders: 0,
    negotiations: 0,
  });
  const { user, isLoading, logout } = useAdminAuth();

  const isAccountMenuOpen = isAccountHovered || isAccountPinnedOpen;
  const adminName = user?.fullName ?? (isLoading ? "Memuat..." : "Admin");
  const adminInitial = adminName.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    let mounted = true;

    const loadBadgeCounts = async () => {
      const response = await fetch("/api/admin/sidebar-badges", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok || !mounted) return;

      const payload = (await response.json().catch(() => ({}))) as {
        ordersPendingAction?: number;
        negotiationsPendingAction?: number;
      };

      setBadgeCounts({
        orders: Math.max(0, payload.ordersPendingAction ?? 0),
        negotiations: Math.max(0, payload.negotiationsPendingAction ?? 0),
      });
    };

    void loadBadgeCounts();
    const timer = window.setInterval(() => {
      void loadBadgeCounts();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const getBadgeCount = (href: string) => {
    if (href === "/orders") return badgeCounts.orders;
    if (href === "/negotiations") return badgeCounts.negotiations;
    return 0;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.push("/admin/login");
      router.refresh();
    }
  };

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

      <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 flex-col border-r border-border-grey bg-white transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex h-16 items-center border-b border-border-grey px-5">
          <Image src="/logo.png" alt="Microdata Store" width={140} height={32} priority className="h-8 w-auto"/>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/products-admin" &&
                pathname.startsWith("/product-admin/"));
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
                <span>{item.label}</span>
                {getBadgeCount(item.href) > 0 ? (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary-orange px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {getBadgeCount(item.href) > 99 ? "99+" : getBadgeCount(item.href)}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border-grey p-4">
          <div
            onMouseEnter={() => setIsAccountHovered(true)}
            onMouseLeave={() => setIsAccountHovered(false)}
            className="rounded-lg border border-transparent p-1 transition-colors duration-200 hover:border-border-grey"
          >
            <button
              type="button"
              aria-expanded={isAccountMenuOpen}
              onClick={() => setIsAccountPinnedOpen((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-md px-1 py-1 cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d1d5db] text-sm font-semibold text-dark-grey">
                {adminInitial}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{adminName}</p>
                <p className="truncate text-xs text-dark-grey">Admin Microdata</p>
              </div>
              <ChevronDown
                size={16}
                className={`text-dark-grey/70 transition-transform duration-200 ${
                  isAccountMenuOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                isAccountMenuOpen ? "mt-3 max-h-24 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} />
                )}
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
