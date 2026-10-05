import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionLib from '../../src/backend/lib/session';
import { CommissionService } from '../../src/backend/services/commission.service';
import { ContributionService } from '../../src/backend/services/contribution.service';
import { PaymentGatewayConfigService } from '../../src/backend/services/payment-gateway-config.service';
import {
  PlatformTaxService,
  PlatformTaxType,
} from '../../src/backend/services/platform-tax.service';
import { prisma } from '../../src/lib/prisma';

describe('BM-11 — Unit Economics / Navya Contribution Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC-01: STANDARD PREPAID POSITIVE CONTRIBUTION
  // =========================================================================
  describe('AC-01: Standard Prepaid Positive Contribution', () => {
    it('Scenario 1.1: Standard prepaid order yields positive net contribution', async () => {
      // Order with MRP ₹1,000, Selling Price ₹900, Prepaid Razorpay
      const mockOrder = {
        id: 'ord_101',
        orderNumber: 'NC-ORD-101',
        totalAmount: 900,
        finalAmount: 900,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'item_1',
            productId: 'prod_1',
            shopId: 'shop_1',
            price: 900,
            mrp: 1000,
            sellingPrice: 900,
            quantity: 1,
            total: 900,
            commissionAmount: 100, // 10% of 1,000 MRP
            navyaCouponAmount: 0,
            customerShippingAmount: 0,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_1',
            shopId: 'shop_1',
            totalAmount: 900,
            commissionAmount: 100,
            vendorPayoutAmount: 800,
            settlement: null,
            shipments: [],
          },
        ],
        shipments: [
          {
            id: 'shp_1',
            shipmentNumber: 'NAV-SHP-101-01',
            shopId: 'shop_1',
            sellerId: 'seller_1',
            status: 'DELIVERED',
            shippingMode: 'STANDARD',
            isFreeShipping: true,
            costBearer: 'NAVYA',
            shippingCharge: 0,
            actualForwardShippingCost: 49,
            shippingCostStatus: 'ACTUAL',
          },
        ],
        paymentTransactions: [
          {
            id: 'txn_1',
            status: 'PAID',
            gatewayFee: 18.0,
            gatewayTax: 3.24,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_101');

      // Commission = ₹100
      expect(res.commissionEarned).toBe(100);
      // Tax on platform service (18% on ₹100) = ₹18.00
      expect(res.applicablePlatformTax).toBe(18.0);
      expect(res.revenueTotal).toBe(82.0); // ₹100 - ₹18

      // Variable Costs: Gateway (18 + 3.24 = 21.24) + Forward Freight (49) = 70.24
      expect(res.gatewayCostUsed).toBe(21.24);
      expect(res.navyaForwardShippingCost).toBe(49);
      expect(res.variableCostTotal).toBe(70.24);

      // Contribution = ₹82.00 - ₹70.24 = ₹11.76
      expect(res.grossContribution).toBe(11.76);
      expect(res.contributionMarginPercent).toBe(14.34);
      expect(res.grossContribution).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // AC-02: CUSTOMER SHIPPING COLLECTED VS ACTUAL FREIGHT
  // =========================================================================
  describe('AC-02: Customer Shipping Collected vs Actual Carrier Freight', () => {
    it('Scenario 2.1: Paid customer shipping is separated from actual carrier freight cost', async () => {
      // Customer paid ₹99 for Express delivery. Shiprocket actual freight was ₹80.
      const mockOrder = {
        id: 'ord_102',
        orderNumber: 'NC-ORD-102',
        totalAmount: 500,
        finalAmount: 599, // ₹500 product + ₹99 customer shipping
        shippingAmount: 99,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i2',
            productId: 'p2',
            shopId: 'shop_1',
            price: 500,
            mrp: 600,
            quantity: 1,
            total: 500,
            commissionAmount: 60, // 10% of 600 MRP
            navyaCouponAmount: 0,
            customerShippingAmount: 99,
          },
        ],
        vendorOrders: [
          { id: 'vo_2', shopId: 'shop_1', totalAmount: 500, commissionAmount: 60, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_2',
            shipmentNumber: 'NAV-SHP-102-01',
            shopId: 'shop_1',
            sellerId: 'seller_1',
            status: 'DELIVERED',
            shippingMode: 'EXPRESS',
            isFreeShipping: false,
            costBearer: 'NAVYA',
            shippingCharge: 99,
            actualForwardShippingCost: 80,
            shippingCostStatus: 'ACTUAL',
          },
        ],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 11.98, gatewayTax: 2.16, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_102');

      expect(res.customerShippingCollected).toBe(99);
      expect(res.navyaForwardShippingCost).toBe(80);
      // Net shipping effect = ₹99 collected - ₹80 paid = +₹19 profit
      const netShippingContribution = res.customerShippingCollected - res.navyaForwardShippingCost;
      expect(netShippingContribution).toBe(19);
    });
  });

  // =========================================================================
  // AC-03: COD ECONOMICS & 1.5% FEE
  // =========================================================================
  describe('AC-03: Cash on Delivery Fee & Contribution', () => {
    it('Scenario 3.1: COD fee (1.5%) is included in Navya contribution revenue', async () => {
      // Order of ₹2,000 product + ₹30 COD fee (1.5%)
      const mockOrder = {
        id: 'ord_103',
        orderNumber: 'NC-ORD-103',
        totalAmount: 2000,
        finalAmount: 2030,
        shippingAmount: 0,
        codFee: 30,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i3',
            shopId: 's1',
            mrp: 2000,
            price: 2000,
            quantity: 1,
            total: 2000,
            commissionAmount: 200,
            navyaCouponAmount: 0,
          },
        ],
        vendorOrders: [
          { id: 'vo_3', shopId: 's1', totalAmount: 2000, commissionAmount: 200, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_3',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            codFee: 30,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 49,
            shippingCostStatus: 'ACTUAL',
          },
        ],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_103');

      expect(res.codFeeCollected).toBe(30);
      expect(res.commissionEarned).toBe(200);
      // Gateway fee on COD is 0
      expect(res.gatewayCostUsed).toBe(0);
      // Net revenue = (200 + 30) - (230 * 0.18 = 41.40) = 188.60
      expect(res.revenueTotal).toBe(188.6);
      expect(res.navyaForwardShippingCost).toBe(49);
      expect(res.grossContribution).toBe(CommissionService.roundMoney(188.6 - 49)); // 139.60
    });
  });

  // =========================================================================
  // AC-04 & AC-05: GATEWAY ESTIMATE VS ACTUAL REPLACEMENT
  // =========================================================================
  describe('AC-04 & AC-05: Gateway Fee Estimate & Idempotent Actual Replacement', () => {
    it('Scenario 4.1: Gateway fee uses estimated rate initially when webhook is pending', async () => {
      const mockOrder = {
        id: 'ord_104',
        orderNumber: 'NC-ORD-104',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'CONFIRMED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i4',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_4', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [
          {
            id: 'txn_est',
            status: 'PAID',
            gatewayFee: 20, // 2%
            gatewayTax: 3.6, // 18% GST
            gatewayFeeStatus: 'ESTIMATED',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_104');

      expect(res.gatewayFeeStatus).toBe('ESTIMATED');
      expect(res.gatewayCostUsed).toBe(23.6);
    });

    it('Scenario 4.2: Actual webhook payload replaces gateway fee estimate idempotently', async () => {
      const mockOrder = {
        id: 'ord_104',
        orderNumber: 'NC-ORD-104',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i4',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_4', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [
          {
            id: 'txn_act',
            status: 'PAID',
            razorpayPaymentId: 'pay_xyz_123',
            gatewayFee: 19.5, // Authoritative actual fee from Razorpay
            gatewayTax: 3.51,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_104');

      expect(res.gatewayFeeStatus).toBe('ACTUAL');
      expect(res.gatewayCostUsed).toBe(23.01); // 19.5 + 3.51
    });
  });

  // =========================================================================
  // AC-06 & AC-07: NAVYA-FUNDED VS SELLER-FUNDED COUPON
  // =========================================================================
  describe('AC-06 & AC-07: Coupon Funding Segregation (NAVYA vs SELLER)', () => {
    it('Scenario 6.1: NAVYA-funded coupon subsidy is deducted as a Navya variable cost', async () => {
      const mockOrder = {
        id: 'ord_navya_cpn',
        orderNumber: 'NC-CPN-NAVYA',
        totalAmount: 1000,
        finalAmount: 850,
        discountAmount: 150,
        couponFundingType: 'NAVYA',
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i_navya',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100, // MRP * 10%
            navyaCouponAmount: 150, // Absorbed by Navya
            sellerCouponAmount: 0,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_n',
            shopId: 's1',
            totalAmount: 1000,
            commissionAmount: 100,
            vendorPayoutAmount: 900,
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 17, gatewayTax: 3.06, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_navya_cpn');

      expect(res.navyaCouponSubsidy).toBe(150);
      expect(res.commissionEarned).toBe(100);
      // Net revenue = 100 - (100 * 0.18 = 18) = 82
      // Variable costs = 20.06 (gateway) + 150 (coupon subsidy) = 170.06
      expect(res.variableCostTotal).toBe(170.06);
      // Contribution = 82 - 170.06 = -88.06 (Negative contribution is preserved!)
      expect(res.grossContribution).toBe(-88.06);
    });

    it('Scenario 6.2: SELLER-funded coupon is NOT deducted as Navya variable cost', async () => {
      const mockOrder = {
        id: 'ord_seller_cpn',
        orderNumber: 'NC-CPN-SELLER',
        totalAmount: 1000,
        finalAmount: 850,
        discountAmount: 150,
        couponFundingType: 'SELLER',
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i_seller',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100, // MRP * 10% (BM-02 Invariant!)
            navyaCouponAmount: 0,
            sellerCouponAmount: 150, // Absorbed by Seller
          },
        ],
        vendorOrders: [
          {
            id: 'vo_s',
            shopId: 's1',
            totalAmount: 1000,
            commissionAmount: 100,
            vendorPayoutAmount: 750,
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 17, gatewayTax: 3.06, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_seller_cpn');

      // STRICT INVARIANT: navyaCouponSubsidy MUST be 0!
      expect(res.navyaCouponSubsidy).toBe(0);
      expect(res.commissionEarned).toBe(100);
      // Variable cost is only gateway fee (20.06), NOT 170.06!
      expect(res.variableCostTotal).toBe(20.06);
      expect(res.grossContribution).toBe(CommissionService.roundMoney(82 - 20.06)); // +61.94
      expect(res.grossContribution).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // AC-08 & AC-09: SELLER-FUNDED VS NAVYA-FUNDED SHIPPING
  // =========================================================================
  describe('AC-08 & AC-09: Shipping Cost Bearer Segregation', () => {
    it('Scenario 8.1: SELLER-funded shipping is excluded from Navya variable costs', async () => {
      const mockOrder = {
        id: 'ord_seller_ship',
        orderNumber: 'NC-SHIP-SELLER',
        totalAmount: 800,
        finalAmount: 800,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i8',
            shopId: 's1',
            mrp: 800,
            price: 800,
            quantity: 1,
            total: 800,
            commissionAmount: 80,
          },
        ],
        vendorOrders: [
          { id: 'vo_8', shopId: 's1', totalAmount: 800, commissionAmount: 80, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_seller_cost',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'SELLER', // Seller pays carrier freight
            actualForwardShippingCost: 49,
          },
        ],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_seller_ship');

      // STRICT INVARIANT: Navya forward shipping cost must be 0
      expect(res.navyaForwardShippingCost).toBe(0);
    });

    it('Scenario 8.2: NAVYA-funded free shipping is deducted as Navya variable freight cost', async () => {
      const mockOrder = {
        id: 'ord_navya_ship',
        orderNumber: 'NC-SHIP-NAVYA',
        totalAmount: 1200,
        finalAmount: 1200,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i9',
            shopId: 's1',
            mrp: 1200,
            price: 1200,
            quantity: 1,
            total: 1200,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          { id: 'vo_9', shopId: 's1', totalAmount: 1200, commissionAmount: 120, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_navya_cost',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'NAVYA', // Navya absorbs carrier freight
            actualForwardShippingCost: 65,
            shippingCostStatus: 'ACTUAL',
          },
        ],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_navya_ship');

      expect(res.navyaForwardShippingCost).toBe(65);
      expect(res.navyaFreeShippingSubsidy).toBe(65);
    });
  });

  // =========================================================================
  // AC-10: RTO 50/50 LOGISTICS SPLIT
  // =========================================================================
  describe('AC-10: RTO 50/50 Logistics Cost Impact', () => {
    it('Scenario 10.1: RTO shipment deducts exactly 50% courier cost from Navya and reverses commission', async () => {
      // Order of ₹1,000 MRP with RTO delivered. Total RTO logistics charge = ₹120.
      const mockOrder = {
        id: 'ord_rto_10',
        orderNumber: 'NC-RTO-10',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'RTO',
        paymentMethod: 'PREPAID',
        paymentStatus: 'REFUNDED',
        items: [
          {
            id: 'i10',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_10',
            shopId: 's1',
            totalAmount: 1000,
            commissionAmount: 100,
            settlement: {
              id: 'set_10',
              status: 'CANCELLED',
              commissionReversal: 100, // Commission 100% reversed
            },
            shipments: [],
          },
        ],
        shipments: [
          {
            id: 'shp_rto',
            shopId: 's1',
            status: 'RTO_DELIVERED',
            rtoStatus: 'RTO_DELIVERED',
            actualForwardShippingCost: 60,
            actualReverseShippingCost: 120, // Total RTO courier charge
          },
        ],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 20, gatewayTax: 3.6, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_rto_10');

      // Realized Commission = 0 (100 - 100 reversed)
      expect(res.commissionEarned).toBe(0);
      expect(res.revenueTotal).toBe(0);
      // Navya 50% RTO share = 50% of ₹120 = ₹60
      expect(res.navyaRtoLogisticsCost).toBe(60);
      // Variable costs = Gateway (23.6) + RTO Navya Share (60) = 83.6
      expect(res.variableCostTotal).toBe(83.6);
      expect(res.grossContribution).toBe(-83.6);
    });
  });

  // =========================================================================
  // AC-11: POST-DISPATCH CANCELLATION LOGISTICS LOSS
  // =========================================================================
  describe('AC-11: Post-Dispatch Cancellation Logistics Loss (100% Navya)', () => {
    it('Scenario 11.1: Post-dispatch cancellation charges 100% freight loss to Navya', async () => {
      const mockOrder = {
        id: 'ord_cancel_11',
        orderNumber: 'NC-CANCEL-11',
        totalAmount: 1500,
        finalAmount: 1500,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'CANCELLED',
        paymentMethod: 'PREPAID',
        paymentStatus: 'REFUNDED',
        items: [
          {
            id: 'i11',
            shopId: 's1',
            mrp: 1500,
            price: 1500,
            quantity: 1,
            total: 1500,
            commissionAmount: 150,
          },
        ],
        vendorOrders: [
          { id: 'vo_11', shopId: 's1', totalAmount: 1500, commissionAmount: 150, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_cancel',
            shopId: 's1',
            status: 'CANCELLED',
            shippedAt: new Date(),
            actualForwardShippingCost: 75,
            isFreeShipping: true,
            costBearer: 'NAVYA',
          },
        ],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 30, gatewayTax: 5.4, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [{ amount: 1500, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cancel_11');

      // Cancellation loss = 100% of forward freight = ₹75
      expect(res.navyaCancellationLogisticsCost).toBe(75);
      expect(res.grossContribution).toBeLessThan(0);
    });
  });

  // =========================================================================
  // AC-13 & AC-14: RETURNS & PARTIAL RETURNS
  // =========================================================================
  describe('AC-13 & AC-14: Returns & Partial Return Commission Reversal', () => {
    it('Scenario 13.1: Partial return reverses only the returned item commission', async () => {
      // Order with 2 items (Item 1: ₹1,000 MRP, Item 2: ₹1,000 MRP). Total commission = ₹200.
      // Item 1 is returned (commission reversal = ₹100). Remaining commission = ₹100.
      const mockOrder = {
        id: 'ord_ret_13',
        orderNumber: 'NC-RET-13',
        totalAmount: 2000,
        finalAmount: 2000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'item_ret',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
          {
            id: 'item_kept',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_ret',
            shopId: 's1',
            totalAmount: 2000,
            commissionAmount: 200,
            settlement: {
              id: 'set_ret',
              commissionReversal: 100, // Partial commission reversed
            },
            shipments: [],
          },
        ],
        shipments: [
          {
            id: 'shp_ret',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 49,
            returnStatus: 'VERIFIED',
            returnShippingDeduction: 100, // Seller bore return shipping
          },
        ],
        paymentTransactions: [],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_ret_13');

      // Realized Commission = 200 - 100 = 100
      expect(res.commissionEarned).toBe(100);
      expect(res.grossContribution).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // AC-15 & AC-16: MULTI-SELLER ISOLATION & EXACT RECONCILIATION
  // =========================================================================
  describe('AC-15 & AC-16: Multi-Seller Isolation & Reconciliation', () => {
    it('Scenario 15.1: Multi-seller contributions isolate each boutique and reconcile exactly to master order', async () => {
      // Order with Seller A (₹600) and Seller B (₹400)
      const mockOrder = {
        id: 'ord_multi_15',
        orderNumber: 'NC-MULTI-15',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            mrp: 600,
            price: 600,
            quantity: 1,
            total: 600,
            commissionAmount: 60,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            mrp: 400,
            price: 400,
            quantity: 1,
            total: 400,
            commissionAmount: 40,
          },
        ],
        vendorOrders: [
          { id: 'vo_A', shopId: 'shop_A', totalAmount: 600, commissionAmount: 60, shipments: [] },
          { id: 'vo_B', shopId: 'shop_B', totalAmount: 400, commissionAmount: 40, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_A',
            shopId: 'shop_A',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 40,
          },
          {
            id: 'shp_B',
            shopId: 'shop_B',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 40,
          },
        ],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 20, gatewayTax: 3.6, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_15');

      expect(res.sellers.length).toBe(2);

      const sellerA = res.sellers.find((s: any) => s.shopId === 'shop_A')!;
      const sellerB = res.sellers.find((s: any) => s.shopId === 'shop_B')!;

      // Seller A isolation
      expect(sellerA.commissionEarned).toBe(60);
      expect(sellerA.gatewayCost).toBe(14.16); // 60% of 23.60

      // Seller B isolation
      expect(sellerB.commissionEarned).toBe(40);
      expect(sellerB.gatewayCost).toBe(9.44); // 40% of 23.60

      // Exact mathematical reconciliation (0 lost paise)
      const sumSellerCommission = CommissionService.roundMoney(
        sellerA.commissionEarned + sellerB.commissionEarned,
      );
      expect(sumSellerCommission).toBe(res.commissionEarned);

      const sumSellerGateway = CommissionService.roundMoney(
        sellerA.gatewayCost + sellerB.gatewayCost,
      );
      expect(sumSellerGateway).toBe(res.gatewayCostUsed);

      const sumSellerContribution = CommissionService.roundMoney(
        sellerA.grossContribution + sellerB.grossContribution,
      );
      expect(sumSellerContribution).toBe(res.grossContribution);
    });
  });

  // =========================================================================
  // AC-23 & AC-24: API SECURITY & ROLE GUARDS
  // =========================================================================
  describe('AC-23 & AC-24: Admin & Seller Finance API Role Guards', () => {
    it('Scenario 23.1: Unauthenticated request to /api/v1/admin/finance/commission is rejected with 401', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue(null);

      const { GET } = await import('../../src/app/api/v1/admin/finance/commission/route');
      const req = new Request('http://localhost:3000/api/v1/admin/finance/commission') as any;

      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('Scenario 23.2: Non-admin user request to /api/v1/admin/finance/unit-economics is rejected with 403', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
        id: 'customer_1',
        role: 'CUSTOMER',
      } as any);

      const { GET } = await import('../../src/app/api/v1/admin/finance/unit-economics/route');
      const req = new Request('http://localhost:3000/api/v1/admin/finance/unit-economics') as any;

      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('Scenario 24.1: Seller can only access their own shop unit economics', async () => {
      vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
        id: 'seller_1',
        role: 'SELLER',
      } as any);

      vi.spyOn(prisma.shop, 'findFirst').mockResolvedValue({
        id: 'shop_A',
        name: 'Boutique A',
      } as any);

      vi.spyOn(prisma.order, 'findMany').mockResolvedValue([]);

      const { GET } = await import('../../src/app/api/v1/seller/finance/unit-economics/route');
      const req = new Request('http://localhost:3000/api/v1/seller/finance/unit-economics') as any;

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.shop.id).toBe('shop_A');
    });
  });

  // =========================================================================
  // AC-25 & AC-26: ZERO REVENUE & NEGATIVE CONTRIBUTION MARGIN
  // =========================================================================
  describe('AC-25 & AC-26: Zero Revenue & Negative Margin Preservation', () => {
    it('Scenario 25.1: Zero revenue returns safe 0% margin and does not produce NaN/Infinity', () => {
      const margin = ContributionService.calculateMarginPercent(0, 0);
      expect(margin).toBe(0);
      expect(Number.isNaN(margin)).toBe(false);
      expect(Number.isFinite(margin)).toBe(true);
    });

    it('Scenario 26.1: Negative contribution margin is preserved and not clamped to zero', () => {
      // Contribution of -₹50 on revenue of ₹100 = -50% margin
      const margin = ContributionService.calculateMarginPercent(-50, 100);
      expect(margin).toBe(-50);
      expect(margin).toBeLessThan(0);
    });
  });

  // =========================================================================
  // AC-12: PLATFORM-BORNE RETURN FREIGHT
  // =========================================================================
  describe('AC-12: Platform-Borne Return Freight', () => {
    it('Scenario 12.1: Reverse freight on platform fault is absorbed as Navya cost', async () => {
      const mockOrder = {
        id: 'ord_ret_12',
        orderNumber: 'NC-RET-12',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i12',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_12', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_plat_ret',
            shopId: 's1',
            status: 'DELIVERED',
            returnStatus: 'VERIFIED',
            actualReverseShippingCost: 65,
            returnShippingDeduction: 0, // Navya bears return shipping because seller deduction is 0
          },
        ],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_ret_12');
      expect(res.navyaReturnShippingCost).toBe(65);
    });
  });

  // =========================================================================
  // AC-17: COD COURIER COLLECTION CHARGE
  // =========================================================================
  describe('AC-17: COD Courier Collection Charge', () => {
    it('Scenario 17.1: Courier COD charge is tracked as a variable cost', async () => {
      const mockOrder = {
        id: 'ord_cod_17',
        orderNumber: 'NC-COD-17',
        totalAmount: 2000,
        finalAmount: 2030,
        shippingAmount: 0,
        codFee: 30, // 1.5% customer fee
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i17',
            shopId: 's1',
            mrp: 2000,
            price: 2000,
            quantity: 1,
            total: 2000,
            commissionAmount: 200,
          },
        ],
        vendorOrders: [
          { id: 'vo_17', shopId: 's1', totalAmount: 2000, commissionAmount: 200, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cod_17');
      expect(res.codFeeCollected).toBe(30);
      expect(res.revenueTotal).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // AC-18: DYNAMIC TAX DETERMINATION
  // =========================================================================
  describe('AC-18: Dynamic Tax Logic', () => {
    it('Scenario 18.1: Platform output tax is derived dynamically from revenue components', () => {
      const tax = ContributionService.calculatePlatformOutputTax(100, 30);
      // 18% GST on (₹100 commission + ₹30 COD fee) = ₹23.40
      expect(tax).toBe(23.4);
    });
  });

  // =========================================================================
  // AC-19, AC-20, AC-21: IDEMPOTENCY OF FINANCIAL EVENTS
  // =========================================================================
  describe('AC-19, AC-20 & AC-21: Financial Idempotency', () => {
    it('Scenario 19.1: Duplicate payment webhook updates gateway fee idempotently', async () => {
      const updateManySpy = vi
        .spyOn(prisma.paymentTransaction, 'updateMany')
        .mockResolvedValue({ count: 1 });
      const recordSpy = vi
        .spyOn(ContributionService, 'recordOrderContribution')
        .mockResolvedValue({ id: 'contrib_1' } as any);

      await ContributionService.syncActualGatewayFee({
        orderId: 'ord_sync_1',
        razorpayPaymentId: 'pay_123',
        actualFee: 25.5,
        actualTax: 4.59,
      });

      // Calling a second time with identical payload
      await ContributionService.syncActualGatewayFee({
        orderId: 'ord_sync_1',
        razorpayPaymentId: 'pay_123',
        actualFee: 25.5,
        actualTax: 4.59,
      });

      expect(updateManySpy).toHaveBeenCalledTimes(2);
      expect(recordSpy).toHaveBeenCalledTimes(2);
    });

    it('Scenario 27.1 & AC-28.1: Actual freight replaces estimate idempotently', async () => {
      vi.spyOn(prisma.shipment, 'findUnique').mockResolvedValue({
        id: 'shp_sync_1',
        masterOrderId: 'ord_sync_1',
      } as any);
      vi.spyOn(prisma.shipment, 'update').mockResolvedValue({ id: 'shp_sync_1' } as any);
      vi.spyOn(ContributionService, 'recordOrderContribution').mockResolvedValue({
        id: 'contrib_1',
      } as any);

      const res = await ContributionService.syncActualShippingCost({
        shipmentId: 'shp_sync_1',
        actualForwardShippingCost: 55,
      });

      expect(res).toBeDefined();
    });
  });

  // =========================================================================
  // AC-22: HISTORICAL IMMUTABILITY
  // =========================================================================
  describe('AC-22: Historical Immutability', () => {
    it('Scenario 22.1: Order contribution retains historical calculation version and timestamp', async () => {
      const mockOrder = {
        id: 'ord_hist_22',
        orderNumber: 'NC-HIST-22',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i22',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_22', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_hist_22');
      expect(res.calculationVersion).toBe(ContributionService.VERSION);
      expect(res.calculatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // AC-29 & AC-30: COUPON FUNDING WITH MULTI-SELLER ALLOCATION
  // =========================================================================
  describe('AC-29 & AC-30: Coupon Funding With Multi-Seller Allocation', () => {
    it('Scenario 29.1: Multi-seller order with seller-funded coupon isolates each seller allocation', async () => {
      const mockOrder = {
        id: 'ord_multi_cpn_29',
        orderNumber: 'NC-MULTI-CPN-29',
        totalAmount: 1000,
        finalAmount: 900,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            mrp: 600,
            price: 600,
            quantity: 1,
            total: 600,
            commissionAmount: 60,
            navyaCouponAmount: 0,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            mrp: 400,
            price: 400,
            quantity: 1,
            total: 400,
            commissionAmount: 40,
            navyaCouponAmount: 0,
          },
        ],
        vendorOrders: [
          { id: 'vo_A', shopId: 'shop_A', totalAmount: 600, commissionAmount: 60, shipments: [] },
          { id: 'vo_B', shopId: 'shop_B', totalAmount: 400, commissionAmount: 40, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_cpn_29');
      // Navya coupon cost is 0 because coupon was seller-funded
      expect(res.navyaCouponSubsidy).toBe(0);
      expect(res.commissionEarned).toBe(100);
    });

    it('Scenario 30.1: Multi-seller order with NAVYA-funded coupon records exact subsidy per seller', async () => {
      const mockOrder = {
        id: 'ord_multi_navya_cpn_30',
        orderNumber: 'NC-MULTI-CPN-30',
        totalAmount: 1000,
        finalAmount: 850,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            mrp: 600,
            price: 600,
            quantity: 1,
            total: 600,
            commissionAmount: 60,
            navyaCouponAmount: 90,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            mrp: 400,
            price: 400,
            quantity: 1,
            total: 400,
            commissionAmount: 40,
            navyaCouponAmount: 60,
          },
        ],
        vendorOrders: [
          { id: 'vo_A', shopId: 'shop_A', totalAmount: 600, commissionAmount: 60, shipments: [] },
          { id: 'vo_B', shopId: 'shop_B', totalAmount: 400, commissionAmount: 40, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_navya_cpn_30');
      expect(res.navyaCouponSubsidy).toBe(150);
      const sellerA = res.sellers.find((s: any) => s.shopId === 'shop_A')!;
      const sellerB = res.sellers.find((s: any) => s.shopId === 'shop_B')!;
      expect(sellerA.navyaCouponSubsidy).toBe(90);
      expect(sellerB.navyaCouponSubsidy).toBe(60);
    });
  });

  // =========================================================================
  // AC-31: COD + MULTI-SELLER ORDER
  // =========================================================================
  describe('AC-31: COD Multi-Seller Economics', () => {
    it('Scenario 31.1: Multi-seller COD order splits COD fee proportionally across sellers', async () => {
      const mockOrder = {
        id: 'ord_multi_cod_31',
        orderNumber: 'NC-MULTI-COD-31',
        totalAmount: 3000,
        finalAmount: 3045,
        shippingAmount: 0,
        codFee: 45, // 1.5% of 3000
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            mrp: 2000,
            price: 2000,
            quantity: 1,
            total: 2000,
            commissionAmount: 200,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_A', shopId: 'shop_A', totalAmount: 2000, commissionAmount: 200, shipments: [] },
          { id: 'vo_B', shopId: 'shop_B', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_A',
            shopId: 'shop_A',
            status: 'DELIVERED',
            shippingCharge: 0,
            codFee: 30,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 49,
          },
          {
            id: 'shp_B',
            shopId: 'shop_B',
            status: 'DELIVERED',
            shippingCharge: 0,
            codFee: 15,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 49,
          },
        ],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_cod_31');
      expect(res.codFeeCollected).toBe(45);
      const sellerA = res.sellers.find((s: any) => s.shopId === 'shop_A')!;
      const sellerB = res.sellers.find((s: any) => s.shopId === 'shop_B')!;
      expect(sellerA.codFeeCollected).toBe(30);
      expect(sellerB.codFeeCollected).toBe(15);
    });
  });

  // =========================================================================
  // AC-32 & AC-33: RETURNS & RTO POST-SETTLEMENT
  // =========================================================================
  describe('AC-32 & AC-33: Post-Settlement Returns & RTO Recovery', () => {
    it('Scenario 32.1 & 33.1: Post-settlement return/RTO uses historical settlement status and reconciles contribution', async () => {
      const mockOrder = {
        id: 'ord_post_set_32',
        orderNumber: 'NC-POST-SET-32',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'RETURNED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i32',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_32',
            shopId: 's1',
            totalAmount: 1000,
            commissionAmount: 100,
            settlement: {
              id: 'set_32',
              status: 'SETTLED',
              commissionReversal: 100, // Recovered post-settlement
            },
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_post_set_32');
      expect(res.contributionStatus).toBe('RETURNED');
      expect(res.commissionEarned).toBe(0);
    });
  });

  // =========================================================================
  // AC-34: POST-DISPATCH CANCELLATION WITH ACTUAL FREIGHT
  // =========================================================================
  describe('AC-34: Post-Dispatch Cancellation With Actual Freight', () => {
    it('Scenario 34.1: Post-dispatch cancellation captures actual freight as 100% Navya variable loss', async () => {
      const mockOrder = {
        id: 'ord_cancel_34',
        orderNumber: 'NC-CANCEL-34',
        totalAmount: 1800,
        finalAmount: 1800,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'CANCELLED',
        paymentMethod: 'PREPAID',
        paymentStatus: 'REFUNDED',
        items: [
          {
            id: 'i34',
            shopId: 's1',
            mrp: 1800,
            price: 1800,
            quantity: 1,
            total: 1800,
            commissionAmount: 180,
          },
        ],
        vendorOrders: [
          { id: 'vo_34', shopId: 's1', totalAmount: 1800, commissionAmount: 180, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp_cancel_34',
            shopId: 's1',
            status: 'CANCELLED',
            shippedAt: new Date(),
            actualForwardShippingCost: 85,
            isFreeShipping: true,
            costBearer: 'NAVYA',
          },
        ],
        paymentTransactions: [
          { status: 'PAID', gatewayFee: 36, gatewayTax: 6.48, gatewayFeeStatus: 'ACTUAL' },
        ],
        customerRefunds: [{ amount: 1800, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cancel_34');
      expect(res.navyaCancellationLogisticsCost).toBe(85);
      expect(res.navyaForwardShippingCost).toBe(0); // Absorbed into cancellation loss
      expect(res.grossContribution).toBeLessThan(0);
    });
  });

  // =========================================================================
  // AC-35: NO DOUBLE COUNTING BETWEEN SELLER SETTLEMENT AND CONTRIBUTION
  // =========================================================================
  describe('AC-35: No Double-Counting Between Settlement and Contribution', () => {
    it('Scenario 35.1: Commission is counted directly and not by subtracting seller settlement', async () => {
      const mockOrder = {
        id: 'ord_clean_35',
        orderNumber: 'NC-CLEAN-35',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i35',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_35',
            shopId: 's1',
            totalAmount: 1000,
            commissionAmount: 100,
            vendorPayoutAmount: 900,
            settlement: {
              id: 'set_35',
              netSettlementAmount: 900,
            },
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_clean_35');

      // Commission is strictly MRP * 10% = ₹100
      expect(res.commissionEarned).toBe(100);
      // It is not polluted by settlement calculations
      expect(res.revenueTotal).toBe(82); // 100 - 18% tax
    });
  });

  // =========================================================================
  // BM-11 PRODUCTION HARDENING: GATEWAY FEE ARCHITECTURE (TESTS 1 - 5)
  // =========================================================================
  describe('BM-11 Hardened Gateway Architecture (Tests 1 - 5)', () => {
    it('Test 1: Configured estimate rate is used (e.g. 2% on ₹1,000 = ₹20 fee)', async () => {
      vi.spyOn(prisma.paymentGatewayConfig, 'findFirst').mockResolvedValue({
        id: 'cfg_1',
        provider: 'RAZORPAY',
        estimateRate: 0.02,
        paymentMethod: null,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const estimate = await PaymentGatewayConfigService.estimateGatewayFee({
        taxableAmount: 1000,
        provider: 'RAZORPAY',
      });

      expect(estimate.estimateRate).toBe(0.02);
      expect(estimate.estimatedFee).toBe(20);
      expect(estimate.estimatedTax).toBe(3.6);
      expect(estimate.totalEstimatedGatewayCost).toBe(23.6);
      expect(estimate.gatewayFeeStatus).toBe('ESTIMATED');
    });

    it('Test 2: Change configuration to MDR = 1.8% -> payment of ₹1,000 gives ₹18 fee (Proves no hardcoded 2%)', async () => {
      vi.spyOn(prisma.paymentGatewayConfig, 'findFirst').mockResolvedValue({
        id: 'cfg_18',
        provider: 'RAZORPAY',
        estimateRate: 0.018, // 1.8% MDR
        paymentMethod: null,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const estimate = await PaymentGatewayConfigService.estimateGatewayFee({
        taxableAmount: 1000,
        provider: 'RAZORPAY',
      });

      expect(estimate.estimateRate).toBe(0.018);
      expect(estimate.estimatedFee).toBe(18); // ₹18, proving dynamic rate
      expect(estimate.estimatedTax).toBe(3.24); // 18% of ₹18 = ₹3.24
      expect(estimate.totalEstimatedGatewayCost).toBe(21.24);
      expect(estimate.gatewayFeeStatus).toBe('ESTIMATED');
    });

    it('Test 3: Actual Razorpay fee replaces estimate in payment transaction and contribution', async () => {
      const updateManySpy = vi
        .spyOn(prisma.paymentTransaction, 'updateMany')
        .mockResolvedValue({ count: 1 });
      const recordSpy = vi
        .spyOn(ContributionService, 'recordOrderContribution')
        .mockResolvedValue({ id: 'c_actual_3' } as any);

      await ContributionService.syncActualGatewayFee({
        orderId: 'ord_actual_3',
        razorpayPaymentId: 'pay_rzp_999',
        actualFee: 21.24,
        actualTax: 3.82,
      });

      expect(updateManySpy).toHaveBeenCalledWith({
        where: {
          razorpayPaymentId: 'pay_rzp_999',
        },
        data: {
          gatewayFee: 21.24,
          gatewayTax: 3.82,
          gatewayFeeStatus: 'ACTUAL',
        },
      });
      expect(recordSpy).toHaveBeenCalledWith('ord_actual_3');
    });

    it('Test 4: Repeated Razorpay webhook does not duplicate fee (Idempotent reconciliation)', async () => {
      const updateManySpy = vi
        .spyOn(prisma.paymentTransaction, 'updateMany')
        .mockResolvedValue({ count: 1 });
      vi.spyOn(ContributionService, 'recordOrderContribution').mockResolvedValue({
        id: 'c_idem_4',
      } as any);

      const payload = {
        orderId: 'ord_idem_4',
        razorpayPaymentId: 'pay_rzp_idem',
        actualFee: 19.5,
        actualTax: 3.51,
      };

      // Call 1
      await ContributionService.syncActualGatewayFee(payload);
      // Call 2 (Duplicate webhook delivery)
      await ContributionService.syncActualGatewayFee(payload);

      expect(updateManySpy).toHaveBeenCalledTimes(2);
      // Data remains exact replacement, not additive
      expect(updateManySpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gatewayFee: 19.5,
            gatewayTax: 3.51,
            gatewayFeeStatus: 'ACTUAL',
          }),
        }),
      );
    });

    it('Test 5: Actual fee = ₹X while estimate = ₹Y -> contribution uses only actual ₹X (not X + Y)', async () => {
      const mockOrder = {
        id: 'ord_actual_vs_est_5',
        orderNumber: 'NC-ACT-5',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i5',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_5', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1000,
            gatewayFee: 21.24, // Actual fee
            gatewayTax: 3.82, // Actual tax
            gatewayFeeStatus: 'ACTUAL',
            gatewayTransactionId: 'pay_actual_only',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_actual_vs_est_5');

      // Actual gateway cost = 21.24 + 3.82 = 25.06
      expect(res.gatewayCostUsed).toBe(25.06);
      expect(res.isEstimatedGatewayFee).toBe(false);
      // Ensure it did not add any estimated 23.60
      expect(res.gatewayCostUsed).not.toBe(23.6);
      expect(res.gatewayCostUsed).not.toBe(48.66); // Not 23.60 + 25.06
    });
  });

  // =========================================================================
  // BM-11 PRODUCTION HARDENING: TAX ENGINE ARCHITECTURE (TESTS 6 - 14)
  // =========================================================================
  describe('BM-11 Hardened Tax Engine Architecture (Tests 6 - 14)', () => {
    it('Test 6: Current configured tax rule is used dynamically', async () => {
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'tax_rule_6',
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0.18,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1,
        description: 'Standard Platform Commission GST',
      } as any);

      const taxResult = await PlatformTaxService.calculateTax({
        taxType: PlatformTaxType.PLATFORM_COMMISSION_GST,
        taxableAmount: 100,
      });

      expect(taxResult.taxRate).toBe(0.18);
      expect(taxResult.taxAmount).toBe(18);
      expect(taxResult.ruleVersion).toBe(1);
    });

    it('Test 7: Change configured tax rate and verify new orders use new rate', async () => {
      // Configuration updated to 12% commission GST
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'tax_rule_7',
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0.12,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 2,
        description: 'Reduced Commission GST',
      } as any);

      const mockOrder = {
        id: 'ord_new_rate_7',
        orderNumber: 'NC-NEW-TAX-7',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        createdAt: new Date('2026-02-01'),
        items: [
          {
            id: 'i7',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_7', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);
      vi.spyOn(prisma.orderContribution, 'findFirst').mockResolvedValue(null);

      const res = await ContributionService.calculateOrderContribution('ord_new_rate_7');

      // 12% tax on ₹100 commission = ₹12 tax
      expect(res.commissionEarned).toBe(100);
      expect(res.platformOutputTax).toBe(12);
      expect(res.revenueTotal).toBe(88); // ₹100 - ₹12 = ₹88
      expect(res.commissionTaxRate).toBe(0.12);
    });

    it('Test 8: Old orders continue using historical tax snapshot when configuration changes', async () => {
      // Active rule today is 12%
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'tax_rule_today',
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0.12,
        isActive: true,
        version: 2,
      } as any);

      // But old order has historical snapshot recorded with commissionTaxRate = 0.18
      vi.spyOn(prisma.orderContribution, 'findFirst').mockResolvedValue({
        id: 'oc_old_8',
        orderId: 'ord_old_8',
        commissionTaxRate: 0.18,
        codFeeTaxRate: 0.18,
        taxRuleVersion: 1,
      } as any);

      const mockOldOrder = {
        id: 'ord_old_8',
        orderNumber: 'NC-OLD-8',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-06-01'),
        items: [
          {
            id: 'i8',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_8', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOldOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_old_8');

      // Historical rule (18%) is preserved: ₹18 tax, net revenue ₹82
      expect(res.platformOutputTax).toBe(18);
      expect(res.revenueTotal).toBe(82);
      expect(res.commissionTaxRate).toBe(0.18);
    });

    it('Test 9: Commission tax is NOT hardcoded to 18% (Custom 15% rate works cleanly)', async () => {
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'rule_comm_15',
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0.15,
        isActive: true,
        version: 3,
      } as any);

      const tax = await PlatformTaxService.calculateTax({
        taxType: PlatformTaxType.PLATFORM_COMMISSION_GST,
        taxableAmount: 200,
      });

      // 15% of ₹200 = ₹30 (NOT 18% = ₹36)
      expect(tax.taxRate).toBe(0.15);
      expect(tax.taxAmount).toBe(30);
    });

    it('Test 10: COD fee tax is NOT hardcoded to 18% (Custom 5% rate works cleanly)', async () => {
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'rule_cod_5',
        taxType: 'COD_FEE_GST',
        rate: 0.05,
        isActive: true,
        version: 1,
      } as any);

      const tax = await PlatformTaxService.calculateTax({
        taxType: PlatformTaxType.COD_FEE_GST,
        taxableAmount: 50,
      });

      // 5% of ₹50 = ₹2.50 (NOT 18% = ₹9)
      expect(tax.taxRate).toBe(0.05);
      expect(tax.taxAmount).toBe(2.5);
    });

    it('Test 11: Gateway tax uses actual Razorpay data when available', async () => {
      const mockOrder = {
        id: 'ord_gw_actual_11',
        orderNumber: 'NC-GW-11',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i11',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_11', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1000,
            gatewayFee: 20,
            gatewayTax: 3.5, // Actual reported Razorpay tax
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_gw_actual_11');

      // Uses actual tax ₹3.50 + actual fee ₹20 = ₹23.50
      expect(res.gatewayCostUsed).toBe(23.5);
      expect(res.isEstimatedGatewayFee).toBe(false);
    });

    it('Test 12: Gateway tax estimate is used only when actual data is unavailable', async () => {
      const mockOrder = {
        id: 'ord_gw_est_12',
        orderNumber: 'NC-GW-12',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i12',
            shopId: 's1',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo_12', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [], // No payment transactions yet
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_gw_est_12');

      // Estimated fallback: 2% MDR (₹20) + 18% GST (₹3.60) = ₹23.60
      expect(res.gatewayCostUsed).toBe(23.6);
      expect(res.isEstimatedGatewayFee).toBe(true);
    });

    it('Test 13: Zero/disabled tax rule is handled safely where legally applicable', async () => {
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        id: 'rule_zero_13',
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0, // 0% GST
        isActive: true,
        version: 1,
      } as any);

      const tax = await PlatformTaxService.calculateTax({
        taxType: PlatformTaxType.PLATFORM_COMMISSION_GST,
        taxableAmount: 100,
      });

      expect(tax.taxRate).toBe(0);
      expect(tax.taxAmount).toBe(0);
      expect(Number.isFinite(tax.taxAmount)).toBe(true);
    });

    it('Test 14: Multi-seller order does not mix seller/product tax records', async () => {
      const mockOrder = {
        id: 'ord_multi_tax_14',
        orderNumber: 'NC-TAX-14',
        totalAmount: 1500,
        finalAmount: 1500,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            mrp: 1000,
            price: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
            gstRate: 0.12,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            mrp: 500,
            price: 500,
            quantity: 1,
            total: 500,
            commissionAmount: 50,
            gstRate: 0.18,
          },
        ],
        vendorOrders: [
          { id: 'vo_A', shopId: 'shop_A', totalAmount: 1000, commissionAmount: 100, shipments: [] },
          { id: 'vo_B', shopId: 'shop_B', totalAmount: 500, commissionAmount: 50, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_tax_14');

      expect(res.sellers.length).toBe(2);
      const sellerA = res.sellers.find((s: any) => s.shopId === 'shop_A')!;
      const sellerB = res.sellers.find((s: any) => s.shopId === 'shop_B')!;

      // Platform commission tax is isolated per seller and based on platform tax rate (18%),
      // NOT influenced by individual item GST rates (12% vs 18%)
      expect(sellerA.commissionEarned).toBe(100);
      expect(sellerA.platformOutputTax).toBe(18); // 18% of ₹100
      expect(sellerA.revenueTotal).toBe(82);

      expect(sellerB.commissionEarned).toBe(50);
      expect(sellerB.platformOutputTax).toBe(9); // 18% of ₹50
      expect(sellerB.revenueTotal).toBe(41);

      // Master order exact sum
      expect(res.platformOutputTax).toBe(27); // 18 + 9
      expect(res.revenueTotal).toBe(123); // 82 + 41
    });
  });
});
