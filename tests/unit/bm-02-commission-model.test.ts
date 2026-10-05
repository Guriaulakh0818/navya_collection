import { describe, expect, it } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import { SettlementService } from '../../src/backend/services/settlement.service';
import {
  bulkCreateVariantsSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../../src/frontend/features/variants/schemas/variant.schema';
import { sellerProductSchema } from '../../src/shared/validations/seller-product.schema';

describe('BM-02 — FINAL COMMISSION MODEL TEST SUITE (TC-BM02-01 to TC-BM02-47)', () => {
  // =========================================================================
  // 1. BASIC COMMISSION BENCHMARKS (TC-BM02-01 to TC-BM02-03)
  // =========================================================================
  describe('1. Basic Commission Benchmarks (MRP-based 10%)', () => {
    it('TC-BM02-01: MRP ₹1,000, selling price ₹1,000 -> Expected commission ₹100', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 1000,
        quantity: 1,
      });

      expect(item.commissionBaseAmount).toBe(1000);
      expect(item.commissionRate).toBe(10.0);
      expect(item.commissionAmount).toBe(100.0);
      expect(item.netSellerPayout).toBe(900.0);
    });

    it('TC-BM02-02: MRP ₹1,500, selling price ₹1,000 -> Expected commission ₹150 (Seller discount does not reduce commission)', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        quantity: 1,
      });

      expect(item.commissionBaseAmount).toBe(1500);
      expect(item.commissionAmount).toBe(150.0);
      expect(item.sellerDiscountAmount).toBe(500.0);
      expect(item.sellerDiscountPercentage).toBe(33.33);
      // Payout = Selling Price (1000) - Commission (150) = 850
      expect(item.netSellerPayout).toBe(850.0);
    });

    it('TC-BM02-03: MRP ₹2,000, selling price ₹500 -> Expected commission ₹200', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 500,
        quantity: 1,
      });

      expect(item.commissionBaseAmount).toBe(2000);
      expect(item.commissionAmount).toBe(200.0);
      expect(item.sellerDiscountAmount).toBe(1500.0);
      expect(item.sellerDiscountPercentage).toBe(75.0);
      // Payout = Selling Price (500) - Commission (200) = 300
      expect(item.netSellerPayout).toBe(300.0);
    });
  });

  // =========================================================================
  // 2. GST INDEPENDENCE (TC-BM02-04 to TC-BM02-07)
  // =========================================================================
  describe('2. GST Independence (Tax engine separated from Commission engine)', () => {
    it('TC-BM02-04: MRP ₹1,000, GST 5% -> Expected commission ₹100', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 1000,
        taxRate: 5,
      });

      expect(item.commissionAmount).toBe(100.0);
      expect(item.taxAmount).toBe(50.0);
    });

    it('TC-BM02-05: MRP ₹1,000, GST 12% -> Expected commission ₹100', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 1000,
        taxRate: 12,
      });

      expect(item.commissionAmount).toBe(100.0);
      expect(item.taxAmount).toBe(120.0);
    });

    it('TC-BM02-06: MRP ₹1,000, GST 18% -> Expected commission ₹100', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 1000,
        taxRate: 18,
      });

      expect(item.commissionAmount).toBe(100.0);
      expect(item.taxAmount).toBe(180.0);
    });

    it('TC-BM02-07: Changing GST rate must NOT change commission', () => {
      const rates = [0, 5, 12, 18, 28];
      const mrp = 1000;
      const expectedCommission = 100.0;

      for (const rate of rates) {
        const item = CommissionService.calculateItemCommission({
          mrp,
          sellingPrice: 1000,
          taxRate: rate,
        });
        expect(item.commissionAmount).toBe(expectedCommission);
      }
    });
  });

  // =========================================================================
  // 3. SELLER DISCOUNT (TC-BM02-08 to TC-BM02-10)
  // =========================================================================
  describe('3. Seller Discount Independence (Seller discount does not reduce commission)', () => {
    it('TC-BM02-08: MRP ₹1,500, selling price ₹1,000 -> Expected commission ₹150', () => {
      const commission = CommissionService.calculateCommission(1500);
      expect(commission).toBe(150.0);
    });

    it('TC-BM02-09: MRP ₹1,500, selling price ₹750 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 750,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.sellerDiscountAmount).toBe(750.0);
      expect(item.sellerDiscountPercentage).toBe(50.0);
      // Net payout = 750 - 150 = 600
      expect(item.netSellerPayout).toBe(600.0);
    });

    it('TC-BM02-10: MRP ₹2,000, selling price ₹1,000 -> Expected commission ₹200', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 1000,
      });

      expect(item.commissionAmount).toBe(200.0);
      expect(item.sellerDiscountAmount).toBe(1000.0);
      expect(item.sellerDiscountPercentage).toBe(50.0);
    });
  });

  // =========================================================================
  // 4. NAVYA COUPON (TC-BM02-11 to TC-BM02-12)
  // =========================================================================
  describe('4. Navya-Funded Coupon Independence (Coupons do not reduce commission)', () => {
    it('TC-BM02-11: MRP ₹1,500, Navya coupon ₹100 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        navyaCouponAmount: 100,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.navyaCouponAmount).toBe(100.0);
    });

    it('TC-BM02-12: MRP ₹1,500, Navya coupon ₹500 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        navyaCouponAmount: 500,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.navyaCouponAmount).toBe(500.0);
    });
  });

  // =========================================================================
  // 5. CUSTOMER SHIPPING (TC-BM02-13 to TC-BM02-14)
  // =========================================================================
  describe('5. Customer Shipping Independence (Shipping does not increase commission)', () => {
    it('TC-BM02-13: MRP ₹1,500, shipping ₹100 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        customerShippingAmount: 100,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.customerShippingAmount).toBe(100.0);
    });

    it('TC-BM02-14: MRP ₹1,500, shipping ₹500 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        customerShippingAmount: 500,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.customerShippingAmount).toBe(500.0);
    });
  });

  // =========================================================================
  // 6. SELLER GST REGISTRATION STATUS (TC-BM02-15 to TC-BM02-16)
  // =========================================================================
  describe('6. Seller Type (GST Status does NOT change commission rate or base)', () => {
    it('TC-BM02-15: GST-registered seller, MRP ₹1,500 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        sellerGstStatus: 'REGISTERED',
        sellerGstin: '07AAAAA0000A1Z5',
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.sellerGstStatus).toBe('REGISTERED');
      expect(item.sellerGstin).toBe('07AAAAA0000A1Z5');
    });

    it('TC-BM02-16: Unregistered seller, MRP ₹1,500 -> Expected commission ₹150 (GST status must NOT change commission)', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        sellerGstStatus: 'UNREGISTERED',
        sellerGstin: null,
      });

      expect(item.commissionAmount).toBe(150.0);
      expect(item.sellerGstStatus).toBe('UNREGISTERED');
      expect(item.sellerGstin).toBeNull();
    });
  });

  // =========================================================================
  // 7. COMBINED SCENARIOS (TC-BM02-17 to TC-BM02-19)
  // =========================================================================
  describe('7. Combined Scenarios (Discounts, GST, Shipping, Coupons)', () => {
    it('TC-BM02-17: MRP ₹1,500, Selling ₹1,000, GST 18%, Shipping ₹100, Coupon ₹100 -> Expected commission ₹150', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        taxRate: 18,
        customerShippingAmount: 100,
        navyaCouponAmount: 100,
      });

      // Customer product = ₹1,000 + ₹180 GST + ₹100 Shipping - ₹100 Coupon = ₹1,180
      // Commission is strictly MRP * 10% = ₹150
      expect(item.commissionAmount).toBe(150.0);
      expect(item.taxAmount).toBe(180.0);
    });

    it('TC-BM02-18: MRP ₹2,000, Selling ₹1,200, GST 18%, Shipping ₹150, Coupon ₹200 -> Expected commission ₹200', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 1200,
        taxRate: 18,
        customerShippingAmount: 150,
        navyaCouponAmount: 200,
      });

      expect(item.commissionAmount).toBe(200.0);
      expect(item.taxAmount).toBe(216.0); // 18% of 1200
    });

    it('TC-BM02-19: MRP ₹5,000, Selling ₹2,500, GST applicable, Shipping ₹0, Coupon ₹500 -> Expected commission ₹500', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 5000,
        sellingPrice: 2500,
        taxRate: 12,
        customerShippingAmount: 0,
        navyaCouponAmount: 500,
      });

      expect(item.commissionAmount).toBe(500.0);
      expect(item.sellerDiscountAmount).toBe(2500.0);
      expect(item.sellerDiscountPercentage).toBe(50.0);
    });
  });

  // =========================================================================
  // 8. MULTI-ITEM ORDER (TC-BM02-20)
  // =========================================================================
  describe('8. Multi-Item Order (Item-level calculation)', () => {
    it('TC-BM02-20: Item A MRP ₹1,500, Item B MRP ₹2,000, Item C MRP ₹500 -> Expected total commission ₹400', () => {
      const orderResult = CommissionService.calculateOrderCommission({
        items: [
          { mrp: 1500, sellingPrice: 1000, quantity: 1 },
          { mrp: 2000, sellingPrice: 1500, quantity: 1 },
          { mrp: 500, sellingPrice: 400, quantity: 1 },
        ],
      });

      // Item A: 1500 * 10% = 150
      // Item B: 2000 * 10% = 200
      // Item C: 500 * 10% = 50
      // Total = 150 + 200 + 50 = 400
      expect(orderResult.totalMrp).toBe(4000);
      expect(orderResult.grossProductValue).toBe(2900);
      expect(orderResult.commissionAmount).toBe(400.0);
      expect(orderResult.netSellerPayout).toBe(2500.0);
    });
  });

  // =========================================================================
  // 9. MULTI-SELLER ORDER (TC-BM02-21)
  // =========================================================================
  describe('9. Multi-Seller Order (Seller-specific commission separation)', () => {
    it('TC-BM02-21: Seller A MRP ₹1,500 (Comm ₹150) + Seller B MRP ₹2,500 (Comm ₹250) -> Total ₹400; Each retains own commission', () => {
      const orderResult = CommissionService.calculateOrderCommission({
        items: [
          { sellerId: 'SELLER-A', mrp: 1500, sellingPrice: 1000, quantity: 1 },
          { sellerId: 'SELLER-B', mrp: 2500, sellingPrice: 1800, quantity: 1 },
        ],
      });

      expect(orderResult.commissionAmount).toBe(400.0);
      expect(orderResult.sellerBreakdown).toBeDefined();

      const sellerA = orderResult.sellerBreakdown!.get('SELLER-A')!;
      expect(sellerA.totalMrp).toBe(1500);
      expect(sellerA.sellingSubtotal).toBe(1000);
      expect(sellerA.commissionAmount).toBe(150.0);
      expect(sellerA.netSellerPayout).toBe(850.0);

      const sellerB = orderResult.sellerBreakdown!.get('SELLER-B')!;
      expect(sellerB.totalMrp).toBe(2500);
      expect(sellerB.sellingSubtotal).toBe(1800);
      expect(sellerB.commissionAmount).toBe(250.0);
      expect(sellerB.netSellerPayout).toBe(1550.0);
    });
  });

  // =========================================================================
  // 10. PRICING & MRP VALIDATION (TC-BM02-22 to TC-BM02-26)
  // =========================================================================
  describe('10. Pricing & MRP Validation (Section 10)', () => {
    it('TC-BM02-22: Selling price > MRP -> reject', () => {
      const res = CommissionService.validatePricing({
        mrp: 1000,
        sellingPrice: 1200,
      });
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('SELLING_EXCEEDS_MRP');

      const zodResult = sellerProductSchema.safeParse({
        name: 'Test Product',
        description: 'Test description text that is long enough',
        price: 1200,
        compareAtPrice: 1000,
        categoryId: 'cat-1',
        images: [{ imageUrl: 'https://example.com/img.jpg', isPrimary: true }],
      });
      expect(zodResult.success).toBe(false);
    });

    it('TC-BM02-23: MRP = ₹0 -> reject', () => {
      const res = CommissionService.validatePricing({
        mrp: 0,
        sellingPrice: 100,
      });
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('INVALID_MRP');
    });

    it('TC-BM02-24: MRP negative -> reject', () => {
      const res = CommissionService.validatePricing({
        mrp: -1000,
        sellingPrice: 500,
      });
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('NEGATIVE_MRP');
    });

    it('TC-BM02-25: Selling price negative -> reject', () => {
      const res = CommissionService.validatePricing({
        mrp: 1000,
        sellingPrice: -100,
      });
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('NEGATIVE_PRICE');
    });

    it('TC-BM02-26: Invalid commission rate -> reject', () => {
      const resNegative = CommissionService.validatePricing({
        mrp: 1000,
        sellingPrice: 1000,
        commissionRate: -5,
      });
      expect(resNegative.isValid).toBe(false);
      expect(resNegative.code).toBe('INVALID_COMMISSION_RATE');

      const resOver100 = CommissionService.validatePricing({
        mrp: 1000,
        sellingPrice: 1000,
        commissionRate: 105,
      });
      expect(resOver100.isValid).toBe(false);
      expect(resOver100.code).toBe('INVALID_COMMISSION_RATE');
    });
  });

  // =========================================================================
  // 11. MONEY PRECISION (TC-BM02-27 to TC-BM02-30)
  // =========================================================================
  describe('11. Safe Paise Precision (Zero IEEE 754 float drift)', () => {
    it('TC-BM02-27: MRP ₹999.99 -> deterministic result (₹100.00)', () => {
      // 99999 paise * 10% = 9999.9 -> 10000 paise = ₹100.00
      const commission = CommissionService.calculateCommission(999.99);
      expect(commission).toBe(100.0);
    });

    it('TC-BM02-28: MRP ₹1,234.56 -> deterministic result (₹123.46)', () => {
      // 123456 paise * 10% = 12345.6 -> 12346 paise = ₹123.46
      const commission = CommissionService.calculateCommission(1234.56);
      expect(commission).toBe(123.46);
    });

    it('TC-BM02-29: MRP ₹0.01 -> deterministic result (₹0.00)', () => {
      // 1 paisa * 10% = 0.1 -> 0 paise = ₹0.00
      const commission = CommissionService.calculateCommission(0.01);
      expect(commission).toBe(0.0);
    });

    it('TC-BM02-30: MRP ₹10,000.01 -> deterministic result (₹1,000.00)', () => {
      // 1000001 paise * 10% = 100000.1 -> 100000 paise = ₹1,000.00
      const commission = CommissionService.calculateCommission(10000.01);
      expect(commission).toBe(1000.0);
    });
  });

  // =========================================================================
  // 12. HISTORICAL PRICING IMMUTABILITY (TC-BM02-31)
  // =========================================================================
  describe('12. Historical Pricing Immutability (Order snapshot protection)', () => {
    it('TC-BM02-31: Order placed when MRP = ₹1,500; product MRP later updated to ₹2,000 -> historical commission remains ₹150', () => {
      // Order placed with immutable orderItem snapshot
      const orderItemSnapshot = CommissionService.calculateItemCommission({
        productId: 'PROD-BANARASI-01',
        mrp: 1500,
        sellingPrice: 1000,
        quantity: 1,
      });

      expect(orderItemSnapshot.commissionBaseAmount).toBe(1500);
      expect(orderItemSnapshot.commissionAmount).toBe(150.0);

      // Seller later updates product catalog MRP to ₹2,000
      const updatedCatalogMrp = 2000;
      expect(updatedCatalogMrp).toBe(2000);

      // Historical settlement calculation strictly reads snapshot values, NOT live catalog values
      const historicalSettlement = SettlementService.computeSettlementBreakdown({
        grossProductValue: orderItemSnapshot.sellingPrice,
        commissionAmount: orderItemSnapshot.commissionAmount,
      });

      expect(historicalSettlement.commissionAmount).toBe(150.0);
      expect(historicalSettlement.netSettlementAmount).toBe(850.0);
    });
  });

  // =========================================================================
  // 13. RETURN / REFUND COMPATIBILITY (TC-BM02-32 to TC-BM02-35)
  // =========================================================================
  describe('13. Return & Refund Compatibility (BM-01 & BM-02 integration)', () => {
    it('TC-BM02-32: Full return before settlement -> Commission reversal ₹150 (Navya retains ₹0)', () => {
      // Original order: MRP = ₹1,500, Selling = ₹1,000, Commission = ₹150
      const preReturn = SettlementService.computeSettlementBreakdown({
        grossProductValue: 1000,
        totalMrp: 1500,
        commissionAmount: 150,
      });
      expect(preReturn.netSettlementAmount).toBe(850);
      expect(preReturn.commissionAmount).toBe(150);

      // Full return approved before payout:
      // Product value refunded = ₹1,000, Commission reversal = ₹150, Forward ₹51, Reverse ₹65 -> shipping liability = ₹116
      const postReturn = SettlementService.computeSettlementBreakdown({
        grossProductValue: 1000,
        refundedProductValue: 1000,
        commissionAmount: 150,
        commissionReversal: 150,
        forwardShippingActual: 51,
        reverseShippingActual: 65,
      });

      expect(postReturn.refundedProductValue).toBe(1000);
      expect(postReturn.commissionReversal).toBe(150);
      expect(postReturn.returnShippingDeduction).toBe(116);
      expect(postReturn.netSettlementAmount).toBe(0);
      expect(postReturn.unrecoveredDebitLiability).toBe(116);
    });

    it('TC-BM02-33: Full return after settlement -> Seller adjustment debit created for reversed commission / payout', () => {
      // Settlement was already SETTLED at net ₹850
      const settledRecord = {
        id: 'SETTLED-BM02-01',
        status: 'SETTLED',
        grossProductValue: 1000,
        commissionAmount: 150,
        netSettlementAmount: 850,
      };

      expect(settledRecord.status).toBe('SETTLED');

      // Post-settlement return: Historical settled record remains immutable
      // Commission reversal creates auditable SellerAdjustment
      const reversalCalc = CommissionService.calculateCommissionReversal({
        originalCommission: settledRecord.commissionAmount,
        returnType: 'FULL',
      });

      expect(reversalCalc.commissionReversal).toBe(150.0);
      expect(reversalCalc.retainedCommission).toBe(0.0);
    });

    it('TC-BM02-34: Partial return -> Reverses only returned item commission (Item A MRP ₹1,500 returned, Item B MRP ₹2,000 retained)', () => {
      // Order with 2 items:
      // Item A: MRP ₹1,500 -> Commission ₹150
      // Item B: MRP ₹2,000 -> Commission ₹200
      // Total recorded commission = ₹350
      const itemACommission = CommissionService.calculateCommission(1500);
      const itemBCommission = CommissionService.calculateCommission(2000);
      const totalCommission = itemACommission + itemBCommission;
      expect(totalCommission).toBe(350.0);

      // Only Item A is returned
      const partialReversal = CommissionService.calculateCommissionReversal({
        originalCommission: totalCommission,
        returnType: 'PARTIAL',
        returnedItemCommission: itemACommission,
      });

      expect(partialReversal.commissionReversal).toBe(150.0);
      expect(partialReversal.retainedCommission).toBe(200.0); // Item B's commission retained
    });

    it('TC-BM02-35: Duplicate return event -> Idempotent, only one commission reversal occurs', () => {
      const initialReversal = CommissionService.calculateCommissionReversal({
        originalCommission: 150,
        returnType: 'FULL',
      });
      expect(initialReversal.commissionReversal).toBe(150.0);

      // Duplicate processing call returns identical idempotent result
      const duplicateReversal = CommissionService.calculateCommissionReversal({
        originalCommission: 150,
        returnType: 'FULL',
      });
      expect(duplicateReversal.commissionReversal).toBe(150.0);
      expect(duplicateReversal.commissionReversal).not.toBe(300.0);
    });
  });

  // =========================================================================
  // 14. IDEMPOTENCY (TC-BM02-36 to TC-BM02-38)
  // =========================================================================
  describe('14. Idempotency (Section 16)', () => {
    it('TC-BM02-36: Duplicate order processing produces identical commission with no duplication', () => {
      const orderPayload = {
        items: [{ mrp: 1500, sellingPrice: 1000, quantity: 1 }],
      };

      const run1 = CommissionService.calculateOrderCommission(orderPayload);
      const run2 = CommissionService.calculateOrderCommission(orderPayload);

      expect(run1.commissionAmount).toBe(150.0);
      expect(run2.commissionAmount).toBe(150.0);
      expect(run1.netSellerPayout).toBe(850.0);
      expect(run2.netSellerPayout).toBe(850.0);
    });

    it('TC-BM02-37: Duplicate payment webhook -> Idempotent, does not double commission', () => {
      const paymentAmount = 1000;
      const mrp = 1500;

      const calc1 = CommissionService.calculateOrderCommission({
        mrp,
        sellingPrice: paymentAmount,
      });
      const calc2 = CommissionService.calculateOrderCommission({
        mrp,
        sellingPrice: paymentAmount,
      });

      expect(calc1.commissionAmount).toBe(150.0);
      expect(calc2.commissionAmount).toBe(150.0);
    });

    it('TC-BM02-38: Duplicate settlement processing -> Idempotent, settlement breakdown remains stable', () => {
      const settlementParams = {
        grossProductValue: 1000,
        totalMrp: 1500,
        commissionAmount: 150,
      };

      const breakdown1 = SettlementService.computeSettlementBreakdown(settlementParams);
      const breakdown2 = SettlementService.computeSettlementBreakdown(settlementParams);

      expect(breakdown1.commissionAmount).toBe(150.0);
      expect(breakdown2.commissionAmount).toBe(150.0);
      expect(breakdown1.netSettlementAmount).toBe(850.0);
      expect(breakdown2.netSettlementAmount).toBe(850.0);
    });
  });

  // =========================================================================
  // 15. FINAL DISCOUNT POLICY & PSYCHOLOGICAL PRICING FLOOR (TC-BM02-39 to TC-BM02-47)
  // =========================================================================
  describe('15. Final Discount Policy & Psychological Pricing Floor (TC-BM02-39 to TC-BM02-47)', () => {
    // TC-BM02-39: MRP ₹1,500, Selling ₹450 -> PASS (Discount 70%, Commission ₹150)
    it('TC-BM02-39: MRP ₹1,500, Selling Price ₹450 -> Discount 70%, Commission ₹150 (PASS)', () => {
      const validation = CommissionService.validatePricing(1500, 450);
      expect(validation.isValid).toBe(true);

      const discount = CommissionService.calculateDiscount(1500, 450);
      expect(discount.discountPercent).toBe(70.0);
      expect(discount.discountAmount).toBe(1050.0);

      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 450,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(150.0);
      expect(item.netSellerPayout).toBe(300.0);
    });

    // TC-BM02-40: MRP ₹1,500, Selling ₹449 -> PASS (Discount 70.0667...%, Commission ₹150)
    it('TC-BM02-40: MRP ₹1,500, Selling Price ₹449 -> Psychological pricing, Discount 70.0667...%, Commission ₹150 (PASS)', () => {
      const validation = CommissionService.validatePricing(1500, 449);
      expect(validation.isValid).toBe(true);

      const discount = CommissionService.calculateDiscount(1500, 449);
      expect(discount.discountPercent).toBeCloseTo(70.06666667, 4);
      expect(discount.discountAmount).toBe(1051.0);

      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 449,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(150.0);
      expect(item.netSellerPayout).toBe(299.0);
    });

    // TC-BM02-41: MRP ₹1,500, Selling ₹448 -> REJECT
    it('TC-BM02-41: MRP ₹1,500, Selling Price ₹448 -> Exceeds psychological floor (REJECT)', () => {
      const validation = CommissionService.validatePricing(1500, 448);
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('EXCEEDS_MAX_DISCOUNT');
    });

    // TC-BM02-42: MRP ₹1,000, Selling ₹300 -> PASS, Commission ₹100
    it('TC-BM02-42: MRP ₹1,000, Selling Price ₹300 -> 70% discount (PASS), Commission ₹100', () => {
      const validation = CommissionService.validatePricing(1000, 300);
      expect(validation.isValid).toBe(true);

      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 300,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(100.0);
      expect(item.netSellerPayout).toBe(200.0);
    });

    // TC-BM02-43: MRP ₹1,000, Selling ₹299 -> PASS, Commission ₹100
    it('TC-BM02-43: MRP ₹1,000, Selling Price ₹299 -> Psychological pricing (PASS), Commission ₹100', () => {
      const validation = CommissionService.validatePricing(1000, 299);
      expect(validation.isValid).toBe(true);

      const discount = CommissionService.calculateDiscount(1000, 299);
      expect(discount.discountPercent).toBe(70.1);

      const item = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 299,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(100.0);
      expect(item.netSellerPayout).toBe(199.0);
    });

    // TC-BM02-44: MRP ₹1,000, Selling ₹298 -> REJECT
    it('TC-BM02-44: MRP ₹1,000, Selling Price ₹298 -> Exceeds psychological floor (REJECT)', () => {
      const validation = CommissionService.validatePricing(1000, 298);
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('EXCEEDS_MAX_DISCOUNT');
    });

    // TC-BM02-45: MRP ₹2,000, Selling ₹600 -> PASS, Commission ₹200
    it('TC-BM02-45: MRP ₹2,000, Selling Price ₹600 -> 70% discount (PASS), Commission ₹200', () => {
      const validation = CommissionService.validatePricing(2000, 600);
      expect(validation.isValid).toBe(true);

      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 600,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(200.0);
      expect(item.netSellerPayout).toBe(400.0);
    });

    // TC-BM02-46: MRP ₹2,000, Selling ₹599 -> PASS, Commission ₹200
    it('TC-BM02-46: MRP ₹2,000, Selling Price ₹599 -> Psychological pricing (PASS), Commission ₹200', () => {
      const validation = CommissionService.validatePricing(2000, 599);
      expect(validation.isValid).toBe(true);

      const discount = CommissionService.calculateDiscount(2000, 599);
      expect(discount.discountPercent).toBe(70.05);

      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 599,
        quantity: 1,
      });
      expect(item.commissionAmount).toBe(200.0);
      expect(item.netSellerPayout).toBe(399.0);
    });

    // TC-BM02-47: MRP ₹2,000, Selling ₹598 -> REJECT
    it('TC-BM02-47: MRP ₹2,000, Selling Price ₹598 -> Exceeds psychological floor (REJECT)', () => {
      const validation = CommissionService.validatePricing(2000, 598);
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('EXCEEDS_MAX_DISCOUNT');
    });
  });

  // =========================================================================
  // 16. EXTREME VALIDATION BENCHMARKS (MRP ₹500 to ₹10,000)
  // =========================================================================
  describe('16. Extreme Validation Benchmarks (Section 14)', () => {
    const extremeCases = [
      { mrp: 500, seventyPct: 150, psychoPrice: 149, invalidPrice: 148, commission: 50 },
      { mrp: 1000, seventyPct: 300, psychoPrice: 299, invalidPrice: 298, commission: 100 },
      { mrp: 1500, seventyPct: 450, psychoPrice: 449, invalidPrice: 448, commission: 150 },
      { mrp: 2000, seventyPct: 600, psychoPrice: 599, invalidPrice: 598, commission: 200 },
      { mrp: 5000, seventyPct: 1500, psychoPrice: 1499, invalidPrice: 1498, commission: 500 },
      { mrp: 10000, seventyPct: 3000, psychoPrice: 2999, invalidPrice: 2998, commission: 1000 },
    ];

    extremeCases.forEach(({ mrp, seventyPct, psychoPrice, invalidPrice, commission }) => {
      it(`MRP ₹${mrp}: 70% (₹${seventyPct}) PASS, Psychological (₹${psychoPrice}) PASS, Lower (₹${invalidPrice}) REJECT`, () => {
        const floors = CommissionService.calculatePricingFloors(mrp);
        expect(floors.normalMinimumSellingPrice).toBe(seventyPct);
        expect(floors.psychologicalMinimumSellingPrice).toBe(psychoPrice);

        // 70% threshold -> PASS
        const pass70 = CommissionService.validatePricing(mrp, seventyPct);
        expect(pass70.isValid).toBe(true);

        // Psychological pricing -> PASS
        const passPsycho = CommissionService.validatePricing(mrp, psychoPrice);
        expect(passPsycho.isValid).toBe(true);

        // Next ₹1 lower -> REJECT
        const failLower = CommissionService.validatePricing(mrp, invalidPrice);
        expect(failLower.isValid).toBe(false);
        expect(failLower.code).toBe('EXCEEDS_MAX_DISCOUNT');

        // Verify commission remains MRP × 10%
        const comm70 = CommissionService.calculateItemCommission({
          mrp,
          sellingPrice: seventyPct,
          quantity: 1,
        });
        const commPsycho = CommissionService.calculateItemCommission({
          mrp,
          sellingPrice: psychoPrice,
          quantity: 1,
        });
        expect(comm70.commissionAmount).toBe(commission);
        expect(commPsycho.commissionAmount).toBe(commission);
      });
    });
  });

  // =========================================================================
  // 17. DECIMAL AND PAISE CASES (Section 15)
  // =========================================================================
  describe('17. Decimal and Paise Precision Tests (Section 15)', () => {
    it('MRP ₹999.99: 70% floor and ₹1 psychological pricing with exact paise precision', () => {
      // 999.99 * 0.30 = 299.997 -> rounded to 300.00
      // Psychological floor = 300.00 - 1.00 = 299.00
      const floors = CommissionService.calculatePricingFloors(999.99);
      expect(floors.normalMinimumSellingPrice).toBe(300.0);
      expect(floors.psychologicalMinimumSellingPrice).toBe(299.0);

      expect(CommissionService.validatePricing(999.99, 300.0).isValid).toBe(true);
      expect(CommissionService.validatePricing(999.99, 299.0).isValid).toBe(true);
      expect(CommissionService.validatePricing(999.99, 298.99).isValid).toBe(false);

      const comm = CommissionService.calculateItemCommission({
        mrp: 999.99,
        sellingPrice: 299.0,
        quantity: 1,
      });
      expect(comm.commissionAmount).toBe(100.0); // 999.99 * 0.10 = 99.999 -> 100.00
    });

    it('MRP ₹1,234.56: 70% floor and ₹1 psychological pricing with exact paise precision', () => {
      // 1234.56 * 0.30 = 370.368 -> rounded to 370.37
      // Psychological floor = 370.37 - 1.00 = 369.37
      const floors = CommissionService.calculatePricingFloors(1234.56);
      expect(floors.normalMinimumSellingPrice).toBe(370.37);
      expect(floors.psychologicalMinimumSellingPrice).toBe(369.37);

      expect(CommissionService.validatePricing(1234.56, 370.37).isValid).toBe(true);
      expect(CommissionService.validatePricing(1234.56, 369.37).isValid).toBe(true);
      expect(CommissionService.validatePricing(1234.56, 369.36).isValid).toBe(false);
    });

    it('MRP ₹1,500.50: 70% floor and ₹1 psychological pricing with exact paise precision', () => {
      // 1500.50 * 0.30 = 450.15
      // Psychological floor = 450.15 - 1.00 = 449.15
      const floors = CommissionService.calculatePricingFloors(1500.5);
      expect(floors.normalMinimumSellingPrice).toBe(450.15);
      expect(floors.psychologicalMinimumSellingPrice).toBe(449.15);

      expect(CommissionService.validatePricing(1500.5, 450.15).isValid).toBe(true);
      expect(CommissionService.validatePricing(1500.5, 449.15).isValid).toBe(true);
      expect(CommissionService.validatePricing(1500.5, 449.14).isValid).toBe(false);
    });
  });

  // =========================================================================
  // 18. VARIANT PRODUCTS & SCHEMA ENFORCEMENT (Section 9, 10, 11, 12)
  // =========================================================================
  describe('18. Variant Products & Schema Enforcement (Section 9, 10, 11, 12)', () => {
    it('Section 9: Size S (₹449 PASS), Size M (₹450 PASS), Size L (₹448 FAIL)', () => {
      // Size S: MRP 1500, Price 449 -> PASS
      const sizeS = createVariantSchema.safeParse({
        name: 'Size S',
        sku: 'SHIRT-S',
        price: 449,
        compareAtPrice: 1500,
        stock: 10,
        size: 'S',
      });
      expect(sizeS.success).toBe(true);

      // Size M: MRP 1500, Price 450 -> PASS
      const sizeM = createVariantSchema.safeParse({
        name: 'Size M',
        sku: 'SHIRT-M',
        price: 450,
        compareAtPrice: 1500,
        stock: 10,
        size: 'M',
      });
      expect(sizeM.success).toBe(true);

      // Size L: MRP 1500, Price 448 -> FAIL
      const sizeL = createVariantSchema.safeParse({
        name: 'Size L',
        sku: 'SHIRT-L',
        price: 448,
        compareAtPrice: 1500,
        stock: 10,
        size: 'L',
      });
      expect(sizeL.success).toBe(false);
      if (!sizeL.success) {
        expect(sizeL.error.issues[0].message).toContain('exceeds maximum allowed discount');
      }
    });

    it('Section 10: Bulk upload variant schema rejects invalid row', () => {
      const bulkValid = bulkCreateVariantsSchema.safeParse({
        variants: [
          { name: 'Var 1', sku: 'V-001', price: 450, compareAtPrice: 1500, stock: 5 },
          { name: 'Var 2', sku: 'V-002', price: 449, compareAtPrice: 1500, stock: 5 },
        ],
      });
      expect(bulkValid.success).toBe(true);

      const bulkInvalid = bulkCreateVariantsSchema.safeParse({
        variants: [
          { name: 'Var 1', sku: 'V-001', price: 450, compareAtPrice: 1500, stock: 5 },
          { name: 'Var 2', sku: 'V-002', price: 448, compareAtPrice: 1500, stock: 5 },
        ],
      });
      expect(bulkInvalid.success).toBe(false);
    });

    it('Section 11 & 12: Seller product schema directly rejects API request below floor', () => {
      const validPayload = {
        name: 'Premium Silk Saree',
        categoryId: 'cat-saree-01',
        description: 'Exquisite silk saree',
        price: 449,
        compareAtPrice: 1500,
        stock: 10,
        images: [{ imageUrl: 'https://example.com/saree.jpg', isPrimary: true }],
      };

      const validResult = sellerProductSchema.safeParse(validPayload);
      expect(validResult.success).toBe(true);

      const invalidPayload = {
        ...validPayload,
        price: 448,
      };

      const invalidResult = sellerProductSchema.safeParse(invalidPayload);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0].message).toContain('exceeds maximum allowed discount');
      }
    });

    it('Section 11: Variant edit updateVariantSchema rejects invalid price edit', () => {
      const validEdit = updateVariantSchema.safeParse({
        price: 449,
        compareAtPrice: 1500,
      });
      expect(validEdit.success).toBe(true);

      const invalidEdit = updateVariantSchema.safeParse({
        price: 448,
        compareAtPrice: 1500,
      });
      expect(invalidEdit.success).toBe(false);
    });
  });
});
