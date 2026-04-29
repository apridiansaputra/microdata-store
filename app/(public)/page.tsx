import Link from "next/link";
import {
  ArrowRight,
  Handshake,
  Search,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

import { ProductCard } from "@/components/ui/product-card";
import HomeBannerCarousel from "@/components/user-layout/home-banner-carousel";
import { prisma } from "@/lib/prisma";
import { toSafeNumber } from "@/lib/products/utils";
import { getAppSettings } from "@/lib/settings/app-settings";

const shoppingGuideSteps = [
  {
    title: "Pilih Produk",
    description: "Telusuri dan pilih produk yang kamu inginkan.",
    icon: Search,
  },
  {
    title: "Tambah Keranjang",
    description: "Masukkan produk pilihanmu ke keranjang belanja.",
    icon: ShoppingCart,
  },
  {
    title: "Negosiasi Harga",
    description: "Jika total harga > 50 juta pembeli dapat melakukan pengajuan negosiasi.",
    icon: Handshake,
  },
  {
    title: "Lakukan Pembayaran",
    description: "Selesaikan pembayaran dengan metode yang tersedia.",
    icon: Wallet,
  },
  {
    title: "Produk Dikirim",
    description: "Pesananmu diproses dan segera dikirim.",
    icon: Truck,
  },
];

export default async function HomePage() {
  const [latestProducts, banners, settings] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        stock: {
          gt: 0,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
        stock: true,
        createdAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: {
            url: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
      },
    }),
    prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        altText: true,
        targetUrl: true,
      },
    }),
    getAppSettings(),
  ]);

  return (
    <div className="mt-3 flex flex-col gap-16 pb-16 md:gap-38 md:pb-24">
      <HomeBannerCarousel banners={banners} autoplayMs={settings.bannerAutoplayMs} />

      <section className="space-y-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold ">Produk Terbaru</h2>
            <p className="text-sm text-dark-grey">
              Koleksi gadget terbaru pilihan editor minggu ini.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary-orange transition-opacity hover:opacity-80"
          >
            Lihat semua
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {latestProducts.map((product) => {
            const coverImageUrl =
              product.images.find((image) => image.isPrimary)?.url ??
              product.images[0]?.url ??
              "/image.png";

            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="block h-full">
                <ProductCard
                  image={coverImageUrl}
                  name={product.name}
                  price={toSafeNumber(product.basePrice) ?? 0}
                  stock={product.stock}
                  isNew={Date.now() - product.createdAt.getTime() <= 1000 * 60 * 60 * 24 * 21}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] bg-secondary px-6 py-10 text-white md:px-10 md:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold">Panduan Belanja</h2>
          <p className="mt-2 text-sm text-slate-300/90">
            Telusuri dan pilih produk yang kamu inginkan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-9 md:mt-24 md:grid-cols-3 md:gap-x-12 md:gap-y-10">
          {shoppingGuideSteps.slice(0, 3).map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-slate-500/70">
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-300/90">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-9 grid grid-cols-1 gap-9 md:mx-auto md:mt-14 md:max-w-3xl md:grid-cols-2 md:gap-x-16">
          {shoppingGuideSteps.slice(3).map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-slate-500/70">
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-300/90">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
