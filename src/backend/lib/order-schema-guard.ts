import { prisma } from '@/lib/prisma';

let isOrderSchemaSynced = false;

/**
 * Self-healing database schema guard for Orders & OrderItems.
 * Automatically verifies and adds any newly migrated columns (such as `taxAmount`, `shippingMode`,
 * `codFee`, `couponId`, item snapshot fields, etc.) via idempotent PostgreSQL statements.
 *
 * This ensures that even if remote production databases have pending migrations or schema drift,
 * order placement and payment flows will never fail with "column does not exist".
 */
export async function ensureOrderSchemaSynced(force = false): Promise<void> {
  if (isOrderSchemaSynced && !force) return;

  try {
    // 1. Ensure CouponFundingType enum exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "CouponFundingType" AS ENUM ('NAVYA', 'SELLER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Ensure Order table columns exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "orders" 
        ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "shippingMode" TEXT DEFAULT 'STANDARD',
        ADD COLUMN IF NOT EXISTS "isFirstOrder" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "shippingWaiverSource" TEXT,
        ADD COLUMN IF NOT EXISTS "shippingCostBearer" TEXT,
        ADD COLUMN IF NOT EXISTS "codFee" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "codFeeTax" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "codVerificationStatus" TEXT DEFAULT 'NONE',
        ADD COLUMN IF NOT EXISTS "codConfirmedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "codVerificationRef" TEXT,
        ADD COLUMN IF NOT EXISTS "couponId" TEXT,
        ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
        ADD COLUMN IF NOT EXISTS "couponType" TEXT;
    `);

    // 3. Ensure enum-typed column on orders
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";
      EXCEPTION
        WHEN undefined_object THEN null;
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // 4. Ensure OrderItem table columns exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "order_items"
        ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerCouponAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "navyaCouponAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "couponId" TEXT,
        ADD COLUMN IF NOT EXISTS "policyType" TEXT DEFAULT 'RETURN_AND_REPLACEMENT',
        ADD COLUMN IF NOT EXISTS "returnAllowed" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER DEFAULT 3,
        ADD COLUMN IF NOT EXISTS "replacementAllowed" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "replacementWindowDays" INTEGER DEFAULT 7,
        ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "mrp" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "sellingPrice" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "sellerDiscountAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerDiscountPercentage" DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) DEFAULT 10.00,
        ADD COLUMN IF NOT EXISTS "commissionBaseAmount" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "customerShippingAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerGstStatus" TEXT,
        ADD COLUMN IF NOT EXISTS "sellerGstin" TEXT,
        ADD COLUMN IF NOT EXISTS "sellerBasePayout" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "sellerGstAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerTotalPayout" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "commissionCalculationVersion" TEXT DEFAULT 'BM-03-MRP-V1';
    `);

    // 5. Ensure VendorOrder table columns exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "vendor_orders"
        ADD COLUMN IF NOT EXISTS "totalMrp" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "allocatedCouponAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerBasePayout" DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS "sellerGstAmount" DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sellerGstStatus" TEXT;
    `);

    // 6. Ensure enum-typed column on vendor_orders
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";
      EXCEPTION
        WHEN undefined_object THEN null;
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // 7. Ensure coupons & coupon_usages table structures exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "coupons"
        ADD COLUMN IF NOT EXISTS "title" TEXT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER,
        ADD COLUMN IF NOT EXISTS "usagePerUser" INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "usedCount" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "applicableCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS "applicableProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS "excludedProducts" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "fundingType" "CouponFundingType" DEFAULT 'NAVYA';
      EXCEPTION
        WHEN undefined_object THEN null;
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "coupon_usages" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "couponId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "orderId" TEXT,
        "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Ensure financial_audit_logs columns exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "financial_audit_logs"
        ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
    `);

    isOrderSchemaSynced = true;
  } catch (err: any) {
    console.warn('[ORDER_SCHEMA_GUARD_WARN]', err?.message || err);
  }
}
