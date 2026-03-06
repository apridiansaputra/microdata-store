"use client"

import Image from "next/image"
import { Star, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import LightboxGallery, {
  type LightboxGalleryImage,
} from "@/components/ui/lightbox-gallery"

const STAR_COUNT = 5

export type ProductReview = {
  id: string
  reviewer: string
  date: string
  rating: number
  summary: string
  detail: string
  images: string[]
}

type ProductReviewListProps = {
  reviews: ProductReview[]
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")

const getRating = (rating: number) =>
  Math.max(0, Math.min(STAR_COUNT, Math.round(rating)))

export default function ProductReviewList({ reviews }: ProductReviewListProps) {
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const selectedReviewImages = useMemo<LightboxGalleryImage[]>(
    () =>
      selectedReview
        ? selectedReview.images.map((image, index) => ({
            src: image,
            alt: `Foto ulasan ${selectedReview.reviewer} ${index + 1}`,
          }))
        : [],
    [selectedReview]
  )

  const closeDetailDialog = () => {
    setSelectedReview(null)
    setIsLightboxOpen(false)
    setLightboxIndex(0)
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        Belum ada ulasan untuk produk ini.
      </div>
    )
  }
 
  return (
    <>
      <div className="flex flex-col gap-6">
        {reviews.map((review) => (
          <button
            key={review.id}
            type="button"
            onClick={() => setSelectedReview(review)}
            className="rounded-lg text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
            aria-label={`Buka detail ulasan dari ${review.reviewer}`}
          >
            <article className="flex flex-col gap-4 rounded-lg bg-light-grey p-6 transition-colors hover:bg-gray-100 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 lg:w-3/4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{review.reviewer}</p>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    {Array.from({ length: STAR_COUNT }).map((_, index) => (
                      <Star
                        key={`${review.id}-star-${index}`}
                        className={`size-3 ${
                          index < getRating(review.rating)
                            ? "fill-orange-400 text-orange-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-800">{review.summary}</p>
              </div>

              {review.images.length > 0 && (
                <div className="flex flex-row items-center gap-2">
                  {review.images.slice(0, 3).map((image, index) => (
                    <div
                      key={`${review.id}-thumb-${index}`}
                      className="relative h-15 w-15 overflow-hidden rounded-md border border-gray-200 bg-white p-2"
                    >
                      <Image
                        src={image}
                        alt={`Foto ulasan ${review.reviewer} ${index + 1}`}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          </button>
        ))}
      </div>

      <Dialog
        open={Boolean(selectedReview)}
        onOpenChange={(open) => {
          if (!open) closeDetailDialog()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] gap-2 overflow-hidden border-gray-200 p-0 sm:max-w-4xl"
        >
          {selectedReview && (
            <>
              <DialogHeader className="border-b border-gray-200 p-4 sm:p-4">
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="font-semibold text-sm">
                    Detail Ulasan
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={closeDetailDialog}
                    className="rounded-lg p-1 text-gray-500 transition-colors hover:text-gray-900"
                    aria-label="Tutup detail ulasan"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </DialogHeader>

              <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-7">
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-primary-orange">
                    {getInitials(selectedReview.reviewer)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{selectedReview.reviewer}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: STAR_COUNT }).map((_, index) => (
                          <Star
                            key={`${selectedReview.id}-modal-star-${index}`}
                            className={`size-3 ${
                              index < getRating(selectedReview.rating)
                                ? "fill-orange-400 text-orange-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span aria-hidden="true">&bull;</span>
                      <span className="text-xs">{selectedReview.date}</span>
                    </div>
                  </div>
                </div>

                <div className=" text-sm leading-8 text-gray-800">
                  {selectedReview.detail.split("\n\n").map((paragraph, index) => (
                    <p key={`${selectedReview.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>

                {selectedReview.images.length > 0 && (
                  <div className="mt-12">
                    <p className="mb-4 text-sm font-semibold">Foto dari Pembeli</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {selectedReview.images.map((image, index) => (
                        <button
                          key={`${selectedReview.id}-modal-image-${index}`}
                          type="button"
                          onClick={() => {
                            setLightboxIndex(index)
                            setIsLightboxOpen(true)
                          }}
                          className="group relative h-30 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                          aria-label={`Lihat foto ${index + 1} dari ulasan ${selectedReview.reviewer}`}
                        >
                          <Image
                            src={image}
                            alt={`Foto ulasan ${selectedReview.reviewer} ${index + 1}`}
                            fill
                            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                            sizes="(max-width: 340px) 30vw, 140px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-gray-200 bg-gray-50 p-6 sm:p-4">
                <Button
                  onClick={closeDetailDialog}
                  className="min-w-28 bg-primary-orange text-white hover:bg-[#f47a2a] cursor-pointer"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LightboxGallery
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        images={selectedReviewImages}
        initialIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        ariaLabel={
          selectedReview
            ? `Gallery foto ulasan ${selectedReview.reviewer}`
            : "Gallery foto ulasan"
        }
      />
    </>
  )
}
