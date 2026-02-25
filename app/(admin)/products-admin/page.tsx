import Container from "@/components/admin/container"
import Header from "@/components/admin/header"
import ProductCard  from "@/components/admin/product-card"
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data"
import Link from "next/link"

export default function Products() {
  return (
    <div>
      <Header title='Produk' />

      <Container className="flex flex-wrap justify-start gap-4">
          {ADMIN_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/product-admin/${getAdminProductSlug(product)}`}
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
          ))}
      </Container>
    </div>

  )
}
