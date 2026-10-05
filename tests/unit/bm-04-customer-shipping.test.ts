import { describe, expect, it } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import {
  CustomerShippingService,
  type SellerShippingBreakdown,
} from '../../src/backend/services/shipping/customer-shipping.service';

describe('BM-04 — Customer Shipping & RTO Policy Suite', () => {
  // =========================================================================
  // 1. SINGLE SELLER THRESHOLD TESTS (Section 40)
  // =========================================================================
  describe('Single-Seller Shipping Calculation', () => {
    it('₹500 -> paid standard shipping (₹49)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown).toHaveLength(1);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
    });

    it('₹998 -> paid shipping (₹49)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 998, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
    });

    it('₹998.99 -> paid shipping (₹49) [Exact boundary]', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 998.99, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
    });

    it('₹999 -> FREE shipping (₹0) [Exact boundary]', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 999, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
    });

    it('₹1,000 -> FREE shipping (₹0)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1000, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
    });

    it('₹1,500 -> FREE shipping (₹0)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
    });
  });

  // =========================================================================
  // 2. MULTI-SELLER SHIPPING TESTS (Section 40)
  // =========================================================================
  describe('Multi-Seller Shipping Calculation', () => {
    it('Seller A ₹500, Seller B ₹500 -> Both charged shipping (₹49 + ₹49 = ₹98)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 500, quantity: 1, shopId: 'shop-B' },
        ],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(98);
      expect(result.sellerBreakdown).toHaveLength(2);

      const sellerA = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-A',
      );
      const sellerB = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-B',
      );

      expect(sellerA?.shippingCharge).toBe(49);
      expect(sellerA?.freeShipping).toBe(false);
      expect(sellerB?.shippingCharge).toBe(49);
      expect(sellerB?.freeShipping).toBe(false);
    });

    it('Seller A ₹500, Seller B ₹1,000 -> A paid (₹49), B free (₹0) -> Total = ₹49', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 1000, quantity: 1, shopId: 'shop-B' },
        ],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);

      const sellerA = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-A',
      );
      const sellerB = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-B',
      );

      expect(sellerA?.shippingCharge).toBe(49);
      expect(sellerA?.freeShipping).toBe(false);
      expect(sellerB?.shippingCharge).toBe(0);
      expect(sellerB?.freeShipping).toBe(true);
    });

    it('Seller A ₹999, Seller B ₹999 -> A free, B free -> Total = ₹0', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 999, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 999, quantity: 1, shopId: 'shop-B' },
        ],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);

      const sellerA = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-A',
      );
      const sellerB = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-B',
      );

      expect(sellerA?.freeShipping).toBe(true);
      expect(sellerB?.freeShipping).toBe(true);
    });

    it('Seller A ₹1,500, Seller B ₹500, Seller C ₹999 -> A free, B paid, C free -> Total = ₹49', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 500, quantity: 1, shopId: 'shop-B' },
          { productId: 'p3', price: 999, quantity: 1, shopId: 'shop-C' },
        ],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);

      const sellerA = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-A',
      );
      const sellerB = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-B',
      );
      const sellerC = result.sellerBreakdown.find(
        (s: SellerShippingBreakdown) => s.sellerId === 'shop-C',
      );

      expect(sellerA?.shippingCharge).toBe(0);
      expect(sellerB?.shippingCharge).toBe(49);
      expect(sellerC?.shippingCharge).toBe(0);
    });
  });

  // =========================================================================
  // 3. CRITICAL ANTI-BUG CASE (Section 40)
  // =========================================================================
  describe('Critical Anti-Bug: Overall Cart Total != Free Shipping Trigger', () => {
    it('Seller A ₹500 + Seller B ₹500: Cart total = ₹1,000 -> MUST NOT give free shipping', () => {
      const items = [
        { productId: 'item-1', price: 500, quantity: 1, shopId: 'seller-A' },
        { productId: 'item-2', price: 500, quantity: 1, shopId: 'seller-B' },
      ];
      const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      expect(cartTotal).toBe(1000); // Cart total exceeds 999

      const result = CustomerShippingService.calculateCustomerShipping({
        items,
        shippingMethodCode: 'STANDARD',
      });

      // Anti-bug assertion: must NOT be free!
      expect(result.finalShippingAmount).not.toBe(0);
      expect(result.finalShippingAmount).toBe(98);
      expect(result.isFreeShippingAcrossAllSellers).toBe(false);
    });
  });

  // =========================================================================
  // 4. SHIPPING MODES & PROMOTIONAL WAIVERS (Section 41)
  // =========================================================================
  describe('Shipping Modes & Promotional Overrides', () => {
    it('Express delivery: ₹99 charge when under ₹999 threshold', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 800, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'EXPRESS',
      });
      expect(result.finalShippingAmount).toBe(99);
      expect(result.shippingMethodCode).toBe('EXPRESS');
    });

    it('Same-Day delivery: ₹149 charge (paid premium mode per BM-05 Section 21 unless promotional waiver)', () => {
      const underResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'SAME-DAY',
      });
      expect(underResult.finalShippingAmount).toBe(149);

      // BM-05 Section 21: Same-Day is a paid premium mode (₹149) even for ₹2,000+
      const paidResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 2000, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'SAME-DAY',
      });
      expect(paidResult.finalShippingAmount).toBe(149);
      expect(paidResult.sellerBreakdown[0].freeShipping).toBe(false);

      // Only an explicit promotion/waiver waives Same-Day charge
      const promoResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 2000, quantity: 1, shopId: 'shop-A' }],
        shippingMethodCode: 'SAME-DAY',
        promotions: [
          {
            title: 'Same-Day Promo',
            isActive: true,
            shippingMode: 'SAME-DAY',
          },
        ],
      });
      expect(promoResult.finalShippingAmount).toBe(0);
      expect(promoResult.sellerBreakdown[0].freeShipping).toBe(true);
    });

    it('Promotional shipping waiver (e.g. first-order free delivery) deterministically zeroes shipping', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 300, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 400, quantity: 1, shopId: 'shop-B' },
        ],
        shippingMethodCode: 'STANDARD',
        isPromotionalFreeShipping: true,
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[1].shippingCharge).toBe(0);
      expect(result.savedShippingAmount).toBe(98);
    });

    it('Empty items cart returns 0 shipping', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [],
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown).toHaveLength(0);
    });
  });

  // =========================================================================
  // 5. PRODUCT WEIGHT NORMALIZATION & SHIPROCKET PAYLOAD (Section 42)
  // =========================================================================
  describe('Product Weight Normalization (Grams canonical, Shiprocket kg)', () => {
    it('500 g -> 0.5 kg', () => {
      const norm = CustomerShippingService.normalizeWeight('500g');
      expect(norm.weightGrams).toBe(500);
      expect(norm.weightKg).toBe(0.5);
    });

    it('1000 g -> 1 kg', () => {
      const norm = CustomerShippingService.normalizeWeight('1000g');
      expect(norm.weightGrams).toBe(1000);
      expect(norm.weightKg).toBe(1);
    });

    it('1500 g -> 1.5 kg', () => {
      const norm = CustomerShippingService.normalizeWeight('1500 g');
      expect(norm.weightGrams).toBe(1500);
      expect(norm.weightKg).toBe(1.5);
    });

    it('2500 g -> 2.5 kg', () => {
      const norm = CustomerShippingService.normalizeWeight('2.5kg');
      expect(norm.weightGrams).toBe(2500);
      expect(norm.weightKg).toBe(2.5);
    });

    it('CRITICAL: 500 g NEVER becomes 500 kg', () => {
      const norm1 = CustomerShippingService.normalizeWeight('500g');
      expect(norm1.weightKg).not.toBe(500);
      expect(norm1.weightKg).toBe(0.5);

      // Raw number 500 assumed canonical grams
      const norm2 = CustomerShippingService.normalizeWeight(500);
      expect(norm2.weightKg).not.toBe(500);
      expect(norm2.weightKg).toBe(0.5);
    });

    it('Rejects negative weight or invalid unit safely with fallback/error handling', () => {
      const fallback = CustomerShippingService.normalizeWeight(-100);
      expect(fallback.weightGrams).toBeGreaterThan(0);
      expect(fallback.weightKg).toBe(0.5);

      const invalidUnit = CustomerShippingService.normalizeWeight('invalid-weight');
      expect(invalidUnit.weightGrams).toBe(500);
      expect(invalidUnit.weightKg).toBe(0.5);
    });
  });

  // =========================================================================
  // 6. RTO 50/50 LOSS ALLOCATION TESTS (Section 43)
  // =========================================================================
  describe('RTO 50% Navya / 50% Seller Financial Split', () => {
    it('RTO cost ₹200 -> Navya ₹100, Seller ₹100', () => {
      const split = CustomerShippingService.calculateRtoSplit(200);
      expect(split.totalRtoCost).toBe(200);
      expect(split.navyaShare).toBe(100);
      expect(split.sellerShare).toBe(100);
      expect(split.sellerShare + split.navyaShare).toBe(200);
    });

    it('RTO cost ₹501 -> Navya ₹250.50, Seller ₹250.50 [Odd rupee split]', () => {
      const split = CustomerShippingService.calculateRtoSplit(501);
      expect(split.totalRtoCost).toBe(501);
      expect(split.navyaShare).toBe(250.5);
      expect(split.sellerShare).toBe(250.5);
      expect(split.sellerShare + split.navyaShare).toBe(501);
    });

    it('Refuses to guess financial amount if eligible RTO cost is 0 or negative', () => {
      expect(() => CustomerShippingService.calculateRtoSplit(0)).toThrow();
      expect(() => CustomerShippingService.calculateRtoSplit(-50)).toThrow();
    });
  });

  // =========================================================================
  // 7. GST ON CUSTOMER SHIPPING (Section 44)
  // =========================================================================
  describe('GST on Customer Shipping', () => {
    it('Calculates 0% GST when customer shipping is not taxable (default configuration)', () => {
      const tax = CustomerShippingService.calculateShippingGst({
        shippingAmount: 49,
        gstRate: 0,
      });
      expect(tax.gstAmount).toBe(0);
      expect(tax.totalShippingWithTax).toBe(49);
    });

    it('Calculates 18% IGST on customer shipping when legally configured', () => {
      const tax = CustomerShippingService.calculateShippingGst({
        shippingAmount: 100,
        gstRate: 18,
        isIntraState: false,
      });
      expect(tax.gstRate).toBe(18);
      expect(tax.gstAmount).toBe(18);
      expect(tax.igstAmount).toBe(18);
      expect(tax.cgstAmount).toBe(0);
      expect(tax.sgstAmount).toBe(0);
      expect(tax.totalShippingWithTax).toBe(118);
    });

    it('Calculates CGST + SGST on intra-state customer shipping when configured', () => {
      const tax = CustomerShippingService.calculateShippingGst({
        shippingAmount: 100,
        gstRate: 18,
        isIntraState: true,
      });
      expect(tax.gstAmount).toBe(18);
      expect(tax.cgstAmount).toBe(9);
      expect(tax.sgstAmount).toBe(9);
      expect(tax.igstAmount).toBe(0);
    });

    it('Customer shipping does NOT modify BM-02 Navya Commission (MRP * 10%)', () => {
      const mrp = 1500;
      const sellingPrice = 1000;
      const customerShipping = 49;

      const comm = CommissionService.calculateItemCommission({
        productId: 'prod-1',
        sellerId: 'sel-1',
        mrp,
        sellingPrice,
        quantity: 1,
        customerShippingAmount: customerShipping,
      });

      // Commission base MUST be MRP only (₹1,500), NOT (sellingPrice + shipping)
      expect(comm.commissionBaseAmount).toBe(1500);
      expect(comm.commissionAmount).toBe(150); // 1500 * 10%
      expect(comm.customerShippingAmount).toBe(49);
      // Payout = sellingPrice (1000) - commission (150) = 850 (customer shipping NOT included in payout)
      expect(comm.sellerBasePayout).toBe(850);
      expect(comm.sellerTotalPayout).toBe(850);
    });
  });

  // =========================================================================
  // 8. BACKEND SECURITY & RECALCULATION (Section 45)
  // =========================================================================
  describe('Backend Security & Tamper Resistance', () => {
    it('Ignores client-supplied zero shipping and enforces authoritative seller rates', () => {
      // Client sends payload claiming shipping is 0
      const clientPayload = {
        claimedShipping: 0,
        items: [
          { productId: 'p1', price: 400, quantity: 1, shopId: 'shop-1' },
          { productId: 'p2', price: 400, quantity: 1, shopId: 'shop-2' },
        ],
      };

      // Server recalculates independently
      const serverCalc = CustomerShippingService.calculateCustomerShipping({
        items: clientPayload.items,
        shippingMethodCode: 'STANDARD',
      });

      expect(serverCalc.finalShippingAmount).toBe(98); // 49 + 49
      expect(serverCalc.finalShippingAmount).not.toBe(clientPayload.claimedShipping);
    });
  });
});
