"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type ProductImageGalleryProps = {
  title: string;
  images: string[];
};

export default function ProductImageGallery({
  title,
  images,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square overflow-hidden rounded-lg border bg-muted">
        <Image
          src={activeImage}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 320px, 100vw"
        />
      </div>

      <Carousel className="w-full max-w-full">
        <CarouselContent className="-ml-1">
          {images.map((src, index) => (
            <CarouselItem
              key={index}
              className="basis-1/4 pl-1 sm:basis-1/5 md:basis-1/6"
            >
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="w-full"
              >
                <Card
                  className={
                    index === activeIndex
                      ? "border-primary ring-2 ring-primary"
                      : ""
                  }
                >
                  <CardContent className="relative aspect-square p-1">
                    <Image
                      src={src}
                      alt={`${title} thumbnail ${index + 1}`}
                      fill
                      className="rounded-md object-cover"
                      sizes="80px"
                    />
                  </CardContent>
                </Card>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
