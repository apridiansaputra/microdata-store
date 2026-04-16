"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

import { ProductCard } from "@/components/ui/product-card"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SimilarProductItem = {
  id: string
  slug: string
  title: string
  price: number
  imageSrc: string
  isNew?: boolean
}

type SimilarProductsSectionProps = {
  products: SimilarProductItem[]
}

export default function SimilarProductsSection({
  products,
}: SimilarProductsSectionProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!carouselApi) return

    const handleSelect = () => {
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
    }

    handleSelect()
    carouselApi.on("select", handleSelect)
    carouselApi.on("reInit", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
      carouselApi.off("reInit", handleSelect)
    }
  }, [carouselApi])

  if (products.length === 0) {
    return null
  }

  return (
    <section>
      <h3 className="mb-12 font-semibold">Saran Produk Serupa</h3>

      <Carousel
        setApi={setCarouselApi}
        opts={{ align: "start" }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-full pl-4 sm:basis-1/2 lg:basis-1/4"
            >
              <Link href={`/product/${item.slug}`} className="block h-full">
                <ProductCard
                  image={item.imageSrc}
                  name={item.title}
                  price={item.price}
                  isNew={item.isNew}
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-16 flex items-center justify-center gap-10">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => carouselApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className={cn(
            "size-10 cursor-pointer rounded-full border-gray-300",
            canScrollPrev
              ? "text-primary hover:border-primary-orange hover:text-primary-orange"
              : "text-gray-400"
          )}
          aria-label="Produk sebelumnya"
        >
          <ArrowLeft className="size-5" />
        </Button>

        <Button
          type="button"
          size="icon"
          onClick={() => carouselApi?.scrollNext()}
          disabled={!canScrollNext}
          className={cn(
            "size-10 cursor-pointer rounded-full bg-primary text-white hover:bg-primary/90",
            !canScrollNext && "bg-gray-300 text-gray-500 hover:bg-gray-300"
          )}
          aria-label="Produk berikutnya"
        >
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </section>
  )
}
