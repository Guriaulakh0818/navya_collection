-- AlterTable
ALTER TABLE "return_requests" ADD COLUMN "refundMethod" TEXT DEFAULT 'ORIGINAL_PAYMENT',
ADD COLUMN "bankAccountNumber" TEXT,
ADD COLUMN "bankIfsc" TEXT,
ADD COLUMN "accountHolderName" TEXT,
ADD COLUMN "upiId" TEXT,
ADD COLUMN "inventoryRestored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3);
