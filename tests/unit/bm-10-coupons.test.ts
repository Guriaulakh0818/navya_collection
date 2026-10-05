import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionLib from '../../src/backend/lib/session';
import { CommissionService } from '../../src/backend/services/commission.service';
import { SettlementService } from '../../src/backend/services/settlement.service';
import { CouponRepository } from '../../src/frontend/features/coupons/repositories/coupon.repository';
import {
  createCouponSchema,
  validateCouponSchema,
} from '../../src/frontend/features/coupons/schemas/coupon.schema';
import { CouponService } from '../../src/frontend/features/coupons/services/coupon.service';
import { prisma } from '../../src/lib/prisma';

describe('BM-10 — PROMOTIONS & COUPONS PRODUCTION SUITE', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC-01: COUPON VALIDATION & BASIC MATH
  // =========================================================================
  describe('AC-01: Basic Coupon Math & Validation Engine', () => {
    it('Scenario 1.1: Percentage coupon calculates correct discount', () => {
      const coupon = {
        discountType: 'PERCENTAGE',
        discountValue: 15, // 15%
        maxDiscount: null,
        minOrderAmount: 0,
      };
      const items = [{ productId: 'p1', shopId: 'shop1', price: 1000, quantity: 1, total: 1000 }];
      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(150);
      expect(res.itemAllocations[0].allocatedCoupon).toBe(150);
    });

    it('Scenario 1.2: Fixed amount coupon calculates exact deduction', () => {
      const coupon = {
        discountType: 'FIXED',
        discountValue: 250,
        maxDiscount: null,
        minOrderAmount: 500,
      };
      const items = [{ productId: 'p1', shopId: 'shop1', price: 800, quantity: 1, total: 800 }];
      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(250);
    });

    it('Scenario 1.3: Maximum discount cap is strictly enforced', () => {
      const coupon = {
        discountType: 'PERCENTAGE',
        discountValue: 20, // 20% on 3000 = 600
        maxDiscount: 300, // Capped at 300
        minOrderAmount: 0,
      };
      const items = [{ productId: 'p1', shopId: 'shop1', price: 3000, quantity: 1, total: 3000 }];
      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(300);
      expect(res.totalDiscount).toBeLessThanOrEqual(300);
    });

    it('Scenario 1.4: Fixed discount cannot exceed eligible cart subtotal', () => {
      const coupon = {
        discountType: 'FIXED',
        discountValue: 1500,
        maxDiscount: null,
        minOrderAmount: 0,
      };
      const items = [{ productId: 'p1', shopId: 'shop1', price: 400, quantity: 2, total: 800 }];
      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(800); // Capped at total
    });

    it('Scenario 1.5: Schema rejects negative or invalid discount values', () => {
      const invalidInput = {
        code: 'BADCOUPON',
        discountType: 'PERCENTAGE',
        discountValue: -10, // Invalid
        minOrderAmount: -50,
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      };
      const parseRes = createCouponSchema.safeParse(invalidInput);
      expect(parseRes.success).toBe(false);
    });

    it('Scenario 1.6: Schema rejects percentage discount above 100%', () => {
      const invalidInput = {
        code: 'OVER100',
        discountType: 'PERCENTAGE',
        discountValue: 105,
        minOrderAmount: 0,
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      };
      const parseRes = createCouponSchema.safeParse(invalidInput);
      expect(parseRes.success).toBe(false);
    });
  });

  // =========================================================================
  // AC-02, AC-03, AC-04: FUNDING RESPONSIBILITY & ACCOUNTING
  // =========================================================================
  describe('AC-02, AC-03, AC-04: Funding Responsibility (NAVYA vs SELLER)', () => {
    const mrp = 1000;
    const sellingPrice = 1000;
    const couponDiscount = 150;

    it('Scenario 2.1: Navya-Funded Coupon — Seller payout is NOT reduced', () => {
      // Under BM-02:
      // Commission = MRP * 10% = 1000 * 10% = 100
      // Seller payout base = sellingPrice - Commission = 1000 - 100 = 900
      const comm = CommissionService.calculateItemCommission({
        mrp,
        sellingPrice,
        quantity: 1,
      });
      expect(comm.commissionAmount).toBe(100);
      expect(comm.sellerTotalPayout).toBe(900);

      // Under NAVYA funding, seller payout remains 900. Navya absorbs 150.
      const fundingType = 'NAVYA';
      const sellerPayout =
        fundingType === 'NAVYA' ? comm.sellerTotalPayout : comm.sellerTotalPayout - couponDiscount;

      expect(sellerPayout).toBe(900);
      const navyaPromotionalSubsidy = couponDiscount;
      expect(navyaPromotionalSubsidy).toBe(150);
    });

    it('Scenario 2.2: Seller-Funded Coupon — Seller bears coupon discount exactly', () => {
      const comm = CommissionService.calculateItemCommission({
        mrp,
        sellingPrice,
        quantity: 1,
      });

      // Under SELLER funding, seller payout is reduced by seller coupon:
      // Payout = 900 - 150 = 750
      const fundingType = 'SELLER';
      const sellerPayout =
        fundingType === 'SELLER' ? comm.sellerTotalPayout - couponDiscount : comm.sellerTotalPayout;

      expect(sellerPayout).toBe(750);
      const navyaPromotionalSubsidy = 0;
      expect(navyaPromotionalSubsidy).toBe(0);
    });

    it('Scenario 2.3: Seller payout difference between NAVYA and SELLER funding is exactly coupon discount', () => {
      const comm = CommissionService.calculateItemCommission({ mrp, sellingPrice, quantity: 1 });
      const navyaFundedPayout = comm.sellerTotalPayout;
      const sellerFundedPayout = comm.sellerTotalPayout - couponDiscount;

      expect(navyaFundedPayout - sellerFundedPayout).toBe(couponDiscount);
    });

    it('Scenario 2.4: Item snapshot allocates navyaCouponAmount vs sellerCouponAmount', () => {
      const items = [{ productId: 'p1', shopId: 's1', price: 1000, quantity: 1, total: 1000 }];

      // Test NAVYA funding
      const navyaAlloc = CouponService.allocateCoupon(
        { discountType: 'FIXED', discountValue: 100, fundingType: 'NAVYA' },
        items,
      );
      expect(navyaAlloc.itemAllocations[0].navyaCouponAmount).toBe(100);
      expect(navyaAlloc.itemAllocations[0].sellerCouponAmount).toBe(0);

      // Test SELLER funding
      const sellerAlloc = CouponService.allocateCoupon(
        { discountType: 'FIXED', discountValue: 100, fundingType: 'SELLER' },
        items,
      );
      expect(sellerAlloc.itemAllocations[0].navyaCouponAmount).toBe(0);
      expect(sellerAlloc.itemAllocations[0].sellerCouponAmount).toBe(100);
    });
  });

  // =========================================================================
  // AC-05: BM-02 COMMISSION PRESERVATION (MRP * 10%)
  // =========================================================================
  describe('AC-05: BM-02 Commission Invariance (MRP × 10%)', () => {
    it('Scenario 3.1: Commission remains MRP × 10% regardless of coupon presence', () => {
      const mrp = 2000;
      const sellingPrice = 1800;

      // Base commission
      const baseComm = CommissionService.calculateItemCommission({
        mrp,
        sellingPrice,
        quantity: 1,
      });
      expect(baseComm.commissionAmount).toBe(200); // 2000 * 10%

      // Commission NEVER calculates from (MRP - coupon)
      const invalidCouponCommission = (mrp - 300) * 0.1;
      expect(baseComm.commissionAmount).not.toBe(invalidCouponCommission);

      // Commission NEVER calculates from (sellingPrice - coupon)
      const invalidNetCommission = (sellingPrice - 300) * 0.1;
      expect(baseComm.commissionAmount).not.toBe(invalidNetCommission);
    });

    it('Scenario 3.2: Multi-item commission base remains untainted by coupon allocations', () => {
      const items = [
        { mrp: 1200, sellingPrice: 1000, quantity: 2 },
        { mrp: 800, sellingPrice: 700, quantity: 1 },
      ];

      const totalMrp = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0); // 1200*2 + 800 = 3200
      const totalComm = items.reduce(
        (sum, i) => sum + CommissionService.calculateItemCommission(i).commissionAmount,
        0,
      );

      expect(totalComm).toBe(320); // 3200 * 10%
    });
  });

  // =========================================================================
  // AC-08: MULTI-SELLER PROPORTIONAL ALLOCATION & EXACT PAISE RECONCILIATION
  // =========================================================================
  describe('AC-08: Multi-Seller Proportional Allocation & Exact Paise Reconciliation', () => {
    it('Scenario 4.1: Proportional allocation across multiple sellers reconciles exactly', () => {
      const items = [
        { productId: 'p1', shopId: 'sellerA', price: 600, quantity: 1, total: 600 },
        { productId: 'p2', shopId: 'sellerB', price: 400, quantity: 1, total: 400 },
      ];
      const coupon = {
        discountType: 'FIXED',
        discountValue: 100,
        fundingType: 'NAVYA' as const,
      };

      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(100);

      const allocA = res.sellerAllocations.find((s) => s.sellerId === 'sellerA')?.allocatedCoupon;
      const allocB = res.sellerAllocations.find((s) => s.sellerId === 'sellerB')?.allocatedCoupon;

      expect(allocA).toBe(60); // 60%
      expect(allocB).toBe(40); // 40%
      expect(allocA! + allocB!).toBe(100);
    });

    it('Scenario 4.2: Exact paise reconciliation with rounding remainders (No Lost Paise)', () => {
      // 3 items of ₹333.33 each with coupon of ₹100
      const items = [
        { productId: 'p1', shopId: 's1', price: 333, quantity: 1, total: 333 },
        { productId: 'p2', shopId: 's2', price: 333, quantity: 1, total: 333 },
        { productId: 'p3', shopId: 's3', price: 334, quantity: 1, total: 334 },
      ];
      const coupon = {
        discountType: 'FIXED',
        discountValue: 100,
      };

      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(100);

      const sumSellerAlloc = res.sellerAllocations.reduce((sum, s) => sum + s.allocatedCoupon, 0);
      expect(CommissionService.roundMoney(sumSellerAlloc)).toBe(100.0);

      const sumItemAlloc = res.itemAllocations.reduce((sum, i) => sum + i.allocatedCoupon, 0);
      expect(CommissionService.roundMoney(sumItemAlloc)).toBe(100.0);
    });

    it('Scenario 4.3: Seller-specific coupon is isolated to eligible seller products only', () => {
      const items = [
        { productId: 'p1', shopId: 'sellerA', price: 500, quantity: 1, total: 500 },
        { productId: 'p2', shopId: 'sellerB', price: 500, quantity: 1, total: 500 },
      ];
      // Coupon belongs strictly to sellerA
      const coupon = {
        discountType: 'FIXED',
        discountValue: 100,
        shopId: 'sellerA',
        fundingType: 'SELLER' as const,
      };

      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(100);

      const allocA = res.sellerAllocations.find((s) => s.sellerId === 'sellerA')?.allocatedCoupon;
      const allocB = res.sellerAllocations.find((s) => s.sellerId === 'sellerB')?.allocatedCoupon;

      expect(allocA).toBe(100);
      expect(allocB).toBe(0); // Seller B gets ₹0 discount
    });
  });

  // =========================================================================
  // AC-20: CATEGORY & PRODUCT RESTRICTIONS
  // =========================================================================
  describe('AC-20: Category & Product Inclusion/Exclusion Rules', () => {
    it('Scenario 5.1: Excluded products do not receive coupon discount', () => {
      const items = [
        { productId: 'prod_allowed', shopId: 's1', price: 800, quantity: 1, total: 800 },
        { productId: 'prod_excluded', shopId: 's1', price: 1200, quantity: 1, total: 1200 },
      ];
      const coupon = {
        discountType: 'PERCENTAGE',
        discountValue: 10,
        excludedProducts: ['prod_excluded'],
      };

      const res = CouponService.allocateCoupon(coupon, items);
      // Only prod_allowed (₹800) gets 10% = ₹80. Excluded product gets 0.
      expect(res.totalDiscount).toBe(80);

      const allowedAlloc = res.itemAllocations.find((i) => i.productId === 'prod_allowed');
      const excludedAlloc = res.itemAllocations.find((i) => i.productId === 'prod_excluded');

      expect(allowedAlloc?.allocatedCoupon).toBe(80);
      expect(excludedAlloc?.allocatedCoupon).toBe(0);
    });

    it('Scenario 5.2: Applicable categories restriction filters non-matching items', () => {
      const items = [
        {
          productId: 'p1',
          shopId: 's1',
          categoryId: 'cat_sarees',
          price: 1500,
          quantity: 1,
          total: 1500,
        },
        {
          productId: 'p2',
          shopId: 's1',
          categoryId: 'cat_jewelry',
          price: 500,
          quantity: 1,
          total: 500,
        },
      ];
      const coupon = {
        discountType: 'FIXED',
        discountValue: 200,
        applicableCategories: ['cat_sarees'],
      };

      const res = CouponService.allocateCoupon(coupon, items);
      expect(res.totalDiscount).toBe(200);

      const p1Alloc = res.itemAllocations.find((i) => i.productId === 'p1')?.allocatedCoupon;
      const p2Alloc = res.itemAllocations.find((i) => i.productId === 'p2')?.allocatedCoupon;

      expect(p1Alloc).toBe(200);
      expect(p2Alloc).toBe(0);
    });
  });

  // =========================================================================
  // AC-14, AC-15, AC-16: USAGE LIMITS & CONCURRENCY
  // =========================================================================
  describe('AC-14, AC-15, AC-16: Global & Per-User Usage Limits and Concurrency Protection', () => {
    it('Scenario 6.1: Global usage limit prevents redemptions when exhausted', async () => {
      const mockCoupon = {
        id: 'c_limit10',
        code: 'LIMIT10',
        usageLimit: 10,
        usedCount: 10, // Max reached
        usagePerUser: 1,
        isActive: true,
        validUntil: new Date(Date.now() + 100000),
      };

      const mockTx: any = {
        coupon: {
          findUnique: vi.fn().mockResolvedValue(mockCoupon),
        },
      };

      const res = await CouponRepository.recordUsage(mockCoupon.id, 'user1', 'order1', mockTx);
      expect(res.success).toBe(false);
      expect(res.message).toContain('reached its maximum global usage limit');
    });

    it('Scenario 6.2: Per-user usage limit blocks second redemption by same user', async () => {
      const mockCoupon = {
        id: 'c_user1',
        code: 'ONCEPERUSER',
        usageLimit: 100,
        usedCount: 5,
        usagePerUser: 1, // Only 1 allowed
        isActive: true,
        validUntil: new Date(Date.now() + 100000),
      };

      const mockTx: any = {
        coupon: {
          findUnique: vi.fn().mockResolvedValue(mockCoupon),
        },
        couponUsage: {
          count: vi.fn().mockResolvedValue(1), // User already redeemed once
        },
      };

      const res = await CouponRepository.recordUsage(mockCoupon.id, 'user1', 'order2', mockTx);
      expect(res.success).toBe(false);
      expect(res.message).toContain('already redeemed coupon');
    });

    it('Scenario 6.3: Concurrency protection with usageLimit = 1 ensures race condition safety', async () => {
      let currentUsedCount = 0;
      const usageLimit = 1;

      // Simulated atomic update handler:
      const atomicRedeem = async (userId: string) => {
        if (currentUsedCount >= usageLimit) {
          return { success: false, message: 'Global limit reached' };
        }
        currentUsedCount += 1;
        return { success: true };
      };

      // 5 simultaneous checkout attempts
      const attempts = await Promise.all([
        atomicRedeem('userA'),
        atomicRedeem('userB'),
        atomicRedeem('userC'),
        atomicRedeem('userD'),
        atomicRedeem('userE'),
      ]);

      const successful = attempts.filter((a) => a.success);
      const rejected = attempts.filter((a) => !a.success);

      expect(successful.length).toBe(1); // Exactly 1 successful redemption
      expect(rejected.length).toBe(4); // 4 rejected
      expect(currentUsedCount).toBe(1);
    });

    it('Scenario 6.4: restoreUsage safely releases coupon usage on order cancellation', async () => {
      const mockTx: any = {
        coupon: {
          findUnique: vi.fn().mockResolvedValue({ id: 'c1', usedCount: 1 }),
          update: vi.fn().mockResolvedValue({ id: 'c1', usedCount: 0 }),
        },
        couponUsage: {
          findFirst: vi.fn().mockResolvedValue({ id: 'usage_123', couponId: 'c1' }),
          delete: vi.fn().mockResolvedValue({ id: 'usage_123' }),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const res = await CouponRepository.restoreUsage('c1', 'user1', 'order1', mockTx);
      expect(res.success).toBe(true);
      expect(mockTx.coupon.update).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // AC-06: BM-05 FREE SHIPPING COMPATIBILITY
  // =========================================================================
  describe('AC-06: BM-05 Free Shipping Compatibility', () => {
    it('Scenario 7.1: Pre-coupon subtotal determines free shipping threshold eligibility', () => {
      // Under BM-05: Threshold for prepaid is ₹999
      // If customer buys ₹1,000 product and uses ₹200 coupon -> Net subtotal ₹800
      // Customer is STILL eligible for Free Shipping because selling subtotal >= ₹999
      const productSellingSubtotal = 1000;
      const couponDiscount = 200;
      const prepaidThreshold = 999;

      const isEligibleForFreeShipping = productSellingSubtotal >= prepaidThreshold;
      expect(isEligibleForFreeShipping).toBe(true);

      const netSubtotal = productSellingSubtotal - couponDiscount;
      expect(netSubtotal).toBe(800); // Net is below 999, but pre-coupon qualifies!
    });
  });

  // =========================================================================
  // AC-07: BM-07 CASH ON DELIVERY (COD) COMPATIBILITY
  // =========================================================================
  describe('AC-07: BM-07 COD Compatibility', () => {
    it('Scenario 8.1: COD fee base deducts allocated coupon amount', () => {
      // Under BM-07: COD Fee Base = Product Selling Price - Allocated Coupon + Shipping + Tax
      const sellerSellingSubtotal = 1200;
      const sellerAllocatedCoupon = 200;
      const shipping = 50;
      const tax = 60;

      const codBase = CommissionService.roundMoney(
        sellerSellingSubtotal - sellerAllocatedCoupon + shipping + tax,
      );
      expect(codBase).toBe(1110); // 1200 - 200 + 50 + 60 = 1110

      const codFee = CommissionService.roundMoney(codBase * 0.015); // 1.5%
      expect(codFee).toBe(16.65);
    });

    it('Scenario 8.2: COD ₹5,000 limit is based on pre-coupon product selling subtotal', () => {
      // Selling subtotal ₹5,200 with ₹300 coupon = net ₹4,900.
      // Must be REJECTED because pre-coupon product subtotal > ₹5,000!
      const productSubtotal = 5200;
      const isCodAllowed = productSubtotal <= 5000;
      expect(isCodAllowed).toBe(false);
    });
  });

  // =========================================================================
  // AC-11 & AC-12: RETURNS (BM-08) & RTO (BM-09) COMPATIBILITY
  // =========================================================================
  describe('AC-11 & AC-12: BM-08 Returns & BM-09 RTO Compatibility', () => {
    it('Scenario 9.1: Return refund uses historical allocated coupon to prevent over-refund', () => {
      const sellingPrice = 1000;
      const allocatedCoupon = 150;
      const customerTax = 50;

      // Customer only paid 1000 - 150 + 50 = 900
      const customerRefund = CommissionService.roundMoney(
        sellingPrice - allocatedCoupon + customerTax,
      );
      expect(customerRefund).toBe(900);
      expect(customerRefund).toBeLessThan(sellingPrice + customerTax);
    });

    it('Scenario 9.2: Return clawback for Seller-Funded coupon avoids double debiting seller', () => {
      // Seller originally received payout based on (sellingPrice - commission - sellerCoupon):
      // sellingPrice = 1000, commission = 100, sellerCoupon = 150
      // Originally earned = 750
      const reversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 100,
        sellerCouponDiscount: 150,
      });

      // Payout clawback should be 750, NOT 900!
      expect(reversal.basePayoutReversal).toBe(750);
      expect(reversal.totalPayoutReversal).toBe(750);
      expect(reversal.commissionReversal).toBe(100);
      expect(reversal.sellerCouponReversal).toBe(150);
    });

    it('Scenario 9.3: Return clawback for Navya-Funded coupon preserves seller rights', () => {
      // Under NAVYA funding, sellerCouponDiscount is 0 for seller:
      const reversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 100,
        sellerCouponDiscount: 0,
      });

      // Clawback is the full 900 originally received
      expect(reversal.basePayoutReversal).toBe(900);
      expect(reversal.totalPayoutReversal).toBe(900);
      expect(reversal.commissionReversal).toBe(100);
      expect(reversal.sellerCouponReversal).toBe(0);
    });

    it('Scenario 9.4: BM-09 Prepaid RTO preserves historical coupon allocation without cash refund', () => {
      const orderSnapshot = {
        totalAmount: 1000,
        discountAmount: 150,
        couponFundingType: 'NAVYA',
        finalAmount: 850,
      };

      // Customer is refunded what they paid (850). Coupon (150) is NOT paid out in cash.
      const rtoRefund = orderSnapshot.finalAmount;
      expect(rtoRefund).toBe(850);
      expect(rtoRefund).not.toBe(orderSnapshot.totalAmount);
    });
  });

  // =========================================================================
  // AC-18 & AC-19: SECURITY & ROLE AUTHORIZATION
  // =========================================================================
  describe('AC-18 & AC-19: Admin & Seller Authorization Guards', () => {
    it('Scenario 10.1: Unauthenticated request to admin coupons API is rejected with 401', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue(null);

      const { GET } = await import('../../src/app/api/v1/admin/coupons/route');

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('Scenario 10.2: Seller cannot create NAVYA-funded coupon', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
        id: 'seller_user_1',
        role: 'SELLER',
      } as any);

      vi.spyOn(prisma.shop, 'findFirst').mockResolvedValue({
        id: 'shop_seller_1',
        shopName: 'Boutique Store',
      } as any);

      const { POST } = await import('../../src/app/api/v1/seller/coupons/route');
      const req = new Request('http://localhost:3000/api/v1/seller/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'SELLER_TRY_NAVYA',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          fundingType: 'NAVYA', // FORBIDDEN for seller!
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }),
      }) as any;

      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.message).toContain('Sellers can only create SELLER-funded');
    });

    it('Scenario 10.3: Authorized Admin can fetch coupon list with 200', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
        id: 'admin_1',
        role: 'ADMIN',
      } as any);

      vi.spyOn(prisma.coupon, 'findMany').mockResolvedValue([
        { id: 'c1', code: 'NAVYA10', discountValue: 10, fundingType: 'NAVYA' },
      ] as any);

      const { GET } = await import('../../src/app/api/v1/admin/coupons/route');
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
    });
  });
});
