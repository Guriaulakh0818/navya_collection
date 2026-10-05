# BM-06 — PREPAID PAYMENTS & ECONOMICS IMPLEMENTATION REPORT

**Navya Collection Private Limited**  
**Classification:** Financial & Technical Architecture Report  
**Implementation Status:** **PASS** (100% Verified, Full Test Suite & Build Passing)  
**Date:** October 3, 2026

---

## 1. Executive Summary

This report documents the complete implementation, security hardening, real refund integration, webhook recovery, dynamic GST calculation, and testing of **BM-06 — Prepaid Payment Flow & Economics** for the Navya Collection multi-seller marketplace.

The implementation resolves all 10 critical findings identified in the read-only audit (`BM-06_PREPAID_PAYMENT_AUDIT_REPORT.md`):

1. **Elimination of Orphaned Payments**: Developed a durable server-side `PaymentIntent` architecture. Razorpay orders are linked to immutable snapshots (cart items, quantities, selling prices, MRPs, discounts, coupons, shipping, dynamic taxes, final payable amounts). If the customer closes the browser, loses network connectivity, or refreshes after payment, the Razorpay webhook (`payment.captured`) automatically recovers and fulfills the order idempotently without human intervention.
2. **Authoritative Dynamic GST Engine**: Completely eliminated hardcoded 18% universal GST. Implemented rule-based dynamic GST: unregistered sellers incur ₹0 tax; registered sellers are assessed 5% for apparel below ₹1,000, 12% for apparel at or above ₹1,000, or product/category-specific configured tax rates, with intra-state (CGST + SGST) and inter-state (IGST) split.
3. **Real Razorpay Refund API**: Replaced all simulated/mock refund strings (`TXN-REF-...`) with the official Razorpay Refund API (`razorpay.payments.refund`), recording authentic `razorpayRefundId`, tracking `REFUND_PENDING`, `REFUNDED`, and `FAILED` states, and updating financial ledgers via webhooks (`refund.processed`, `refund.failed`).
4. **Cryptographic Security & Demo Bypass Removal**: Completely excised the insecure `order_demo_` bypass from `verifyPaymentSignatureAndFulfill`. Implemented timing-safe HMAC-SHA256 signature verification for all payment confirmations and webhook events.
5. **Legacy Route Deprecation**: Secured and deprecated legacy arbitrary-amount endpoints (`/api/create-order` and `/api/verify-payment`), mandating server-side price recalculation.
6. **Database-Level Idempotency**: Added `@unique` constraints in Prisma schema for `Order.razorpayOrderId`, `PaymentTransaction.razorpayPaymentId`, `CustomerRefund.razorpayRefundId`, and created `PaymentIntent` and `PaymentWebhookEvent` models for duplicate event suppression.
7. **Inventory Concurrency Protection**: Fixed stock decrement race conditions by executing atomic conditional updates (`tx.product.updateMany({ where: { id, stock: { gte: quantity } } })`), rolling back transactions with explicit `INSUFFICIENT_STOCK` errors if inventory is unavailable.
8. **Gateway Fee Economics**: Enforced the locked BM-06 business rule that Navya bears the ~2% payment gateway processing cost by default. Gateway fees are recorded in `FinancialAuditLog` as platform operational expenses without debiting seller base payout or altering BM-02 commission.
9. **Dedicated BM-06 Test Suite**: Implemented **46 dedicated BM-06 unit tests** covering all 7 risk areas.
10. **Zero Regressions**: All 28 test files (308 tests) pass across the entire codebase. TypeScript (`tsc --noEmit`), ESLint (`npm run lint`), and Next.js production build (`npm run build`) completed with 0 errors.

---

## 2. Final Architecture

The finalized prepaid payment architecture enforces backend authority over all monetary calculations:

```text
                        Customer Cart
                              │
                              ▼
            Server Cart Validation & Price Recalculation
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       BM-05 Shipping Engine         BM-06 Dynamic GST Engine
   (Standard Free >= ₹999/seller)   (Unregistered: ₹0, Reg: 5%/12%)
               │                             │
               └──────────────┬──────────────┘
                              ▼
                  Authoritative Payable Amount
                 = Subtotal - Discount + Shipping + Tax
                              │
                              ▼
          Create Durable PaymentIntent in Database
          - cartSnapshot (items, prices, mrps, shops, taxes)
          - shippingSnapshot (BM-05 seller breakdown)
          - taxSnapshot (CGST/SGST/IGST breakdown)
                              │
                              ▼
          Create Razorpay Order (Paise minor units)
                              │
                              ▼
                   Customer Checkout Modal
                              │
               ┌──────────────┴──────────────┐
               │                             │
        (Happy Path)                  (Drop-off / Crash)
    Customer Completes Modal          Browser Tab Closed
               │                             │
               ▼                             │
    Client invokes /verify                   │
    - HMAC SHA256 Verification              │
    - Intent Status -> CAPTURED             │
    - Atomic Stock Decrement                │
    - Master Order & VendorOrders            │
    - Shipments & Ledger Records            │
               │                             │
               │                      Webhook Arrives
               │                   (payment.captured)
               │                             │
               │                             ▼
               │                Idempotency Check
               │                - Event already processed? Return 200
               │                - Order already exists? Return 200
               │                - Recover from PaymentIntent snapshot
               │                - Atomic Stock Decrement
               │                - Create Master & VendorOrders
               │                - Intent Status -> CAPTURED
               ▼                             ▼
               └──────────────┬──────────────┘
                              ▼
                     Order Confirmation
                     & Seller Settlements
```

---

## 3. Payment State Machine

The payment lifecycle is mapped across `PaymentIntent`, `PaymentTransaction`, and `CustomerRefund`:

```text
               ┌────────────────┐
               │    CREATED     │
               └───────┬────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   PAYMENT_PENDING   │ (PaymentIntent initialized)
            └──────────┬──────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
(Payment Fails / Cancelled)     (Signature / Webhook Verified)
         │                           │
         ▼                           ▼
  ┌──────────────┐            ┌──────────────┐
  │    FAILED    │            │   CAPTURED   │ (Order & Splits Created)
  └──────────────┘            └──────┬───────┘
                                     │
                             (Return / Cancel Approved)
                                     │
                                     ▼
                              ┌──────────────┐
                              │REFUND_PENDING│ (Razorpay Refund API called)
                              └──────┬───────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
             (refund.processed)               (refund.failed)
                     │                               │
                     ▼                               ▼
       ┌───────────────────────────┐          ┌──────────────┐
       │   REFUNDED / PARTIALLY    │          │REFUND_FAILED │
       └───────────────────────────┘          └──────────────┘
```

---

## 4. PaymentIntent Design

The `PaymentIntent` model guarantees complete auditability and zero orphan risk:

```prisma
model PaymentIntent {
  id                 String    @id @default(cuid())
  intentNumber       String    @unique // e.g. NC-PI-2026-XXXX
  userId             String
  addressId          String
  razorpayOrderId    String    @unique
  razorpayPaymentId  String?   @unique
  razorpaySignature  String?
  amount             Decimal   @db.Decimal(10, 2)
  currency           String    @default("INR")
  status             String    @default("PAYMENT_PENDING") // PAYMENT_PENDING, CAPTURED, FAILED, CANCELLED, REFUNDED
  subtotal           Decimal   @db.Decimal(10, 2)
  discountAmount     Decimal   @default(0) @db.Decimal(10, 2)
  shippingAmount     Decimal   @default(0) @db.Decimal(10, 2)
  taxAmount          Decimal   @default(0) @db.Decimal(10, 2)
  finalAmount        Decimal   @db.Decimal(10, 2)
  couponCode         String?
  shippingMethodCode String?   @default("STANDARD")
  cartSnapshot       Json      // Immutable snapshot of items, prices, mrps, sellerIds, taxes
  shippingSnapshot   Json?     // Seller-level shipping breakdown snapshot
  taxSnapshot        Json?     // Dynamic tax breakdown snapshot
  customerNotes      String?
  metadata           Json?
  expiresAt          DateTime?
  fulfilledAt        DateTime?
  failedAt           DateTime?
  failureReason      String?
  masterOrderId      String?   @unique
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

---

## 5. Dynamic GST Architecture

In accordance with BM-06 Decision 2:

- **No universal 18% GST**: Hardcoded 0.18 calculations were deprecated and replaced.
- **Unregistered Sellers**: Automatically assessed ₹0 tax (`taxRate = 0`, `taxAmount = 0`, `taxType = 'EXEMPT'`).
- **Registered Sellers**:
  - Apparel items with selling price < ₹1,000: **5% GST**.
  - Apparel items with selling price >= ₹1,000: **12% GST**.
  - Product-level `taxRate` or category-level configuration overrides if specified.
- **Tax Classification**:
  - Intra-State (Customer State == Seller State): CGST (50% of rate) + SGST (50% of rate).
  - Inter-State (Customer State != Seller State): IGST (100% of rate).
- **Consistency**: The same dynamic tax computation runs in:
  1. Product card / cart preview (`TaxService.calculateItemDynamicTax`)
  2. Checkout preview (`OrderPreviewService.previewOrder`)
  3. Durable snapshot (`PaymentIntent.taxSnapshot`)
  4. Razorpay Order creation amount
  5. Master Order record (`Order.taxAmount`, `Order.finalAmount`)
  6. Child `OrderItem` snapshots (`taxRate`, `taxAmount`, `sellerGstAmount`)
  7. Seller settlement financial breakdowns (`SettlementService.computeSettlementBreakdown`)

---

## 6. Razorpay Integration & Webhook Architecture

### Real Razorpay Refund API

- `createRazorpayRefund` in [`src/backend/lib/razorpay.ts`](file:///d:/disk%20d/Navya%20Collection%20Website/src/backend/lib/razorpay.ts):
  - Converts amounts to integer paise (`Math.round(amount * 100)`).
  - Calls `razorpay.payments.refund(paymentId, { amount: amountInPaise, notes })`.
  - Persists `razorpayRefundId` and sets `gatewayRefundStatus: 'PENDING'`.

### Webhook Deduplication & Orphan Recovery

- In [`src/app/api/v1/webhooks/razorpay/route.ts`](file:///d:/disk%20d/Navya%20Collection%20Website/src/app/api/v1/webhooks/razorpay/route.ts):
  - Header `x-razorpay-signature` validated with HMAC-SHA256.
  - Event ID stored in `PaymentWebhookEvent` table with unique constraint.
  - Event `payment.captured`:
    1. Checks if order already exists for `razorpay_order_id`. If so, marks paid and returns 200.
    2. If no order exists, invokes `PaymentService.recoverAndFulfillOrphanPayment(orderId, paymentId)`.
    3. Fulfills master order, vendor orders, inventory decrements, and sets `PaymentIntent.status = 'CAPTURED'`.
  - Events `refund.processed` and `refund.failed`:
    1. Finds `CustomerRefund` by `razorpayRefundId`.
    2. Updates status to `PAID` or `FAILED` and records refund timestamp / error description.

---

## 7. Gateway Economics

- **Locked Decision**: Navya bears payment gateway transaction processing fees (~2%) by default.
- **Rule Verification**:
  - BM-02 Commission remains strictly 10% of MRP (untouched by gateway fee).
  - BM-03 Seller Base Payout = (Selling Price - Commission) remains strictly untouched.
  - Gateway cost is recorded in `financial_audit_logs` under `entityType: 'GATEWAY_FEE'`.

---

## 8. Multi-Seller Flow & Benchmark Scenario

### Multi-Seller Benchmark Scenario:

- **Seller A**: Subtotal ₹600 (< ₹999), Shipping = ₹49, Registered (5% GST = ₹30). Payable = ₹679.
- **Seller B**: Subtotal ₹1,200 (>= ₹999), Shipping = ₹0, Unregistered (0% GST = ₹0). Payable = ₹1,200.
- **Combined Cart**:
  - Subtotal = ₹1,800
  - Shipping = ₹49
  - Tax = ₹30
  - **Authoritative Grand Total = ₹1,879**
- One master `PaymentIntent` and one master Razorpay Order created for ₹1,879 (187,900 paise).
- On payment capture, child `VendorOrder` for Seller A and child `VendorOrder` for Seller B are generated with respective shipping, tax, commission, and settlement snapshots.

---

## 9. Inventory Protection & Concurrency

- Decrements use atomic SQL conditional statements:
  ```ts
  const prodRes = await tx.product.updateMany({
    where: { id: item.productId, stock: { gte: item.quantity } },
    data: { stock: { decrement: item.quantity } },
  });
  if (prodRes.count === 0) {
    const prod = await tx.product.findUnique({ where: { id: item.productId } });
    if (prod && prod.stock < item.quantity) {
      throw new Error(
        `INSUFFICIENT_STOCK: Product '${item.name}' has only ${prod.stock} unit(s) remaining in stock.`,
      );
    }
  }
  ```
- Prevents overselling when two customers pay concurrently.
- If stock is insufficient, transaction rolls back cleanly; payment remains recorded for customer refund/recovery.

---

## 10. Database Schema Changes & Migration

### Migration File:

[`prisma/migrations/20261003_bm06_prepaid_payments/migration.sql`](file:///d:/disk%20d/Navya%20Collection%20Website/prisma/migrations/20261003_bm06_prepaid_payments/migration.sql)

### Highlights:

1. **Added Unique Constraints**:
   - `Order.razorpayOrderId` (`UNIQUE INDEX`)
   - `PaymentTransaction.razorpayPaymentId` (`UNIQUE INDEX`)
   - `CustomerRefund.razorpayRefundId` (`UNIQUE INDEX`)
2. **New Tables**:
   - `payment_intents` (intentNumber, snapshots, statuses, timestamps)
   - `payment_webhook_events` (eventId, eventType, entityId, idempotency)
   - `tax_configurations` (hsnCode, category, taxRate, effectiveDates)
3. **New Columns**:
   - `Order.taxAmount` (Decimal(10,2))
   - `PaymentTransaction.gatewayFee`, `gatewayTax`, `netAmount`, `paymentIntentId`
   - `CustomerRefund.razorpayRefundId`, `gatewayRefundStatus`, `failureReason`, `isPartial`, `fee`
   - `Product.taxRate`, `Product.hsnCode`

---

## 11. Test Coverage & Quality Verification

### Dedicated BM-06 Test Suite:

`tests/unit/bm-06-prepaid-payments.test.ts` — **46 tests, 100% passing**:

1. **Payment Creation & Dynamic GST Rules (10 tests)**:
   - 5% GST on apparel < ₹1,000 for registered sellers.
   - 12% GST on apparel >= ₹1,000 for registered sellers.
   - Intra-state CGST + SGST split.
   - ₹0 GST for unregistered sellers.
   - Currency validation (INR) and minor units (paise).
   - Server-side amount recalculation rejecting frontend tamper.
   - Authoritative inclusion of BM-05 shipping and coupon discounts.
   - Accurate multi-seller tax accumulation.
2. **Cryptographic Signature Security (6 tests)**:
   - Timing-safe HMAC SHA256 validation.
   - Tampered signature rejection.
   - Tampered payment ID rejection.
   - Wrong secret key rejection.
   - Safety against variable-length timing attacks.
   - Strict blocking of `order_demo_` bypass.
3. **Webhook Architecture & Orphan Payment Recovery (5 tests)**:
   - Webhook signature validation.
   - Invalid webhook signature rejection.
   - Idempotency & duplicate event ID deduplication.
   - Recovery and fulfillment of orphan payments from `PaymentIntent`.
   - Idempotent execution of `recoverAndFulfillOrphanPayment`.
4. **Real Razorpay Refund Architecture (4 tests)**:
   - Invocation of real refund API with integer paise.
   - Rejection of invalid payment IDs or negative amounts.
   - Partial refund support without total order refund.
   - Integration with `SettlementService` replacing `TXN-REF-`.
5. **Inventory Concurrency & Race Condition Protection (1 test)**:
   - Atomic conditional decrement with `INSUFFICIENT_STOCK` rollback.
6. **Gateway Economics & Ledger Audit (6 tests)**:
   - No gateway fee deduction from BM-02 commission.
   - No gateway fee deduction from BM-03 seller payout.
   - Verification of the Multi-Seller Benchmark Scenario.
   - Post-shipment cancellation logistics loss borne 100% by Navya (BM-05).
   - RTO logistics loss split 50/50 between Navya and seller (BM-04).
7. **Reconciliation & Auditability (14 tests)**:
   - End-to-end payment chain tracing (`PaymentIntent` -> Razorpay Order -> Payment -> Order).
   - Explicit 18% GST calculation when configured.
   - Empty cart rejection.
   - Missing orderId, paymentId, or signature verification rejection.
   - PaymentIntent status transition to `FAILED` on payment error.
   - Webhook `refund.processed` and `refund.failed` event handling.
   - Deprecated `/api/create-order` rejection of client amount (HTTP 400).
   - Deprecated `/api/verify-payment` signature verification.
   - Over-refund prevention.
   - Order taxAmount consistency check.

### Regression Test Suite:

| Suite                        | File                                                     |     Tests     |    Result     |
| :--------------------------- | :------------------------------------------------------- | :-----------: | :-----------: |
| **BM-01**                    | `tests/unit/final-commercial-settlement-returns.test.ts` |      22       |   **PASS**    |
| **BM-02**                    | `tests/unit/bm-02-commission-model.test.ts`              |      60       |   **PASS**    |
| **BM-03**                    | `tests/unit/bm-03-seller-payout.test.ts`                 |      37       |   **PASS**    |
| **BM-04**                    | `tests/unit/bm-04-customer-shipping.test.ts`             |      29       |   **PASS**    |
| **BM-05**                    | `tests/unit/bm-05-free-shipping.test.ts`                 |      42       |   **PASS**    |
| **BM-06**                    | `tests/unit/bm-06-prepaid-payments.test.ts`              |      46       |   **PASS**    |
| **Other Unit & Integration** | 22 test files                                            |      72       |   **PASS**    |
| **Total**                    | **28 test files**                                        | **308 tests** | **100% PASS** |

---

## 12. Legacy Logic Classification

| Target Term           | Location                              | Classification           | Action / Status                                                          |
| :-------------------- | :------------------------------------ | :----------------------- | :----------------------------------------------------------------------- |
| `order_demo_`         | `payment.service.ts`                  | **DEAD / REMOVED**       | Excised completely from production code; tested for rejection.           |
| `TXN-REF-`            | `settlement.service.ts`               | **REPLACED**             | Replaced with real Razorpay Refund API (`razorpay.payments.refund`).     |
| `/api/create-order`   | `src/app/api/create-order/route.ts`   | **DEPRECATED & SECURED** | Returns HTTP 400 rejecting arbitrary client amounts.                     |
| `/api/verify-payment` | `src/app/api/verify-payment/route.ts` | **DEPRECATED & SECURED** | Re-implemented with timing-safe HMAC-SHA256 signature verification.      |
| Hardcoded `18%` GST   | `src/shared/config/payment.ts`        | **DEPRECATED**           | Marked deprecated; dynamic calculation enforced via `TaxService`.        |
| `0.9` / `0.98`        | CSS transforms & sitemaps             | **SAFE**                 | Visual Tailwind scaling (`active:scale-[0.98]`) and SEO sitemap weights. |

---

## 13. Quality Gates Verification

- **TypeScript (`npx tsc --noEmit`)**: **PASSED** (0 errors)
- **ESLint (`npm run lint`)**: **PASSED** (0 warnings, 0 errors)
- **Production Build (`npm run build`)**: **PASSED** (Next.js 15.5.25 optimized production bundle generated successfully)
- **Unit & Integration Tests (`npm test`)**: **PASSED** (28 test files, 308 passed, 0 failed)

---

## 14. Final BM-06 Status

# **STATUS: PASS**

All BM-06 prepaid payment, dynamic GST, real Razorpay refund, webhook recovery, database idempotency, inventory protection, and gateway accounting requirements are fully implemented, verified against existing business rules (BM-01 through BM-05), and validated by comprehensive automated testing.
