-- BM-10 — Promotions / Coupons Database Migration
-- Adds CouponFundingType enum, hardens Coupon table, creates coupon_usages table, adds snapshot fields to orders, vendor_orders, and order_items

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CouponFundingType" AS ENUM ('NAVYA', 'SELLER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable coupons
ALTER TABLE "coupons"
  ADD COLUMN IF NOT EXISTS "fundingType" "CouponFundingType" NOT NULL DEFAULT 'NAVYA',
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "usagePerUser" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "applicableCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "applicableProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "excludedProducts" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "coupons_fundingType_idx" ON "coupons"("fundingType");

-- CreateTable coupon_usages
CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coupon_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "coupon_usages_couponId_userId_idx" ON "coupon_usages"("couponId", "userId");
CREATE INDEX IF NOT EXISTS "coupon_usages_couponId_orderId_idx" ON "coupon_usages"("couponId", "orderId");

-- AlterTable orders
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "couponId" TEXT,
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "couponType" TEXT,
  ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";

-- AlterTable vendor_orders
ALTER TABLE "vendor_orders"
  ADD COLUMN IF NOT EXISTS "allocatedCouponAmount" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";

-- AlterTable order_items
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "sellerCouponAmount" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "couponId" TEXT;

-- Seed NAVYA15VIP promo code if not exists (BM-10 Migration)
INSERT INTO "coupons" ("id", "code", "title", "description", "discountType", "discountValue", "minOrderAmount", "maxDiscount", "usagePerUser", "usedCount", "fundingType", "isActive", "validUntil", "updatedAt")
VALUES (
  'coupon_navya15vip',
  'NAVYA15VIP',
  'VIP Club 15% OFF Welcome Discount',
  'Exclusive 15% discount for VIP newsletter subscribers on orders above ₹3,000',
  'PERCENTAGE',
  15,
  3000,
  1000,
  1,
  0,
  'NAVYA',
  true,
  '2030-01-01 00:00:00',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

