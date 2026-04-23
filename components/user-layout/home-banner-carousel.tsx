"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  altText: string | null;
  targetUrl: string | null;
};

export default function HomeBannerCarousel({
  banners,
  autoplayMs = 5000,
}: {
  banners: HomeBanner[];
  autoplayMs?: number;
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      setActiveIndex(carouselApi.selectedScrollSnap());
    };

    handleSelect();
    carouselApi.on("select", handleSelect);
    carouselApi.on("reInit", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
      carouselApi.off("reInit", handleSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || banners.length <= 1) return;
    const intervalId = window.setInterval(() => {
      carouselApi.scrollNext();
    }, Math.max(2500, autoplayMs));

    return () => window.clearInterval(intervalId);
  }, [autoplayMs, banners.length, carouselApi]);

  if (banners.length === 0) {
    return (
      <section className="flex h-56 items-center justify-center rounded-lg bg-light-grey text-xl text-gray-700 md:h-[360px]">
        <p className="text-xs text-dark-grey">Banner Promosi</p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-light-grey">
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: true }}>
        <CarouselContent className="-ml-0">
          {banners.map((banner) => {
            const content = (
              <div className="relative h-56 w-full md:h-[360px]">
                <Image
                  src={banner.imageUrl}
                  alt={banner.altText ?? banner.title ?? "Banner"}
                  fill
                  className="object-cover"
                  priority
                  sizes="(min-width: 768px) 100vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center px-6 md:px-12">
                  <div className="max-w-md text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Microdata Store
                    </p>
                    <h2 className="mt-3 text-xl font-semibold md:text-3xl">
                      {banner.title ?? "Promo Spesial"}
                    </h2>
                    <p className="mt-2 text-xs text-white/80 md:text-sm">
                      {banner.subtitle ?? "Belanja kebutuhan IT dengan penawaran terbaik."}
                    </p>
                  </div>
                </div>
              </div>
            );

            return (
              <CarouselItem key={banner.id} className="basis-full">
                {banner.targetUrl ? (
                  <Link href={banner.targetUrl} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {banners.length > 1 ? (
        <>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
            {banners.map((banner, index) => (
              <button
                key={`${banner.id}-dot`}
                type="button"
                onClick={() => carouselApi?.scrollTo(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all",
                  activeIndex === index ? "bg-white" : "bg-white/40",
                )}
                aria-label={`Banner ${index + 1}`}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="pointer-events-auto size-9 rounded-full border-white/40 bg-white/70 text-secondary hover:bg-white"
              onClick={() => carouselApi?.scrollPrev()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="pointer-events-auto size-9 rounded-full border-white/40 bg-white/70 text-secondary hover:bg-white"
              onClick={() => carouselApi?.scrollNext()}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}
