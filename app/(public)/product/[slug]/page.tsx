import React from 'react'

import { Button } from '@/components/ui/button'
import { Star, StarIcon } from 'lucide-react'
import { ADMIN_PRODUCTS, getAdminProductSlug } from '@/constants/data'

type ProductDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params
  const product = ADMIN_PRODUCTS.find(
    (item) => getAdminProductSlug(item) === slug
  )

  if (!product) {
    return (
      <section className="mb-32 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Produk tidak ditemukan</h1>
        <p className="text-sm text-gray-500">
          Produk dengan link ini belum tersedia atau sudah dihapus.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-32 flex flex-col gap-16">
      <div className="flex flex-row gap-12">
        <div className="flex flex-row gap-8">
          <div className="flex w-1/4 flex-col gap-6">
            <div className="bg-gray-100 h-fit w-fit rounded-[4px] p-2">
              <img src={product.imageSrc} alt={product.title} width={120} height={100} />
            </div>

            <div className="bg-gray-100 h-fit w-fit rounded-[4px] p-2">
              <img src={product.imageSrc} alt={product.title} width={120} height={100} />
            </div>

            <div className="bg-gray-100 h-fit w-fit rounded-[4px] p-2">
              <img src={product.imageSrc} alt={product.title} width={120} height={100} />
            </div>
          </div>

          <div className="h-full">
            <img src={product.imageSrc} alt={product.title} width={400} height={120} />
          </div>
        </div>

        <div className="flex w-1/2 flex-col gap-4">
          <div className="mb-4 flex flex-row items-start justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-bold">{product.title}</p>
              <p className="text-2xl text-primary-orange">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <StarIcon className="inline-block size-4 text-yellow-500" />
              <p>9.0/10</p>
            </div>
          </div>

          <p className="text-sm">
            Laptop UltraBook Nova Z14 Varian Pro adalah pilihan ideal untuk keseimbangan sempurna
            antara performa, portabilitas, dan harga. Ditenagai oleh prosesor Intel Core i7 Generasi
            Terbaru dan didukung dengan RAM 16 GB DDR5, varian ini mampu menjalankan aplikasi desain
            grafis, coding, hingga multitasking harian tanpa kendala. Dengan bobot yang ringan dan
            baterai yang tahan lama, Nova Z14 Pro siap menjadi partner kerja Anda di mana saja.
          </p>
          <p className="text-sm text-gray-500">lihat selengkapnya</p>

          <Button className="mt-12 cursor-pointer py-6 text-sm bg-gray-600">
            Masukkan Keranjang
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-6 text-xl font-semibold">Ulasan Produk</h3>
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-row gap-12 rounded-xl bg-gray-50 p-6">
              <div className="flex w-3/4 flex-col gap-5">
                <div className="flex flex-row items-start gap-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-semibold">Budi Santoso</p>
                    <p className="text-xs text-gray-500">01 Januari 2025</p>
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <Star className="size-4 text-yellow-500" />
                    <Star className="size-4 text-yellow-500" />
                    <Star className="size-4 text-yellow-500" />
                    <Star className="size-4 text-yellow-500" />
                    <Star className="size-4 text-yellow-500" />
                  </div>
                </div>

                <p className="text-base text-gray-800">
                  Lorem ipsum dolor sit amet consectetur. Massa aenean vestibulum mus semper volutpat.
                  Volutpat cursus convallis faucibus consectetur amet tincidunt. Risus nec dictumst orci
                  semper ornare faucibus ligula.
                </p>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div className="h-fit w-fit rounded-[4px] p-2">
                  <img src="/image.png" alt="Laptop" width={80} height={80} />
                </div>

                <div className="h-fit w-fit rounded-[4px] p-2">
                  <img src="/image.png" alt="Laptop" width={80} height={80} />
                </div>

                <div className="h-fit w-fit rounded-[4px] p-2">
                  <img src="/image.png" alt="Laptop" width={80} height={80} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
