import { StarIcon } from 'lucide-react'
import { ADMIN_PRODUCTS, getAdminProductSlug } from '@/constants/data'
import { AddToCartButton } from '@/components/cart-components/AddToCartButton'
import ProductImageGallery from '@/components/admin-layout/product-image-gallery'
import ExpandableDescription from '@/components/user-layout/expandable-description'
import ProductReviewList, { type ProductReview } from '@/components/user-layout/product-review-list'
import SimilarProductsSection, { type SimilarProductItem } from '@/components/user-layout/similar-products-section'

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
  const galleryImages = [product?.imageSrc ?? '', '/samsung.png', '/lenovo.png', '/samsung.png', product?.imageSrc ?? '']
  const productDescription =
    'Laptop **UltraBook Nova Z14 Varian Pro** adalah pilihan ideal bagi Anda yang mencari keseimbangan sempurna antara **performa tinggi, portabilitas, dan harga yang kompetitif**. Dirancang untuk mendukung produktivitas modern, laptop ini cocok digunakan oleh profesional, mahasiswa, kreator konten, maupun developer yang membutuhkan perangkat andal untuk berbagai aktivitas sehari-hari. Ditenagai oleh **prosesor Intel Core i7 generasi terbaru**, Nova Z14 Pro mampu menghadirkan kinerja yang cepat dan responsif. Dukungan **RAM 16 GB DDR5** memastikan proses multitasking berjalan dengan lancar, mulai dari membuka banyak tab browser, menjalankan aplikasi perkantoran, hingga mengoperasikan software yang lebih berat seperti aplikasi desain grafis, editing ringan, atau tools pengembangan perangkat lunak. Dengan kombinasi spesifikasi tersebut, pengguna dapat bekerja lebih efisien tanpa harus khawatir mengalami lag atau penurunan performa. Selain performa, laptop ini juga mengutamakan **desain yang tipis dan ringan**, sehingga mudah dibawa ke mana saja. Hal ini menjadikannya pilihan tepat bagi Anda yang memiliki mobilitas tinggi, seperti bekerja di luar kantor, belajar di kampus, atau bekerja dari berbagai tempat. Desainnya yang modern dan elegan juga memberikan kesan profesional saat digunakan dalam berbagai situasi. Nova Z14 Pro juga dilengkapi dengan **daya tahan baterai yang optimal**, memungkinkan Anda bekerja lebih lama tanpa harus sering mencari sumber listrik. Fitur ini sangat membantu ketika sedang bepergian atau bekerja di tempat yang terbatas akses listriknya. Ditambah lagi dengan kualitas layar yang jernih dan nyaman di mata, pengalaman bekerja, belajar, maupun menikmati hiburan menjadi lebih menyenangkan. Dengan kombinasi **performa tangguh, desain portabel, serta fitur yang mendukung produktivitas**, Laptop UltraBook Nova Z14 Varian Pro siap menjadi **partner kerja yang dapat diandalkan** dalam berbagai aktivitas digital Anda, baik untuk kebutuhan profesional maupun penggunaan sehari-hari.'

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

  const productReviews: ProductReview[] = [
    {
      id: 'review-1',
      reviewer: 'Budi Santoso',
      date: '01 Januari 2025',
      rating: 5,
      summary:
        'Laptopnya ringan, performa kencang, dan nyaman dipakai kerja harian. Pengiriman juga aman tanpa kendala.',
      detail:
        'Lorem ipsum dolor sit amet consectetur. Massa aenean vestibulum mus semper volutpat. Volutpat cursus convallis faucibus consectetur amet tincidunt. Risus nec dictumst orci semper ornare faucibus ligula.\n\nAenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.',
      images: [product.imageSrc, '/samsung.png', '/lenovo.png'],
    },
    {
      id: 'review-2',
      reviewer: 'Joko Hasibuan',
      date: '08 Februari 2025',
      rating: 4,
      summary:
        'Secara keseluruhan bagus untuk coding dan meeting online. Fan agak terdengar saat beban tinggi, tapi masih wajar.',
      detail:
        'Laptop dipakai untuk development React dan beberapa Docker container ringan. Booting cepat dan baterai cukup tahan untuk 6-7 jam kerja campuran.\n\nBuild quality oke, keyboard enak, dan layar tajam. Semoga update berikutnya bisa optimasi suhu agar lebih stabil saat render video ringan.',
      images: ['/lenovo.png', product.imageSrc],
    },
    {
      id: 'review-3',
      reviewer: 'Siti Rahma',
      date: '14 Maret 2025',
      rating: 5,
      summary:
        'Kualitas sesuai ekspektasi. Body rapi dan performa lancar untuk desain ringan serta multitasking.',
      detail:
        'Pengalaman pakai selama dua minggu sangat positif. Aplikasi office, browser dengan banyak tab, dan Figma berjalan mulus.\n\nSpeaker cukup jernih untuk meeting, touchpad responsif, dan charger compact jadi enak dibawa mobilitas tinggi.',
      images: ['/samsung.png', '/lenovo.png', product.imageSrc],
    },
  ]
  const similarProducts: SimilarProductItem[] = ADMIN_PRODUCTS
    .filter((item) => item.id !== product.id)
    .map((item) => ({
      id: item.id,
      slug: getAdminProductSlug(item),
      title: item.title,
      price: item.price,
      imageSrc: item.imageSrc,
      isNew: item.isNew,
    }))

  return (
    <section className="mb-32 flex flex-col gap-32 mt-12">
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="w-full lg:w-[56%]">
          <ProductImageGallery
            images={galleryImages}
            productTitle={product.title}
            layout="side-by-side"
            className="bg-transparent p-0"
          />
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[44%]">
          <div className="mb-4 flex flex-row items-start justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-semibold">{product.title}</p>
              <p className="text-2xl">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <StarIcon className="inline-block size-4 text-yellow-500" />
              <p className='text-sm'>9.0/10</p>
            </div>
          </div>

          <ExpandableDescription text={productDescription} />

          <AddToCartButton
            id={product.id}
            title={product.title}
            price={product.price}
            imageSrc={product.imageSrc}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-12 font-semibold">Ulasan Produk</h3>
        <ProductReviewList reviews={productReviews} />
      </div>

      <SimilarProductsSection products={similarProducts} />
    </section>
  )
}
