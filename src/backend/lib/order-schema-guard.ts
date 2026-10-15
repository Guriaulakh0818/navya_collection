import { prisma } from '@/lib/prisma';

let isOrderSchemaSynced = false;

async function runSafeSql(sql: string, tag: string): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(sql);
    return true;
  } catch (err: any) {
    console.warn(`[ORDER_SCHEMA_GUARD_${tag}_WARN]`, err?.message || err);
    return false;
  }
}

/**
 * Self-healing database schema guard for Orders, OrderItems, Shipments, and Payment Transactions.
 * Automatically verifies and adds any newly migrated columns (such as `taxAmount`, `shippingMode`,
 * `codFee`, `couponId`, `gatewayFee`, `shippingCostStatus`, etc.) via idempotent PostgreSQL statements.
 *
 * Each table statement runs in its own isolated try-catch block so that an issue on one table
 * will NEVER prevent other tables from being upgraded and synchronized.
 *
 * This ensures that even if remote production databases have pending migrations or schema drift,
 * order placement and payment verification flows in Step 5 will never fail with "column does not exist".
 */
export async function ensureOrderSchemaSynced(force = false): Promise<void> {
  if (isOrderSchemaSynced && !force) return;

  // 1. Ensure Enums exist
  await runSafeSql(
    `
    DO $$ BEGIN
      CREATE TYPE "CouponFundingType" AS ENUM ('NAVYA', 'SELLER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `,
    'ENUM_COUPON_FUNDING',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      CREATE TYPE "ContributionStatus" AS ENUM (
        'ESTIMATED', 'PAYMENT_CAPTURED', 'SHIPPED', 'DELIVERED', 
        'SETTLED', 'RETURNED', 'RTO', 'CANCELLED', 'REALIZED', 'REVERSED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `,
    'ENUM_CONTRIBUTION_STATUS',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RTO';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `,
    'ENUM_ORDER_STATUS_RTO',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'UNDELIVERED';
      ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_INITIATED';
      ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_IN_TRANSIT';
      ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_DELIVERED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `,
    'ENUM_SHIPPING_STATUS_RTO',
  );

  // 2. Ensure Order table columns exist
  await runSafeSql(
    `
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
  `,
    'ALTER_ORDERS',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";
    EXCEPTION
      WHEN undefined_object THEN null;
      WHEN duplicate_column THEN null;
    END $$;
  `,
    'ALTER_ORDERS_COUPON_FUNDING',
  );

  // 3. Ensure OrderItem table columns exist
  await runSafeSql(
    `
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
  `,
    'ALTER_ORDER_ITEMS',
  );

  // 4. Ensure VendorOrder table columns exist
  await runSafeSql(
    `
    ALTER TABLE "vendor_orders"
      ADD COLUMN IF NOT EXISTS "totalMrp" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "allocatedCouponAmount" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "sellerBasePayout" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "sellerGstAmount" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "sellerGstStatus" TEXT;
  `,
    'ALTER_VENDOR_ORDERS',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "couponFundingType" "CouponFundingType";
    EXCEPTION
      WHEN undefined_object THEN null;
      WHEN duplicate_column THEN null;
    END $$;
  `,
    'ALTER_VENDOR_ORDERS_COUPON_FUNDING',
  );

  // 5. Ensure PaymentTransaction table and columns exist (BM-06 & BM-11)
  await runSafeSql(
    `
    ALTER TABLE "payment_transactions"
      ADD COLUMN IF NOT EXISTS "gatewayFee" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "gatewayTax" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "gatewayFeeStatus" TEXT DEFAULT 'ESTIMATED',
      ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT,
      ADD COLUMN IF NOT EXISTS "errorCode" TEXT,
      ADD COLUMN IF NOT EXISTS "errorDescription" TEXT,
      ADD COLUMN IF NOT EXISTS "payload" JSONB;
  `,
    'ALTER_PAYMENT_TRANSACTIONS',
  );

  // 6. Ensure Shipments table and columns exist (BM-04, BM-05, BM-07, BM-09, BM-11)
  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "shipments" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "shipmentNumber" TEXT NOT NULL UNIQUE,
      "masterOrderId" TEXT NOT NULL,
      "vendorOrderId" TEXT,
      "sellerId" TEXT NOT NULL,
      "shopId" TEXT NOT NULL,
      "pickupLocationId" TEXT,
      "shiprocketOrderId" TEXT,
      "shiprocketShipmentId" TEXT,
      "awbCode" TEXT,
      "courierName" TEXT,
      "courierCompanyId" INTEGER,
      "pickupAddressSnapshot" JSONB NOT NULL,
      "deliveryAddressSnapshot" JSONB NOT NULL,
      "packageWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
      "packageLength" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
      "packageBreadth" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
      "packageHeight" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
      "itemCount" INTEGER NOT NULL DEFAULT 1,
      "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "shippingCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "shippingMode" TEXT NOT NULL DEFAULT 'STANDARD',
      "isFreeShipping" BOOLEAN NOT NULL DEFAULT false,
      "freeShippingSource" TEXT,
      "freeShippingThreshold" DECIMAL(10,2),
      "costBearer" TEXT,
      "promotionId" TEXT,
      "sellerSubtotal" DECIMAL(10,2),
      "status" TEXT NOT NULL DEFAULT 'CREATED',
      "trackingStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "labelUrl" TEXT,
      "manifestUrl" TEXT,
      "invoiceUrl" TEXT,
      "pickupScheduledDate" TIMESTAMP(3),
      "pickupTokenNumber" TEXT,
      "shippedAt" TIMESTAMP(3),
      "deliveredAt" TIMESTAMP(3),
      "cancelledAt" TIMESTAMP(3),
      "rtoStatus" TEXT,
      "rtoInitiatedAt" TIMESTAMP(3),
      "rtoInTransitAt" TIMESTAMP(3),
      "rtoDeliveredAt" TIMESTAMP(3),
      "rtoReason" TEXT,
      "rtoShipmentId" TEXT,
      "rtoVerifiedAt" TIMESTAMP(3),
      "rtoCostPending" BOOLEAN DEFAULT false,
      "rtoInventoryRestored" BOOLEAN DEFAULT false,
      "rtoRefundProcessed" BOOLEAN DEFAULT false,
      "rtoSettlementVoided" BOOLEAN DEFAULT false,
      "returnStatus" TEXT,
      "codFee" DECIMAL(10,2) DEFAULT 0,
      "codFeeTax" DECIMAL(10,2) DEFAULT 0,
      "codRemittanceStatus" TEXT DEFAULT 'PENDING',
      "codRemittanceRef" TEXT,
      "codRemittedAmount" DECIMAL(10,2),
      "remittedAt" TIMESTAMP(3),
      "remittanceBatchId" TEXT,
      "actualForwardShippingCost" DECIMAL(10,2),
      "actualReverseShippingCost" DECIMAL(10,2),
      "shippingCostStatus" TEXT DEFAULT 'ESTIMATED',
      "returnShippingDeduction" DECIMAL(10,2),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_SHIPMENTS_TABLE',
  );

  await runSafeSql(
    `
    ALTER TABLE "shipments"
      ADD COLUMN IF NOT EXISTS "vendorOrderId" TEXT,
      ADD COLUMN IF NOT EXISTS "pickupLocationId" TEXT,
      ADD COLUMN IF NOT EXISTS "shiprocketOrderId" TEXT,
      ADD COLUMN IF NOT EXISTS "shiprocketShipmentId" TEXT,
      ADD COLUMN IF NOT EXISTS "awbCode" TEXT,
      ADD COLUMN IF NOT EXISTS "courierName" TEXT,
      ADD COLUMN IF NOT EXISTS "courierCompanyId" INTEGER,
      ADD COLUMN IF NOT EXISTS "packageWeight" DOUBLE PRECISION DEFAULT 0.5,
      ADD COLUMN IF NOT EXISTS "packageLength" DOUBLE PRECISION DEFAULT 10.0,
      ADD COLUMN IF NOT EXISTS "packageBreadth" DOUBLE PRECISION DEFAULT 10.0,
      ADD COLUMN IF NOT EXISTS "packageHeight" DOUBLE PRECISION DEFAULT 10.0,
      ADD COLUMN IF NOT EXISTS "itemCount" INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "codAmount" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "shippingCharge" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "shippingMode" TEXT DEFAULT 'STANDARD',
      ADD COLUMN IF NOT EXISTS "isFreeShipping" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "freeShippingSource" TEXT,
      ADD COLUMN IF NOT EXISTS "freeShippingThreshold" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "costBearer" TEXT,
      ADD COLUMN IF NOT EXISTS "promotionId" TEXT,
      ADD COLUMN IF NOT EXISTS "sellerSubtotal" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'CREATED',
      ADD COLUMN IF NOT EXISTS "trackingStatus" TEXT DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "labelUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "manifestUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "pickupScheduledDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "pickupTokenNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "rtoStatus" TEXT,
      ADD COLUMN IF NOT EXISTS "rtoInitiatedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "rtoInTransitAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "rtoDeliveredAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "rtoReason" TEXT,
      ADD COLUMN IF NOT EXISTS "rtoShipmentId" TEXT,
      ADD COLUMN IF NOT EXISTS "rtoVerifiedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "rtoCostPending" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "rtoInventoryRestored" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "rtoRefundProcessed" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "rtoSettlementVoided" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "returnStatus" TEXT,
      ADD COLUMN IF NOT EXISTS "codFee" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "codFeeTax" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "codRemittanceStatus" TEXT DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "codRemittanceRef" TEXT,
      ADD COLUMN IF NOT EXISTS "codRemittedAmount" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "remittedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "remittanceBatchId" TEXT,
      ADD COLUMN IF NOT EXISTS "actualForwardShippingCost" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "actualReverseShippingCost" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "shippingCostStatus" TEXT DEFAULT 'ESTIMATED',
      ADD COLUMN IF NOT EXISTS "returnShippingDeduction" DECIMAL(10,2);
  `,
    'ALTER_SHIPMENTS',
  );

  // 7. Ensure ShipmentItems table exists
  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "shipment_items" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "shipmentId" TEXT NOT NULL,
      "orderItemId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "variantId" TEXT,
      "name" TEXT NOT NULL,
      "sku" TEXT NOT NULL,
      "size" TEXT,
      "color" TEXT,
      "price" DECIMAL(10,2) NOT NULL,
      "quantity" INTEGER NOT NULL,
      "total" DECIMAL(10,2) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_SHIPMENT_ITEMS_TABLE',
  );

  // 8. Ensure coupons & coupon_usages table structures exist
  await runSafeSql(
    `
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
  `,
    'ALTER_COUPONS',
  );

  await runSafeSql(
    `
    DO $$ BEGIN
      ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "fundingType" "CouponFundingType" DEFAULT 'NAVYA';
    EXCEPTION
      WHEN undefined_object THEN null;
      WHEN duplicate_column THEN null;
    END $$;
  `,
    'ALTER_COUPONS_FUNDING_TYPE',
  );

  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "coupon_usages" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "couponId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "orderId" TEXT,
      "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_COUPON_USAGES_TABLE',
  );

  // 9. Ensure financial_audit_logs table and columns exist
  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "performedById" TEXT,
      "amount" DECIMAL(10,2),
      "oldValues" JSONB,
      "newValues" JSONB,
      "notes" TEXT,
      "idempotencyKey" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_FINANCIAL_AUDIT_LOGS_TABLE',
  );

  await runSafeSql(
    `
    ALTER TABLE "financial_audit_logs"
      ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
  `,
    'ALTER_FINANCIAL_AUDIT_LOGS',
  );

  // 10. Ensure payment_intents table exists
  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "payment_intents" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "intentNumber" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "addressId" TEXT NOT NULL,
      "razorpayOrderId" TEXT NOT NULL,
      "razorpayPaymentId" TEXT,
      "razorpaySignature" TEXT,
      "amount" DECIMAL(10,2) NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "status" TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
      "subtotal" DECIMAL(10,2) NOT NULL,
      "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "finalAmount" DECIMAL(10,2) NOT NULL,
      "couponCode" TEXT,
      "shippingMethodCode" TEXT DEFAULT 'STANDARD',
      "cartSnapshot" JSONB NOT NULL,
      "shippingSnapshot" JSONB,
      "taxSnapshot" JSONB,
      "customerNotes" TEXT,
      "metadata" JSONB,
      "expiresAt" TIMESTAMP(3),
      "fulfilledAt" TIMESTAMP(3),
      "failedAt" TIMESTAMP(3),
      "failureReason" TEXT,
      "masterOrderId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_PAYMENT_INTENTS_TABLE',
  );

  // 11. Ensure order_contributions table exists
  await runSafeSql(
    `
    CREATE TABLE IF NOT EXISTS "order_contributions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "masterOrderId" TEXT NOT NULL,
      "vendorOrderId" TEXT,
      "shopId" TEXT,
      "shipmentId" TEXT,
      "calculationVersion" TEXT NOT NULL DEFAULT 'BM-11-V1',
      "commissionEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "customerShippingCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "codFeeCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "otherNavyaRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "applicablePlatformTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "revenueTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "gatewayFeeActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "gatewayTaxActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "gatewayFeeEstimated" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "gatewayFeeStatus" TEXT NOT NULL DEFAULT 'ESTIMATED',
      "navyaCouponSubsidy" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "navyaForwardShippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "navyaFreeShippingSubsidy" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "shippingCostStatus" TEXT NOT NULL DEFAULT 'ESTIMATED',
      "navyaReturnShippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "navyaRtoLogisticsCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "navyaCancellationLogisticsCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "courierCodCollectionFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "otherVariableCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "variableCostTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "grossContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "contributionMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "notes" TEXT,
      "metadata" JSONB,
      "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
    'CREATE_ORDER_CONTRIBUTIONS_TABLE',
  );

  isOrderSchemaSynced = true;
}
