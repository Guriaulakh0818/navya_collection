-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ContributionStatus" AS ENUM ('ESTIMATED', 'PAYMENT_CAPTURED', 'SHIPPED', 'DELIVERED', 'SETTLED', 'RETURNED', 'RTO', 'CANCELLED', 'REALIZED', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "gatewayFeeStatus" TEXT DEFAULT 'ESTIMATED';

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "shippingCostStatus" TEXT DEFAULT 'ESTIMATED';

-- AlterTable
ALTER TABLE "financial_audit_logs" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "financial_audit_logs_idempotencyKey_key" ON "financial_audit_logs"("idempotencyKey");

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_contributions" (
    "id" TEXT NOT NULL,
    "masterOrderId" TEXT NOT NULL,
    "vendorOrderId" TEXT,
    "shopId" TEXT,
    "shipmentId" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'ESTIMATED',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "order_contributions_masterOrderId_idx" ON "order_contributions"("masterOrderId");
CREATE INDEX IF NOT EXISTS "order_contributions_vendorOrderId_idx" ON "order_contributions"("vendorOrderId");
CREATE INDEX IF NOT EXISTS "order_contributions_shopId_idx" ON "order_contributions"("shopId");
CREATE INDEX IF NOT EXISTS "order_contributions_shipmentId_idx" ON "order_contributions"("shipmentId");
CREATE INDEX IF NOT EXISTS "order_contributions_status_idx" ON "order_contributions"("status");
CREATE INDEX IF NOT EXISTS "order_contributions_calculatedAt_idx" ON "order_contributions"("calculatedAt");
CREATE INDEX IF NOT EXISTS "order_contributions_createdAt_idx" ON "order_contributions"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "order_contributions" ADD CONSTRAINT "order_contributions_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_contributions" ADD CONSTRAINT "order_contributions_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_contributions" ADD CONSTRAINT "order_contributions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_contributions" ADD CONSTRAINT "order_contributions_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
