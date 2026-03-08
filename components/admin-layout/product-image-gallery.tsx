"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import LightboxGallery, {
  type LightboxGalleryImage,
} from "@/components/ui/lightbox-gallery";
import { cn } from "@/lib/utils";

type ProductImageGalleryProps = {
  images: string[];
  productTitle: string;
  layout?: "stacked" | "side-by-side";
  className?: string;
};

const FALLBACK_IMAGE = "/lenovo.png";

export default function ProductImageGallery({
  images,
  productTitle,
  layout = "stacked",
  className,
}: ProductImageGalleryProps) {
  const isSideBySideLayout = layout === "side-by-side";
  const galleryImages = useMemo(() => {
    const sanitized = images.filter(Boolean);
    return sanitized.length > 0 ? sanitized : [FALLBACK_IMAGE];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const safeSelectedIndex =
    selectedIndex < galleryImages.length ? selectedIndex : 0;
  const selectedImage = galleryImages[safeSelectedIndex] ?? galleryImages[0];
  const lightboxImages: LightboxGalleryImage[] = useMemo(
    () =>
      galleryImages.map((image, index) => ({
        src: image,
        alt: `${productTitle} besar ${index + 1}`,
      })),
    [galleryImages, productTitle]
  );

  return (
    <>
      <section className={cn("rounded-xl bg-white p-5", className)}>
        {isSideBySideLayout ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="order-2 md:order-1 md:w-[92px]">
              <div className="md:hidden">
                <Carousel className="px-9" opts={{ align: "start", dragFree: true }}>
                  <CarouselContent className="-ml-2">
                    {galleryImages.map((image, index) => (
                      <CarouselItem key={`${image}-${index}`} className="basis-auto pl-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className={cn(
                            "flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-md border-2 bg-light-grey p-1 transition-colors",
                            safeSelectedIndex === index
                              ? "border-primary-orange/80"
                              : "border-dark-grey/20 hover:border-[#b4b4b4]"
                          )}
                          aria-label={`Tampilkan gambar ${index + 1}`}
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={image}
                              alt={`${productTitle} ${index + 1}`}
                              fill
                              className="object-contain"
                              sizes="84px"
                            />
                          </div>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-1 size-7 bg-white" />
                  <CarouselNext className="-right-1 size-7 bg-white" />
                </Carousel>
              </div>

              <div className="hidden md:block">
                <Carousel
                  orientation="vertical"
                  className="py-8"
                  opts={{ align: "start", dragFree: true }}
                >
                  <CarouselContent className="-mt-2 h-[340px]">
                    {galleryImages.map((image, index) => (
                      <CarouselItem key={`${image}-${index}`} className="basis-auto pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className={cn(
                            "flex h-[84px] w-[84px] cursor-pointer items-center justify-center rounded-md border-2 bg-light-grey p-2 transition-colors",
                            safeSelectedIndex === index
                              ? "border-primary-orange/80"
                              : "border-dark-grey/20 hover:border-[#b4b4b4]"
                          )}
                          aria-label={`Tampilkan gambar ${index + 1}`}
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={image}
                              alt={`${productTitle} ${index + 1}`}
                              fill
                              className="object-contain"
                              sizes="120px"
                            />
                          </div>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-top-1 left-1/2 size-7 bg-white" />
                  <CarouselNext className="-bottom-1 left-1/2 size-7 bg-white" />
                </Carousel>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="relative order-1 block h-[224px] w-full cursor-zoom-in md:order-2 md:h-[364px]"
              aria-label="Buka gallery ukuran besar"
            >
              <Image
                src={selectedImage}
                alt={productTitle}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-xl p-4">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative mx-auto block h-[200px] w-[200px] cursor-zoom-in"
                aria-label="Buka gallery ukuran besar"
              >
                <Image
                  src={selectedImage}
                  alt={productTitle}
                  fill
                  className="object-contain"
                  sizes="300px"
                  priority
                />
              </button>
            </div>

            <Carousel className="px-9" opts={{ align: "start", dragFree: true }}>
              <CarouselContent className="-ml-2">
                {galleryImages.map((image, index) => (
                  <CarouselItem key={`${image}-${index}`} className="basis-auto pl-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-md border-2 bg-light-grey p-1 transition-colors",
                        safeSelectedIndex === index
                          ? "border-primary-orange/80"
                          : "border-dark-grey/20 hover:border-[#b4b4b4]"
                      )}
                      aria-label={`Tampilkan gambar ${index + 1}`}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={image}
                          alt={`${productTitle} ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="84px"
                        />
                      </div>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-1 size-7 bg-white" />
              <CarouselNext className="-right-1 size-7 bg-white" />
            </Carousel>
          </>
        )}
      </section>

      <LightboxGallery
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        images={lightboxImages}
        initialIndex={safeSelectedIndex}
        onIndexChange={setSelectedIndex}
        ariaLabel={`Gallery besar ${productTitle}`}
      />
    </>
  );
}
