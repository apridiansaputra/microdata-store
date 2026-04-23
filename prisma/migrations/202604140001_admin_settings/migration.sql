-- CreateTable
CREATE TABLE "public"."AppSetting" (
    "id" VARCHAR(32) NOT NULL,
    "shippingCourierCode" VARCHAR(32) NOT NULL DEFAULT 'jne',
    "shippingCourierName" VARCHAR(64) NOT NULL DEFAULT 'JNE',
    "shippingTrackingBaseUrl" VARCHAR(2048),
    "bannerAutoplayMs" INTEGER NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeBanner" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120),
    "subtitle" VARCHAR(180),
    "imageUrl" VARCHAR(2048) NOT NULL,
    "altText" VARCHAR(255),
    "targetUrl" VARCHAR(2048),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeBanner_isActive_sortOrder_idx" ON "public"."HomeBanner"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "HomeBanner_sortOrder_idx" ON "public"."HomeBanner"("sortOrder");
