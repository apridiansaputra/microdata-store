-- CreateTable
CREATE TABLE "public"."ReviewImage" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_sortOrder_idx" ON "public"."ReviewImage"("reviewId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewImage_reviewId_sortOrder_key" ON "public"."ReviewImage"("reviewId", "sortOrder");

-- AddForeignKey
ALTER TABLE "public"."ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
