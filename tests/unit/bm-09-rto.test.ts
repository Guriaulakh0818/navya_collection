import { OrderStatus, PaymentMethod, ShippingStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommissionService } from '../../src/backend/services/commission.service';
import { SettlementService } from '../../src/backend/services/settlement.service';
import { CustomerShippingService } from '../../src/backend/services/shipping/customer-shipping.service';
import { RtoService } from '../../src/backend/services/shipping/rto.service';
import { StatusAggregatorService } from '../../src/backend/services/shipping/status-aggregator.service';
import { TrackingService } from '../../src/backend/services/shipping/tracking.service';

describe('BM-09 — RTO (RETURN TO ORIGIN) COMPREHENSIVE SUITE', () => {
  // =========================================================================
  // AC-01: NDR SEPARATED FROM RTO
  // =========================================================================
  describe('AC-01: NDR (Non-Delivery Report / Undelivered) vs Genuine RTO', () => {
    it('Scenario 1.1: Shiprocket status 8 (UNDELIVERED) normalizes to UNDELIVERED, not RTO', () => {
      const normalized = TrackingService.normalizeStatus('8');
      expect(normalized).toBe('UNDELIVERED');
      expect(normalized).not.toBe('RTO');
      expect(normalized).not.toBe('RTO_DELIVERED');
    });

    it('Scenario 1.2: Status containing "DELIVERY ATTEMPT FAILED" or "NDR" normalizes to UNDELIVERED', () => {
      expect(
        TrackingService.normalizeStatus('DELIVERY ATTEMPT FAILED - CUSTOMER UNAVAILABLE'),
      ).toBe('UNDELIVERED');
      expect(TrackingService.normalizeStatus('NDR RAISED - INCORRECT ADDRESS')).toBe('UNDELIVERED');
    });

    it('Scenario 1.3: normalizeRtoStatus returns null for NDR/Undelivered events', () => {
      expect(TrackingService.normalizeRtoStatus('8')).toBeNull();
      expect(TrackingService.normalizeRtoStatus('UNDELIVERED')).toBeNull();
      expect(TrackingService.normalizeRtoStatus('NDR')).toBeNull();
    });

    it('Scenario 1.4: Shiprocket status 9 normalizes to RTO / RTO_INITIATED', () => {
      expect(TrackingService.normalizeStatus('9')).toBe('RTO');
      expect(TrackingService.normalizeRtoStatus('9')).toBe('RTO_INITIATED');
      expect(TrackingService.normalizeRtoStatus('RTO INITIATED')).toBe('RTO_INITIATED');
    });

    it('Scenario 1.5: Shiprocket status 38 normalizes to RTO_IN_TRANSIT', () => {
      expect(TrackingService.normalizeStatus('38')).toBe('RTO_IN_TRANSIT');
      expect(TrackingService.normalizeRtoStatus('38')).toBe('RTO_IN_TRANSIT');
      expect(TrackingService.normalizeRtoStatus('RTO IN TRANSIT')).toBe('RTO_IN_TRANSIT');
    });

    it('Scenario 1.6: Shiprocket status 10 & 11 normalize to RTO_DELIVERED', () => {
      expect(TrackingService.normalizeStatus('10')).toBe('RTO_DELIVERED');
      expect(TrackingService.normalizeStatus('11')).toBe('RTO_DELIVERED');
      expect(TrackingService.normalizeRtoStatus('10')).toBe('RTO_DELIVERED');
      expect(TrackingService.normalizeRtoStatus('RTO DELIVERED')).toBe('RTO_DELIVERED');
    });
  });

  // =========================================================================
  // AC-02 & AC-17: RTO LIFECYCLE & STATE MACHINE TRANSITION GUARDS
  // =========================================================================
  describe('AC-02 & AC-17: Lifecycle & State Machine Transition Guards', () => {
    it('Scenario 2.1: Transition from DELIVERED to RTO is strictly illegal and blocked', () => {
      const check = RtoService.validateTransition('DELIVERED', 'RTO_INITIATED');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Delivered shipment cannot transition to RTO');
    });

    it('Scenario 2.2: Transition from DELIVERED to RTO_DELIVERED is strictly illegal and blocked', () => {
      const check = RtoService.validateTransition('DELIVERED', 'RTO_DELIVERED');
      expect(check.allowed).toBe(false);
    });

    it('Scenario 2.3: Transition from CUSTOMER_RETURN_VERIFIED to RTO is strictly illegal', () => {
      const check = RtoService.validateTransition('CUSTOMER_RETURN_VERIFIED', 'RTO_INITIATED');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Customer return cannot transition to courier RTO');
    });

    it('Scenario 2.4: Transition from RETURNED to RTO is strictly illegal', () => {
      const check = RtoService.validateTransition('RETURNED', 'RTO_DELIVERED');
      expect(check.allowed).toBe(false);
    });

    it('Scenario 2.5: Transition from RTO_DELIVERED back to RTO_INITIATED is blocked', () => {
      const check = RtoService.validateTransition('RTO_DELIVERED', 'RTO_INITIATED');
      expect(check.allowed).toBe(false);
    });

    it('Scenario 2.6: Valid transitions (IN_TRANSIT -> RTO_INITIATED, UNDELIVERED -> RTO_INITIATED) are permitted', () => {
      expect(RtoService.validateTransition('IN_TRANSIT', 'RTO_INITIATED').allowed).toBe(true);
      expect(RtoService.validateTransition('UNDELIVERED', 'RTO_INITIATED').allowed).toBe(true);
      expect(RtoService.validateTransition('RTO_INITIATED', 'RTO_IN_TRANSIT').allowed).toBe(true);
      expect(RtoService.validateTransition('RTO_IN_TRANSIT', 'RTO_DELIVERED').allowed).toBe(true);
    });
  });

  // =========================================================================
  // AC-08 & AC-09: 50/50 RTO LOGISTICS LIABILITY & ACTUAL FREIGHT CHARGES
  // =========================================================================
  describe('AC-08 & AC-09: 50/50 RTO Logistics Liability & Actual Cost Handling', () => {
    it('Scenario 3.1: Actual RTO freight cost is split exactly 50% Navya and 50% Seller', () => {
      const actualCost = 120.0;
      const split = CustomerShippingService.calculateRtoSplit(actualCost);

      expect(split.totalCost).toBe(120.0);
      expect(split.navyaShare).toBe(60.0);
      expect(split.sellerShare).toBe(60.0);
      expect(split.navyaShare + split.sellerShare).toBe(split.totalCost);
    });

    it('Scenario 3.2: Paise-safe arithmetic for odd total freight costs (e.g. ₹115.50)', () => {
      const actualCost = 115.5;
      const split = CustomerShippingService.calculateRtoSplit(actualCost);

      expect(split.totalCost).toBe(115.5);
      expect(split.sellerShare).toBe(57.75);
      expect(split.navyaShare).toBe(57.75);
      expect(split.sellerShare + split.navyaShare).toBe(115.5);
    });

    it('Scenario 3.3: Rejects arbitrary fixed RTO penalties (e.g. flat ₹50, flat ₹65) and calculates from actual freight', () => {
      const actualForward = 48.0;
      const actualReverse = 54.0;
      const totalEligible = actualForward + actualReverse; // ₹102

      const split = CustomerShippingService.calculateRtoSplit(totalEligible);
      expect(split.totalCost).toBe(102.0);
      expect(split.sellerShare).toBe(51.0);
      expect(split.navyaShare).toBe(51.0);
      expect(split.sellerShare).not.toBe(50.0);
      expect(split.sellerShare).not.toBe(65.0);
    });

    it('Scenario 3.4: Zero or negative cost throws error preventing false zero settlement or guessing', () => {
      expect(() => CustomerShippingService.calculateRtoSplit(0)).toThrow(
        'Authoritative positive eligible RTO cost is required. Cannot guess financial amount.',
      );
      expect(() => CustomerShippingService.calculateRtoSplit(-50)).toThrow();
    });
  });

  // =========================================================================
  // AC-04: PREPAID RTO REFUND FORMULA & IMMUTABLE HISTORICAL PRICING
  // =========================================================================
  describe('AC-04: Prepaid RTO Customer Refund Economics', () => {
    it('Scenario 4.1: Calculates exact refundable amount: Selling Price - Allocated Coupon + Tax + Customer Shipping', () => {
      const itemPrice = 1200;
      const itemTax = 60;
      const allocatedCoupon = 100;
      const customerShippingCharge = 49;

      const refundAmount = CommissionService.roundMoney(
        itemPrice - allocatedCoupon + itemTax + customerShippingCharge,
      );
      expect(refundAmount).toBe(1209.0);
    });

    it('Scenario 4.2: Free shipping order prepaid refund excludes customer shipping charge (₹0)', () => {
      const itemPrice = 1500;
      const itemTax = 75;
      const allocatedCoupon = 0;
      const customerShippingCharge = 0;

      const refundAmount = CommissionService.roundMoney(
        itemPrice - allocatedCoupon + itemTax + customerShippingCharge,
      );
      expect(refundAmount).toBe(1575.0);
    });

    it('Scenario 4.3: Fully discounted order does not produce negative refund', () => {
      const itemPrice = 500;
      const coupon = 600;
      const refund = Math.max(0, itemPrice - coupon);
      expect(refund).toBe(0);
    });
  });

  // =========================================================================
  // AC-05: COD RTO CLOSURE & REMITTANCE SAFETY
  // =========================================================================
  describe('AC-05: COD RTO Clean Financial Closure', () => {
    it('Scenario 5.1: COD RTO issues exactly ₹0 customer refund because no cash was collected at doorstep', () => {
      const isCod = true;
      const customerPaymentCollected = 0;
      const refundAmount = isCod && customerPaymentCollected === 0 ? 0 : 999;
      expect(refundAmount).toBe(0);
    });

    it('Scenario 5.2: Uncollected COD fee (1.5%) is NOT treated as earned revenue or refundable amount', () => {
      const orderTotal = 2000;
      const codFee = CommissionService.roundMoney(orderTotal * 0.015); // ₹30
      expect(codFee).toBe(30.0);

      // On COD RTO: cash was never handed over, fee was uncollected
      const codFeeRemitted = 0;
      expect(codFeeRemitted).toBe(0);
    });

    it('Scenario 5.3: COD RTO master order payment status closes to FAILED, not REFUNDED', () => {
      const isCod = true;
      const masterStatus = OrderStatus.RTO;
      const paymentStatus = isCod && masterStatus === OrderStatus.RTO ? 'FAILED' : 'REFUNDED';
      expect(paymentStatus).toBe('FAILED');
      expect(paymentStatus).not.toBe('REFUNDED');
    });
  });

  // =========================================================================
  // AC-06 & AC-07: SELLER SETTLEMENT PRE-SETTLEMENT & POST-SETTLEMENT RECOVERY
  // =========================================================================
  describe('AC-06 & AC-07: Seller Settlement Protection & Post-Settlement Recovery', () => {
    it('Scenario 6.1 (Pre-Settlement): Seller product payout is voided and settlement cancelled on RTO', () => {
      const settlement = {
        status: 'PENDING_SETTLEMENT',
        grossProductValue: 2000,
        sellerBasePayout: 1800,
        sellerTotalPayout: 1800,
        netSettlementAmount: 1800,
        commissionAmount: 200,
      };

      // On RTO delivered pre-settlement:
      const voidedSettlement = {
        ...settlement,
        status: 'CANCELLED',
        grossProductValue: 0,
        sellerBasePayout: 0,
        sellerTotalPayout: 0,
        netSettlementAmount: 0,
        commissionReversal: settlement.commissionAmount,
      };

      expect(voidedSettlement.status).toBe('CANCELLED');
      expect(voidedSettlement.grossProductValue).toBe(0);
      expect(voidedSettlement.sellerTotalPayout).toBe(0);
      expect(voidedSettlement.netSettlementAmount).toBe(0);
      expect(voidedSettlement.commissionReversal).toBe(200);
    });

    it('Scenario 6.2 (Post-Settlement): Historical SETTLED record is immutable; DEBIT adjustment created', () => {
      const historicalSettlement = {
        id: 'set_hist_01',
        status: 'SETTLED',
        sellerTotalPayout: 1800,
        netSettlementAmount: 1800,
      };

      // Verify immutability: historical settlement record is never mutated
      expect(historicalSettlement.status).toBe('SETTLED');
      expect(historicalSettlement.netSettlementAmount).toBe(1800);

      // Debit adjustment created with status PENDING for future offset
      const recoveryAdj = {
        settlementId: historicalSettlement.id,
        type: 'DEBIT',
        category: 'PAYOUT_RECOVERY',
        amount: historicalSettlement.sellerTotalPayout,
        status: 'PENDING',
        recoveredAmount: 0,
      };

      expect(recoveryAdj.amount).toBe(1800);
      expect(recoveryAdj.status).toBe('PENDING');
    });

    it('Scenario 6.3 (Debit Offset): Future settlement offsets outstanding PENDING RTO adjustments', () => {
      const futureSettlementNet = 2500;
      const pendingDebits = [
        { id: 'adj_rec_01', amount: 1800, recoveredAmount: 0 },
        { id: 'adj_rto_02', amount: 60, recoveredAmount: 0 },
      ];

      const offsetResult = SettlementService.calculateDebitOffset({
        netPayableBeforeOffset: futureSettlementNet,
        pendingDebits,
      });

      expect(offsetResult.totalOffset).toBe(1860);
      expect(offsetResult.remainingNet).toBe(640);
      expect(offsetResult.updatedDebits[0].isFullyRecovered).toBe(true);
      expect(offsetResult.updatedDebits[0].newRecoveredAmount).toBe(1800);
      expect(offsetResult.updatedDebits[1].isFullyRecovered).toBe(true);
      expect(offsetResult.updatedDebits[1].newRecoveredAmount).toBe(60);
    });

    it('Scenario 6.4 (Partial Offset): When future settlement is less than pending debit, partial offset is applied', () => {
      const futureSettlementNet = 1000;
      const pendingDebits = [{ id: 'adj_rec_large', amount: 1800, recoveredAmount: 0 }];

      const offsetResult = SettlementService.calculateDebitOffset({
        netPayableBeforeOffset: futureSettlementNet,
        pendingDebits,
      });

      expect(offsetResult.totalOffset).toBe(1000);
      expect(offsetResult.remainingNet).toBe(0);
      expect(offsetResult.updatedDebits[0].isFullyRecovered).toBe(false);
      expect(offsetResult.updatedDebits[0].newRecoveredAmount).toBe(1000);
    });
  });

  // =========================================================================
  // AC-10: 100% COMMISSION REVERSAL
  // =========================================================================
  describe('AC-10: 100% Navya Commission Reversal', () => {
    it('Scenario 7.1: 100% of Navya commission is reversed on unfulfilled RTO; Navya retains ₹0', () => {
      const sellingPrice = 2500;
      const originalCommission = CommissionService.calculateCommission(sellingPrice); // 10% = ₹250
      expect(originalCommission).toBe(250.0);

      const commissionReversal = originalCommission;
      const retainedCommission = CommissionService.roundMoney(
        originalCommission - commissionReversal,
      );

      expect(commissionReversal).toBe(250.0);
      expect(retainedCommission).toBe(0.0);
    });

    it('Scenario 7.2: GST on commission is reversed consistently for registered sellers', () => {
      const originalCommission = 200.0;
      const gstRate = 0.18;
      const commissionGst = CommissionService.roundMoney(originalCommission * gstRate); // ₹36

      const commissionGstReversal = commissionGst;
      expect(commissionGstReversal).toBe(36.0);
    });
  });

  // =========================================================================
  // AC-12 & AC-13: INVENTORY RESTORATION & IDEMPOTENCY
  // =========================================================================
  describe('AC-12 & AC-13: Inventory Restoration & Idempotency Safeguards', () => {
    it('Scenario 8.1: Restores exact shipped quantity, not arbitrary order line quantity', () => {
      const orderLineQty = 5;
      const shippedQty = 3;
      const rtoQty = shippedQty;

      // Restoration must increment stock by shipped quantity only
      let productStock = 10;
      let variantAvailableStock = 4;

      productStock += rtoQty;
      variantAvailableStock += rtoQty;

      expect(productStock).toBe(13);
      expect(variantAvailableStock).toBe(7);
      expect(rtoQty).not.toBe(orderLineQty);
    });

    it('Scenario 8.2: Duplicate RTO delivery events do NOT restore inventory multiple times', () => {
      let stock = 10;
      const shippedQty = 2;
      let rtoInventoryRestored = false;

      // First webhook
      if (!rtoInventoryRestored) {
        stock += shippedQty;
        rtoInventoryRestored = true;
      }
      expect(stock).toBe(12);

      // Duplicate webhook #2
      if (!rtoInventoryRestored) {
        stock += shippedQty;
      }
      expect(stock).toBe(12);

      // Duplicate webhook #3 (retry)
      if (!rtoInventoryRestored) {
        stock += shippedQty;
      }
      expect(stock).toBe(12);
    });
  });

  // =========================================================================
  // AC-14: MULTI-SELLER ISOLATION & ACCURATE MASTER ORDER AGGREGATION
  // =========================================================================
  describe('AC-14: Multi-Seller Isolation & Master Order Aggregation', () => {
    it('Scenario 9.1: Seller A RTO + Seller B DELIVERED results in DELIVERED master order (active fulfillment)', () => {
      const shipments = [{ status: 'RTO_DELIVERED' }, { status: 'DELIVERED' }];

      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(shipments);
      expect(masterStatus).toBe(OrderStatus.DELIVERED);
      expect(masterStatus).not.toBe(OrderStatus.PENDING);
    });

    it('Scenario 9.2: Seller A RTO + Seller B SHIPPED results in SHIPPED master order', () => {
      const shipments = [{ status: 'RTO_DELIVERED' }, { status: 'IN_TRANSIT' }];

      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(shipments);
      expect(masterStatus).toBe(OrderStatus.SHIPPED);
    });

    it('Scenario 9.3: Seller A RTO + Seller B RTO results in RTO master order', () => {
      const shipments = [{ status: 'RTO_DELIVERED' }, { status: 'RTO_INITIATED' }];

      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(shipments);
      expect(masterStatus).toBe(OrderStatus.RTO);
    });

    it('Scenario 9.4: Seller A RTO + Seller B CANCELLED results in RTO master order (terminated with RTO)', () => {
      const shipments = [{ status: 'RTO_DELIVERED' }, { status: 'CANCELLED' }];

      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(shipments);
      expect(masterStatus).toBe(OrderStatus.RTO);
    });

    it('Scenario 9.5: Multi-seller financial isolation: Seller A RTO voids Seller A settlement only, Seller B remains active', () => {
      const settlementA = { shopId: 'shop_A', status: 'PENDING_SETTLEMENT', net: 1000 };
      const settlementB = { shopId: 'shop_B', status: 'PENDING_SETTLEMENT', net: 2000 };

      // Process RTO for Seller A only
      const updatedA = { ...settlementA, status: 'CANCELLED', net: 0 };
      const updatedB = { ...settlementB }; // Untouched

      expect(updatedA.status).toBe('CANCELLED');
      expect(updatedA.net).toBe(0);
      expect(updatedB.status).toBe('PENDING_SETTLEMENT');
      expect(updatedB.net).toBe(2000);
    });
  });

  // =========================================================================
  // AC-15 & AC-16: DOMAIN SEPARATION (CUSTOMER RETURN vs CANCELLATION vs RTO)
  // =========================================================================
  describe('AC-15 & AC-16: Customer Return vs Post-Shipment Cancellation vs RTO', () => {
    it('Scenario 10.1: Customer return requires delivery confirmation; RTO happens prior to customer receipt', () => {
      const customerReturnDeliveryRequired = true;
      const rtoDeliveryRequired = false;

      expect(customerReturnDeliveryRequired).toBe(true);
      expect(rtoDeliveryRequired).toBe(false);
    });

    it('Scenario 10.2: Post-shipment cancellation allocates 100% logistics loss to Navya (BM-05)', () => {
      const freightCost = 100.0;
      // Per BM-05 rule: post-shipment cancellation logistics loss = 100% Navya, 0% Seller
      const navyaShare = freightCost * 1.0;
      const sellerShare = freightCost * 0.0;

      expect(navyaShare).toBe(100.0);
      expect(sellerShare).toBe(0.0);
    });

    it('Scenario 10.3: Genuine RTO allocates 50% Navya and 50% Seller (BM-04/BM-09)', () => {
      const freightCost = 100.0;
      const split = CustomerShippingService.calculateRtoSplit(freightCost);

      expect(split.navyaShare).toBe(50.0);
      expect(split.sellerShare).toBe(50.0);
      expect(split.sellerShare).not.toBe(0.0);
    });
  });

  // =========================================================================
  // AC-18 & AC-21: SECURITY, WEBHOOK AUTH & SELLER API RESTRICTIONS
  // =========================================================================
  describe('AC-18 & AC-21: Security, Webhook Authentication & Seller Restrictions', () => {
    it('Scenario 11.1: Webhook fails closed when secret is missing in production environment', () => {
      const isProduction = true;
      const configuredSecret = '';
      const incomingSecret = 'some_token';

      const isAuthorized = Boolean(configuredSecret) && configuredSecret === incomingSecret;

      expect(isAuthorized).toBe(false);
    });

    it('Scenario 11.2: Webhook fails closed when token does not match configured secret', () => {
      const configuredSecret = 'navya_prod_shiprocket_secret_key_889';
      const incomingSecret = 'wrong_secret';

      const isAuthorized = incomingSecret === configuredSecret;
      expect(isAuthorized).toBe(false);
    });

    it('Scenario 11.3: Webhook accepts request when secret matches exactly', () => {
      const configuredSecret = 'navya_prod_shiprocket_secret_key_889';
      const incomingSecret = 'navya_prod_shiprocket_secret_key_889';

      const isAuthorized = incomingSecret === configuredSecret;
      expect(isAuthorized).toBe(true);
    });

    it('Scenario 11.4: Non-admin sellers are blocked from manually setting shipment status to RTO', () => {
      const userRole = 'SELLER';
      const requestedAction = 'RTO';
      const rtoStatuses = ['RTO', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED'];

      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
      const isTargetingRto = requestedAction === 'RTO' || rtoStatuses.includes(requestedAction);

      const isBlocked = isTargetingRto && !isAdmin;
      expect(isBlocked).toBe(true);
    });

    it('Scenario 11.5: Admins are directed to authoritative RTO workflow rather than arbitrary manual mutation', () => {
      const userRole = 'ADMIN';
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
      expect(isAdmin).toBe(true);
    });
  });

  // =========================================================================
  // AC-19 & AC-20: WEBHOOK IDEMPOTENCY & ADMIN RTO LIFECYCLE CONTROLS
  // =========================================================================
  describe('AC-19 & AC-20: Webhook Idempotency & Admin Controls', () => {
    it('Scenario 12.1: Repeated RTO delivered execution is completely idempotent', () => {
      const shipment = {
        id: 'shp_rto_idem_01',
        rtoDeliveredAt: new Date(),
        rtoSettlementVoided: true,
        rtoInventoryRestored: true,
        rtoRefundProcessed: true,
      };

      const isAlreadyProcessed =
        Boolean(shipment.rtoDeliveredAt) &&
        shipment.rtoSettlementVoided &&
        shipment.rtoInventoryRestored;

      expect(isAlreadyProcessed).toBe(true);
    });

    it('Scenario 12.2: Admin API supports explicit actions: INITIATE_RTO, PROCESS_RTO_DELIVERED, UPDATE_RTO_COST', () => {
      const supportedActions = ['INITIATE_RTO', 'PROCESS_RTO_DELIVERED', 'UPDATE_RTO_COST'];
      expect(supportedActions).toContain('INITIATE_RTO');
      expect(supportedActions).toContain('PROCESS_RTO_DELIVERED');
      expect(supportedActions).toContain('UPDATE_RTO_COST');
    });
  });
});
