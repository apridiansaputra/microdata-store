import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import ProductImageGallery from "@/components/admin-layout/product-image-gallery";
import { Button } from "@/components/ui/button";
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data";
import { Handshake, ShoppingBag, Star } from "lucide-react";
import { notFound } from "next/navigation";

type ProductDetailProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetail({ params }: ProductDetailProps) {
  const { slug } = await params;
  const product = ADMIN_PRODUCTS.find((item) => getAdminProductSlug(item) === slug);

  if (!product) {
    notFound();
  }

  const galleryImages = [product.imageSrc, "/samsung.png", "/lenovo.png", "/samsung.png", product.imageSrc];
  const productDescription =
    "Laptop UltraBook Nova Z14 Varian Pro adalah pilihan ideal untuk keseimbangan sempurna antara performa, portabilitas, dan harga. Ditenagai oleh prosesor Intel Core i7 Generasi Terbaru dan didukung dengan RAM 16 GB DDR5, varian ini mampu menjalankan aplikasi desain grafis, coding, hingga multitasking harian tanpa kendala. Dengan bobot yang ringan dan baterai yang tahan lama, Nova Z14 Pro siap menjadi partner kerja Anda di mana saja.";
  const productMeta = [
    { label: "Stok", value: `${product.stock} Unit` },
    { label: "SKU", value: "MAC-M3-GRY-512" },
    { label: "Berat", value: "2.100 Gram" },
  ];
  const totalRevenue = product.price * product.sold;

  return (
    <div>
      <Header
        breadcrumbItems={[
          { label: "Produk", href: "/products-admin" },
          { label: "Detail Produk" },
        ]}
      />

      <Container>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <ProductImageGallery images={galleryImages} productTitle={product.title} />

            <div className="space-y-4">
              <section className="rounded-lg bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h1 className="text-lg leading-tight font-medium">{product.title}</h1>
                    <p className="text-xl font-bold tracking-tight">RP. {product.price.toLocaleString("id-ID")},-</p>
                  </div>
                  <Button className="rounded-md bg-primary-orange text-xs font-semibold text-white hover:bg-primary-orange/90">
                    Edit Produk
                  </Button>
                </div>
              </section>

              <section className="rounded-lg bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold">Deskripsi Produk</h2>
                <p className="mb-8 text-xs text-secondary">{productDescription}</p>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-[120px_24px_1fr] items-center gap-2">
                    <p className="font-semibold text-xs">Rating</p>
                    <span>:</span>
                    <div className="flex items-center gap-2">
                      <Star className="size-3 fill-black text-black" />
                      <span className="text-xs">4.7/5.0</span>
                    </div>
                  </div>

                  {productMeta.map((item) => (
                    <div key={item.label} className="grid grid-cols-[120px_24px_1fr] items-center gap-2">
                      <p className="font-semibold text-xs">{item.label}</p>
                      <span>:</span>
                      <p className="text-xs">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="rounded-lg bg-white p-5">
            <h2 className="text-sm font-semibold">Inventory & Penjualan</h2>

            <div className="mt-4 flex flex-wrap items-start gap-8">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-dark-grey/10">
                  <ShoppingBag className="size-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs">Total Terjual</p>
                  <p className="text-xs font-semibold">{product.sold} Unit</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-dark-grey/10">
                  <Handshake className="size-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs">Total Pendapatan</p>
                  <p className="text-xs font-semibold">Rp. {totalRevenue.toLocaleString("id-ID")},-</p>
                </div>
              </div>
            </div>

            <h3 className="mt-10 text-sm font-semibold">Statistik Penjualan</h3>
            <div className="mt-4 h-[260px] rounded-lg border border-dark-grey/20 bg-light-grey" />
          </section>
        </div>
      </Container>
    </div>
  );
}
