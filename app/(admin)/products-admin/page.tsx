import Container from "@/components/admin-layout/container"
import Header from "@/components/admin-layout/header"
import ProductCard  from "@/components/admin-layout/product-card"
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data"
import Link from "next/link"

export default function Products() {

  return (
    <div>
      <Header title='Produk' />

      <Container className="flex flex-wrap justify-start gap-4">
          {ADMIN_PRODUCTS.map((product) => {
            const slug = getAdminProductSlug(product);
            return (
              <Link
                key={product.id}
                href={`/product-admin/${slug}`}
                className="no-underline"
              >
                <ProductCard
                  title={product.title}
                  price={product.price}
                  stock={product.stock}
                  sold={product.sold}
                  imageSrc={product.imageSrc}
                />
              </Link>
            )
          })}
      </Container>
    </div>

  )
}
