-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('GOOGLE', 'CREDENTIALS');

-- CreateEnum
CREATE TYPE "public"."VerificationPurpose" AS ENUM ('REGISTER', 'LOGIN', 'PASSWORD_RESET', 'EMAIL_CHANGE');

-- CreateEnum
CREATE TYPE "public"."AddressLabel" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('MIDTRANS');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CHALLENGE', 'CAPTURED', 'SETTLED', 'DENIED', 'CANCELLED', 'EXPIRED', 'FAILED', 'REFUNDED', 'PARTIAL_REFUNDED', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "public"."ShipmentProvider" AS ENUM ('RAJAONGKIR');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('WAITING_FULFILLMENT', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NegotiationStatus" AS ENUM ('OPEN', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MessageSenderRole" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REPORTED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "emailNormalized" VARCHAR(320) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "username" VARCHAR(40),
    "phone" VARCHAR(24),
    "passwordHash" VARCHAR(255),
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "gender" "public"."Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "birthDate" DATE,
    "avatarUrl" VARCHAR(2048),
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionToken" VARCHAR(128) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "public"."AuthProvider" NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "providerEmail" VARCHAR(320),
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "scope" TEXT,
    "tokenType" VARCHAR(64),
    "idToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailVerification" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "emailNormalized" VARCHAR(320) NOT NULL,
    "purpose" "public"."VerificationPurpose" NOT NULL,
    "codeHash" VARCHAR(255) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "requestedByIp" VARCHAR(45),
    "requestedUserAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" "public"."AddressLabel" NOT NULL DEFAULT 'OTHER',
    "recipientName" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(24) NOT NULL,
    "provinceCode" VARCHAR(16),
    "provinceName" VARCHAR(100) NOT NULL,
    "cityCode" VARCHAR(16),
    "cityName" VARCHAR(100) NOT NULL,
    "districtName" VARCHAR(100) NOT NULL,
    "subdistrictName" VARCHAR(100),
    "postalCode" VARCHAR(10) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "detail" TEXT,
    "rajaOngkirSubdistrictId" VARCHAR(32),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" UUID NOT NULL,
    "categoryId" UUID,
    "createdById" UUID,
    "updatedById" UUID,
    "sku" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "shortSpec" VARCHAR(255),
    "description" TEXT,
    "basePrice" BIGINT NOT NULL,
    "compareAtPrice" BIGINT,
    "weightGrams" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DECIMAL(3,2),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "altText" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shippingAddressId" UUID,
    "orderNumber" VARCHAR(32) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "shippingStatus" "public"."ShipmentStatus" NOT NULL DEFAULT 'WAITING_FULFILLMENT',
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'IDR',
    "subtotalAmount" BIGINT NOT NULL,
    "shippingAmount" BIGINT NOT NULL,
    "discountAmount" BIGINT NOT NULL DEFAULT 0,
    "taxAmount" BIGINT NOT NULL DEFAULT 0,
    "grandTotalAmount" BIGINT NOT NULL,
    "notes" VARCHAR(500),
    "adminNote" VARCHAR(500),
    "shippingRecipientName" VARCHAR(120) NOT NULL,
    "shippingPhone" VARCHAR(24) NOT NULL,
    "shippingProvinceName" VARCHAR(100) NOT NULL,
    "shippingCityName" VARCHAR(100) NOT NULL,
    "shippingDistrictName" VARCHAR(100) NOT NULL,
    "shippingSubdistrictName" VARCHAR(100),
    "shippingPostalCode" VARCHAR(10) NOT NULL,
    "shippingStreet" VARCHAR(255) NOT NULL,
    "shippingDetail" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "productSku" VARCHAR(64) NOT NULL,
    "productSlug" VARCHAR(180) NOT NULL,
    "productName" VARCHAR(180) NOT NULL,
    "productImageUrl" VARCHAR(2048),
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "negotiatedUnitPrice" BIGINT,
    "lineSubtotal" BIGINT NOT NULL,
    "weightGrams" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'MIDTRANS',
    "providerOrderId" VARCHAR(64) NOT NULL,
    "providerTransactionId" VARCHAR(128),
    "snapToken" VARCHAR(128),
    "paymentUrl" VARCHAR(2048),
    "method" VARCHAR(64),
    "channel" VARCHAR(64),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "grossAmount" BIGINT NOT NULL,
    "fraudStatus" VARCHAR(64),
    "transactionTime" TIMESTAMP(3),
    "settlementTime" TIMESTAMP(3),
    "expiryTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentEvent" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'MIDTRANS',
    "eventType" VARCHAR(100) NOT NULL,
    "providerEventId" VARCHAR(128),
    "payloadHash" CHAR(64) NOT NULL,
    "signatureKey" VARCHAR(255),
    "isSignatureValid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" "public"."ShipmentProvider" NOT NULL DEFAULT 'RAJAONGKIR',
    "courierCode" VARCHAR(32) NOT NULL,
    "courierName" VARCHAR(64) NOT NULL,
    "serviceCode" VARCHAR(32) NOT NULL,
    "serviceName" VARCHAR(100) NOT NULL,
    "trackingNumber" VARCHAR(128),
    "trackingUrl" VARCHAR(2048),
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'READY_TO_SHIP',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Negotiation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "processedById" UUID,
    "finalOrderId" UUID,
    "negotiationNumber" VARCHAR(32) NOT NULL,
    "status" "public"."NegotiationStatus" NOT NULL DEFAULT 'OPEN',
    "requestedTotalAmount" BIGINT NOT NULL,
    "counterTotalAmount" BIGINT,
    "finalTotalAmount" BIGINT,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NegotiationItem" (
    "id" UUID NOT NULL,
    "negotiationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "baseUnitPrice" BIGINT NOT NULL,
    "buyerOfferUnitPrice" BIGINT,
    "adminCounterUnitPrice" BIGINT,
    "finalUnitPrice" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NegotiationMessage" (
    "id" UUID NOT NULL,
    "negotiationId" UUID NOT NULL,
    "senderId" UUID,
    "senderRole" "public"."MessageSenderRole" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "orderItemId" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(120),
    "content" TEXT,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(80) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNormalized_key" ON "public"."User"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "public"."User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "public"."Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthAccount_userId_idx" ON "public"."AuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthAccount_provider_providerAccountId_key" ON "public"."AuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "EmailVerification_emailNormalized_purpose_createdAt_idx" ON "public"."EmailVerification"("emailNormalized", "purpose", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmailVerification_userId_purpose_createdAt_idx" ON "public"."EmailVerification"("userId", "purpose", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmailVerification_expiresAt_idx" ON "public"."EmailVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailVerification_consumedAt_idx" ON "public"."EmailVerification"("consumedAt");

-- CreateIndex
CREATE INDEX "Address_userId_isPrimary_idx" ON "public"."Address"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "public"."Address"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Address_deletedAt_idx" ON "public"."Address"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_sortOrder_idx" ON "public"."Category"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "public"."Category"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "public"."Category"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "public"."Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "public"."Product"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_basePrice_idx" ON "public"."Product"("basePrice");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "public"."Product"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "public"."ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductImage_productId_isPrimary_idx" ON "public"."ProductImage"("productId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_sortOrder_key" ON "public"."ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "public"."Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_updatedAt_idx" ON "public"."Cart"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "CartItem_cartId_isSelected_idx" ON "public"."CartItem"("cartId", "isSelected");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "public"."CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "public"."CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "public"."Order"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "public"."Order"("paymentStatus", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_shippingStatus_createdAt_idx" ON "public"."Order"("shippingStatus", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_placedAt_idx" ON "public"."Order"("placedAt" DESC);

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "public"."Order"("deletedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_productSku_idx" ON "public"."OrderItem"("productSku");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerOrderId_key" ON "public"."Payment"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "public"."Payment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_orderId_createdAt_idx" ON "public"."Payment"("orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Payment_status_updatedAt_idx" ON "public"."Payment"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Payment_provider_providerOrderId_idx" ON "public"."Payment"("provider", "providerOrderId");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "public"."PaymentEvent"("paymentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PaymentEvent_processedAt_idx" ON "public"."PaymentEvent"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_payloadHash_key" ON "public"."PaymentEvent"("provider", "payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_providerEventId_key" ON "public"."PaymentEvent"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "public"."Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "public"."Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_updatedAt_idx" ON "public"."Shipment"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Shipment_courierCode_trackingNumber_idx" ON "public"."Shipment"("courierCode", "trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Negotiation_finalOrderId_key" ON "public"."Negotiation"("finalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Negotiation_negotiationNumber_key" ON "public"."Negotiation"("negotiationNumber");

-- CreateIndex
CREATE INDEX "Negotiation_userId_createdAt_idx" ON "public"."Negotiation"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Negotiation_status_createdAt_idx" ON "public"."Negotiation"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Negotiation_processedById_createdAt_idx" ON "public"."Negotiation"("processedById", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "NegotiationItem_productId_idx" ON "public"."NegotiationItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "NegotiationItem_negotiationId_productId_key" ON "public"."NegotiationItem"("negotiationId", "productId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_negotiationId_createdAt_idx" ON "public"."NegotiationMessage"("negotiationId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "NegotiationMessage_senderId_createdAt_idx" ON "public"."NegotiationMessage"("senderId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderItemId_key" ON "public"."Review"("orderItemId");

-- CreateIndex
CREATE INDEX "Review_productId_status_createdAt_idx" ON "public"."Review"("productId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "public"."Review"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Review_deletedAt_idx" ON "public"."Review"("deletedAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "public"."AdminAuditLog"("actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_createdAt_idx" ON "public"."AdminAuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "public"."AdminAuditLog"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuthAccount" ADD CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Negotiation" ADD CONSTRAINT "Negotiation_finalOrderId_fkey" FOREIGN KEY ("finalOrderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Negotiation" ADD CONSTRAINT "Negotiation_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Negotiation" ADD CONSTRAINT "Negotiation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NegotiationItem" ADD CONSTRAINT "NegotiationItem_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "public"."Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NegotiationItem" ADD CONSTRAINT "NegotiationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "public"."Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

