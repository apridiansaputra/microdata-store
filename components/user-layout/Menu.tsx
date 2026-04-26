"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import Container from "./Container";

type CategoryMenuItem = {
  id: string;
  name: string;
  slug: string;
};

const BASE_MENU_ITEMS = [
  { title: "Beranda", href: "/" },
  { title: "Semua Produk", href: "/products" },
];

export default function Menu() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryMenuItem[]>([]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json().catch(() => ({}))) as {
        categories?: CategoryMenuItem[];
      };

      if (!mounted) return;
      setCategories(data.categories ?? []);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const menuItems = useMemo(
    () => [
      ...BASE_MENU_ITEMS,
      ...categories.map((category) => ({
        title: category.name,
        href: `/categories/${category.slug}`,
      })),
    ],
    [categories],
  );

  return (
    <Container>
      <div className="relative mt-6">
        <div className="no-scrollbar overflow-x-auto pb-2">
          <div className="flex w-max min-w-full items-center justify-between gap-6 pr-8 text-sm">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap text-xs ${isActive ? "font-semibold text-primary-orange" : ""}`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white/95 via-white/60 to-transparent backdrop-blur-[2px] md:w-12 md:from-white md:via-white/90 md:backdrop-blur-[1px]" />
      </div>
    </Container>
  );
}
