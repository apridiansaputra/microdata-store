import { StarIcon } from "lucide-react";

import { AddToCartButton } from "@/components/cart-components/AddToCartButton";
import ProductImageGallery from "@/components/admin-layout/product-image-gallery";
import { ProductDescriptionViewer } from "@/components/user-layout/product-description-viewer";
import ProductReviewList, { type ProductReview } from "@/components/user-layout/product-review-list";
import SimilarProductsSection, {
  type SimilarProductItem,
} from "@/components/user-layout/similar-products-section";
import { prisma } from "@/lib/prisma";
import { toSafeNumber } from "@/lib/products/utils";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      stock: {
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      shortSpec: true,
      basePrice: true,
      compareAtPrice: true,
      stock: true,
      ratingAverage: true,
      ratingCount: true,
      categoryId: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          url: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
      reviews: {
        where: {
          status: "PUBLISHED",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              url: true,
            },
          },
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return (
      <section className="mb-32 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Produk tidak ditemukan</h1>
        <p className="text-sm text-gray-500">
          Produk dengan link ini belum tersedia atau sudah dihapus.
        </p>
      </section>
    );
  }

  const similarRaw = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: "PUBLISHED",
      deletedAt: null,
      stock: {
        gt: 0,
      },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          url: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
    },
  });

  const sortedImages = [...product.images].sort((left, right) => left.sortOrder - right.sortOrder);
  const galleryImages = sortedImages.length > 0 ? sortedImages.map((image) => image.url) : ["/image.png"];
  const productDescription = product.description || product.shortSpec || "";
  const productReviews: ProductReview[] = product.reviews.map((review) => ({
    id: review.id,
    reviewer: review.user.fullName,
    date: formatDate(review.createdAt),
    rating: review.rating,
    summary: review.title || review.content?.slice(0, 120) || "Ulasan pelanggan",
    detail: review.content || review.title || "Tidak ada detail ulasan.",
    images: review.images.map((image) => image.url),
  }));
  const similarProducts: SimilarProductItem[] = similarRaw.map((item) => {
    const sorted = [...item.images].sort((left, right) => left.sortOrder - right.sortOrder);
    const image =
      sorted.find((productImage) => productImage.isPrimary)?.url ??
      sorted[0]?.url ??
      "/image.png";
    return {
      id: item.id,
      slug: item.slug,
      title: item.name,
      price: toSafeNumber(item.basePrice) ?? 0,
      imageSrc: image,
    };
  });

  const ratingAverage = product.ratingAverage ? Number(product.ratingAverage) : 0;

  return (
    <section className="mt-12 mb-32 flex flex-col gap-32">
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="w-full lg:w-[56%]">
          <ProductImageGallery
            images={galleryImages}
            productTitle={product.name}
            layout="side-by-side"
            className="bg-transparent p-0"
          />
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[44%]">
          <div className="mb-4 flex flex-row items-start justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-semibold">{product.name}</p>
              <p className="text-2xl">
                Rp {(toSafeNumber(product.basePrice) ?? 0).toLocaleString("id-ID")}
              </p>
              {product.compareAtPrice ? (
                <p className="text-sm text-dark-grey/70 line-through">
                  Rp {(toSafeNumber(product.compareAtPrice) ?? 0).toLocaleString("id-ID")}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              <StarIcon className="inline-block size-4 text-yellow-500" />
              <p className="text-sm">
                {ratingAverage.toFixed(1)}/5.0
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-dark-grey">Deskripsi Produk</p>
            <ProductDescriptionViewer value={productDescription} />
          </div>

          <AddToCartButton productId={product.id} />

          <div className="rounded-lg border border-border-grey p-3 text-xs text-dark-grey/80">
            Stok tersedia:{" "}
            <span className="font-semibold">
              {product.stock > 0 ? `${product.stock} unit` : "Habis"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-12 font-semibold">Ulasan Produk</h3>
        <ProductReviewList reviews={productReviews} />
      </div>

      <SimilarProductsSection products={similarProducts} />
    </section>
  );
}
