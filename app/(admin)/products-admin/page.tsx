"use client";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import ProductCard from "@/components/admin-layout/product-card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type CategoryId = "all" | "laptop" | "komputer" | "printer" | "proyektor";

const categoryByProductId: Record<number, Exclude<CategoryId, "all">> = {
  1: "laptop",
  2: "laptop",
  3: "komputer",
  4: "printer",
  5: "proyektor",
  6: "laptop",
  7: "komputer",
  8: "laptop",
};

const CATEGORY_NAMES: Record<CategoryId, string> = {
  all: "Semua Produk",
  laptop: "Laptop",
  komputer: "Komputer",
  printer: "Printer",
  proyektor: "Proyektor",
};

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("laptop");

  const categories = useMemo(() => {
    const laptopCount = ADMIN_PRODUCTS.filter(
      (product) => categoryByProductId[product.id] === "laptop"
    ).length;
    const komputerCount = ADMIN_PRODUCTS.filter(
      (product) => categoryByProductId[product.id] === "komputer"
    ).length;
    const printerCount = ADMIN_PRODUCTS.filter(
      (product) => categoryByProductId[product.id] === "printer"
    ).length;
    const proyektorCount = ADMIN_PRODUCTS.filter(
      (product) => categoryByProductId[product.id] === "proyektor"
    ).length;

    return [
      { id: "all" as const, label: "Semua Produk", count: ADMIN_PRODUCTS.length },
      { id: "laptop" as const, label: "Laptop", count: laptopCount },
      { id: "komputer" as const, label: "Komputer", count: komputerCount },
      { id: "printer" as const, label: "Printer", count: printerCount },
      { id: "proyektor" as const, label: "Proyektor", count: proyektorCount },
    ];
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return ADMIN_PRODUCTS;
    return ADMIN_PRODUCTS.filter(
      (product) => categoryByProductId[product.id] === activeCategory
    );
  }, [activeCategory]);

  return (
    <div>
      <Header title="Produk" />

      <Container className="flex flex-col gap-6 py-6 pb-24">
        <section className="flex items-stretch gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <button 
              key={category.id} type="button" 
              onClick={() => setActiveCategory(category.id)} className={cn("relative rounded-lg min-w-48 border bg-white px-4 text-left cursor-pointer",
              isActive ? "border-primary-orange" : "border-transparent hover:border-dark-grey/25")}>
                <span className={cn("absolute top-3.5 right-3.5 flex h-4 w-4 items-center justify-center rounded-full border",isActive ? "border-primary-orange" : "border-dark-grey/80")}>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />}
                </span>

                <p className={cn("text-xs font-semibold", isActive ? "text-primary-orange" : "text-secondary/80 font-normal")}>
                  {category.label}
                </p>
                <p className={cn("mt-2 text-xs text-dark-grey/80", isActive ? "text-primary-orange" : "")}>{category.count} items</p>
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Tambah kategori"
            className="cursor-pointer px-2 py-6 rounded-md border border-primary-orange bg-white text-primary-orange hover:bg-primary-orange/5"
          >
            <Plus className="mx-auto h-6 w-6" />
          </button>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-secondary">
              Daftar Produk {" "}
              <span className="font-medium font-extralight text-dark-grey">{CATEGORY_NAMES[activeCategory]}</span>
            </h2>

            <InputGroup className=" w-full max-w-[540px] rounded-full border-border-grey bg-white px-1 py-5 shadow-none">
              <InputGroupAddon align="inline-start" className="text-dark-grey">
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Cari Produk"
                className="text-sm text-secondary placeholder:text-dark-grey"
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const slug = getAdminProductSlug(product);

              return (
                <Link
                  key={product.id}
                  href={`/product-admin/${slug}`}
                  className="no-underline"
                >
                  <ProductCard
                    title={product.title}
                    price={product.price}
                    stock={product.stock}
                    sold={product.sold}
                    imageSrc={product.imageSrc}
                    className="h-full max-w-none"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </Container>

      <Link href="/products-admin/new">
        <button
          type="button"
          aria-label="Tambah produk"
          className="fixed right-6 bottom-6 z-20 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary-orange text-white shadow-lg transition hover:bg-primary-orange/90 md:right-8 md:bottom-8"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </Link>
    </div>
  );
}
