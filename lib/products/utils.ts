import { prisma } from "@/lib/prisma";

const DEFAULT_SLUG = "produk";
const DEFAULT_CATEGORY_SLUG = "kategori";

export function slugifyProductName(input: string) {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || DEFAULT_SLUG;
}

export function slugifyCategoryName(input: string) {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || DEFAULT_CATEGORY_SLUG;
}

export async function createUniqueProductSlug(input: {
  source: string;
  excludeProductId?: string;
}) {
  const base = slugifyProductName(input.source);

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(input.excludeProductId
          ? {
              NOT: { id: input.excludeProductId },
            }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

export async function createUniqueCategorySlug(input: {
  source: string;
  excludeCategoryId?: string;
}) {
  const base = slugifyCategoryName(input.source);

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(input.excludeCategoryId
          ? {
              NOT: { id: input.excludeCategoryId },
            }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

export function toSafeNumber(value: bigint | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isLocalImagePath(value: string) {
  if (value.startsWith("https://") && value.includes("public.blob.vercel-storage.com")) {
    return true;
  }
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("..")) return false;
  return true;
}

export function normalizeImagePath(value: string) {
  return value.trim();
}

export function dedupeImagePaths(imagePaths: string[]) {
  const unique = new Set<string>();
  const output: string[] = [];

  for (const imagePath of imagePaths) {
    const normalized = normalizeImagePath(imagePath);
    if (!normalized || unique.has(normalized)) {
      continue;
    }
    unique.add(normalized);
    output.push(normalized);
  }

  return output;
}

export function parsePagination(searchParams: URLSearchParams) {
  const rawPage = Number(searchParams.get("page") ?? "1");
  const rawPageSize = Number(searchParams.get("pageSize") ?? "12");
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, 48)
      : 12;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
