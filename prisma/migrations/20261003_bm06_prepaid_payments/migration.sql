-- AlterTable
ALTER TABLE "customer_refunds" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "fee" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "gatewayRefundStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "isPartial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" JSONB,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpayRefundId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "gatewayFee" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "gatewayTax" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "netAmount" DECIMAL(10,2),
ADD COLUMN     "paymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "taxRate" DECIMAL(5,2) DEFAULT 0;

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state" TEXT,
    "taxType" TEXT NOT NULL DEFAULT 'GST',
    "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_intentNumber_key" ON "payment_intents"("intentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_razorpayOrderId_key" ON "payment_intents"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_razorpayPaymentId_key" ON "payment_intents"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_masterOrderId_key" ON "payment_intents"("masterOrderId");

-- CreateIndex
CREATE INDEX "payment_intents_userId_idx" ON "payment_intents"("userId");

-- CreateIndex
CREATE INDEX "payment_intents_addressId_idx" ON "payment_intents"("addressId");

-- CreateIndex
CREATE INDEX "payment_intents_razorpayOrderId_idx" ON "payment_intents"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_createdAt_idx" ON "payment_intents"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_eventId_key" ON "payment_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_eventId_idx" ON "payment_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_eventType_idx" ON "payment_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "payment_webhook_events_razorpayOrderId_idx" ON "payment_webhook_events"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_razorpayPaymentId_idx" ON "payment_webhook_events"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "tax_configurations_country_idx" ON "tax_configurations"("country");

-- CreateIndex
CREATE INDEX "tax_configurations_state_idx" ON "tax_configurations"("state");

-- CreateIndex
CREATE INDEX "tax_configurations_isActive_idx" ON "tax_configurations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "customer_refunds_razorpayRefundId_key" ON "customer_refunds"("razorpayRefundId");

-- CreateIndex
CREATE INDEX "customer_refunds_razorpayRefundId_idx" ON "customer_refunds"("razorpayRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_razorpayOrderId_key" ON "orders"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_razorpayPaymentId_key" ON "payment_transactions"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentIntentId_idx" ON "payment_transactions"("paymentIntentId");

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
