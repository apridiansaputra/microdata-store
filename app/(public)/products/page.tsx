"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ProductCard } from "@/components/ui/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductItem = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  stock: number;
  coverImageUrl: string;
  isNew: boolean;
};

type PriceSort = "none" | "price_desc" | "price_asc";

function AllProductsPageContent() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.trim() ?? "";
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sort = priceSort !== "none" ? priceSort : "newest";

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      params.set("sort", sort);
      params.set("pageSize", "32");

      const response = await fetch(`/api/products?${params.toString()}`, {
        method: "GET",
      });
      const data = (await response.json().catch(() => ({}))) as {
        items?: ProductItem[];
      };
      setProducts(data.items ?? []);
      setIsLoading(false);
    };

    void loadProducts();
  }, [searchTerm, sort]);

  return (
    <div className="space-y-12">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-semibold">Semua Produk</h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <Select value={priceSort} onValueChange={(value) => setPriceSort(value as PriceSort)}>
            <SelectTrigger className="w-full bg-white sm:w-48">
              <SelectValue placeholder="Harga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Harga (Default)</SelectItem>
              <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
              <SelectItem value="price_asc">Harga Terendah</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-dark-grey/60" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-grey bg-white p-8 text-center text-sm text-dark-grey/70">
          Produk tidak ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="block h-full">
              <ProductCard
                image={product.coverImageUrl || "/image.png"}
                name={product.name}
                price={product.basePrice}
                stock={product.stock}
                isNew={product.isNew}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AllProductsPage() {
  return (
    <Suspense>
      <AllProductsPageContent />
    </Suspense>
  );
}
