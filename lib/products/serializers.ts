import { Prisma } from "@prisma/client";

import { toSafeNumber } from "@/lib/products/utils";

type ProductImageLite = {
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

function getSortedImages(images: ProductImageLite[]) {
  return [...images].sort((left, right) => left.sortOrder - right.sortOrder);
}

function getCoverImageUrl(images: ProductImageLite[]) {
  const sorted = getSortedImages(images);
  return (
    sorted.find((image) => image.isPrimary)?.url ??
    sorted[0]?.url ??
    "/image.png"
  );
}

export function serializeAdminProductListItem(product: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  status: string;
  stock: number;
  soldCount: number;
  basePrice: bigint;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImageLite[];
  category: { id: string; name: string; slug: string } | null;
}) {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    status: product.status,
    stock: product.stock,
    soldCount: product.soldCount,
    basePrice: toSafeNumber(product.basePrice) ?? 0,
    coverImageUrl: getCoverImageUrl(product.images),
    category: product.category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeAdminProductDetail(product: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortSpec: string | null;
  description: string | null;
  basePrice: bigint;
  compareAtPrice: bigint | null;
  stock: number;
  weightGrams: number;
  soldCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImageLite[];
  category: { id: string; name: string; slug: string } | null;
}) {
  const sortedImages = getSortedImages(product.images);
  const coverImageUrl = getCoverImageUrl(product.images);
  const galleryImageUrls = sortedImages
    .filter((image) => image.url !== coverImageUrl)
    .map((image) => image.url);

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    shortSpec: product.shortSpec,
    description: product.description,
    basePrice: toSafeNumber(product.basePrice) ?? 0,
    compareAtPrice: toSafeNumber(product.compareAtPrice),
    stock: product.stock,
    weightGrams: product.weightGrams,
    soldCount: product.soldCount,
    status: product.status,
    coverImageUrl,
    galleryImageUrls,
    images: sortedImages.map((image) => ({
      url: image.url,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
    category: product.category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializePublicProductListItem(product: {
  id: string;
  slug: string;
  name: string;
  shortSpec: string | null;
  basePrice: bigint;
  compareAtPrice: bigint | null;
  stock: number;
  createdAt: Date;
  images: ProductImageLite[];
  category: { id: string; name: string; slug: string } | null;
}) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortSpec: product.shortSpec,
    basePrice: toSafeNumber(product.basePrice) ?? 0,
    compareAtPrice: toSafeNumber(product.compareAtPrice),
    stock: product.stock,
    isNew: Date.now() - product.createdAt.getTime() <= 1000 * 60 * 60 * 24 * 21,
    coverImageUrl: getCoverImageUrl(product.images),
    category: product.category,
  };
}

export function serializePublicProductDetail(product: {
  id: string;
  slug: string;
  name: string;
  shortSpec: string | null;
  description: string | null;
  basePrice: bigint;
  compareAtPrice: bigint | null;
  stock: number;
  soldCount: number;
  weightGrams: number;
  ratingAverage: Prisma.Decimal | null;
  ratingCount: number;
  images: ProductImageLite[];
  category: { id: string; name: string; slug: string } | null;
}) {
  const sortedImages = getSortedImages(product.images);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortSpec: product.shortSpec,
    description: product.description,
    basePrice: toSafeNumber(product.basePrice) ?? 0,
    compareAtPrice: toSafeNumber(product.compareAtPrice),
    stock: product.stock,
    soldCount: product.soldCount,
    weightGrams: product.weightGrams,
    ratingAverage: product.ratingAverage ? Number(product.ratingAverage) : null,
    ratingCount: product.ratingCount,
    images: sortedImages.map((image) => image.url),
    coverImageUrl: getCoverImageUrl(product.images),
    category: product.category,
  };
}

export function serializeCartItem(cartItem: {
  id: string;
  quantity: number;
  isSelected: boolean;
  product: {
    id: string;
    slug: string;
    name: string;
    shortSpec: string | null;
    basePrice: bigint;
    stock: number;
    images: ProductImageLite[];
  };
}) {
  return {
    id: cartItem.id,
    productId: cartItem.product.id,
    slug: cartItem.product.slug,
    name: cartItem.product.name,
    description: cartItem.product.shortSpec,
    price: toSafeNumber(cartItem.product.basePrice) ?? 0,
    quantity: cartItem.quantity,
    isSelected: cartItem.isSelected,
    stock: cartItem.product.stock,
    isOutOfStock: cartItem.product.stock <= 0,
    image: getCoverImageUrl(cartItem.product.images),
  };
}
