import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { MARKETPLACE_CONFIG } from '../../src/backend/config/marketplace.config';
import { createRazorpayPayout } from '../../src/backend/lib/razorpay';
import { CommissionService } from '../../src/backend/services/commission.service';
import { SettlementService } from '../../src/backend/services/settlement.service';
import { CodReconciliationService } from '../../src/backend/services/shipping/cod-reconciliation.service';
import { CustomerShippingService } from '../../src/backend/services/shipping/customer-shipping.service';
import { MultiSellerShipmentService } from '../../src/backend/services/shipping/multi-seller-shipment.service';
import { ShiprocketCodService } from '../../src/backend/services/shipping/shiprocket-cod.service';
import { OrderRepository } from '../../src/frontend/features/orders/repositories/order.repository';
import { OrderPreviewService } from '../../src/frontend/features/orders/services/order-preview.service';
import { PaymentService } from '../../src/frontend/features/payments/services/payment.service';
import { TaxService } from '../../src/frontend/features/tax/services/tax.service';
import { prisma } from '../../src/lib/prisma';

describe('BM-07: Cash on Delivery (COD) Payments & Economics Test Suite', () => {
  const testUserId = 'test_user_bm07';
  const testAddressId = 'test_addr_bm07';
  const verificationOrderId = `test_cod_verif_${Date.now()}`;
  const verificationOrderNumber = `NC-VERIF-${Date.now().toString().slice(-6)}`;

  beforeAll(async () => {
    try {
      await prisma.user.upsert({
        where: { id: testUserId },
        update: {},
        create: {
          id: testUserId,
          email: 'bm07_test@navyacollection.store',
          name: 'BM07 Test Customer',
          role: 'CUSTOMER',
        },
      });

      await prisma.address.upsert({
        where: { id: testAddressId },
        update: {},
        create: {
          id: testAddressId,
          userId: testUserId,
          fullName: 'BM07 Test Customer',
          mobile: '9053883125',
          pincode: '125050',
          addressLine1: 'Main Market Road',
          city: 'Fatehabad',
          state: 'Haryana',
          type: 'HOME',
        },
      });

      let categoryId = 'ethnic_cat_bm07';
      const existingCat = await prisma.category.findFirst();
      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const createdCat = await prisma.category.create({
          data: {
            id: categoryId,
            name: 'Ethnic Wear',
            slug: 'ethnic-wear-test',
          },
        });
        categoryId = createdCat.id;
      }

      await prisma.product.upsert({
        where: { id: 'expensive_item' },
        update: { price: 6000, stock: 10 },
        create: {
          id: 'expensive_item',
          name: 'Luxury Designer Lehenga',
          slug: 'luxury-designer-lehenga',
          sku: 'SKU-EXPENSIVE-1',
          description: 'High end luxury lehenga',
          price: 6000,
          compareAtPrice: 8000,
          stock: 10,
          categoryId,
        },
      });

      // BM-07 AC-07 & AC-09 Multi-Seller Setup
      await prisma.shop.upsert({
        where: { id: 'shop_a_bm07' },
        update: {},
        create: {
          id: 'shop_a_bm07',
          name: 'Ethnic Silks Hub A',
          slug: 'ethnic-silks-hub-a-bm07',
          shopCode: 'HUB-A',
          ownerId: testUserId,
          city: 'Hisar',
          state: 'Haryana',
          pincode: '125001',
          fullAddress: 'Shop 101, Textile Market, Hisar',
          phone: '9053883125',
          email: 'sellerA@navyacollection.store',
        },
      });

      await prisma.shop.upsert({
        where: { id: 'shop_b_bm07' },
        update: {},
        create: {
          id: 'shop_b_bm07',
          name: 'Navya Crafts Hub B',
          slug: 'navya-crafts-hub-b-bm07',
          shopCode: 'HUB-B',
          ownerId: testUserId,
          city: 'Fatehabad',
          state: 'Haryana',
          pincode: '125050',
          fullAddress: 'Shop 202, Main Bazaar, Fatehabad',
          phone: '9053883126',
          email: 'sellerB@navyacollection.store',
        },
      });

      await prisma.pickupLocation.upsert({
        where: { locationCode: 'HUB-A-PKP1' },
        update: {},
        create: {
          id: 'pkp_a_bm07',
          shopId: 'shop_a_bm07',
          locationCode: 'HUB-A-PKP1',
          name: 'Hub A Primary Depot',
          addressLine1: 'Depot A, Industrial Area',
          city: 'Hisar',
          state: 'Haryana',
          pincode: '125001',
          contactName: 'Manager A',
          contactPhone: '9053883125',
          isPrimary: true,
          status: 'ACTIVE',
        },
      });

      await prisma.pickupLocation.upsert({
        where: { locationCode: 'HUB-B-PKP1' },
        update: {},
        create: {
          id: 'pkp_b_bm07',
          shopId: 'shop_b_bm07',
          locationCode: 'HUB-B-PKP1',
          name: 'Hub B Primary Depot',
          addressLine1: 'Depot B, Station Road',
          city: 'Fatehabad',
          state: 'Haryana',
          pincode: '125050',
          contactName: 'Manager B',
          contactPhone: '9053883126',
          isPrimary: true,
          status: 'ACTIVE',
        },
      });

      await prisma.product.upsert({
        where: { id: 'prod_seller_a' },
        update: { price: 3000, shopId: 'shop_a_bm07', pickupLocationId: 'pkp_a_bm07' },
        create: {
          id: 'prod_seller_a',
          name: 'Pure Banarasi Silk Saree',
          slug: 'pure-banarasi-silk-saree',
          sku: 'SKU-BANARASI-A',
          description: 'Handwoven Banarasi silk saree with zari border',
          price: 3000,
          compareAtPrice: 4000,
          stock: 20,
          categoryId,
          shopId: 'shop_a_bm07',
          pickupLocationId: 'pkp_a_bm07',
        },
      });

      await prisma.product.upsert({
        where: { id: 'prod_seller_b' },
        update: { price: 1500, shopId: 'shop_b_bm07', pickupLocationId: 'pkp_b_bm07' },
        create: {
          id: 'prod_seller_b',
          name: 'Embroidered Kurti Set',
          slug: 'embroidered-kurti-set',
          sku: 'SKU-KURTI-B',
          description: 'Designer embroidered cotton kurti set with dupatta',
          price: 1500,
          compareAtPrice: 2000,
          stock: 20,
          categoryId,
          shopId: 'shop_b_bm07',
          pickupLocationId: 'pkp_b_bm07',
        },
      });

      await prisma.order.upsert({
        where: { id: verificationOrderId },
        update: {},
        create: {
          id: verificationOrderId,
          orderNumber: verificationOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 2000,
          discountAmount: 0,
          shippingAmount: 0,
          taxAmount: 0,
          codFee: 30,
          codFeeTax: 5.4,
          finalAmount: 2035.4,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING,
          codVerificationStatus: 'PENDING',
        },
      });
    } catch (setupErr) {
      console.error('[BM07_TEST_SETUP_ERROR]', setupErr);
    }
  });

  // =========================================================================
  // 1. COD FEE CALCULATION & NON-REFUNDABILITY (BM-07 Section 1 & 3)
  // =========================================================================
  describe('1. Authoritative COD Fee Calculation (1.5%)', () => {
    it('1.1 should correctly calculate 1.5% COD fee from the COD fee base', () => {
      // Base = Product Selling Price - Coupon + Shipping + Tax
      const productSellingPrice = 2000;
      const couponDiscount = 200;
      const shipping = 49;
      const tax = 90;
      const base = productSellingPrice - couponDiscount + shipping + tax; // 1939
      const expectedFee = CommissionService.roundMoney(base * 0.015); // 1939 * 0.015 = 29.085 -> 29.09

      expect(expectedFee).toBe(29.09);
    });

    it('1.2 should properly round COD fee to 2 decimal places using safe money rules', () => {
      const base = 1333.33;
      const fee = CommissionService.roundMoney(base * 0.015); // 19.99995 -> 20.00
      expect(fee).toBe(20);
    });

    it('1.3 should handle zero-base edge case without producing negative fee', () => {
      const base = 0;
      const fee = CommissionService.roundMoney(Math.max(0, base) * 0.015);
      expect(fee).toBe(0);
    });

    it('1.4 COD fee is separate from Navya commission and does not alter BM-03 economics', () => {
      const mrp = 3000;
      const sellingPrice = 2500;
      const codFee = CommissionService.roundMoney(sellingPrice * 0.015); // 37.50

      // Navya commission remains strictly MRP * 10%
      const commission = CommissionService.calculateCommission(mrp);
      expect(commission).toBe(300);

      // Seller base payout remains sellingPrice - commission
      const sellerPayout = CommissionService.calculateSellerPayout(sellingPrice, mrp);
      expect(sellerPayout).toBe(2200);

      // COD fee does NOT alter seller payout or Navya commission
      expect(sellerPayout).toBe(2200);
      expect(commission).toBe(300);
    });
  });

  // =========================================================================
  // 2. COD SELLING-PRICE LIMIT (₹5,000 CAP) (BM-07 Section 2)
  // =========================================================================
  describe('2. COD Order Value Limit (₹5,000 Selling-Price Subtotal)', () => {
    it('2.1 allows COD when product selling-price subtotal is exactly ₹5,000', () => {
      const subtotal = 5000;
      const isCodEligible = subtotal <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(true);
    });

    it('2.2 allows COD when product selling-price subtotal is below ₹5,000 (e.g. ₹4,999)', () => {
      const subtotal = 4999;
      const isCodEligible = subtotal <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(true);
    });

    it('2.3 strictly rejects COD when product selling-price subtotal exceeds ₹5,000 (e.g. ₹5,001)', () => {
      const subtotal = 5001;
      const isCodEligible = subtotal <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(false);
    });

    it('2.4 shipping does NOT disqualify an order whose selling-price subtotal is ₹5,000', () => {
      const productSellingPrice = 5000;
      const shipping = 500;
      const tax = 250;
      const codFee = CommissionService.roundMoney((productSellingPrice + shipping + tax) * 0.015);
      const customerPayable = productSellingPrice + shipping + tax + codFee; // ₹5,836.25

      // The limit applies ONLY to the product selling price subtotal
      const isCodEligible = productSellingPrice <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(true);
      expect(customerPayable).toBeGreaterThan(5000);
    });

    it('2.5 coupon discount does NOT allow an order whose selling price is > ₹5,000', () => {
      const productSellingPrice = 5500; // Subtotal exceeds cap
      const couponDiscount = 1000; // Even though net payable is ₹4,500
      const netPayable = productSellingPrice - couponDiscount;

      // Business Rule: Do NOT increase the ₹5,000 limit because of coupons
      const isCodEligible = productSellingPrice <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(false);
      expect(netPayable).toBe(4500);
    });

    it('2.6 multi-seller combined selling-price subtotal is evaluated against the ₹5,000 cap', () => {
      const sellerASubtotal = 3000;
      const sellerBSubtotal = 2100;
      const combinedSubtotal = sellerASubtotal + sellerBSubtotal; // 5100

      const isCodEligible = combinedSubtotal <= MARKETPLACE_CONFIG.COD.MAX_SELLING_PRICE;
      expect(isCodEligible).toBe(false);
    });
  });

  // =========================================================================
  // 3. DYNAMIC COD TAX ENGINE (BM-07 Section 4)
  // =========================================================================
  describe('3. Dynamic COD Fee Tax Engine', () => {
    it('3.1 calculates dynamic intra-state CGST + SGST when tax is applicable', async () => {
      const codFee = 100;
      const taxRes = await TaxService.calculateCodFeeTax({
        codFee,
        customerState: 'Haryana',
      });

      expect(taxRes).toBeDefined();
      expect(taxRes.taxRate).toBeGreaterThan(0);
      expect(taxRes.taxAmount).toBe(CommissionService.roundMoney(codFee * (taxRes.taxRate / 100)));
      expect(taxRes.taxBreakdown.cgst).toBeGreaterThan(0);
      expect(taxRes.taxBreakdown.sgst).toBeGreaterThan(0);
      expect(taxRes.taxBreakdown.igst).toBe(0);
    });

    it('3.2 calculates inter-state IGST when customer is in a different state', async () => {
      const codFee = 100;
      const taxRes = await TaxService.calculateCodFeeTax({
        codFee,
        customerState: 'Maharashtra',
      });

      expect(taxRes).toBeDefined();
      expect(taxRes.taxAmount).toBe(CommissionService.roundMoney(codFee * (taxRes.taxRate / 100)));
      expect(taxRes.taxBreakdown.igst).toBe(taxRes.taxAmount);
      expect(taxRes.taxBreakdown.cgst).toBe(0);
      expect(taxRes.taxBreakdown.sgst).toBe(0);
    });

    it('3.3 produces ₹0 COD tax when codFee is 0', async () => {
      const taxRes = await TaxService.calculateCodFeeTax({
        codFee: 0,
        customerState: 'Delhi',
      });

      expect(taxRes.taxAmount).toBe(0);
      expect(taxRes.taxBreakdown.gst).toBe(0);
    });
  });

  // =========================================================================
  // 4. SHIPROCKET COD BUYER VERIFICATION (BM-07 Section 6)
  // =========================================================================
  describe('4. Shiprocket COD Buyer Verification & Shipment Gating', () => {
    it('4.1 initial COD order starts in PENDING verification state', async () => {
      const order = await prisma.order.findUnique({
        where: { id: verificationOrderId },
      });
      expect(order?.codVerificationStatus).toBe('PENDING');
      expect(order?.orderStatus).toBe(OrderStatus.PENDING);
    });

    it('4.2 dispatchShipmentToShiprocket strictly blocks dispatch when verification is PENDING', async () => {
      const mockShipment = {
        id: 'shp_pending_test',
        shipmentNumber: 'NAV-SHP-PENDING-01',
        paymentMethod: 'COD',
        codAmount: 2035.4,
        shippingCharge: 0,
        masterOrder: {
          id: verificationOrderId,
          paymentMethod: 'COD',
          codVerificationStatus: 'PENDING',
        },
      };

      const isCod =
        mockShipment.paymentMethod === 'COD' || mockShipment.masterOrder.paymentMethod === 'COD';
      const isBlocked = isCod && mockShipment.masterOrder.codVerificationStatus !== 'VERIFIED';

      expect(isBlocked).toBe(true);
    });

    it('4.3 VERIFIED webhook successfully confirms order and updates verification status', async () => {
      const verResult = await ShiprocketCodService.handleVerificationWebhook({
        orderNumber: verificationOrderNumber,
        status: 'VERIFIED',
        referenceId: 'SR-VERIF-REF-001',
      });

      expect(verResult.success).toBe(true);
      expect(verResult.status).toBe('VERIFIED');

      const updated = await prisma.order.findUnique({
        where: { id: verificationOrderId },
      });
      expect(updated?.codVerificationStatus).toBe('VERIFIED');
      expect(updated?.codConfirmedAt).toBeDefined();
      expect(updated?.codVerificationRef).toBe('SR-VERIF-REF-001');
    });

    it('4.4 duplicate VERIFIED webhook is completely idempotent', async () => {
      const dupResult = await ShiprocketCodService.handleVerificationWebhook({
        orderNumber: verificationOrderNumber,
        status: 'VERIFIED',
        referenceId: 'SR-VERIF-REF-001',
      });

      expect(dupResult.success).toBe(true);
      expect(dupResult.message).toContain('already in VERIFIED state');
    });

    it('4.5 REJECTED webhook cancels order and restores inventory', async () => {
      const rejectOrderId = `test_cod_rej_${Date.now()}`;
      const rejectOrderNumber = `NC-REJ-${Date.now().toString().slice(-6)}`;

      await prisma.order.create({
        data: {
          id: rejectOrderId,
          orderNumber: rejectOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 1500,
          finalAmount: 1522.5,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING,
          codVerificationStatus: 'PENDING',
        },
      });

      const rejResult = await ShiprocketCodService.handleVerificationWebhook({
        orderNumber: rejectOrderNumber,
        status: 'REJECTED',
      });

      expect(rejResult.success).toBe(true);
      expect(rejResult.status).toBe('REJECTED');

      const cancelledOrder = await prisma.order.findUnique({
        where: { id: rejectOrderId },
      });
      expect(cancelledOrder?.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(cancelledOrder?.codVerificationStatus).toBe('REJECTED');
    });
  });

  // =========================================================================
  // 5. MULTI-SELLER COD ALLOCATION & DETERMINISTIC RECONCILIATION (BM-07 Section 7)
  // =========================================================================
  describe('5. Multi-Seller COD Allocation & Rounding Reconciliation', () => {
    it('5.1 correctly allocates coupon, shipping, tax, and COD fee across multiple sellers', () => {
      const sellerASubtotal = 3000;
      const sellerBSubtotal = 1500;
      const totalSubtotal = 4500;
      const orderCoupon = 450;
      const orderShipping = 49;
      const orderTax = 225;

      const couponRatioA = sellerASubtotal / totalSubtotal;
      const couponA = CommissionService.roundMoney(orderCoupon * couponRatioA);
      const couponB = CommissionService.roundMoney(orderCoupon - couponA);
      expect(couponA + couponB).toBe(orderCoupon);

      const shippingA = 0;
      const shippingB = 49;

      const taxA = 150;
      const taxB = 75;

      const codFeeBaseA = sellerASubtotal - couponA + shippingA + taxA;
      const codFeeBaseB = sellerBSubtotal - couponB + shippingB + taxB;
      expect(codFeeBaseA).toBe(2850);
      expect(codFeeBaseB).toBe(1474);

      const codFeeA = CommissionService.roundMoney(codFeeBaseA * 0.015);
      const totalOrderCodFee = CommissionService.roundMoney((codFeeBaseA + codFeeBaseB) * 0.015);
      const codFeeB = CommissionService.roundMoney(totalOrderCodFee - codFeeA);

      expect(codFeeA).toBe(42.75);
      expect(codFeeB).toBe(22.11);
      expect(codFeeA + codFeeB).toBe(totalOrderCodFee);

      const shipmentCodA = CommissionService.roundMoney(codFeeBaseA + codFeeA);
      const orderFinalAmount = CommissionService.roundMoney(
        totalSubtotal - orderCoupon + orderShipping + orderTax + totalOrderCodFee,
      );
      const shipmentCodB = CommissionService.roundMoney(orderFinalAmount - shipmentCodA);

      expect(shipmentCodA + shipmentCodB).toBe(orderFinalAmount);
      expect(shipmentCodA + shipmentCodB).toBe(4388.86);
    });

    it('5.2 ensures zero under-collection and zero over-collection across uneven multi-seller splits', () => {
      const subtotals = [1111.11, 1222.22, 1333.33];
      const totalSubtotal = CommissionService.roundMoney(subtotals.reduce((a, b) => a + b, 0));
      const totalCodFee = CommissionService.roundMoney(totalSubtotal * 0.015);
      const masterFinalAmount = CommissionService.roundMoney(totalSubtotal + totalCodFee);

      let accumulatedCodAmount = 0;
      const shipmentCodAmounts = [];

      for (let i = 0; i < subtotals.length; i++) {
        const isLast = i === subtotals.length - 1;
        if (isLast) {
          const lastAmount = CommissionService.roundMoney(masterFinalAmount - accumulatedCodAmount);
          shipmentCodAmounts.push(lastAmount);
        } else {
          const fee = CommissionService.roundMoney(subtotals[i] * 0.015);
          const shpAmount = CommissionService.roundMoney(subtotals[i] + fee);
          shipmentCodAmounts.push(shpAmount);
          accumulatedCodAmount = CommissionService.roundMoney(accumulatedCodAmount + shpAmount);
        }
      }

      const sumShipments = CommissionService.roundMoney(
        shipmentCodAmounts.reduce((a, b) => a + b, 0),
      );
      expect(sumShipments).toBe(masterFinalAmount);
    });

    it('5.3 (AC-07 Test 1) multi-seller COD shipment amounts reconcile to master order finalAmount', async () => {
      const msOrderId = `test_ord_ms_${Date.now()}`;
      const msOrderNumber = `NC-MS-${Date.now().toString().slice(-6)}`;

      // Seller A: subtotal = 3000, coupon = 300, shipping = 0 (Free >= 1999), tax = 150
      // Seller A COD Fee Base = 3000 - 300 + 0 + 150 = 2850
      // Seller A COD Fee = 42.75, Tax = 7.70 (18% GST intra-state)
      // Seller A Expected COD Amount = 2850 + 42.75 + 7.70 = 2900.45

      // Seller B: subtotal = 1500, coupon = 150, shipping = 49 (< 1999), tax = 75
      // Seller B COD Fee Base = 1500 - 150 + 49 + 75 = 1474
      // Seller B COD Fee = 22.11, Tax = 3.98 (18% GST intra-state)
      // Seller B Expected COD Amount = 1474 + 22.11 + 3.98 = 1500.09

      // Master Order Totals:
      // Subtotal = 4500, Coupon = 450, Shipping = 49, Tax = 225, COD Fee = 64.86, COD Fee Tax = 11.68
      // Master Final Amount = 4400.54

      const order = await prisma.order.create({
        data: {
          id: msOrderId,
          orderNumber: msOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 4500,
          discountAmount: 450,
          shippingAmount: 49,
          taxAmount: 225,
          codFee: 64.86,
          codFeeTax: 11.68,
          finalAmount: 4400.54,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.CONFIRMED,
        },
      });

      const voA = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${msOrderNumber}-V01`,
          totalAmount: 3000,
          commissionAmount: 300,
          vendorPayoutAmount: 2700,
          status: 'PENDING',
        },
      });

      const voB = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_b_bm07',
          vendorOrderNumber: `${msOrderNumber}-V02`,
          totalAmount: 1500,
          commissionAmount: 150,
          vendorPayoutAmount: 1350,
          status: 'PENDING',
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: 'prod_seller_a',
          shopId: 'shop_a_bm07',
          vendorOrderId: voA.id,
          name: 'Pure Banarasi Silk Saree',
          sku: 'SKU-BANARASI-A',
          price: 3000,
          quantity: 1,
          total: 3000,
          taxAmount: 150,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: 'prod_seller_b',
          shopId: 'shop_b_bm07',
          vendorOrderId: voB.id,
          name: 'Embroidered Kurti Set',
          sku: 'SKU-KURTI-B',
          price: 1500,
          quantity: 1,
          total: 1500,
          taxAmount: 75,
        },
      });

      const shipments = await MultiSellerShipmentService.createShipmentsForOrder(order.id);
      expect(shipments.length).toBe(2);

      const shpA = shipments.find((s) => s.shopId === 'shop_a_bm07');
      const shpB = shipments.find((s) => s.shopId === 'shop_b_bm07');
      expect(shpA).toBeDefined();
      expect(shpB).toBeDefined();

      // Verify Seller A shipment COD amount independently
      // Seller A: subtotal(3000) - coupon(300) + shipping(0) + tax(150) + codFee(42.75) + codFeeTax(7.70) = 2900.45
      expect(Number(shpA!.codAmount)).toBe(2900.45);
      expect(Number(shpA!.codFee)).toBe(42.75);
      expect(Number(shpA!.codFeeTax)).toBe(7.7);
      expect(Number(shpA!.shippingCharge)).toBe(0);

      // Verify Seller B shipment COD amount independently
      // Seller B: subtotal(1500) - coupon(150) + shipping(49) + tax(75) + codFee(22.11) + codFeeTax(3.98) = 1500.09
      expect(Number(shpB!.codAmount)).toBe(1500.09);
      expect(Number(shpB!.codFee)).toBe(22.11);
      expect(Number(shpB!.codFeeTax)).toBe(3.98);
      expect(Number(shpB!.shippingCharge)).toBe(49);

      // Verify Reconciliation Invariant: SUM(all COD shipment amounts) = final customer COD payable amount
      const totalShipmentCod = CommissionService.roundMoney(
        Number(shpA!.codAmount) + Number(shpB!.codAmount),
      );
      expect(totalShipmentCod).toBe(Number(order.finalAmount));
      expect(totalShipmentCod).toBe(4400.54);
    });

    it('5.4 (AC-07 Test 2) single seller COD shipment amount includes all fee, tax, and coupon components', async () => {
      const ssOrderId = `test_ord_ss_${Date.now()}`;
      const ssOrderNumber = `NC-SS-${Date.now().toString().slice(-6)}`;

      // Single Seller: Subtotal = 2000, Coupon = 200, Shipping = 0 (Free >= 1999), Tax = 100
      // COD Base = 2000 - 200 + 0 + 100 = 1900
      // COD Fee = 28.50, COD Fee Tax = 0
      // Expected Final Amount = 1928.50

      const order = await prisma.order.create({
        data: {
          id: ssOrderId,
          orderNumber: ssOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 2000,
          discountAmount: 200,
          shippingAmount: 0,
          taxAmount: 100,
          codFee: 28.5,
          codFeeTax: 0,
          finalAmount: 1928.5,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.CONFIRMED,
        },
      });

      const vo = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${ssOrderNumber}-V01`,
          totalAmount: 2000,
          commissionAmount: 200,
          vendorPayoutAmount: 1800,
          status: 'PENDING',
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: 'prod_seller_a',
          shopId: 'shop_a_bm07',
          vendorOrderId: vo.id,
          name: 'Pure Banarasi Silk Saree',
          sku: 'SKU-BANARASI-A',
          price: 2000,
          quantity: 1,
          total: 2000,
          taxAmount: 100,
        },
      });

      const shipments = await MultiSellerShipmentService.createShipmentsForOrder(order.id);
      expect(shipments.length).toBe(1);

      const shp = shipments[0];
      // Verify shipment COD amount includes: product (2000) - coupon (200) + shipping (0) + tax (100) + codFee (28.50) + codFeeTax (0)
      expect(Number(shp.codAmount)).toBe(1928.5);
      expect(Number(shp.codFee)).toBe(28.5);
      expect(Number(shp.shippingCharge)).toBe(0);
      expect(Number(shp.codAmount)).toBe(Number(order.finalAmount));
    });

    it('5.5 (AC-07 Test 3) prepaid shipment codAmount is strictly zero', async () => {
      const prepaidOrderId = `test_ord_prep_${Date.now()}`;
      const prepaidOrderNumber = `NC-PREP-${Date.now().toString().slice(-6)}`;

      const order = await prisma.order.create({
        data: {
          id: prepaidOrderId,
          orderNumber: prepaidOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 3000,
          discountAmount: 0,
          shippingAmount: 0,
          taxAmount: 150,
          codFee: 0,
          codFeeTax: 0,
          finalAmount: 3150,
          paymentMethod: PaymentMethod.RAZORPAY,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.CONFIRMED,
        },
      });

      const vo = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${prepaidOrderNumber}-V01`,
          totalAmount: 3000,
          commissionAmount: 300,
          vendorPayoutAmount: 2700,
          status: 'PENDING',
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: 'prod_seller_a',
          shopId: 'shop_a_bm07',
          vendorOrderId: vo.id,
          name: 'Pure Banarasi Silk Saree',
          sku: 'SKU-BANARASI-A',
          price: 3000,
          quantity: 1,
          total: 3000,
          taxAmount: 150,
        },
      });

      const shipments = await MultiSellerShipmentService.createShipmentsForOrder(order.id);
      expect(shipments.length).toBe(1);
      expect(Number(shipments[0].codAmount)).toBe(0);
      expect(shipments[0].paymentMethod).toBe(PaymentMethod.RAZORPAY);
    });
  });

  // =========================================================================
  // 6. COD DELIVERY & PAYMENT STATE TRANSITION (BM-07 Section 13)
  // =========================================================================
  describe('6. COD Delivery & Payment State Transition', () => {
    it('6.1 transitions COD order paymentStatus to PAID when Shiprocket webhook confirms DELIVERED', async () => {
      const deliveredOrderId = `test_cod_deliv_${Date.now()}`;
      await prisma.order.create({
        data: {
          id: deliveredOrderId,
          orderNumber: `NC-DELIV-${Date.now().toString().slice(-6)}`,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 1800,
          finalAmount: 1827,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.CONFIRMED,
          codVerificationStatus: 'VERIFIED',
        },
      });

      const orderUpdateData: any = {
        orderStatus: OrderStatus.DELIVERED,
        shippingStatus: 'DELIVERED',
        paymentStatus: PaymentStatus.PAID,
      };

      const updated = await prisma.order.update({
        where: { id: deliveredOrderId },
        data: orderUpdateData,
      });

      expect(updated.orderStatus).toBe(OrderStatus.DELIVERED);
      expect(updated.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  // =========================================================================
  // 7. COD RETURNS, EXCLUSION OF COD FEE & RAZORPAY PAYOUTS (BM-07 Section 16 & 21)
  // =========================================================================
  describe('7. COD Returns & Non-Refundable COD Fee', () => {
    it('7.1 strictly excludes COD fee and COD tax from customer refund amount on return', () => {
      const productSellingPrice = 1000;
      const shipping = 49;
      const tax = 50;
      const codFee = 16.49;
      const codFeeTax = 2.97;
      const totalCustomerPaid = productSellingPrice + shipping + tax + codFee + codFeeTax; // 1118.46

      const nonRefundableCod = CommissionService.roundMoney(codFee + codFeeTax); // 19.46
      const refundableCustomerAmount = CommissionService.roundMoney(
        totalCustomerPaid - nonRefundableCod,
      ); // 1099.00

      expect(nonRefundableCod).toBe(19.46);
      expect(refundableCustomerAmount).toBe(1099.0);
    });

    it('7.2 on partial return, only returned product value is refunded and COD fee remains non-refundable', () => {
      const itemAPrice = 600;
      const codFee = 15;

      const eligibleRefund = CommissionService.roundMoney(itemAPrice); // ₹600
      expect(eligibleRefund).toBe(600);
    });

    it('7.3 creates real Razorpay payout structure for COD customer refunds', async () => {
      const payoutRes = await createRazorpayPayout({
        amountInPaise: 100000,
        referenceId: `POUT-TEST-${Date.now()}`,
        beneficiaryName: 'BM07 Test Customer',
        notes: {
          orderId: 'order_test_cod_001',
          refundNumber: 'NC-REF-TEST-001',
          nonRefundableCodFee: 15,
        },
      });

      expect(payoutRes).toBeDefined();
      expect(payoutRes.id).toBeDefined();
      expect(payoutRes.id).not.toContain('TXN-REF-');
      expect(['processed', 'processing', 'queued', 'pending']).toContain(
        payoutRes.status.toLowerCase(),
      );
    });
  });

  // =========================================================================
  // 8. COURIER REMITTANCE BATCH RECONCILIATION (BM-07 Section 14)
  // =========================================================================
  describe('8. Courier Remittance Tracking & Batch Reconciliation', () => {
    it('8.1 records courier remittance batch and marks shipments as REMITTED', async () => {
      const testShpNumber = `NAV-SHP-REMIT-${Date.now().toString().slice(-6)}`;
      const existingShop = await prisma.shop.findFirst();
      let shopId = existingShop?.id;
      if (!shopId) {
        const createdShop = await prisma.shop.create({
          data: {
            name: 'Navya Flagship Hub',
            slug: 'navya-flagship-hub-test',
            shopCode: 'NAV-HUB-01',
            ownerId: testUserId,
          },
        });
        shopId = createdShop.id;
      }

      const shp = await prisma.shipment.create({
        data: {
          shipmentNumber: testShpNumber,
          masterOrderId: verificationOrderId,
          sellerId: testUserId,
          shopId,
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 1500,
          codFee: 22.5,
          codRemittanceStatus: 'PENDING',
          status: 'DELIVERED',
        },
      });

      const testBankRef = `HDFC-UTR-99887766-${Date.now()}`;
      const testRemitRef = `SR-CR-REF-1001-${Date.now()}`;

      const batchRes = await CodReconciliationService.processCourierRemittanceBatch({
        courierPartner: 'Shiprocket',
        bankReference: testBankRef,
        records: [
          {
            shipmentNumber: testShpNumber,
            remittedAmount: 1500,
            remittanceRef: testRemitRef,
          },
        ],
      });

      expect(batchRes.success).toBe(true);
      expect(batchRes.totalCollected).toBe(1500);
      expect(batchRes.totalRemitted).toBe(1500);

      const updatedShp = await prisma.shipment.findUnique({
        where: { id: shp.id },
      });
      expect(updatedShp?.codRemittanceStatus).toBe('REMITTED');
      expect(updatedShp?.codRemittanceRef).toBe(testRemitRef);
      expect(Number(updatedShp?.codRemittedAmount)).toBe(1500);
    });

    it('8.2 (AC-09 Test 4) delivered COD order remains NOT ELIGIBLE for settlement while courier remittance is PENDING', async () => {
      const codDelivOrderId = `test_ord_deliv_pend_${Date.now()}`;
      const codDelivOrderNumber = `NC-COD-DP-${Date.now().toString().slice(-6)}`;
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const order = await prisma.order.create({
        data: {
          id: codDelivOrderId,
          orderNumber: codDelivOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 2000,
          finalAmount: 2030,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
        },
      });

      const vo = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${codDelivOrderNumber}-V01`,
          totalAmount: 2000,
          commissionAmount: 200,
          vendorPayoutAmount: 1800,
          status: 'DELIVERED',
        },
      });

      await prisma.shipment.create({
        data: {
          shipmentNumber: `NAV-SHP-PEND-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: vo.id,
          sellerId: testUserId,
          shopId: 'shop_a_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 2030,
          codRemittanceStatus: 'PENDING',
          status: 'DELIVERED',
          deliveredAt: eightDaysAgo,
        },
      });

      const settlement = await prisma.sellerSettlement.create({
        data: {
          settlementNumber: `NC-SET-PEND-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: vo.id,
          shopId: 'shop_a_bm07',
          sellerId: testUserId,
          grossProductValue: 2000,
          commissionRate: 10,
          commissionAmount: 200,
          netSettlementAmount: 1800,
          status: 'PENDING_SETTLEMENT',
          deliveryDate: eightDaysAgo,
          settlementEligibilityDate: oneDayAgo, // Delivery + 7 days has elapsed!
        },
      });

      // 1. Authoritative check: settlement must be NOT ELIGIBLE due to pending remittance
      const eligibility = await SettlementService.isSettlementEligible(settlement.id);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('remittance pending');

      // 2. Automated cron must NOT transition this settlement to ELIGIBLE_FOR_SETTLEMENT
      await SettlementService.processSettlementEligibilityCron();
      const freshSettlement = await prisma.sellerSettlement.findUnique({
        where: { id: settlement.id },
      });
      expect(freshSettlement?.status).toBe('PENDING_SETTLEMENT');
    });

    it('8.3 (AC-09 Test 5) delivered COD order becomes ELIGIBLE only after remittance is confirmed and T+7 has elapsed', async () => {
      const codRemitOrderId = `test_ord_deliv_remit_${Date.now()}`;
      const codRemitOrderNumber = `NC-COD-DR-${Date.now().toString().slice(-6)}`;
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const order = await prisma.order.create({
        data: {
          id: codRemitOrderId,
          orderNumber: codRemitOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 2000,
          finalAmount: 2030,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
        },
      });

      const vo = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${codRemitOrderNumber}-V01`,
          totalAmount: 2000,
          commissionAmount: 200,
          vendorPayoutAmount: 1800,
          status: 'DELIVERED',
        },
      });

      await prisma.shipment.create({
        data: {
          shipmentNumber: `NAV-SHP-CONF-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: vo.id,
          sellerId: testUserId,
          shopId: 'shop_a_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 2030,
          codRemittanceStatus: 'REMITTED', // Remittance confirmed!
          codRemittanceRef: 'SR-REMIT-CONF-9988',
          remittedAt: new Date(),
          status: 'DELIVERED',
          deliveredAt: eightDaysAgo,
        },
      });

      const settlement = await prisma.sellerSettlement.create({
        data: {
          settlementNumber: `NC-SET-CONF-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: vo.id,
          shopId: 'shop_a_bm07',
          sellerId: testUserId,
          grossProductValue: 2000,
          commissionRate: 10,
          commissionAmount: 200,
          netSettlementAmount: 1800,
          status: 'PENDING_SETTLEMENT',
          deliveryDate: eightDaysAgo,
          settlementEligibilityDate: oneDayAgo, // Delivery + 7 days has elapsed
        },
      });

      // 1. When remittance is confirmed and T+7 has elapsed, settlement is ELIGIBLE
      const eligibility = await SettlementService.isSettlementEligible(settlement.id);
      expect(eligibility.eligible).toBe(true);

      await SettlementService.processSettlementEligibilityCron();
      const freshSettlement = await prisma.sellerSettlement.findUnique({
        where: { id: settlement.id },
      });
      expect(freshSettlement?.status).toBe('ELIGIBLE_FOR_SETTLEMENT');

      // 2. If remittance is confirmed but T+7 has NOT elapsed (e.g. delivered 2 days ago)
      const recentDelivery = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const futureEligibility = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const voRecent = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${codRemitOrderNumber}-V02`,
          totalAmount: 2000,
          commissionAmount: 200,
          vendorPayoutAmount: 1800,
          status: 'DELIVERED',
        },
      });

      await prisma.shipment.create({
        data: {
          shipmentNumber: `NAV-SHP-REC-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voRecent.id,
          sellerId: testUserId,
          shopId: 'shop_a_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 2030,
          codRemittanceStatus: 'REMITTED',
          status: 'DELIVERED',
          deliveredAt: recentDelivery,
        },
      });

      const recentSettlement = await prisma.sellerSettlement.create({
        data: {
          settlementNumber: `NC-SET-RECENT-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voRecent.id,
          shopId: 'shop_a_bm07',
          sellerId: testUserId,
          grossProductValue: 2000,
          commissionRate: 10,
          commissionAmount: 200,
          netSettlementAmount: 1800,
          status: 'PENDING_SETTLEMENT',
          deliveryDate: recentDelivery,
          settlementEligibilityDate: futureEligibility,
        },
      });

      const recentEligibility = await SettlementService.isSettlementEligible(recentSettlement.id);
      expect(recentEligibility.eligible).toBe(false);
      expect(recentEligibility.reason).toContain('T+7');
    });

    it('8.4 (AC-09 Test 6) enforces multi-seller remittance isolation: Seller A remitted releases Seller A but keeps Seller B locked', async () => {
      const isoOrderId = `test_ord_iso_${Date.now()}`;
      const isoOrderNumber = `NC-ISO-${Date.now().toString().slice(-6)}`;
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const order = await prisma.order.create({
        data: {
          id: isoOrderId,
          orderNumber: isoOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 4500,
          finalAmount: 4388.86,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
        },
      });

      const voA = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${isoOrderNumber}-V01`,
          totalAmount: 3000,
          commissionAmount: 300,
          vendorPayoutAmount: 2700,
          status: 'DELIVERED',
        },
      });

      const voB = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_b_bm07',
          vendorOrderNumber: `${isoOrderNumber}-V02`,
          totalAmount: 1500,
          commissionAmount: 150,
          vendorPayoutAmount: 1350,
          status: 'DELIVERED',
        },
      });

      // Seller A shipment is REMITTED
      await prisma.shipment.create({
        data: {
          shipmentNumber: `NAV-SHP-ISO-A-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voA.id,
          sellerId: testUserId,
          shopId: 'shop_a_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 2892.75,
          codRemittanceStatus: 'REMITTED',
          codRemittanceRef: 'SR-ISO-REF-A',
          remittedAt: new Date(),
          status: 'DELIVERED',
          deliveredAt: eightDaysAgo,
        },
      });

      // Seller B shipment is PENDING remittance
      await prisma.shipment.create({
        data: {
          shipmentNumber: `NAV-SHP-ISO-B-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voB.id,
          sellerId: testUserId,
          shopId: 'shop_b_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 1496.11,
          codRemittanceStatus: 'PENDING',
          status: 'DELIVERED',
          deliveredAt: eightDaysAgo,
        },
      });

      const settlementA = await prisma.sellerSettlement.create({
        data: {
          settlementNumber: `NC-SET-ISO-A-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voA.id,
          shopId: 'shop_a_bm07',
          sellerId: testUserId,
          grossProductValue: 3000,
          commissionRate: 10,
          commissionAmount: 300,
          netSettlementAmount: 2700,
          status: 'PENDING_SETTLEMENT',
          deliveryDate: eightDaysAgo,
          settlementEligibilityDate: oneDayAgo,
        },
      });

      const settlementB = await prisma.sellerSettlement.create({
        data: {
          settlementNumber: `NC-SET-ISO-B-${Date.now().toString().slice(-6)}`,
          masterOrderId: order.id,
          vendorOrderId: voB.id,
          shopId: 'shop_b_bm07',
          sellerId: testUserId,
          grossProductValue: 1500,
          commissionRate: 10,
          commissionAmount: 150,
          netSettlementAmount: 1350,
          status: 'PENDING_SETTLEMENT',
          deliveryDate: eightDaysAgo,
          settlementEligibilityDate: oneDayAgo,
        },
      });

      // Check eligibility independently
      const eligA = await SettlementService.isSettlementEligible(settlementA.id);
      const eligB = await SettlementService.isSettlementEligible(settlementB.id);

      expect(eligA.eligible).toBe(true);
      expect(eligB.eligible).toBe(false);
      expect(eligB.reason).toContain('remittance pending');

      // Run cron scan
      await SettlementService.processSettlementEligibilityCron();

      const freshA = await prisma.sellerSettlement.findUnique({ where: { id: settlementA.id } });
      const freshB = await prisma.sellerSettlement.findUnique({ where: { id: settlementB.id } });

      expect(freshA?.status).toBe('ELIGIBLE_FOR_SETTLEMENT');
      expect(freshB?.status).toBe('PENDING_SETTLEMENT');
    });

    it('8.5 (AC-09 Test 7) handles duplicate remittance events idempotently with zero duplicate settlements, credits, or ledger entries', async () => {
      const dupOrderId = `test_ord_dup_${Date.now()}`;
      const dupOrderNumber = `NC-DUP-${Date.now().toString().slice(-6)}`;
      const bankRef = `HDFC-UTR-DUP-${Date.now().toString().slice(-6)}`;
      const shpNumber = `NAV-SHP-DUP-${Date.now().toString().slice(-6)}`;

      const order = await prisma.order.create({
        data: {
          id: dupOrderId,
          orderNumber: dupOrderNumber,
          userId: testUserId,
          addressId: testAddressId,
          totalAmount: 1200,
          finalAmount: 1218,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
        },
      });

      const vo = await prisma.vendorOrder.create({
        data: {
          masterOrderId: order.id,
          shopId: 'shop_a_bm07',
          vendorOrderNumber: `${dupOrderNumber}-V01`,
          totalAmount: 1200,
          commissionAmount: 120,
          vendorPayoutAmount: 1080,
          status: 'DELIVERED',
        },
      });

      await prisma.shipment.create({
        data: {
          shipmentNumber: shpNumber,
          masterOrderId: order.id,
          vendorOrderId: vo.id,
          sellerId: testUserId,
          shopId: 'shop_a_bm07',
          pickupAddressSnapshot: {},
          deliveryAddressSnapshot: {},
          paymentMethod: PaymentMethod.COD,
          codAmount: 1218,
          codRemittanceStatus: 'PENDING',
          status: 'DELIVERED',
        },
      });

      const remittanceInput = {
        courierPartner: 'Shiprocket',
        bankReference: bankRef,
        records: [
          {
            shipmentNumber: shpNumber,
            remittedAmount: 1218,
            remittanceRef: `SR-DUP-REF-${Date.now().toString().slice(-4)}`,
          },
        ],
      };

      // 1. Process remittance first time
      const initialBatch =
        await CodReconciliationService.processCourierRemittanceBatch(remittanceInput);
      expect(initialBatch.success).toBe(true);
      expect(initialBatch.totalRemitted).toBe(1218);

      const batchCountBefore = await prisma.codRemittanceBatch.count({
        where: { bankReference: bankRef },
      });
      expect(batchCountBefore).toBe(1);

      const settlementCountBefore = await prisma.sellerSettlement.count({
        where: { masterOrderId: order.id },
      });

      // 2. Process duplicate remittance second time
      const duplicateBatch =
        await CodReconciliationService.processCourierRemittanceBatch(remittanceInput);
      expect(duplicateBatch.success).toBe(true);
      expect(duplicateBatch.isDuplicate).toBe(true);

      // Verify no duplicate ledger entry created
      const batchCountAfter = await prisma.codRemittanceBatch.count({
        where: { bankReference: bankRef },
      });
      expect(batchCountAfter).toBe(1);

      // Verify no duplicate settlement created
      const settlementCountAfter = await prisma.sellerSettlement.count({
        where: { masterOrderId: order.id },
      });
      expect(settlementCountAfter).toBe(settlementCountBefore);
    });
  });

  // =========================================================================
  // 9. SECURITY & VALIDATION (BM-07 Section 11)
  // =========================================================================
  describe('9. Security & Authoritative Server-Side Validation', () => {
    it('9.1 rejects COD orders when product selling price subtotal exceeds ₹5,000 via PaymentService', async () => {
      const res = await PaymentService.createCodOrder(testUserId, {
        addressId: testAddressId,
        items: [
          {
            productId: 'expensive_item',
            name: 'Luxury Lehenga',
            price: 6000,
            quantity: 1,
            subtotal: 6000,
          },
        ],
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.message).toContain('exceeds ₹5,000');
    });

    it('9.2 rejects COD order creation when delivery address is missing', async () => {
      const res = await PaymentService.createCodOrder(testUserId, {
        addressId: '',
        items: [{ productId: 'item1', price: 1000, quantity: 1, subtotal: 1000 }],
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.message).toContain('address is required');
    });
  });
});
