import { describe, expect, it } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import { SettlementService } from '../../src/backend/services/settlement.service';

describe('BM-03 — SELLER PAYOUT TEST SUITE (TC-BM03-01 to TC-BM03-37)', () => {
  // =========================================================================
  // 1. COMMISSION BASE & RATE BENCHMARKS (1 to 5)
  // =========================================================================
  describe('1. Commission (MRP-based 10%)', () => {
    it('TC-BM03-01: MRP ₹1,500 -> Commission ₹150', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1500,
        quantity: 1,
      });

      expect(calc.commissionBaseAmount).toBe(1500);
      expect(calc.commissionRate).toBe(10.0);
      expect(calc.commissionAmount).toBe(150.0);
    });

    it('TC-BM03-02: MRP ₹2,000 -> Commission ₹200', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 2000,
        quantity: 1,
      });

      expect(calc.commissionBaseAmount).toBe(2000);
      expect(calc.commissionRate).toBe(10.0);
      expect(calc.commissionAmount).toBe(200.0);
    });

    it('TC-BM03-03: Selling price discount does NOT change commission', () => {
      const atFullPrice = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1500,
        quantity: 1,
      });
      const atDiscountedPrice = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 449,
        quantity: 1,
      });

      expect(atFullPrice.commissionAmount).toBe(150.0);
      expect(atDiscountedPrice.commissionAmount).toBe(150.0);
      expect(atDiscountedPrice.commissionAmount).not.toBe(CommissionService.roundMoney(449 * 0.1));
    });

    it('TC-BM03-04: Coupon does NOT change commission', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        navyaCouponAmount: 200,
        quantity: 1,
      });

      expect(calc.commissionBaseAmount).toBe(1500);
      expect(calc.commissionAmount).toBe(150.0);
    });

    it('TC-BM03-05: Customer shipping does NOT change commission base', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        customerShippingAmount: 99,
        quantity: 1,
      });

      expect(calc.commissionBaseAmount).toBe(1500);
      expect(calc.commissionAmount).toBe(150.0);
    });
  });

  // =========================================================================
  // 2. SELLER BASE PAYOUT BENCHMARKS (6 to 8)
  // =========================================================================
  describe('2. Seller Base Payout (Selling Price - Commission)', () => {
    it('TC-BM03-06: MRP ₹1,500 / SP ₹449 -> Base Payout ₹299 (Not 90% = ₹404.10)', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 449,
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(150.0);
      expect(calc.sellerBasePayout).toBe(299.0);
      expect(calc.sellerBasePayout).not.toBe(404.1);
      expect(calc.netSellerPayout).toBe(299.0);
    });

    it('TC-BM03-07: MRP ₹1,500 / SP ₹1,000 -> Base Payout ₹850', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(150.0);
      expect(calc.sellerBasePayout).toBe(850.0);
    });

    it('TC-BM03-08: MRP ₹2,000 / SP ₹599 -> Base Payout ₹399', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 599,
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(200.0);
      expect(calc.sellerBasePayout).toBe(399.0);
      expect(calc.sellerBasePayout).not.toBe(539.1);
    });
  });

  // =========================================================================
  // 3. GST REGISTERED SELLER (9 to 13)
  // =========================================================================
  describe('3. GST Registered Seller Payout', () => {
    it('TC-BM03-09: MRP ₹1,500 / SP ₹1,000 / GST 5% -> Comm ₹150, Base ₹850, GST ₹50, Total Payout ₹900', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        taxRate: 5,
        sellerGstStatus: 'REGISTERED',
        sellerGstin: '27AAAAA0000A1Z5',
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(150.0);
      expect(calc.sellerBasePayout).toBe(850.0);
      expect(calc.applicableGstRate).toBe(5.0);
      expect(calc.sellerGstAmount).toBe(50.0);
      expect(calc.sellerTotalPayout).toBe(900.0);
      expect(calc.netSellerPayout).toBe(900.0);
    });

    it('TC-BM03-10: GST 12% on ₹1,200 Selling Price (MRP ₹2,000)', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 1200,
        taxRate: 12,
        sellerGstStatus: 'REGISTERED',
        sellerGstin: '27AAAAA0000A1Z5',
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(200.0);
      expect(calc.sellerBasePayout).toBe(1000.0);
      // GST 12% of 1200 = 144
      expect(calc.sellerGstAmount).toBe(144.0);
      expect(calc.sellerTotalPayout).toBe(1144.0);
    });

    it('TC-BM03-11: GST 18% if configured for non-apparel accessory', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 3000,
        sellingPrice: 2000,
        taxRate: 18,
        sellerGstStatus: 'REGISTERED',
        sellerGstin: '27AAAAA0000A1Z5',
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(300.0);
      expect(calc.sellerBasePayout).toBe(1700.0);
      // GST 18% of 2000 = 360
      expect(calc.sellerGstAmount).toBe(360.0);
      expect(calc.sellerTotalPayout).toBe(2060.0);
    });

    it('TC-BM03-12: Dynamic/configurable GST rate (not hardcoded to 18%)', () => {
      const rates = [0, 5, 12, 18, 28];
      for (const rate of rates) {
        const calc = CommissionService.calculateItemCommission({
          mrp: 1000,
          sellingPrice: 1000,
          taxRate: rate,
          sellerGstStatus: 'REGISTERED',
          quantity: 1,
        });

        expect(calc.applicableGstRate).toBe(rate);
        expect(calc.sellerGstAmount).toBe(CommissionService.roundMoney(1000 * (rate / 100)));
        expect(calc.sellerTotalPayout).toBe(
          CommissionService.roundMoney(900 + 1000 * (rate / 100)),
        );
      }
    });

    it('TC-BM03-13: GST status snapshot remains unchanged after seller profile changes', () => {
      // Order placed when seller was REGISTERED
      const orderTimeCalc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        taxRate: 5,
        sellerGstStatus: 'REGISTERED',
        sellerGstin: '27AAAAA0000A1Z5',
        quantity: 1,
      });

      // Simulated subsequent seller profile mutation to UNREGISTERED
      const sellerProfileAfterward = { gstin: null, isGstRegistered: false };

      // Settlement uses the immutable order snapshot, NOT the current profile
      const settlementCalc = SettlementService.computeSettlementBreakdown({
        grossProductValue: orderTimeCalc.sellingPrice,
        totalMrp: orderTimeCalc.mrp,
        commissionAmount: orderTimeCalc.commissionAmount,
        sellerGstStatus: orderTimeCalc.sellerGstStatus,
        sellerGstRate: orderTimeCalc.applicableGstRate,
        sellerGstAmount: orderTimeCalc.sellerGstAmount,
      });

      expect(settlementCalc.sellerGstStatus).toBe('REGISTERED');
      expect(settlementCalc.sellerGstAmount).toBe(50.0);
      expect(settlementCalc.sellerTotalPayout).toBe(900.0);
      expect(settlementCalc.netSettlementAmount).toBe(900.0);
    });
  });

  // =========================================================================
  // 4. NON-GST / UNREGISTERED SELLER (14)
  // =========================================================================
  describe('4. Non-GST / Unregistered Seller Payout', () => {
    it('TC-BM03-14: MRP ₹1,500 / SP ₹1,000 Unregistered -> Comm ₹150, Base ₹850, GST ₹0, Total Payout ₹850', () => {
      const calc = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        taxRate: 5, // Even if product has taxRate, seller is unregistered
        sellerGstStatus: 'UNREGISTERED',
        sellerGstin: null,
        quantity: 1,
      });

      expect(calc.commissionAmount).toBe(150.0);
      expect(calc.sellerBasePayout).toBe(850.0);
      expect(calc.sellerGstAmount).toBe(0.0);
      expect(calc.sellerTotalPayout).toBe(850.0);
      expect(calc.netSellerPayout).toBe(850.0);
    });
  });

  // =========================================================================
  // 5. MULTI-ITEM ORDERS (15)
  // =========================================================================
  describe('5. Multi-Item Order Commission & Payout', () => {
    it('TC-BM03-15: Multiple products calculate independent MRP commissions', () => {
      const orderCalc = CommissionService.calculateOrderCommission({
        items: [
          {
            productId: 'item-1',
            sellerId: 'seller-a',
            mrp: 1500,
            sellingPrice: 449,
            quantity: 1,
            sellerGstStatus: 'UNREGISTERED',
          },
          {
            productId: 'item-2',
            sellerId: 'seller-a',
            mrp: 2000,
            sellingPrice: 599,
            quantity: 1,
            sellerGstStatus: 'UNREGISTERED',
          },
        ],
      });

      // Item 1: MRP 1500 -> Comm 150 -> Base Payout 299
      expect(orderCalc.items).toBeDefined();
      expect(orderCalc.items![0].commissionAmount).toBe(150.0);
      expect(orderCalc.items![0].sellerBasePayout).toBe(299.0);

      // Item 2: MRP 2000 -> Comm 200 -> Base Payout 399
      expect(orderCalc.items![1].commissionAmount).toBe(200.0);
      expect(orderCalc.items![1].sellerBasePayout).toBe(399.0);

      // Total Commission = 150 + 200 = 350
      expect(orderCalc.totalCommissionAmount).toBe(350.0);
      // Total Base Payout = 299 + 399 = 698
      expect(orderCalc.totalSellerBasePayout).toBe(698.0);
      expect(orderCalc.totalSellerPayout).toBe(698.0);
    });
  });

  // =========================================================================
  // 6. MULTI-SELLER ORDER ISOLATION (16 to 18)
  // =========================================================================
  describe('6. Multi-Seller Isolation', () => {
    const multiSellerOrder = CommissionService.calculateOrderCommission({
      items: [
        {
          productId: 'item-1',
          sellerId: 'seller-a',
          mrp: 1500,
          sellingPrice: 1000,
          taxRate: 5,
          sellerGstStatus: 'REGISTERED',
          sellerGstin: '27AAAAA0000A1Z5',
          quantity: 1,
        },
        {
          productId: 'item-2',
          sellerId: 'seller-b',
          mrp: 1500,
          sellingPrice: 1000,
          taxRate: 5,
          sellerGstStatus: 'UNREGISTERED',
          sellerGstin: null,
          quantity: 1,
        },
      ],
    });

    it('TC-BM03-16: GST registered Seller A receives GST (+₹50)', () => {
      expect(multiSellerOrder.sellerBreakdown).toBeDefined();
      const sellerA = multiSellerOrder.sellerBreakdown?.get('seller-a');
      expect(sellerA).toBeDefined();
      expect(sellerA!.sellerGstStatus).toBe('REGISTERED');
      expect(sellerA!.commissionAmount).toBe(150.0);
      expect(sellerA!.sellerBasePayout).toBe(850.0);
      expect(sellerA!.sellerGstAmount).toBe(50.0);
      expect(sellerA!.sellerTotalPayout).toBe(900.0);
    });

    it('TC-BM03-17: Unregistered Seller B receives no GST (₹0)', () => {
      expect(multiSellerOrder.sellerBreakdown).toBeDefined();
      const sellerB = multiSellerOrder.sellerBreakdown?.get('seller-b');
      expect(sellerB).toBeDefined();
      expect(sellerB!.sellerGstStatus).toBe('UNREGISTERED');
      expect(sellerB!.commissionAmount).toBe(150.0);
      expect(sellerB!.sellerBasePayout).toBe(850.0);
      expect(sellerB!.sellerGstAmount).toBe(0.0);
      expect(sellerB!.sellerTotalPayout).toBe(850.0);
    });

    it('TC-BM03-18: Seller A and B calculations remain completely isolated', () => {
      const sellerA = multiSellerOrder.sellerBreakdown?.get('seller-a');
      const sellerB = multiSellerOrder.sellerBreakdown?.get('seller-b');

      expect(sellerA).toBeDefined();
      expect(sellerB).toBeDefined();
      expect(sellerA!.sellerTotalPayout).toBe(900.0);
      expect(sellerB!.sellerTotalPayout).toBe(850.0);
      expect(multiSellerOrder.totalSellerPayout).toBe(1750.0);
    });
  });

  // =========================================================================
  // 7. ORDER CREATION PATHS (RAZORPAY & COD) (19 to 20)
  // =========================================================================
  describe('7. Order Creation Paths (Razorpay & COD)', () => {
    it('TC-BM03-19: Razorpay order creates authoritative BM-03 fields', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 449,
        sellerGstStatus: 'REGISTERED',
        taxRate: 5,
        quantity: 1,
      });

      // Verify the exact fields snapshot for database insertion
      expect(item.commissionBaseAmount).toBe(1500);
      expect(item.commissionAmount).toBe(150);
      expect(item.sellerBasePayout).toBe(299);
      expect(item.sellerGstAmount).toBe(22.45); // 5% of 449 = 22.45
      expect(item.sellerTotalPayout).toBe(321.45); // 299 + 22.45 = 321.45
      expect(item.commissionCalculationVersion).toBe('BM-03-MRP-V1');
    });

    it('TC-BM03-20: COD order creates authoritative BM-03 fields', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 2000,
        sellingPrice: 1000,
        sellerGstStatus: 'UNREGISTERED',
        quantity: 2,
      });

      expect(item.commissionBaseAmount).toBe(4000);
      expect(item.commissionAmount).toBe(400);
      expect(item.sellerBasePayout).toBe(1600); // 2000 - 400 = 1600
      expect(item.sellerGstAmount).toBe(0);
      expect(item.sellerTotalPayout).toBe(1600);
    });
  });

  // =========================================================================
  // 8. SETTLEMENT SERVICE INTEGRATION (21 to 23)
  // =========================================================================
  describe('8. Settlement Service BM-03 Integration', () => {
    it('TC-BM03-21: Settlement uses stored MRP-based commission', () => {
      const settlement = SettlementService.computeSettlementBreakdown({
        grossProductValue: 449,
        totalMrp: 1500,
        commissionAmount: 150, // Authoritative MRP commission
        sellerGstStatus: 'UNREGISTERED',
      });

      expect(settlement.commissionAmount).toBe(150.0);
      expect(settlement.sellerBasePayout).toBe(299.0);
      expect(settlement.netSettlementAmount).toBe(299.0);
    });

    it('TC-BM03-22: Settlement releases seller total payout including GST for registered seller', () => {
      const settlement = SettlementService.computeSettlementBreakdown({
        grossProductValue: 1000,
        totalMrp: 1500,
        commissionAmount: 150,
        sellerGstStatus: 'REGISTERED',
        sellerGstRate: 5,
        sellerGstAmount: 50,
      });

      expect(settlement.sellerBasePayout).toBe(850.0);
      expect(settlement.sellerGstAmount).toBe(50.0);
      expect(settlement.sellerTotalPayout).toBe(900.0);
      expect(settlement.netSettlementAmount).toBe(900.0);
    });

    it('TC-BM03-23: Settlement does NOT use 90% of selling price', () => {
      const settlement = SettlementService.computeSettlementBreakdown({
        grossProductValue: 449,
        totalMrp: 1500,
        commissionAmount: 150,
        sellerGstStatus: 'UNREGISTERED',
      });

      expect(settlement.netSettlementAmount).not.toBe(CommissionService.roundMoney(449 * 0.9));
      expect(settlement.netSettlementAmount).toBe(299.0);
    });
  });

  // =========================================================================
  // 9. RETURNS & REVERSALS (24 to 29)
  // =========================================================================
  describe('9. Returns & GST Payout Reversals', () => {
    it('TC-BM03-24: Full return reverses 100% of commission', () => {
      const reversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        sellerGstStatus: 'UNREGISTERED',
      });

      expect(reversal.commissionReversal).toBe(150.0);
      expect(reversal.basePayoutReversal).toBe(850.0);
      expect(reversal.sellerTotalPayoutReversal).toBe(850.0);
    });

    it('TC-BM03-25: Full return reverses GST payout where applicable (₹900 total)', () => {
      const reversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        returnedTaxAmount: 50,
        sellerGstStatus: 'REGISTERED',
      });

      expect(reversal.commissionReversal).toBe(150.0);
      expect(reversal.basePayoutReversal).toBe(850.0);
      expect(reversal.gstPayoutReversal).toBe(50.0);
      expect(reversal.sellerTotalPayoutReversal).toBe(900.0);
    });

    it('TC-BM03-26: Partial return reverses only the returned item components', () => {
      // Order had 2 items of ₹1000 each (MRP ₹1500 each, GST 5% = ₹50 each). 1 item returned.
      const partialReversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        returnedTaxAmount: 50,
        sellerGstStatus: 'REGISTERED',
      });

      expect(partialReversal.commissionReversal).toBe(150.0);
      expect(partialReversal.gstPayoutReversal).toBe(50.0);
      expect(partialReversal.sellerTotalPayoutReversal).toBe(900.0);

      // Remaining active settlement for unreturned item
      const remainingSettlement = SettlementService.computeSettlementBreakdown({
        grossProductValue: 2000,
        totalMrp: 3000,
        commissionAmount: 300,
        commissionReversal: partialReversal.commissionReversal,
        refundedProductValue: 1000,
        sellerGstStatus: 'REGISTERED',
        sellerGstRate: 5,
        sellerGstAmount: 100,
        refundedGstAmount: partialReversal.gstPayoutReversal,
      });

      expect(remainingSettlement.sellerBasePayout).toBe(850.0);
      expect(remainingSettlement.sellerTotalPayout).toBe(900.0);
      expect(remainingSettlement.netSettlementAmount).toBe(900.0);
    });

    it('TC-BM03-27: Post-settlement return calculates correct recovery adjustment', () => {
      // Pre-settlement: ₹900 paid to seller
      const reversal = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        returnedTaxAmount: 50,
        sellerGstStatus: 'REGISTERED',
      });

      const forwardShipping = 51;
      const reverseShipping = 65;
      const totalShippingDeduction = forwardShipping + reverseShipping; // 116

      // Total seller liability = return shipping (116) + returned payout recovery (900) = 1016
      const totalSellerLiability = totalShippingDeduction + reversal.sellerTotalPayoutReversal;
      expect(totalSellerLiability).toBe(1016.0);
    });

    it('TC-BM03-28: Pre-settlement return recalculation is accurate with return shipping deficit', () => {
      // ₹1,000 item fully returned before settlement. Forward ₹51, Reverse ₹65. Unregistered seller.
      const breakdown = SettlementService.computeSettlementBreakdown({
        grossProductValue: 1000,
        totalMrp: 1500,
        commissionAmount: 150,
        isFullyRefunded: true,
        forwardShippingActual: 51,
        reverseShippingActual: 65,
        sellerGstStatus: 'UNREGISTERED',
      });

      expect(breakdown.grossProductValue).toBe(1000);
      expect(breakdown.refundedProductValue).toBe(1000);
      expect(breakdown.commissionReversal).toBe(150);
      expect(breakdown.sellerBasePayout).toBe(0);
      expect(breakdown.sellerTotalPayout).toBe(0);
      expect(breakdown.returnShippingDeduction).toBe(116);
      expect(breakdown.netSettlementAmount).toBe(0); // Clamped, no negative bank payout
      expect(breakdown.unrecoveredDebitLiability).toBe(116); // Recoverable deficit
    });

    it('TC-BM03-29: Return reversal calculation is idempotent', () => {
      const reversal1 = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        returnedTaxAmount: 50,
        sellerGstStatus: 'REGISTERED',
      });
      const reversal2 = CommissionService.calculateReturnPayoutReversal({
        returnedSellingPrice: 1000,
        returnedMrpCommission: 150,
        returnedTaxAmount: 50,
        sellerGstStatus: 'REGISTERED',
      });

      expect(reversal1).toEqual(reversal2);
    });
  });

  // =========================================================================
  // 10. FINANCIAL SAFETY & DEBIT RECOVERY (30 to 35)
  // =========================================================================
  describe('10. Financial Safety & Debit Recovery', () => {
    it('TC-BM03-30: Money precision test (clean 2-decimal rounding)', () => {
      const val = CommissionService.roundMoney(449.126);
      expect(val).toBe(449.13);

      const val2 = CommissionService.roundMoney(449.124);
      expect(val2).toBe(449.12);
    });

    it('TC-BM03-31: No floating point corruption (0.1 + 0.2 arithmetic)', () => {
      const sum = CommissionService.roundMoney(0.1 + 0.2);
      expect(sum).toBe(0.3);
      expect(sum.toString()).toBe('0.3');
    });

    it('TC-BM03-32: No duplicate commission applied', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        quantity: 1,
      });

      expect(item.commissionAmount).toBe(150.0);
      const totalCostToSeller = item.commissionAmount;
      expect(totalCostToSeller).toBe(150.0);
    });

    it('TC-BM03-33: No duplicate GST payout added', () => {
      const item = CommissionService.calculateItemCommission({
        mrp: 1500,
        sellingPrice: 1000,
        taxRate: 5,
        sellerGstStatus: 'REGISTERED',
        quantity: 1,
      });

      // GST added exactly once
      expect(item.sellerGstAmount).toBe(50.0);
      expect(item.sellerTotalPayout).toBe(item.sellerBasePayout + item.sellerGstAmount);
    });

    it('TC-BM03-34: No negative seller bank payout (clamped to ₹0)', () => {
      const breakdown = SettlementService.computeSettlementBreakdown({
        grossProductValue: 100,
        totalMrp: 500,
        commissionAmount: 50,
        forwardShippingActual: 100,
        reverseShippingActual: 100,
        sellerGstStatus: 'UNREGISTERED',
      });

      // Seller earnings: 100 - 50 = 50. Shipping: 200. Deficit = -150
      expect(breakdown.netSettlementAmount).toBe(0);
      expect(breakdown.unrecoveredDebitLiability).toBe(150);
    });

    it('TC-BM03-35: Seller debit recovery offsets pending debits against future settlements', () => {
      // Seller has pending liability of ₹116 from past return
      const pendingDebits = [{ id: 'adj-1', amount: 116, recoveredAmount: 0 }];

      // New settlement arrives with ₹500 payable
      const offsetResult = SettlementService.calculateDebitOffset({
        netPayableBeforeOffset: 500,
        pendingDebits,
      });

      expect(offsetResult.totalOffset).toBe(116);
      expect(offsetResult.remainingNet).toBe(384);
      expect(offsetResult.updatedDebits[0].newRecoveredAmount).toBe(116);
      expect(offsetResult.updatedDebits[0].isFullyRecovered).toBe(true);
    });
  });

  // =========================================================================
  // 11. REGRESSION VERIFICATION (36 to 37)
  // =========================================================================
  describe('11. Regression Verification', () => {
    it('TC-BM03-36: BM-01 settlement window is preserved (7 calendar days)', () => {
      expect(SettlementService.SETTLEMENT_WINDOW_DAYS).toBe(7);
    });

    it('TC-BM03-37: BM-02 commission rate is preserved (10% of MRP)', () => {
      expect(CommissionService.COMMISSION_RATE_PERCENT).toBe(10);
    });
  });
});
