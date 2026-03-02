"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type ProductImageGalleryProps = {
  images: string[];
  productTitle: string;
};

const FALLBACK_IMAGE = "/lenovo.png";
const LIGHTBOX_TRANSITION_MS = 300;

export default function ProductImageGallery({
  images,
  productTitle,
}: ProductImageGalleryProps) {
  const galleryImages = useMemo(() => {
    const sanitized = images.filter(Boolean);
    return sanitized.length > 0 ? sanitized : [FALLBACK_IMAGE];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxMounted, setIsLightboxMounted] = useState(false);
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
  const selectedImage = galleryImages[selectedIndex] ?? galleryImages[0];

  const openLightbox = () => {
    setIsLightboxMounted(true);
    requestAnimationFrame(() => setIsLightboxOpen(true));
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  useEffect(() => {
    if (!lightboxApi) return;

    const onSelect = () => {
      setSelectedIndex(lightboxApi.selectedScrollSnap());
    };

    onSelect();
    lightboxApi.on("select", onSelect);
    lightboxApi.on("reInit", onSelect);

    return () => {
      lightboxApi.off("select", onSelect);
      lightboxApi.off("reInit", onSelect);
    };
  }, [lightboxApi]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen || !lightboxApi) return;
    lightboxApi.scrollTo(selectedIndex);
  }, [isLightboxOpen, lightboxApi, selectedIndex]);

  useEffect(() => {
    if (isLightboxOpen || !isLightboxMounted) return;

    const timeoutId = window.setTimeout(() => {
      setIsLightboxMounted(false);
    }, LIGHTBOX_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isLightboxOpen, isLightboxMounted]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      <section className="rounded-xl bg-white p-5">
        <div className="mb-5 rounded-xl p-4">
          <button
            type="button"
            onClick={openLightbox}
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
                    selectedIndex === index
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
      </section>

      {isLightboxMounted && (
        <div
          className={cn(
            "fixed inset-0 z-[100] bg-black/70 p-4 transition-opacity duration-300 md:p-8",
            isLightboxOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={`Gallery besar ${productTitle}`}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className={cn(
              "pointer-events-auto absolute top-4 left-1/2 z-10 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:bg-white/20",
              isLightboxOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            )}
            aria-label="Tutup gallery besar"
          >
            <X className="size-4" />
          </button>

          <div
            className={cn(
              "pointer-events-none mx-auto flex h-full w-full max-w-5xl flex-col justify-center gap-4 transition-all duration-300",
              isLightboxOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
            )}
          >
            <div className="pointer-events-auto" onClick={(event) => event.stopPropagation()}>
              <Carousel
                setApi={setLightboxApi}
                opts={{ align: "center", loop: true, startIndex: selectedIndex }}
                className="w-full"
              >
                <CarouselContent>
                  {galleryImages.map((image, index) => (
                    <CarouselItem key={`lightbox-${image}-${index}`} className="pl-0">
                      <div className="relative mx-auto h-[56vh] w-full max-w-4xl">
                        <Image
                          src={image}
                          alt={`${productTitle} besar ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 1200px"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 size-10 border-white/30 bg-white/10 text-white hover:bg-white/20" />
                <CarouselNext className="right-2 size-10 border-white/30 bg-white/10 text-white hover:bg-white/20" />
              </Carousel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
