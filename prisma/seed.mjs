import { PrismaClient, ProductStatus, Role, UserStatus } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function seedSuperAdmin() {
  const email = normalizeEmail(process.env.SUPER_ADMIN_EMAIL ?? "admin@microdata.store");
  const fullName = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
  const passwordFromEnv = process.env.SUPER_ADMIN_PASSWORD;
  const generatedPassword = randomBytes(18).toString("base64url");
  const password = passwordFromEnv || generatedPassword;

  const superAdmin = await prisma.user.upsert({
    where: { emailNormalized: email },
    update: {
      fullName,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
    },
    create: {
      email,
      emailNormalized: email,
      fullName,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
    },
  });

  return { superAdmin, generatedPassword: passwordFromEnv ? null : generatedPassword };
}

async function seedCategoriesAndProducts(superAdminId) {
  const categories = [
    { name: "Laptop", slug: "laptop" },
    { name: "Komputer", slug: "komputer" },
    { name: "Printer", slug: "printer" },
    { name: "Proyektor", slug: "proyektor" },
  ];

  const seededCategories = [];
  for (const [index, category] of categories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index, isActive: true },
      create: { ...category, sortOrder: index, isActive: true },
    });
    seededCategories.push(saved);
  }

  const categoryBySlug = Object.fromEntries(
    seededCategories.map((category) => [category.slug, category.id]),
  );

  const sampleProducts = [
    {
      sku: "LTP-INFX1-16-512",
      slug: "laptop-infinix-x1-book-16gb-512gb",
      name: "Laptop Infinix X1 Book RAM 16GB SSD 512GB",
      shortSpec: "Intel Core i5, RAM 16GB, SSD 512GB",
      basePrice: 8500000n,
      compareAtPrice: 9200000n,
      weightGrams: 1800,
      stock: 25,
      categorySlug: "laptop",
      imageUrl: "/lenovo.png",
    },
    {
      sku: "LTP-MBP14-M3P-512",
      slug: "apple-macbook-pro-14-m3-pro-16gb-512gb",
      name: "Apple MacBook Pro 14 M3 Pro 16GB/512GB",
      shortSpec: "Apple M3 Pro, RAM 16GB, SSD 512GB",
      basePrice: 32999000n,
      compareAtPrice: null,
      weightGrams: 1600,
      stock: 12,
      categorySlug: "laptop",
      imageUrl: "/samsung.png",
    },
  ];

  for (const product of sampleProducts) {
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        slug: product.slug,
        name: product.name,
        shortSpec: product.shortSpec,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        weightGrams: product.weightGrams,
        stock: product.stock,
        categoryId: categoryBySlug[product.categorySlug] ?? null,
        status: ProductStatus.PUBLISHED,
        updatedById: superAdminId,
      },
      create: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        shortSpec: product.shortSpec,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        weightGrams: product.weightGrams,
        stock: product.stock,
        categoryId: categoryBySlug[product.categorySlug] ?? null,
        status: ProductStatus.PUBLISHED,
        createdById: superAdminId,
        updatedById: superAdminId,
      },
    });

    await prisma.productImage.upsert({
      where: {
        productId_sortOrder: {
          productId: saved.id,
          sortOrder: 0,
        },
      },
      update: {
        url: product.imageUrl,
        altText: product.name,
        sortOrder: 0,
        isPrimary: true,
      },
      create: {
        productId: saved.id,
        url: product.imageUrl,
        altText: product.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }
}

async function main() {
  const { superAdmin, generatedPassword } = await seedSuperAdmin();
  await seedCategoriesAndProducts(superAdmin.id);

  console.log(`Seed selesai. Super admin email: ${superAdmin.email}`);
  if (generatedPassword) {
    console.log(`Password super admin sementara: ${generatedPassword}`);
    console.log("Simpan password ini lalu segera ganti setelah login pertama.");
  }
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
