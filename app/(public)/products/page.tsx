"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  coverImageUrl: string;
  isNew: boolean;
};

type DateSort = "newest" | "oldest";
type PriceSort = "none" | "price_desc" | "price_asc";

export default function AllProductsPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.trim() ?? "";
  const [dateSort, setDateSort] = useState<DateSort>("newest");
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sort = useMemo(() => {
    if (priceSort !== "none") return priceSort;
    return dateSort;
  }, [dateSort, priceSort]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      params.set("sort", sort);
      params.set("pageSize", "32");

      const response = await fetch(`/api/products?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
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
          <Select value={dateSort} onValueChange={(value) => setDateSort(value as DateSort)}>
            <SelectTrigger className="w-full bg-white sm:w-44">
              <SelectValue placeholder="Terbaru" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
            </SelectContent>
          </Select>

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
                isNew={product.isNew}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
