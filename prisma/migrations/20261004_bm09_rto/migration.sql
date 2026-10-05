-- BM-09 — RTO (Return to Origin) Database Migration
-- Alters OrderStatus and ShippingStatus enums and adds RTO lifecycle fields to shipments

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RTO';

ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'UNDELIVERED';
ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_INITIATED';
ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_IN_TRANSIT';
ALTER TYPE "ShippingStatus" ADD VALUE IF NOT EXISTS 'RTO_DELIVERED';

ALTER TABLE "shipments"
  ADD COLUMN IF NOT EXISTS "rtoInitiatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rtoInTransitAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rtoDeliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rtoReason" TEXT,
  ADD COLUMN IF NOT EXISTS "rtoShipmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "rtoVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rtoCostPending" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rtoInventoryRestored" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rtoRefundProcessed" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rtoSettlementVoided" BOOLEAN DEFAULT false;
