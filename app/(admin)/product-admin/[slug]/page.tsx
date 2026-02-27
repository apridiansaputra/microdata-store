import Header from "@/components/admin-layout/header"
import Container from "@/components/admin-layout/container"

export default function ProductDetail() {
  return (
    <div>
      <Header title='Produk' />

      <Container className="flex flex-wrap justify-start gap-4">
          <h1>Detail Produk</h1>
      </Container>
    </div>
  )
}
