import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import ProductImageGallery from "@/components/admin-layout/product-image-gallery";
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data";
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

  return (
    <div>
      <Header
        breadcrumbItems={[
          { label: "Produk", href: "/products-admin" },
          { label: "Detail Produk" },
        ]}
      />

      <Container>
        <div className="max-w-md">
          <ProductImageGallery
            title={product.title}
            images={[
              product.imageSrc,
              product.imageSrc,
              product.imageSrc,
              product.imageSrc,
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
