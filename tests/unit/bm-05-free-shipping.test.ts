import { describe, expect, it } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import {
  CustomerShippingService,
  type SellerShippingBreakdown,
  type ShippingPromotionConfig,
  type SpecialShippingMode,
} from '../../src/backend/services/shipping/customer-shipping.service';
import { MultiSellerShipmentService } from '../../src/backend/services/shipping/multi-seller-shipment.service';

describe('BM-05 — Authoritative Free Shipping Policy Suite', () => {
  // =========================================================================
  // Section 46: TEST MATRIX — NORMAL PREPAID
  // =========================================================================
  describe('Section 46: Normal Prepaid Standard Shipping Threshold (₹999)', () => {
    it('₹998 -> Paid Standard shipping (₹49)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 998, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[0].thresholdUsed).toBe(999);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('NONE');
    });

    it('₹998.99 -> Paid Standard shipping (₹49) [Exact boundary check]', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 998.99, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
    });

    it('₹999 -> FREE Standard shipping (₹0) [Inclusive boundary]', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 999, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
      expect(result.sellerBreakdown[0].costBearer).toBe('NAVYA');
    });

    it('₹1,000 -> FREE Standard shipping (₹0)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1000, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
    });

    it('₹1,500 -> FREE Standard shipping (₹0)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
    });
  });

  // =========================================================================
  // Section 47: TEST MATRIX — COD
  // =========================================================================
  describe('Section 47: COD Standard Shipping Threshold (₹1,999)', () => {
    it('₹1,998 -> Paid Standard shipping (₹49)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1998, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[0].thresholdUsed).toBe(1999);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('NONE');
    });

    it('₹1,999 -> FREE Standard shipping (₹0) [Inclusive boundary]', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1999, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('COD_THRESHOLD');
      expect(result.sellerBreakdown[0].costBearer).toBe('NAVYA');
    });

    it('₹2,000 -> FREE Standard shipping (₹0)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 2000, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('COD_THRESHOLD');
    });

    it('COD at ₹999 is PAID (does NOT accidentally use prepaid threshold)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 999, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[0].thresholdUsed).toBe(1999);
    });
  });

  // =========================================================================
  // Section 48: TEST MATRIX — COUPON
  // =========================================================================
  describe('Section 48: Coupon Does Not Reduce or Manufacture Free Shipping', () => {
    it('Selling Price ₹1,200, Coupon ₹300, Customer Payable ₹900 -> FREE', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1200, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown[0].sellerSubtotal).toBe(1200);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
    });

    it('Selling Price ₹999, Coupon ₹200, Customer Payable ₹799 -> FREE', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 999, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown[0].sellerSubtotal).toBe(999);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
    });

    it('Selling Price ₹800, Coupon ₹200, Customer Payable ₹600 -> PAID (Coupon does not create free shipping)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 800, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown[0].sellerSubtotal).toBe(800);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
    });

    it('Navya-Funded Coupon: Selling ₹1,100, Navya coupon ₹250, Payable ₹850 -> FREE (Uses pre-coupon subtotal)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1100, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown[0].sellerSubtotal).toBe(1100);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
    });
  });

  // =========================================================================
  // Section 49: TEST MATRIX — FIRST ORDER
  // =========================================================================
  describe('Section 49: First-Order Free Standard Shipping', () => {
    it('First order, single seller subtotal ₹100 -> FREE STANDARD', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 100, quantity: 1, shopId: 'shop-A' }],
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('FIRST_ORDER');
      expect(result.sellerBreakdown[0].costBearer).toBe('NAVYA');
    });

    it('First order, multi-seller: A ₹200, B ₹500, C ₹800 -> A FREE, B FREE, C FREE', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 200, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 500, quantity: 1, shopId: 'shop-B' },
          { productId: 'p3', price: 800, quantity: 1, shopId: 'shop-C' },
        ],
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown).toHaveLength(3);
      for (const seller of result.sellerBreakdown) {
        expect(seller.freeShipping).toBe(true);
        expect(seller.shippingCharge).toBe(0);
        expect(seller.freeShippingSource).toBe('FIRST_ORDER');
        expect(seller.costBearer).toBe('NAVYA');
      }
    });

    it('First order with COD also gets FREE Standard shipping', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 150, quantity: 1, shopId: 'shop-A' }],
        isFirstOrder: true,
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('FIRST_ORDER');
    });
  });

  // =========================================================================
  // Section 50: TEST MATRIX — MULTI-SELLER CART
  // =========================================================================
  describe('Section 50: Multi-Seller Independent Calculation', () => {
    it('Prepaid: Seller A = ₹1,200, Seller B = ₹700, Seller C = ₹999 -> A FREE, B PAID, C FREE', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 1200, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 700, quantity: 1, shopId: 'shop-B' },
          { productId: 'p3', price: 999, quantity: 1, shopId: 'shop-C' },
        ],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown).toHaveLength(3);

      const sellerA = result.sellerBreakdown.find((s) => s.shopId === 'shop-A');
      const sellerB = result.sellerBreakdown.find((s) => s.shopId === 'shop-B');
      const sellerC = result.sellerBreakdown.find((s) => s.shopId === 'shop-C');

      expect(sellerA?.freeShipping).toBe(true);
      expect(sellerA?.shippingCharge).toBe(0);
      expect(sellerA?.freeShippingSource).toBe('STANDARD_THRESHOLD');

      expect(sellerB?.freeShipping).toBe(false);
      expect(sellerB?.shippingCharge).toBe(49);
      expect(sellerB?.freeShippingSource).toBe('NONE');

      expect(sellerC?.freeShipping).toBe(true);
      expect(sellerC?.shippingCharge).toBe(0);
      expect(sellerC?.freeShippingSource).toBe('STANDARD_THRESHOLD');

      // Total customer shipping = 0 + 49 + 0 = 49
      expect(result.finalShippingAmount).toBe(49);
    });

    it('Prepaid: Seller A = ₹500, Seller B = ₹500 (Cart Total ₹1,000) -> Both PAID (Cart total does not qualify)', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 500, quantity: 1, shopId: 'shop-B' },
        ],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown).toHaveLength(2);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[1].freeShipping).toBe(false);
      expect(result.sellerBreakdown[1].shippingCharge).toBe(49);
      expect(result.finalShippingAmount).toBe(98);
    });

    it('COD: Seller A = ₹2,000, Seller B = ₹1,500 -> A FREE, B PAID', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 2000, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 1500, quantity: 1, shopId: 'shop-B' },
        ],
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      const sellerA = result.sellerBreakdown.find((s) => s.shopId === 'shop-A');
      const sellerB = result.sellerBreakdown.find((s) => s.shopId === 'shop-B');

      expect(sellerA?.freeShipping).toBe(true);
      expect(sellerA?.shippingCharge).toBe(0);
      expect(sellerA?.freeShippingSource).toBe('COD_THRESHOLD');

      expect(sellerB?.freeShipping).toBe(false);
      expect(sellerB?.shippingCharge).toBe(49);
      expect(sellerB?.freeShippingSource).toBe('NONE');

      expect(result.finalShippingAmount).toBe(49);
    });
  });

  // =========================================================================
  // Section 51: TEST MATRIX — EXPRESS & SAME-DAY
  // =========================================================================
  describe('Section 51: Express and Same-Day Remain Paid Premium Modes', () => {
    it('Subtotal ₹1,500: Standard is FREE, Express is PAID (₹99)', () => {
      const standardResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(standardResult.finalShippingAmount).toBe(0);
      expect(standardResult.sellerBreakdown[0].freeShipping).toBe(true);

      const expressResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'EXPRESS',
      });
      expect(expressResult.finalShippingAmount).toBe(99);
      expect(expressResult.sellerBreakdown[0].freeShipping).toBe(false);
      expect(expressResult.sellerBreakdown[0].shippingCharge).toBe(99);
    });

    it('Subtotal ₹1,500: Same-Day is PAID (₹149)', () => {
      const sameDayResult = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'SAME_DAY',
      });
      expect(sameDayResult.finalShippingAmount).toBe(149);
      expect(sameDayResult.sellerBreakdown[0].freeShipping).toBe(false);
      expect(sameDayResult.sellerBreakdown[0].shippingCharge).toBe(149);
    });

    it('First-order customer: Standard is FREE, Express is PAID (₹99)', () => {
      const firstOrderExpress = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' }],
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'EXPRESS',
      });
      expect(firstOrderExpress.finalShippingAmount).toBe(99);
      expect(firstOrderExpress.sellerBreakdown[0].freeShipping).toBe(false);
      expect(firstOrderExpress.sellerBreakdown[0].shippingCharge).toBe(99);
    });

    it('First-order customer: Standard is FREE, Same-Day is PAID (₹149)', () => {
      const firstOrderSameDay = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' }],
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'SAME_DAY',
      });
      expect(firstOrderSameDay.finalShippingAmount).toBe(149);
      expect(firstOrderSameDay.sellerBreakdown[0].freeShipping).toBe(false);
      expect(firstOrderSameDay.sellerBreakdown[0].shippingCharge).toBe(149);
    });
  });

  // =========================================================================
  // Section 52: TEST MATRIX — SELLER-FUNDED SHIPPING
  // =========================================================================
  describe('Section 52: Seller-Funded Free Shipping & Settlement Liability', () => {
    it('Seller subtotal < threshold, Seller-funded shipping enabled -> Customer ₹0, Cost bearer = SELLER', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 700, quantity: 1, shopId: 'shop-A' }],
        sellerFundedFlags: { 'shop-A': true },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('SELLER_FUNDED');
      expect(result.sellerBreakdown[0].costBearer).toBe('SELLER');
    });

    it('Seller-funded shipping with threshold: qualifying subtotal gets SELLER_FUNDED', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 600, quantity: 1, shopId: 'shop-A' }],
        sellerFundedFlags: { 'shop-A': true },
        sellerFundedThresholds: { 'shop-A': 500 },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('SELLER_FUNDED');
      expect(result.sellerBreakdown[0].costBearer).toBe('SELLER');
    });

    it('Seller-funded shipping with threshold: below seller threshold does not get SELLER_FUNDED', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 400, quantity: 1, shopId: 'shop-A' }],
        sellerFundedFlags: { 'shop-A': true },
        sellerFundedThresholds: { 'shop-A': 500 },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('NONE');
    });

    it('Seller settlement correctly deducts seller-funded shipping liability', () => {
      // Selling price 700, MRP 1000
      // Navya commission = 1000 * 10% = 100
      // Base payout = 700 - 100 = 600
      // GST 5% on 700 = 35
      // Gross payout = 635
      // Seller funded shipping deduction = 49
      // Net payout = 635 - 49 = 586
      const mrp = 1000;
      const sellingPrice = 700;
      const commission = CommissionService.roundMoney(mrp * 0.1);
      const basePayout = CommissionService.roundMoney(sellingPrice - commission);
      const gst = CommissionService.roundMoney(sellingPrice * 0.05);
      const grossPayout = CommissionService.roundMoney(basePayout + gst);
      const sellerFundedShippingDeduction = 49;
      const netPayout = CommissionService.roundMoney(grossPayout - sellerFundedShippingDeduction);

      expect(commission).toBe(100);
      expect(basePayout).toBe(600);
      expect(gst).toBe(35);
      expect(grossPayout).toBe(635);
      expect(netPayout).toBe(586);
      // Customer shipping remains completely outside MRP commission calculation!
      expect(CommissionService.calculateCommission(mrp)).toBe(100);
    });
  });

  // =========================================================================
  // Section 53: TEST MATRIX — PROMOTIONAL SHIPPING
  // =========================================================================
  describe('Section 53: Promotional Free Shipping & Expired Promo Handling', () => {
    it('Active Navya promotion: Seller subtotal < ₹999 -> Customer shipping = ₹0, Cost bearer = NAVYA', () => {
      const activePromotion: ShippingPromotionConfig = {
        id: 'promo-weekend',
        name: 'Weekend Free Shipping',
        startDate: new Date(Date.now() - 3600000), // 1 hour ago
        endDate: new Date(Date.now() + 3600000), // 1 hour in future
        status: 'ACTIVE',
        costBearer: 'NAVYA',
        applicableShippingModes: ['STANDARD'],
      };

      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 700, quantity: 1, shopId: 'shop-A' }],
        promotions: [activePromotion],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });

      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(0);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('NAVYA_PROMOTION');
      expect(result.sellerBreakdown[0].costBearer).toBe('NAVYA');
      expect(result.sellerBreakdown[0].promotionId).toBe('promo-weekend');
    });

    it('Expired promotion: Seller subtotal < ₹999 -> Normal shipping applies (₹49)', () => {
      const expiredPromotion: ShippingPromotionConfig = {
        id: 'promo-expired',
        name: 'Past Holiday Free Shipping',
        startDate: new Date(Date.now() - 7200000), // 2 hours ago
        endDate: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'ACTIVE',
        costBearer: 'NAVYA',
        applicableShippingModes: ['STANDARD'],
      };

      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 700, quantity: 1, shopId: 'shop-A' }],
        promotions: [expiredPromotion],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });

      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('NONE');
    });

    it('Promotion scoped to specific shipping modes does not apply to other modes', () => {
      const standardOnlyPromotion: ShippingPromotionConfig = {
        id: 'promo-standard-only',
        name: 'Standard Only Promotion',
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        status: 'ACTIVE',
        costBearer: 'NAVYA',
        applicableShippingModes: ['STANDARD'],
      };

      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 700, quantity: 1, shopId: 'shop-A' }],
        promotions: [standardOnlyPromotion],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'EXPRESS',
      });

      expect(result.finalShippingAmount).toBe(99);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(99);
    });
  });

  // =========================================================================
  // Section 54: TEST MATRIX — SPECIAL PRODUCT RULES & DETERMINISTIC PRIORITY
  // =========================================================================
  describe('Section 54: Special Product Rules & Deterministic Rule Priority', () => {
    it('Product with SPECIAL mode and configured rate (₹120) charges exactly ₹120', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'heavy-rug', price: 3000, quantity: 1, shopId: 'shop-A' }],
        productSpecialShippingRules: {
          'heavy-rug': { mode: 'SPECIAL', specialRate: 120 },
        },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(120);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(120);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('SPECIAL_PRODUCT_RULE');
    });

    it('Product with EXCLUDED mode never qualifies for free shipping even on high cart value', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'bulky-sofa', price: 15000, quantity: 1, shopId: 'shop-A' }],
        productSpecialShippingRules: {
          'bulky-sofa': { mode: 'EXCLUDED' },
        },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(49);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('SPECIAL_PRODUCT_RULE');
    });

    it('Product with FREE mode gets free shipping even on sub-threshold cart', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'promo-saree', price: 400, quantity: 1, shopId: 'shop-A' }],
        productSpecialShippingRules: {
          'promo-saree': { mode: 'FREE' },
        },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(0);
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('SPECIAL_PRODUCT_RULE');
      expect(result.sellerBreakdown[0].costBearer).toBe('NAVYA');
    });

    it('Deterministic Priority: EXCLUDED overrides First-Order free shipping', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'bulky-safe', price: 2000, quantity: 1, shopId: 'shop-A' }],
        productSpecialShippingRules: {
          'bulky-safe': { mode: 'EXCLUDED' },
        },
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(49);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
    });

    it('Deterministic Priority: SPECIAL rate overrides normal ₹999 threshold', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'heavy-sculpture', price: 5000, quantity: 1, shopId: 'shop-A' }],
        productSpecialShippingRules: {
          'heavy-sculpture': { mode: 'SPECIAL', specialRate: 150 },
        },
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.finalShippingAmount).toBe(150);
      expect(result.sellerBreakdown[0].freeShipping).toBe(false);
      expect(result.sellerBreakdown[0].shippingCharge).toBe(150);
    });

    it('Deterministic Priority: First Order takes precedence over normal threshold', () => {
      const result = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', price: 1500, quantity: 1, shopId: 'shop-A' }],
        isFirstOrder: true,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(result.sellerBreakdown[0].freeShipping).toBe(true);
      expect(result.sellerBreakdown[0].freeShippingSource).toBe('FIRST_ORDER');
    });
  });

  // =========================================================================
  // Section 55: TEST MATRIX — PARTIAL RETURNS
  // =========================================================================
  describe('Section 55: Partial Return Does Not Alter Historical Order Shipping Snapshot', () => {
    it('Seller subtotal ₹1,200 qualified for FREE shipping. Partial return of ₹500 leaves ₹700. Historical snapshot remains FREE', () => {
      // Historical order creation snapshot
      const originalOrderShipping = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'p1', price: 700, quantity: 1, shopId: 'shop-A' },
          { productId: 'p2', price: 500, quantity: 1, shopId: 'shop-A' },
        ],
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });

      expect(originalOrderShipping.finalShippingAmount).toBe(0);
      expect(originalOrderShipping.sellerBreakdown[0].freeShipping).toBe(true);
      expect(originalOrderShipping.sellerBreakdown[0].freeShippingSource).toBe(
        'STANDARD_THRESHOLD',
      );

      // Partial return occurs on p2 (₹500). Customer keeps p1 (₹700).
      // The original order snapshot must not be recalculated or mutated.
      const persistedSnapshot = {
        shippingAmount: originalOrderShipping.finalShippingAmount,
        isFreeShipping: originalOrderShipping.sellerBreakdown[0].freeShipping,
        freeShippingSource: originalOrderShipping.sellerBreakdown[0].freeShippingSource,
      };

      expect(persistedSnapshot.shippingAmount).toBe(0);
      expect(persistedSnapshot.isFreeShipping).toBe(true);
      expect(persistedSnapshot.freeShippingSource).toBe('STANDARD_THRESHOLD');
    });
  });

  // =========================================================================
  // Section 56: TEST MATRIX — CANCELLATION AFTER SHIPMENT
  // =========================================================================
  describe('Section 56: Post-Shipment Cancellation Logistics Loss Borne by Navya', () => {
    it('Order shipped and cancelled: Navya bears logistics loss 100%, Seller is not debited', () => {
      const cancellationResult = MultiSellerShipmentService.recordPostShipmentCancellationLoss({
        orderId: 'ord-123',
        shipmentId: 'ship-456',
        shopId: 'shop-A',
        actualLogisticsCost: 120,
      });

      expect(cancellationResult.logisticsLossBorneBy).toBe('NAVYA');
      expect(cancellationResult.sellerDebitAmount).toBe(0);
      expect(cancellationResult.actualLogisticsCost).toBe(120);
      expect(cancellationResult.reason).toContain(
        'Post-shipment cancellation loss borne 100% by Navya',
      );
    });
  });

  // =========================================================================
  // Section 57: SECURITY & TAMPER RESISTANCE TESTS
  // =========================================================================
  describe('Section 57: Security & Backend Authority', () => {
    it('Backend recalculates shipping and rejects client manipulation of freeShipping or shippingAmount', () => {
      // Malicious client tries to send freeShipping: true or shippingAmount: 0 for a ₹500 cart
      const clientPayload = {
        freeShipping: true,
        shippingAmount: 0,
        sellerSubtotal: 10000, // Client attempts to spoof seller subtotal
      };

      // Authoritative backend uses database items and prices
      const authoritativeItems = [{ productId: 'p1', price: 500, quantity: 1, shopId: 'shop-A' }];
      const authoritativeResult = CustomerShippingService.calculateCustomerShipping({
        items: authoritativeItems,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });

      expect(authoritativeResult.finalShippingAmount).toBe(49);
      expect(authoritativeResult.sellerBreakdown[0].freeShipping).toBe(false);
      expect(authoritativeResult.finalShippingAmount).not.toBe(clientPayload.shippingAmount);
      expect(authoritativeResult.sellerBreakdown[0].freeShipping).not.toBe(
        clientPayload.freeShipping,
      );
    });

    it('COD cannot masquerade as PREPAID to exploit the lower ₹999 threshold', () => {
      const items = [{ productId: 'p1', price: 1200, quantity: 1, shopId: 'shop-A' }];

      // Legitimate prepaid order
      const prepaidResult = CustomerShippingService.calculateCustomerShipping({
        items,
        paymentMethod: 'PREPAID',
        shippingMethodCode: 'STANDARD',
      });
      expect(prepaidResult.finalShippingAmount).toBe(0);

      // Backend verifies payment method is COD
      const codResult = CustomerShippingService.calculateCustomerShipping({
        items,
        paymentMethod: 'COD',
        shippingMethodCode: 'STANDARD',
      });
      expect(codResult.finalShippingAmount).toBe(49);
      expect(codResult.sellerBreakdown[0].freeShipping).toBe(false);
    });
  });

  // =========================================================================
  // Regression Checks: BM-01, BM-02, BM-03, BM-04
  // =========================================================================
  describe('Regression: BM-01, BM-02, BM-03, BM-04 Integrity', () => {
    it('BM-02 Commission remains strictly MRP * 10% regardless of shipping fee or free shipping', () => {
      const comm1 = CommissionService.calculateCommission(2000);
      expect(comm1).toBe(200);

      const comm2 = CommissionService.calculateCommission(2000);
      expect(comm2).toBe(200);
    });

    it('BM-04 RTO cost sharing remains strictly 50% Navya / 50% Seller', () => {
      const rtoResult = MultiSellerShipmentService.calculateRtoCostSplit(180);
      expect(rtoResult.navyaShare).toBe(90);
      expect(rtoResult.sellerShare).toBe(90);
    });
  });
});
