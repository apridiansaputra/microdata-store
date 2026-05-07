-- AlterTable
ALTER TABLE "public"."AppSetting" ALTER COLUMN "id" SET DEFAULT 'default';

-- CreateTable
CREATE TABLE "public"."AuthBanner" (
    "id" UUID NOT NULL,
    "imageUrl" VARCHAR(2048) NOT NULL,
    "altText" VARCHAR(255),
    "title" VARCHAR(120),
    "subtitle" VARCHAR(180),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthBanner_isActive_sortOrder_idx" ON "public"."AuthBanner"("isActive", "sortOrder");
