# BM-10 — PROMOTIONS / COUPONS FORENSIC IMPLEMENTATION REPORT

**Module:** BM-10 — Promotions → Coupons  
**Repository:** Navya Collection Production Marketplace  
**Date:** October 4, 2026  
**Final Status:** **PASS**  
**Audit Verdict Before Implementation:** NOT READY (0 files modified)  
**Verification Result:** 31/31 BM-10 Unit Tests PASS | 470/470 Full Regression PASS | TypeScript PASS | ESLint PASS | Prisma Validate PASS | Production Build PASS

---

## 1. Executive Summary

The **BM-10 — Promotions / Coupons** business module has been completely implemented, hardened, and verified to production-grade standards.

All financial rules established under **BM-01 through BM-09** remain 100% intact and invariant:

1. **Navya Commission Invariance (BM-02):** The platform commission is strictly $MRP \times 10\%$ and is never discounted, altered, or eroded by coupons, whether Navya-funded or Seller-funded.
2. **Free Shipping Invariance (BM-05):** Customer free shipping eligibility continues to be evaluated against the pre-coupon product selling subtotal (₹999 for prepaid, ₹1,999 for COD).
3. **Cash on Delivery Fee & Cap Invariance (BM-07):** The COD ₹5,000 ordering ceiling applies strictly to the pre-coupon product selling subtotal, and the COD fee is calculated based on the net product selling price after allocated coupon plus shipping and tax.
4. **Returns & Customer Refunds (BM-08):** Returned items deduct the historical allocated coupon from customer refunds and protect sellers from over-clawbacks on seller-funded discounts.
5. **Prepaid RTO Retentions (BM-09):** Courier return to origin preserves immutable historical coupon records; promotional discounts are never refunded in cash.

---

## 2. BM-10 V1 Funding Model

The V1 funding architecture implements strictly two funding types (`NAVYA` and `SELLER`). As mandated by the production hardening specification, `CO_FUNDED` is not implemented in this phase.

| Dimension            | NAVYA-Funded Coupon (`CouponFundingType.NAVYA`)                                                    | SELLER-Funded Coupon (`CouponFundingType.SELLER`)                                              |
| :------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Customer Benefit** | Customer receives promotional discount                                                             | Customer receives promotional discount                                                         |
| **Seller Impact**    | **No coupon loss.** Seller receives full eligible payout base ($Selling Price - MRP \times 10\%$). | **Seller bears coupon discount.** Seller payout is reduced by their allocated coupon discount. |
| **Navya Platform**   | Navya absorbs the promotional subsidy ($₹X$). Recorded in `FinancialAuditLog`.                     | Navya does not subsidize. Promotional liability is zero.                                       |
| **Navya Commission** | $MRP \times 10\%$ (BM-02 untouched)                                                                | $MRP \times 10\%$ (BM-02 untouched)                                                            |
| **Settlement Line**  | Payout unaltered; audited as promotional subsidy.                                                  | Deducted once under `SellerSettlement.sellerDiscounts`.                                        |
| **Return Reversal**  | Seller clawback is not penalized for Navya's subsidy.                                              | Seller clawback reverses only the net payout actually earned, preventing double debit.         |

---

## 3. Database Schema Hardening & Migration

### Migration File

`prisma/migrations/20261004_bm10_coupons/migration.sql`

### Schema Changes Summary

1. **Enum `CouponFundingType`:**

   ```prisma
   enum CouponFundingType {
     NAVYA
     SELLER
   }
   ```

2. **Hardened `Coupon` Model (`prisma/schema.prisma`):**
   - `fundingType`: `CouponFundingType @default(NAVYA)` with index.
   - `title`: `String?`
   - `description`: `String?`
   - `usageLimit`: `Int?` (Global usage cap)
   - `usagePerUser`: `Int @default(1)` (Per-customer redemption cap)
   - `usedCount`: `Int @default(0)`
   - `startDate`: `DateTime? @default(now())`
   - `applicableCategories`: `String[] @default([])`
   - `applicableProducts`: `String[] @default([])`
   - `excludedProducts`: `String[] @default([])`
   - `usages`: Relation to `CouponUsage[]`

3. **New Model `CouponUsage`:**

   ```prisma
   model CouponUsage {
     id        String   @id @default(cuid())
     couponId  String
     userId    String
     orderId   String?
     usedAt    DateTime @default(now())

     coupon    Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@index([couponId, userId])
     @@index([couponId, orderId])
     @@map("coupon_usages")
   }
   ```

4. **Order Snapshot Hardening:**
   - **`Order` Model:**
     - `couponId`: `String?`
     - `couponCode`: `String?`
     - `couponType`: `String?`
     - `couponFundingType`: `CouponFundingType?`
   - **`VendorOrder` Model:**
     - `allocatedCouponAmount`: `Decimal? @default(0) @db.Decimal(10, 2)`
     - `couponFundingType`: `CouponFundingType?`
   - **`OrderItem` Model:**
     - `couponId`: `String?`
     - `navyaCouponAmount`: `Decimal? @default(0) @db.Decimal(10, 2)`
     - `sellerCouponAmount`: `Decimal? @default(0) @db.Decimal(10, 2)`

5. **`NAVYA15VIP` Database Seeding:**
   - Idempotently inserted into the database via migration to retire hardcoded coupon logic:
     - Code: `NAVYA15VIP`
     - Title: `VIP Club 15% OFF Welcome Discount`
     - Discount: `15%` (Min order: ₹3,000, Max discount: ₹1,000)
     - Funding: `NAVYA`
     - Usage per user: `1`

---

## 4. Single Authoritative Coupon Allocation Engine

The proportional allocation logic has been unified into a single authoritative engine in [CouponService.allocateCoupon](file:///d:/disk%20d/Navya%20Collection%20Website/src/frontend/features/coupons/services/coupon.service.ts):

$$\text{Seller Coupon Allocation} = \text{Total Discount} \times \frac{\text{Eligible Seller Subtotal}}{\Sigma \text{Eligible Subtotal}}$$

### Exact Paise Reconciliation (Zero Lost Paise)

- Allocations are rounded to two decimal places (paise) via `CommissionService.roundMoney`.
- Any mathematical remainder or residual rounding paise is deterministically assigned to the final eligible seller and item:
  $$\text{Final Seller Coupon} = \text{Total Discount} - \sum_{i=1}^{N-1} \text{Seller Coupon}_i$$
- Exact invariant maintained:
  $$\sum \text{Seller Allocations} \equiv \text{Total Discount}$$
  $$\sum \text{Item Allocations} \equiv \text{Total Discount}$$

---

## 5. Coupon Lifecycle & Concurrency Protection

```text
[Customer Enters Code]
        ↓
[Server Validation & Restriction Filter]
  - Date window (startDate - validUntil)
  - Active flag
  - Global limit check (usedCount < usageLimit)
  - User limit check (userUsageCount < usagePerUser)
  - Category / Product inclusion & exclusion
  - Shop isolation (seller-specific coupons)
        ↓
[Proportional Allocation Calculated]
  - Seller breakdown & Item breakdown
  - Funding liability determined (NAVYA vs SELLER)
        ↓
[Atomic Database Transaction]
  - Order, VendorOrders, OrderItems created with snapshots
  - Coupon usedCount incremented atomically
  - Immutable CouponUsage record created
  - Navya promotional subsidy logged (if NAVYA)
  - Seller payout adjusted (if SELLER)
        ↓
[Order Success / Confirmation]
        ↓ (If Order Fully Cancelled / Failed)
[Atomic restoreUsage()]
  - Decrements usedCount if > 0
  - Removes specific CouponUsage record
  - Idempotent execution
```

### Race Condition & Concurrency Guard

- Implemented in [CouponRepository.recordUsage](file:///d:/disk%20d/Navya%20Collection%20Website/src/frontend/features/coupons/repositories/coupon.repository.ts):
  - Operates within Prisma transaction isolation.
  - Re-evaluates global usage and per-user count inside the transaction lock.
  - Atomic increment prevents over-redemption when multiple concurrent checkouts occur simultaneously.
  - Verified by concurrency test: 5 simultaneous checkouts on a single-use coupon yield exactly 1 success and 4 rejections.

---

## 6. Financial Reconciliation & Settlement Integration

### Settlement Service (`SettlementService`)

1. **Order Delivery (`onOrderDelivered`):**
   - When a vendor order is marked delivered, `vo.allocatedCouponAmount` is evaluated.
   - If `couponFundingType === 'SELLER'`, the coupon discount is recorded into `SellerSettlement.sellerDiscounts`.
   - The seller's net settlement is:
     $$\text{Net Settlement} = \text{Gross Product Value} - \text{Commission} - \text{Seller Discounts} - \text{Shipping Deductions} + \text{Eligible GST}$$
2. **Customer Return Verification (`onReturnVerified`):**
   - Uses `CommissionService.calculateReturnPayoutReversal`.
   - If the return was seller-funded, the clawback is reduced by the historical `sellerCouponDiscount` already borne by the seller.
   - Prevents the seller from being debited twice for a promo discount they never received.

---

## 7. Security & API Protection

1. **Admin Coupon Routes (`/api/v1/admin/coupons`, `/api/v1/admin/coupons/[id]`):**
   - Enforces `getCurrentUser()` authentication guard.
   - Verifies roles: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `SUPERVISOR`.
   - Returns `401 Unauthorized` for unauthenticated requests.
   - Returns `403 Forbidden` for non-admin accounts.

2. **Seller Coupon Routes (`/api/v1/seller/coupons`, `/api/v1/seller/coupons/[id]`):**
   - Dedicated seller coupon management endpoint.
   - Validates that the user owns an active store (`prisma.shop.findFirst`).
   - **Enforces SELLER-only funding:** Sellers attempting to create a `NAVYA`-funded coupon receive `403 Forbidden`.
   - **Enforces Shop Isolation:** Seller coupons are strictly tied to `shop.id`; sellers cannot modify, deactivate, or delete coupons belonging to other sellers or the platform.

3. **Admin Coupon UI (`/admin/coupons`):**
   - Added interactive `Funding Responsibility` selector:
     - `Navya-Funded` (Platform absorbs promo; seller payout unaffected).
     - `Seller-Funded` (Seller absorbs discount; requires seller shop ID).
   - Displays Funding badges, Shop associations, Global Limits, and Per-User Limits.

---

## 8. Files Modified / Created

| #   | File Path                                                         | Type       | Action & Responsibility                                                                                                            |
| :-- | :---------------------------------------------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `prisma/schema.prisma`                                            | Schema     | Added `CouponFundingType`, hardened `Coupon`, created `CouponUsage`, added snapshot fields to `Order`, `VendorOrder`, `OrderItem`. |
| 2   | `prisma/migrations/20261004_bm10_coupons/migration.sql`           | Migration  | Production SQL migration with non-destructive table alters, indexes, constraints, and `NAVYA15VIP` seed.                           |
| 3   | `src/frontend/features/coupons/types/coupon.types.ts`             | Types      | Domain types for funding types, item allocations, seller allocations, and coupon filters.                                          |
| 4   | `src/frontend/features/coupons/schemas/coupon.schema.ts`          | Schema     | Zod schemas with funding types, percentage <= 100% refinements, and clean partial derivation.                                      |
| 5   | `src/frontend/features/coupons/repositories/coupon.repository.ts` | Repository | Atomic `recordUsage`, `restoreUsage`, `countUserUsages`, `findByShopId`, and full field persistence.                               |
| 6   | `src/frontend/features/coupons/services/coupon.service.ts`        | Service    | Single authoritative `allocateCoupon` engine with paise reconciliation, restriction filtering, and seller isolation.               |
| 7   | `src/app/api/v1/admin/coupons/route.ts`                           | API Route  | Secured admin endpoint for coupon creation and listing with role guards (401/403).                                                 |
| 8   | `src/app/api/v1/admin/coupons/[id]/route.ts`                      | API Route  | Secured admin endpoint for coupon update and deletion.                                                                             |
| 9   | `src/app/api/v1/seller/coupons/route.ts`                          | API Route  | New seller endpoint for creating and listing shop-isolated SELLER-funded coupons.                                                  |
| 10  | `src/app/api/v1/seller/coupons/[id]/route.ts`                     | API Route  | New seller endpoint for updating/deactivating seller's own coupons.                                                                |
| 11  | `src/backend/services/commission.service.ts`                      | Service    | Upgraded `calculateReturnPayoutReversal` with `sellerCouponDiscount` to prevent double-charging sellers on returns.                |
| 12  | `src/backend/services/settlement.service.ts`                      | Service    | Updated `onOrderDelivered` and `onReturnVerified` with seller discount accounting and settlement number initialization.            |
| 13  | `src/backend/services/order-split.service.ts`                     | Service    | Multi-vendor order creation with coupon snapshots, seller payout adjustment, and Navya subsidy audit logging.                      |
| 14  | `src/frontend/features/orders/repositories/order.repository.ts`   | Repository | Single/multi-seller `createOrderWithItems` wired with BM-10 coupon snapshots, atomic usage, and subsidy logging.                   |
| 15  | `src/frontend/features/payments/services/payment.service.ts`      | Service    | Wired `verifyPaymentAndCreateOrder`, `createCodOrder`, and orphan recovery with coupon snapshots.                                  |
| 16  | `src/frontend/features/orders/services/order-preview.service.ts`  | Service    | Passes cart items to coupon validation and uses authoritative seller allocations in COD breakdown.                                 |
| 17  | `src/backend/services/shipping/multi-seller-shipment.service.ts`  | Service    | Added coupon usage restoration on master order cancellation.                                                                       |
| 18  | `src/app/admin/coupons/page.tsx`                                  | Admin UI   | Updated UI with funding responsibility radios, shop selector, usage limits, and table badges.                                      |
| 19  | `tests/unit/bm-10-coupons.test.ts`                                | Unit Tests | Comprehensive automated test suite with 31 scenarios covering all BM-10 acceptance criteria.                                       |

---

## 9. Final Acceptance Matrix

| AC        | Requirement                         | Status   | Evidence                                                                                           |
| :-------- | :---------------------------------- | :------- | :------------------------------------------------------------------------------------------------- |
| **AC-01** | Coupon schema hardened              | **PASS** | `prisma/schema.prisma`, `migration.sql` (validated via `npx prisma validate`)                      |
| **AC-02** | Funding type persisted              | **PASS** | `Order.couponFundingType`, `VendorOrder.couponFundingType`, `tests/unit/bm-10-coupons.test.ts`     |
| **AC-03** | Navya-funded accounting             | **PASS** | Seller payout unaffected; `FinancialAuditLog` logs `NAVYA_PROMOTIONAL_SUBSIDY_APPLIED`             |
| **AC-04** | Seller-funded accounting            | **PASS** | Deducted from seller payout; recorded in `SellerSettlement.sellerDiscounts`                        |
| **AC-05** | BM-02 commission preserved          | **PASS** | Commission strictly $MRP \times 10\%$; tests Scenario 3.1 & 3.2 pass                               |
| **AC-06** | BM-05 shipping preserved            | **PASS** | Evaluated on pre-coupon selling subtotal; tests Scenario 7.1 pass                                  |
| **AC-07** | BM-07 COD preserved                 | **PASS** | COD fee base uses allocated coupon; subtotal cap uses pre-coupon subtotal; Scenario 8.1 pass       |
| **AC-08** | Multi-seller allocation persisted   | **PASS** | `CouponService.allocateCoupon` with exact paise reconciliation; Scenario 4.1 & 4.2 pass            |
| **AC-09** | Immutable order snapshot            | **PASS** | `Order`, `VendorOrder`, and `OrderItem` persist snapshot fields; Scenario 2.4 pass                 |
| **AC-10** | Refund compatibility                | **PASS** | Historical allocation prevents over-refunds; Scenario 9.1 pass                                     |
| **AC-11** | BM-08 return compatibility          | **PASS** | `CommissionService.calculateReturnPayoutReversal` with `sellerCouponDiscount`; Scenario 9.2 pass   |
| **AC-12** | BM-09 RTO compatibility             | **PASS** | Prepaid RTO retains coupon value without cash payout; Scenario 9.4 pass                            |
| **AC-13** | Cancellation usage handling         | **PASS** | Fully cancelled orders restore coupon usage via `restoreUsage()`; Scenario 6.4 pass                |
| **AC-14** | Global usage limit                  | **PASS** | Server-side validation rejects when `usedCount >= usageLimit`; Scenario 6.1 pass                   |
| **AC-15** | Per-user usage limit                | **PASS** | `countUserUsages` enforces `usagePerUser`; Scenario 6.2 pass                                       |
| **AC-16** | Concurrency protection              | **PASS** | Atomic Prisma transaction updates prevent race conditions; Scenario 6.3 pass                       |
| **AC-17** | Server-side validation              | **PASS** | Server recalculates discount and seller allocations; client values never trusted                   |
| **AC-18** | Admin authorization                 | **PASS** | Role guards on `/api/v1/admin/coupons` reject unauthorized requests; Scenario 10.1 & 10.3 pass     |
| **AC-19** | Seller authorization                | **PASS** | Sellers restricted to own `SELLER` coupons; `NAVYA` attempt returns 403; Scenario 10.2 pass        |
| **AC-20** | Category/product restrictions       | **PASS** | `applicableCategories`, `applicableProducts`, `excludedProducts` enforced; Scenario 5.1 & 5.2 pass |
| **AC-21** | Coupon funding ledger               | **PASS** | `NAVYA_PROMOTIONAL_SUBSIDY_APPLIED` recorded in `FinancialAuditLog`                                |
| **AC-22** | No duplicate/legacy financial logic | **PASS** | Reuses authoritative `CommissionService` and `CouponService`; no parallel tax or shipping logic    |
| **AC-23** | Dedicated BM-10 tests               | **PASS** | `tests/unit/bm-10-coupons.test.ts` (31/31 tests pass)                                              |
| **AC-24** | Full regression                     | **PASS** | 32/32 test suites pass                                                                             | 470/470 tests pass |

---

## 10. Quality Gate Verification Results

| Quality Gate             | Command                                           | Status   | Details                                                        |
| :----------------------- | :------------------------------------------------ | :------- | :------------------------------------------------------------- |
| **Prisma Validation**    | `npx prisma validate`                             | **PASS** | Schema valid with 0 errors.                                    |
| **Database Sync**        | `npx prisma db push`                              | **PASS** | Database in sync with schema; Prisma Client v5.22.0 generated. |
| **BM-10 Unit Suite**     | `npx vitest run tests/unit/bm-10-coupons.test.ts` | **PASS** | **31 / 31 passed (100%)**                                      |
| **Full Regression**      | `npx vitest run`                                  | **PASS** | **32 / 32 suites passed                                        | 470 / 470 tests passed** |
| **TypeScript Typecheck** | `npx tsc --noEmit`                                | **PASS** | 0 type errors across codebase.                                 |
| **ESLint**               | `npm run lint`                                    | **PASS** | 0 warnings, 0 errors.                                          |
| **Production Build**     | `npm run build`                                   | **PASS** | Exit code 0; 152/152 routes generated successfully.            |

---

## 11. Remaining Risks & Observations

1. **Third-Party Payment Webhook Real-time Verification:**
   All local database transactions, atomic idempotency checks, and mock webhook handlers pass 100%. As is standard for staging environments, end-to-end webhook delivery from live Razorpay and Shiprocket accounts depends on valid production webhook secret keys configured in the production environment.
2. **Seller Settlement Payout Timing:**
   Seller-funded coupon deductions are executed immediately upon settlement record creation (`T+7` eligibility post-delivery). If a seller's net settlement amount for a period becomes negative due to heavy coupon promotions exceeding sales, the existing `offsetPendingSellerDebits` engine holds the negative balance against future sales as designed under BM-03.

---

## 12. Final Certification

**Module Status:** **PASS**  
All requirements, funding responsibilities, security guards, usage limits, multi-seller allocations, and regression boundaries have been fully implemented, hardened, and verified with zero defects.
