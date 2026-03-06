"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export type LightboxGalleryImage = {
  src: string
  alt?: string
}

type LightboxGalleryProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: LightboxGalleryImage[]
  initialIndex?: number
  onIndexChange?: (index: number) => void
  ariaLabel?: string
}

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export default function LightboxGallery({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  onIndexChange,
  ariaLabel = "Image gallery lightbox",
}: LightboxGalleryProps) {
  const galleryImages = useMemo(
    () => images.filter((image) => Boolean(image.src)),
    [images]
  )
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!lightboxApi || !onIndexChange) return

    const onSelect = () => {
      const selected = lightboxApi.selectedScrollSnap()
      onIndexChange(selected)
    }

    onSelect()
    lightboxApi.on("select", onSelect)
    lightboxApi.on("reInit", onSelect)

    return () => {
      lightboxApi.off("select", onSelect)
      lightboxApi.off("reInit", onSelect)
    }
  }, [lightboxApi, onIndexChange])

  useEffect(() => {
    if (!open || !lightboxApi || galleryImages.length === 0) return
    lightboxApi.scrollTo(clampIndex(initialIndex, galleryImages.length), true)
  }, [open, lightboxApi, initialIndex, galleryImages.length])

  if (galleryImages.length === 0) {
    return null
  }

  const startIndex = clampIndex(initialIndex, galleryImages.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="z-[120] max-w-[calc(100%-2rem)] border-white/20 bg-black/90 p-4 text-white sm:max-w-6xl sm:p-8"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 left-1/2 z-10 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Tutup lightbox"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center gap-4">
          <Carousel
            setApi={setLightboxApi}
            opts={{ align: "center", loop: true, startIndex }}
            className="w-full"
          >
            <CarouselContent>
              {galleryImages.map((image, index) => (
                <CarouselItem key={`lightbox-${image.src}-${index}`} className="pl-0">
                  <div className="relative mx-auto h-[56vh] w-full max-w-4xl">
                    <Image
                      src={image.src}
                      alt={image.alt ?? `Gallery image ${index + 1}`}
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
      </DialogContent>
    </Dialog>
  )
}
