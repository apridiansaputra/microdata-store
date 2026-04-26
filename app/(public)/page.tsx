import Link from "next/link";
import { ArrowRight, Search, ShoppingCart, Truck, Wallet } from "lucide-react";

import { ProductCard } from "@/components/ui/product-card";
import HomeBannerCarousel from "@/components/user-layout/home-banner-carousel";
import { prisma } from "@/lib/prisma";
import { toSafeNumber } from "@/lib/products/utils";

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
  const [latestProducts, banners, settings] = await prisma.$transaction([
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
    prisma.appSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        shippingCourierCode: "jne",
        shippingCourierName: "JNE",
        bannerAutoplayMs: 5000,
      },
      update: {},
    }),
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {latestProducts.map((product) => {
            const coverImageUrl =
              product.images.find((image) => image.isPrimary)?.url ??
              product.images[0]?.url ??
              "/image.png";

            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="mx-auto block h-full">
                <ProductCard
                  image={coverImageUrl}
                  name={product.name}
                  price={toSafeNumber(product.basePrice) ?? 0}
                  stock={product.stock}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-secondary px-6 py-10 text-white md:px-12 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-semibold">Panduan Belanja Microdata Store</h2>
          <p className="mt-2 text-sm text-slate-300">
            Telusuri dan pilih produk yang kamu inginkan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:mt-24 md:grid-cols-2 xl:grid-cols-4">
          {shoppingGuideSteps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-slate-600/70">
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-300">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
