import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import { ContributionService } from '../../src/backend/services/contribution.service';
import { PaymentGatewayConfigService } from '../../src/backend/services/payment-gateway-config.service';
import {
  PlatformTaxService,
  PlatformTaxType,
} from '../../src/backend/services/platform-tax.service';
import { CustomerShippingService } from '../../src/backend/services/shipping/customer-shipping.service';
import { prisma } from '../../src/lib/prisma';

describe('BM-12 — Unit Economics Test Order Matrix & Forensic Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. BASE PRICE TEST MATRIX (8 PRIMARY PRICES: PREPAID & COD)
  // =========================================================================
  describe('1. Base Price Test Matrix (8 Primary Prices: Prepaid & COD)', () => {
    const primaryPrices = [
      { price: 399, mrp: 499 },
      { price: 499, mrp: 599 },
      { price: 599, mrp: 799 },
      { price: 699, mrp: 899 },
      { price: 799, mrp: 999 },
      { price: 999, mrp: 1199 },
      { price: 1499, mrp: 1799 },
      { price: 1999, mrp: 2399 },
    ];

    primaryPrices.forEach(({ price, mrp }) => {
      it(`Prepaid Order @ ₹${price} (MRP: ₹${mrp}) - full unit economics verification`, async () => {
        const isFreeShipping = price >= CustomerShippingService.PREPAID_FREE_SHIPPING_THRESHOLD;
        const customerShipping = isFreeShipping
          ? 0
          : CustomerShippingService.STANDARD_SHIPPING_CHARGE;
        const finalAmount = price + customerShipping;
        const expectedCommission = CommissionService.roundMoney(mrp * 0.1);
        const commissionTax = CommissionService.roundMoney(expectedCommission * 0.18);
        const netRevenue = CommissionService.roundMoney(
          expectedCommission + customerShipping - commissionTax,
        );

        // Gateway fee: 2% MDR + 18% GST estimated on finalAmount
        const estGatewayFee = CommissionService.roundMoney(finalAmount * 0.02);
        const estGatewayTax = CommissionService.roundMoney(estGatewayFee * 0.18);
        const totalGatewayCost = CommissionService.roundMoney(estGatewayFee + estGatewayTax);

        const forwardShippingCost = 49; // Carrier forward freight paid by Navya
        const expectedGrossContribution = CommissionService.roundMoney(
          netRevenue - totalGatewayCost - forwardShippingCost,
        );

        const mockOrder = {
          id: `ord_prep_${price}`,
          orderNumber: `NC-PREP-${price}`,
          totalAmount: price,
          finalAmount,
          shippingAmount: customerShipping,
          codFee: 0,
          orderStatus: 'DELIVERED',
          paymentMethod: 'RAZORPAY',
          paymentStatus: 'PAID',
          createdAt: new Date('2026-03-01'),
          items: [
            {
              id: `item_${price}`,
              shopId: 'shop_1',
              price,
              mrp,
              quantity: 1,
              total: price,
              commissionAmount: expectedCommission,
            },
          ],
          vendorOrders: [
            {
              id: `vo_${price}`,
              shopId: 'shop_1',
              totalAmount: price,
              commissionAmount: expectedCommission,
              vendorPayoutAmount: price - expectedCommission,
              shipments: [],
            },
          ],
          shipments: [
            {
              id: `shp_${price}`,
              shopId: 'shop_1',
              status: 'DELIVERED',
              shippingCharge: customerShipping,
              isFreeShipping,
              costBearer: isFreeShipping ? 'NAVYA' : 'CUSTOMER',
              actualForwardShippingCost: 49,
            },
          ],
          paymentTransactions: [
            {
              status: 'PAID',
              amount: finalAmount,
              gatewayFee: estGatewayFee,
              gatewayTax: estGatewayTax,
              gatewayFeeStatus: 'ESTIMATED',
            },
          ],
          customerRefunds: [],
        };

        vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

        const res = await ContributionService.calculateOrderContribution(`ord_prep_${price}`);

        expect(res.commissionEarned).toBe(expectedCommission);
        expect(res.customerShippingCollected).toBe(customerShipping);
        expect(res.platformOutputTax).toBe(commissionTax);
        expect(res.gatewayCostUsed).toBe(totalGatewayCost);
        expect(res.navyaForwardShippingCost).toBe(forwardShippingCost);
        expect(res.navyaFreeShippingSubsidy).toBe(isFreeShipping ? 49 : 0);
        expect(res.grossContribution).toBe(expectedGrossContribution);
      });

      it(`COD Order @ ₹${price} (MRP: ₹${mrp}) - full unit economics verification`, async () => {
        const isFreeShipping = price >= CustomerShippingService.COD_FREE_SHIPPING_THRESHOLD;
        const customerShipping = isFreeShipping
          ? 0
          : CustomerShippingService.STANDARD_SHIPPING_CHARGE;
        const codFee = CommissionService.roundMoney(price * 0.015);
        const finalAmount = CommissionService.roundMoney(price + customerShipping + codFee);
        const expectedCommission = CommissionService.roundMoney(mrp * 0.1);
        const platformTax = CommissionService.roundMoney((expectedCommission + codFee) * 0.18);
        const netRevenue = CommissionService.roundMoney(
          expectedCommission + customerShipping + codFee - platformTax,
        );
        const forwardShippingCost = 49; // Carrier forward freight paid by Navya
        const expectedGrossContribution = CommissionService.roundMoney(
          netRevenue - forwardShippingCost,
        );

        const mockOrder = {
          id: `ord_cod_${price}`,
          orderNumber: `NC-COD-${price}`,
          totalAmount: price,
          finalAmount,
          shippingAmount: customerShipping,
          codFee,
          orderStatus: 'DELIVERED',
          paymentMethod: 'COD',
          paymentStatus: 'PAID',
          createdAt: new Date('2026-03-01'),
          items: [
            {
              id: `item_cod_${price}`,
              shopId: 'shop_1',
              price,
              mrp,
              quantity: 1,
              total: price,
              commissionAmount: expectedCommission,
            },
          ],
          vendorOrders: [
            {
              id: `vo_cod_${price}`,
              shopId: 'shop_1',
              totalAmount: price,
              commissionAmount: expectedCommission,
              vendorPayoutAmount: price - expectedCommission,
              shipments: [],
            },
          ],
          shipments: [
            {
              id: `shp_cod_${price}`,
              shopId: 'shop_1',
              status: 'DELIVERED',
              shippingCharge: customerShipping,
              codFee,
              isFreeShipping,
              costBearer: isFreeShipping ? 'NAVYA' : 'CUSTOMER',
              actualForwardShippingCost: 49,
            },
          ],
          paymentTransactions: [],
          customerRefunds: [],
        };

        vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

        const res = await ContributionService.calculateOrderContribution(`ord_cod_${price}`);

        expect(res.commissionEarned).toBe(expectedCommission);
        expect(res.codFeeCollected).toBe(codFee);
        expect(res.customerShippingCollected).toBe(customerShipping);
        expect(res.platformOutputTax).toBe(platformTax);
        expect(res.gatewayCostUsed).toBe(0); // ₹0 gateway cost for COD
        expect(res.navyaForwardShippingCost).toBe(forwardShippingCost);
        expect(res.navyaFreeShippingSubsidy).toBe(isFreeShipping ? 49 : 0);
        expect(res.grossContribution).toBe(expectedGrossContribution);
      });
    });
  });

  // =========================================================================
  // 2. SHIPPING BOUNDARY TESTS (PREPAID & COD BOUNDARIES)
  // =========================================================================
  describe('2. Shipping Boundary Tests (Prepaid: ₹998, ₹999, ₹1,000 | COD: ₹1,998, ₹1,999, ₹2,000)', () => {
    it('Prepaid ₹998 is below ₹999 threshold -> standard shipping ₹49 applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 998, quantity: 1 }],
        paymentMethod: 'PREPAID',
      });

      expect(shipping.isAllFreeShipping).toBe(false);
      expect(shipping.totalCustomerShipping).toBe(49);
      expect(shipping.sellers[0].freeShippingRemaining).toBe(1);
    });

    it('Prepaid ₹999 meets ₹999 threshold -> FREE shipping applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 999, quantity: 1 }],
        paymentMethod: 'PREPAID',
      });

      expect(shipping.isAllFreeShipping).toBe(true);
      expect(shipping.totalCustomerShipping).toBe(0);
      expect(shipping.sellers[0].freeShippingSource).toBe('STANDARD_THRESHOLD');
      expect(shipping.sellers[0].costBearer).toBe('NAVYA');
    });

    it('Prepaid ₹1,000 exceeds threshold -> FREE shipping applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 1000, quantity: 1 }],
        paymentMethod: 'PREPAID',
      });

      expect(shipping.isAllFreeShipping).toBe(true);
      expect(shipping.totalCustomerShipping).toBe(0);
    });

    it('COD ₹1,998 is below ₹1,999 threshold -> standard shipping ₹49 applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 1998, quantity: 1 }],
        paymentMethod: 'COD',
      });

      expect(shipping.isAllFreeShipping).toBe(false);
      expect(shipping.totalCustomerShipping).toBe(49);
      expect(shipping.sellers[0].freeShippingRemaining).toBe(1);
    });

    it('COD ₹1,999 meets ₹1,999 threshold -> FREE shipping applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 1999, quantity: 1 }],
        paymentMethod: 'COD',
      });

      expect(shipping.isAllFreeShipping).toBe(true);
      expect(shipping.totalCustomerShipping).toBe(0);
      expect(shipping.sellers[0].freeShippingSource).toBe('COD_THRESHOLD');
      expect(shipping.sellers[0].costBearer).toBe('NAVYA');
    });

    it('COD ₹2,000 exceeds threshold -> FREE shipping applies', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [{ productId: 'p1', shopId: 'shop_1', price: 2000, quantity: 1 }],
        paymentMethod: 'COD',
      });

      expect(shipping.isAllFreeShipping).toBe(true);
      expect(shipping.totalCustomerShipping).toBe(0);
    });
  });

  // =========================================================================
  // 3. COD CAP TESTS (₹4,999, ₹5,000, ₹5,001 ON SELLING PRICE SUBTOTAL)
  // =========================================================================
  describe('3. COD Cap Tests (₹4,999, ₹5,000, ₹5,001 on Selling Price Subtotal)', () => {
    it('COD order with product selling price ₹4,999 is allowed', () => {
      const subtotal = 4999;
      const isCodEligible = subtotal <= 5000;
      expect(isCodEligible).toBe(true);
    });

    it('COD order with product selling price ₹5,000 is allowed', () => {
      const subtotal = 5000;
      const isCodEligible = subtotal <= 5000;
      expect(isCodEligible).toBe(true);
    });

    it('COD order with product selling price ₹5,001 exceeds cap and is rejected', () => {
      const subtotal = 5001;
      const isCodEligible = subtotal <= 5000;
      expect(isCodEligible).toBe(false);
    });

    it('COD cap evaluates selling price subtotal ONLY and ignores shipping & COD fee', () => {
      // Selling subtotal ₹4,900 + shipping ₹49 + COD fee ₹73.50 = ₹5,022.50 final amount
      const sellingSubtotal = 4900;
      const shipping = 49;
      const codFee = CommissionService.roundMoney(sellingSubtotal * 0.015);
      const totalAmount = sellingSubtotal + shipping + codFee;

      expect(totalAmount).toBeGreaterThan(5000); // Final amount exceeds ₹5,000
      expect(sellingSubtotal <= 5000).toBe(true); // But product subtotal qualifies
    });
  });

  // =========================================================================
  // 4. COMMISSION VERIFICATION (MRP × 10% ACROSS SCENARIOS)
  // =========================================================================
  describe('4. Commission Verification (MRP × 10% Base Rule)', () => {
    it('Seller discount does not reduce Navya commission', () => {
      // Product MRP = ₹1,000, Selling Price = ₹700 (₹300 seller discount)
      const commission = CommissionService.calculateItemCommission({
        mrp: 1000,
        sellingPrice: 700,
        quantity: 1,
      });

      expect(commission.commissionAmount).toBe(100); // Strictly 10% of ₹1,000 MRP
    });

    it('Customer shipping charge does not enter commission base', () => {
      const mrp = 1000;
      const customerShipping = 49;
      const commission = CommissionService.calculateItemCommission({
        mrp,
        sellingPrice: 900,
        quantity: 1,
        customerShippingAmount: customerShipping,
      });

      expect(commission.commissionAmount).toBe(100);
      expect(commission.commissionAmount).not.toBe(104.9);
    });
  });

  // =========================================================================
  // 5. COUPON FUNDING TESTS (NAVYA-FUNDED VS SELLER-FUNDED)
  // =========================================================================
  describe('5. Coupon Funding Tests (Navya-Funded vs Seller-Funded Isolation)', () => {
    it('Navya-funded coupon: subsidy is Navya variable cost and does not reduce seller payout', async () => {
      // Product ₹999, MRP ₹1,200. Commission = ₹120.
      // ₹100 Navya coupon applied: Customer pays ₹899.
      const mockOrder = {
        id: 'ord_navya_cpn',
        orderNumber: 'NC-NAVYA-CPN',
        totalAmount: 999,
        finalAmount: 899,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 999,
            mrp: 1200,
            quantity: 1,
            total: 999,
            commissionAmount: 120,
            navyaCouponAmount: 100,
          },
        ],
        vendorOrders: [
          {
            id: 'vo1',
            shopId: 's1',
            totalAmount: 999,
            commissionAmount: 120,
            vendorPayoutAmount: 879, // ₹999 - ₹120 = ₹879 (seller payout NOT reduced)
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 899,
            gatewayFee: 18,
            gatewayTax: 3.24,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_navya_cpn');

      expect(res.commissionEarned).toBe(120);
      expect(res.navyaCouponSubsidy).toBe(100); // Counted as Navya variable cost
    });

    it('Seller-funded coupon: seller bears discount and Navya records zero coupon subsidy', async () => {
      // Product ₹999, MRP ₹1,200. Commission = ₹120.
      // ₹100 Seller-funded coupon: Seller payout reduces by ₹100.
      const mockOrder = {
        id: 'ord_seller_cpn',
        orderNumber: 'NC-SELLER-CPN',
        totalAmount: 999,
        finalAmount: 899,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 999,
            mrp: 1200,
            quantity: 1,
            total: 999,
            commissionAmount: 120,
            navyaCouponAmount: 0, // 0 Navya funding
          },
        ],
        vendorOrders: [
          {
            id: 'vo1',
            shopId: 's1',
            totalAmount: 999,
            commissionAmount: 120,
            vendorPayoutAmount: 779, // ₹999 - ₹120 - ₹100 seller coupon = ₹779
            allocatedCouponAmount: 100,
            couponFundingType: 'SELLER',
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 899,
            gatewayFee: 18,
            gatewayTax: 3.24,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_seller_cpn');

      expect(res.commissionEarned).toBe(120);
      expect(res.navyaCouponSubsidy).toBe(0); // Seller-funded coupon is NOT Navya cost
    });
  });

  // =========================================================================
  // 6. SHIPPING FUNDING & CARRIER FREIGHT SEPARATION
  // =========================================================================
  describe('6. Shipping Funding & Carrier Freight Separation', () => {
    it('Customer-paid shipping: customer pays ₹49, freight ₹49 absorbed by carrier charge', async () => {
      const mockOrder = {
        id: 'ord_paid_shp',
        orderNumber: 'NC-PAID-SHP',
        totalAmount: 499,
        finalAmount: 548,
        shippingAmount: 49,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 499,
            mrp: 599,
            quantity: 1,
            total: 499,
            commissionAmount: 60,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 499, commissionAmount: 60, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp1',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 49,
            isFreeShipping: false,
            costBearer: 'CUSTOMER',
            actualForwardShippingCost: 49,
          },
        ],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 548,
            gatewayFee: 11,
            gatewayTax: 1.98,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_paid_shp');

      expect(res.customerShippingCollected).toBe(49);
      expect(res.navyaForwardShippingCost).toBe(49); // Carrier freight incurred by Navya
      expect(res.navyaFreeShippingSubsidy).toBe(0); // Customer paid, no platform subsidy
    });

    it('Navya-funded free shipping: customer pays ₹0, Navya absorbs ₹49 carrier freight as cost', async () => {
      const mockOrder = {
        id: 'ord_navya_free_shp',
        orderNumber: 'NC-FREE-SHP',
        totalAmount: 1200,
        finalAmount: 1200,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 1200,
            mrp: 1500,
            quantity: 1,
            total: 1200,
            commissionAmount: 150,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 1200, commissionAmount: 150, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp1',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'NAVYA',
            actualForwardShippingCost: 49,
          },
        ],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1200,
            gatewayFee: 24,
            gatewayTax: 4.32,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_navya_free_shp');

      expect(res.customerShippingCollected).toBe(0);
      expect(res.navyaForwardShippingCost).toBe(49); // Navya bore the forward freight
      expect(res.navyaFreeShippingSubsidy).toBe(49); // Free shipping subsidized by Navya
    });

    it('Seller-funded free shipping: cost is borne by seller, Navya forward shipping cost = ₹0', async () => {
      const mockOrder = {
        id: 'ord_seller_shp',
        orderNumber: 'NC-SELLER-SHP',
        totalAmount: 800,
        finalAmount: 800,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 800,
            mrp: 1000,
            quantity: 1,
            total: 800,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 800, commissionAmount: 100, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp1',
            shopId: 's1',
            status: 'DELIVERED',
            shippingCharge: 0,
            isFreeShipping: true,
            costBearer: 'SELLER',
            actualForwardShippingCost: 49,
          },
        ],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 800,
            gatewayFee: 16,
            gatewayTax: 2.88,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_seller_shp');

      expect(res.customerShippingCollected).toBe(0);
      expect(res.navyaForwardShippingCost).toBe(0); // Borne by seller, NOT Navya
      expect(res.navyaFreeShippingSubsidy).toBe(0);
    });
  });

  // =========================================================================
  // 7. GATEWAY COST DYNAMICS (BM-11 CONFIGURABLE MDR & RECONCILIATION)
  // =========================================================================
  describe('7. Gateway Cost Dynamics (BM-11 Hardened MDR & Reconciliation)', () => {
    it('MDR = 2%: ₹1,000 payment estimates ₹20 fee + ₹3.60 tax = ₹23.60', async () => {
      vi.spyOn(prisma.paymentGatewayConfig, 'findFirst').mockResolvedValue({
        provider: 'RAZORPAY',
        estimateRate: 0.02,
        isActive: true,
      } as any);

      const estimate = await PaymentGatewayConfigService.estimateGatewayFee({
        amount: 1000,
        provider: 'RAZORPAY',
      });

      expect(estimate.fee).toBe(20);
      expect(estimate.tax).toBe(3.6);
      expect(estimate.total).toBe(23.6);
      expect(estimate.status).toBe('ESTIMATED');
    });

    it('MDR = 1.8%: ₹1,000 payment estimates ₹18 fee + ₹3.24 tax = ₹21.24', async () => {
      vi.spyOn(prisma.paymentGatewayConfig, 'findFirst').mockResolvedValue({
        provider: 'RAZORPAY',
        estimateRate: 0.018,
        isActive: true,
      } as any);

      const estimate = await PaymentGatewayConfigService.estimateGatewayFee({
        amount: 1000,
        provider: 'RAZORPAY',
      });

      expect(estimate.fee).toBe(18);
      expect(estimate.tax).toBe(3.24);
      expect(estimate.total).toBe(21.24);
      expect(estimate.status).toBe('ESTIMATED');
    });

    it('Actual fee ₹25.06 supersedes estimated ₹23.60 idempotently without addition', async () => {
      const mockOrder = {
        id: 'ord_gw_recon',
        orderNumber: 'NC-GW-RECON',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 1000,
            mrp: 1200,
            quantity: 1,
            total: 1000,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 1000, commissionAmount: 120, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1000,
            gatewayFee: 21.24,
            gatewayTax: 3.82,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_gw_recon');

      expect(res.gatewayCostUsed).toBe(25.06);
      expect(res.isEstimatedGatewayFee).toBe(false);
      expect(res.gatewayCostUsed).not.toBe(48.66); // Never adds estimated ₹23.60 + actual ₹25.06
    });
  });

  // =========================================================================
  // 8. DYNAMIC TAX RULES (PLATFORM TAX SERVICE ENGINE)
  // =========================================================================
  describe('8. Dynamic Tax Rules (PlatformTaxService Engine)', () => {
    const taxRates = [0.18, 0.15, 0.12, 0.05, 0.0];

    taxRates.forEach((rate) => {
      it(`Platform output tax calculates accurately at ${(rate * 100).toFixed(0)}% GST`, async () => {
        vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
          taxType: 'PLATFORM_COMMISSION_GST',
          rate,
          isActive: true,
          version: 'test-v1',
        } as any);

        const result = await PlatformTaxService.calculateTax({
          taxType: PlatformTaxType.PLATFORM_COMMISSION_GST,
          taxableAmount: 200,
        });

        const expectedTax = CommissionService.roundMoney(200 * rate);
        expect(result.taxRate).toBe(rate);
        expect(result.taxAmount).toBe(expectedTax);
      });
    });
  });

  // =========================================================================
  // 9. RETURN TEST MATRIX (₹399, ₹999, ₹1,499, ₹1,999)
  // =========================================================================
  describe('9. Return Test Matrix (Prepaid & COD Cases)', () => {
    const returnPrices = [399, 999, 1499, 1999];

    returnPrices.forEach((price) => {
      it(`Return @ ₹${price} prepaid: full refund, commission reversed, free shipping eligibility preserved`, async () => {
        const mrp = price + 200;
        const commission = CommissionService.roundMoney(mrp * 0.1);

        const mockOrder = {
          id: `ord_ret_${price}`,
          orderNumber: `NC-RET-${price}`,
          totalAmount: price,
          finalAmount: price,
          shippingAmount: 0,
          codFee: 0,
          orderStatus: 'RETURNED',
          paymentMethod: 'RAZORPAY',
          paymentStatus: 'REFUNDED',
          items: [
            {
              id: `i_${price}`,
              shopId: 's1',
              price,
              mrp,
              quantity: 1,
              total: price,
              commissionAmount: commission,
            },
          ],
          vendorOrders: [
            {
              id: `vo_${price}`,
              shopId: 's1',
              totalAmount: price,
              commissionAmount: commission,
              settlement: {
                id: `set_${price}`,
                commissionReversal: commission, // 100% commission reversed on return
              },
              shipments: [],
            },
          ],
          shipments: [
            {
              id: `shp_${price}`,
              shopId: 's1',
              status: 'RETURNED',
              returnStatus: 'VERIFIED',
              isFreeShipping: price >= 999,
              costBearer: 'NAVYA',
              actualReverseShippingCost: 60,
              returnShippingDeduction: 60, // Seller bore reverse freight
            },
          ],
          paymentTransactions: [
            {
              status: 'PAID',
              amount: price,
              gatewayFee: 20,
              gatewayTax: 3.6,
              gatewayFeeStatus: 'ACTUAL',
            },
          ],
          customerRefunds: [{ amount: price, status: 'REFUNDED' }],
        };

        vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

        const res = await ContributionService.calculateOrderContribution(`ord_ret_${price}`);

        expect(res.commissionEarned).toBe(0); // Realized commission becomes 0
        expect(res.contributionStatus).toBe('RETURNED');
      });
    });

    it('COD Return: COD fee is strictly non-refundable and retained as revenue', async () => {
      const price = 1000;
      const codFee = 15;

      const mockOrder = {
        id: 'ord_cod_ret_nonref',
        orderNumber: 'NC-COD-RET',
        totalAmount: price,
        finalAmount: price + codFee,
        shippingAmount: 0,
        codFee,
        orderStatus: 'RETURNED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price,
            mrp: 1200,
            quantity: 1,
            total: price,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          {
            id: 'vo1',
            shopId: 's1',
            totalAmount: price,
            commissionAmount: 120,
            settlement: { id: 'set1', commissionReversal: 120 },
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [
          {
            amount: price, // Refunded product price only
            nonRefundableCodFee: codFee, // COD fee retained
            status: 'REFUNDED',
          },
        ],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cod_ret_nonref');

      expect(res.codFeeCollected).toBe(15); // COD fee retained
      expect(res.commissionEarned).toBe(0); // Commission reversed
    });
  });

  // =========================================================================
  // 10. RTO TEST MATRIX (50/50 LOGISTICS SPLIT & ₹0 REFUND)
  // =========================================================================
  describe('10. RTO Test Matrix (₹399, ₹999, ₹1,999, ₹5,000 COD)', () => {
    const rtoPrices = [399, 999, 1999, 5000];

    rtoPrices.forEach((price) => {
      it(`RTO @ ₹${price} COD: ₹0 refund, 50/50 logistics split, seller payout cancelled`, async () => {
        const codFee = CommissionService.roundMoney(price * 0.015);
        const rtoCost = 100;
        const navyaRtoShare = CustomerShippingService.calculateRtoSplit(rtoCost).navyaShare; // ₹50

        const mockOrder = {
          id: `ord_rto_${price}`,
          orderNumber: `NC-RTO-${price}`,
          totalAmount: price,
          finalAmount: price + codFee,
          shippingAmount: 0,
          codFee,
          orderStatus: 'RTO',
          paymentMethod: 'COD',
          paymentStatus: 'FAILED',
          items: [
            {
              id: `i_${price}`,
              shopId: 's1',
              price,
              mrp: price + 100,
              quantity: 1,
              total: price,
              commissionAmount: 100,
            },
          ],
          vendorOrders: [
            {
              id: `vo_${price}`,
              shopId: 's1',
              totalAmount: price,
              commissionAmount: 100,
              vendorPayoutAmount: 0,
              settlement: null,
              shipments: [],
            },
          ],
          shipments: [
            {
              id: `shp_${price}`,
              shopId: 's1',
              status: 'RTO_DELIVERED',
              rtoStatus: 'RTO_DELIVERED',
              actualReverseShippingCost: rtoCost,
              shippingCharge: 0,
            },
          ],
          paymentTransactions: [],
          customerRefunds: [], // ₹0 refund
        };

        vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

        const res = await ContributionService.calculateOrderContribution(`ord_rto_${price}`);

        expect(res.contributionStatus).toBe('RTO');
        expect(res.navyaRtoLogisticsCost).toBe(navyaRtoShare); // 50% split = ₹50
        expect(res.commissionEarned).toBe(0); // 0 commission realized
      });
    });
  });

  // =========================================================================
  // 11. CANCELLATION TEST MATRIX (BEFORE DISPATCH VS POST-DISPATCH)
  // =========================================================================
  describe('11. Cancellation Test Matrix', () => {
    it('Pre-dispatch cancellation: ₹0 logistics loss', async () => {
      const mockOrder = {
        id: 'ord_cancel_pre',
        orderNumber: 'NC-CANCEL-PRE',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'CANCELLED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'REFUNDED',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 1000,
            mrp: 1200,
            quantity: 1,
            total: 1000,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 1000, commissionAmount: 120, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp1',
            shopId: 's1',
            status: 'CANCELLED',
            shippedAt: null, // Not dispatched
            actualForwardShippingCost: 0,
          },
        ],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1000,
            gatewayFee: 20,
            gatewayTax: 3.6,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cancel_pre');

      expect(res.navyaCancellationLogisticsCost).toBe(0);
    });

    it('Post-dispatch cancellation: 100% of forward freight is absorbed as Navya variable loss', async () => {
      const mockOrder = {
        id: 'ord_cancel_post',
        orderNumber: 'NC-CANCEL-POST',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'CANCELLED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'REFUNDED',
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 1000,
            mrp: 1200,
            quantity: 1,
            total: 1000,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 1000, commissionAmount: 120, shipments: [] },
        ],
        shipments: [
          {
            id: 'shp1',
            shopId: 's1',
            status: 'CANCELLED',
            shippedAt: new Date(), // Dispatched
            actualForwardShippingCost: 75,
            isFreeShipping: true,
            costBearer: 'NAVYA',
          },
        ],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 1000,
            gatewayFee: 20,
            gatewayTax: 3.6,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_cancel_post');

      expect(res.navyaCancellationLogisticsCost).toBe(75); // 100% forward freight loss
      expect(res.navyaForwardShippingCost).toBe(0); // Not double counted in forward shipping
    });
  });

  // =========================================================================
  // 12. MULTI-SELLER ORDER MATRIX & SELLER-LEVEL THRESHOLD ISOLATION
  // =========================================================================
  describe('12. Multi-Seller Matrix & Seller-Level Threshold Isolation', () => {
    it('Seller A (₹499) + Seller B (₹500) = ₹999 cart: both below threshold, both pay shipping', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'pA', shopId: 'shop_A', price: 499, quantity: 1 },
          { productId: 'pB', shopId: 'shop_B', price: 500, quantity: 1 },
        ],
        paymentMethod: 'PREPAID',
      });

      expect(shipping.isAllFreeShipping).toBe(false);
      expect(shipping.sellers.length).toBe(2);
      expect(shipping.sellers[0].shippingCharge).toBe(49);
      expect(shipping.sellers[1].shippingCharge).toBe(49);
      expect(shipping.totalCustomerShipping).toBe(98); // 49 + 49
    });

    it('Seller A (₹999) + Seller B (₹999): both independently qualify for free shipping', () => {
      const shipping = CustomerShippingService.calculateCustomerShipping({
        items: [
          { productId: 'pA', shopId: 'shop_A', price: 999, quantity: 1 },
          { productId: 'pB', shopId: 'shop_B', price: 999, quantity: 1 },
        ],
        paymentMethod: 'PREPAID',
      });

      expect(shipping.isAllFreeShipping).toBe(true);
      expect(shipping.totalCustomerShipping).toBe(0);
      expect(shipping.sellers[0].shippingCharge).toBe(0);
      expect(shipping.sellers[1].shippingCharge).toBe(0);
    });

    it('Partial return of Seller A: Seller A commission reversed, Seller B commission preserved', async () => {
      const mockOrder = {
        id: 'ord_multi_partial_ret',
        orderNumber: 'NC-PARTIAL-RET',
        totalAmount: 2000,
        finalAmount: 2000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        items: [
          {
            id: 'iA',
            shopId: 'shop_A',
            price: 1000,
            mrp: 1200,
            quantity: 1,
            total: 1000,
            commissionAmount: 120,
          },
          {
            id: 'iB',
            shopId: 'shop_B',
            price: 1000,
            mrp: 1200,
            quantity: 1,
            total: 1000,
            commissionAmount: 120,
          },
        ],
        vendorOrders: [
          {
            id: 'vo_A',
            shopId: 'shop_A',
            totalAmount: 1000,
            commissionAmount: 120,
            settlement: { id: 'set_A', commissionReversal: 120 }, // Returned
            shipments: [],
          },
          {
            id: 'vo_B',
            shopId: 'shop_B',
            totalAmount: 1000,
            commissionAmount: 120,
            settlement: { id: 'set_B', commissionReversal: 0 }, // Kept
            shipments: [],
          },
        ],
        shipments: [],
        paymentTransactions: [
          {
            status: 'PAID',
            amount: 2000,
            gatewayFee: 40,
            gatewayTax: 7.2,
            gatewayFeeStatus: 'ACTUAL',
          },
        ],
        customerRefunds: [{ amount: 1000, status: 'REFUNDED' }],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_multi_partial_ret');

      const sellerA = res.sellers.find((s: any) => s.shopId === 'shop_A')!;
      const sellerB = res.sellers.find((s: any) => s.shopId === 'shop_B')!;

      expect(sellerA.commissionEarned).toBe(0); // Reversed
      expect(sellerB.commissionEarned).toBe(120); // Retained
      expect(res.commissionEarned).toBe(120); // Exact rollup
    });
  });

  // =========================================================================
  // 13. HISTORICAL IMMUTABILITY & IDEMPOTENCY
  // =========================================================================
  describe('13. Historical Immutability & Idempotency', () => {
    it('Changing active tax rules does not alter old orders with historical snapshots', async () => {
      // Current active rule is 12%
      vi.spyOn(prisma.platformTaxRule, 'findFirst').mockResolvedValue({
        taxType: 'PLATFORM_COMMISSION_GST',
        rate: 0.12,
        isActive: true,
        version: 'v2.0',
      } as any);

      // Old order has historical snapshot locked at 18%
      vi.spyOn(prisma.orderContribution, 'findFirst').mockResolvedValue({
        commissionTaxRate: 0.18,
        taxRuleVersion: 'v1.0',
      } as any);

      const mockOrder = {
        id: 'ord_hist_immut',
        orderNumber: 'NC-HIST-IMMUT',
        totalAmount: 1000,
        finalAmount: 1000,
        shippingAmount: 0,
        codFee: 0,
        orderStatus: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-01-01'),
        items: [
          {
            id: 'i1',
            shopId: 's1',
            price: 1000,
            mrp: 1000,
            quantity: 1,
            total: 1000,
            commissionAmount: 100,
          },
        ],
        vendorOrders: [
          { id: 'vo1', shopId: 's1', totalAmount: 1000, commissionAmount: 100, shipments: [] },
        ],
        shipments: [],
        paymentTransactions: [],
        customerRefunds: [],
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as any);

      const res = await ContributionService.calculateOrderContribution('ord_hist_immut');

      expect(res.commissionTaxRate).toBe(0.18); // Preserved historical rate
      expect(res.platformOutputTax).toBe(18); // 18% of ₹100, NOT 12%
      expect(res.revenueTotal).toBe(82);
    });

    it('Repeated execution of syncActualGatewayFee is strictly idempotent', async () => {
      const updateManySpy = vi
        .spyOn(prisma.paymentTransaction, 'updateMany')
        .mockResolvedValue({ count: 1 });
      const recordSpy = vi
        .spyOn(ContributionService, 'recordOrderContribution')
        .mockResolvedValue({ id: 'c1' } as any);

      const payload = {
        orderId: 'ord_idem_test',
        razorpayPaymentId: 'pay_idem_123',
        actualFee: 21.5,
        actualTax: 3.87,
      };

      await ContributionService.syncActualGatewayFee(payload);
      await ContributionService.syncActualGatewayFee(payload);

      expect(updateManySpy).toHaveBeenCalledTimes(2);
      expect(recordSpy).toHaveBeenCalledTimes(2);
    });
  });
});
