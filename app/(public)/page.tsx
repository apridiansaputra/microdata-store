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
    colSpan: "md:col-span-7",
  },
  {
    title: "Tambah Keranjang",
    description: "Telusuri dan pilih produk yang kamu inginkan.",
    icon: ShoppingCart,
    colSpan: "md:col-span-5",
  },
  {
    title: "Negosiasi Harga",
    description: "Jika total harga > 50 juta pembeli dapat melakukan pengajuan negosiasi.",
    icon: Handshake,
    colSpan: "md:col-span-5",
  },
  {
    title: "Lakukan Pembayaran",
    description: "Selesaikan transaksi menggunakan metode pembayaran yang aman dan terverifikasi dalam sistem kami.",
    icon: Wallet,
    colSpan: "md:col-span-7",
  },
  {
    title: "Produk Dikirim",
    description: "Pesanan anda akan segera diproses dan dikirimkan ke lokasi tujuan dengan aman. Lacak pada tautan yang tertera menggunakan nomor resi yang ada.",
    icon: Truck,
    colSpan: "md:col-span-12",
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

      <section className="rounded-xl bg-[#131722] px-6 py-12 text-white md:px-12 md:py-16">
        <div className="mx-auto text-center">
          <h2 className="text-xl font-semibold md:text-2xl">Panduan Belanja</h2>
          <p className="mt-2 text-sm text-slate-400">
            Telusuri dan pilih produk yang kamu inginkan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4">
          {shoppingGuideSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === 4;

            return (
              <div
                key={step.title}
                className={`flex flex-col justify-between rounded-xl bg-[#272f3f] p-6 ${step.colSpan}`}
              >
                <div className="mb-12">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#1a202c]">
                    <Icon className="size-4 text-white" />
                  </div>
                </div>

                <div className={isLast ? "flex flex-col justify-between gap-4 md:flex-row md:items-end" : ""}>
                  <div className={isLast ? "max-w-4xl" : ""}>
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                      {step.description}
                    </p>
                  </div>
                  <div className={`mt-6 whitespace-nowrap text-xs font-medium text-slate-500 md:mt-0`}>
                    {isLast ? "Langkah 5 (selesai)" : `Langkah ${index + 1}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
