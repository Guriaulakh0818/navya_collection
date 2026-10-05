import { PaymentMethod, Prisma, ReturnStatus, SettlementStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CommissionService } from './commission.service';

export interface SettlementFinancialBreakdown {
  grossProductValue: number;
  totalMrp?: number;
  refundedProductValue: number;
  commissionRate: number;
  commissionAmount: number;
  commissionReversal: number;
  sellerBasePayout: number;
  sellerGstStatus: 'REGISTERED' | 'UNREGISTERED' | string;
  sellerGstRate: number;
  sellerGstAmount: number;
  refundedGstAmount: number;
  sellerTotalPayout: number;
  forwardShippingActual: number;
  reverseShippingActual: number;
  returnShippingDeduction: number;
  sellerDiscounts: number;
  otherDeductions: number;
  adjustments: number;
  netSettlementAmount: number;
  unrecoveredDebitLiability: number;
}

export class SettlementService {
  /**
   * Enforced settlement holding window: 7 calendar days after delivery (Section 2).
   */
  public static readonly SETTLEMENT_WINDOW_DAYS = 7;

  /**
   * Centralized financial breakdown calculator (BM-03 Authoritative).
   *
   * Formula:
   * Commission = MRP * 10%
   * Seller Base Payout = (Gross Product Value - Refunded Product Value) - (Commission - Commission Reversal)
   * Seller GST = If REGISTERED: Applicable GST on active Selling Price; If UNREGISTERED: 0
   * Seller Total Payout = Seller Base Payout + Seller GST
   *
   * Net Settlement = Seller Total Payout - Return shipping deductions - Seller discounts - Other deductions +/- Adjustments
   *
   * If net payable is negative (e.g. ₹0 earnings - ₹116 return shipping),
   * payable is clamped to ₹0, and the unrecovered deficit is returned as unrecoveredDebitLiability
   * to be retained as a recoverable seller debit balance.
   */
  public static computeSettlementBreakdown(params: {
    grossProductValue: number | string | Prisma.Decimal;
    totalMrp?: number | string | Prisma.Decimal;
    refundedProductValue?: number | string | Prisma.Decimal;
    commissionRate?: number;
    commissionAmount?: number | string | Prisma.Decimal;
    commissionReversal?: number | string | Prisma.Decimal;
    sellerBasePayout?: number | string | Prisma.Decimal;
    sellerGstStatus?: 'REGISTERED' | 'UNREGISTERED' | string | null;
    sellerGstRate?: number | string | Prisma.Decimal;
    sellerGstAmount?: number | string | Prisma.Decimal;
    refundedGstAmount?: number | string | Prisma.Decimal;
    forwardShippingActual?: number | string | Prisma.Decimal;
    reverseShippingActual?: number | string | Prisma.Decimal;
    sellerDiscounts?: number | string | Prisma.Decimal;
    otherDeductions?: number | string | Prisma.Decimal;
    adjustments?: number | string | Prisma.Decimal;
    isFullyRefunded?: boolean;
  }): SettlementFinancialBreakdown {
    const grossProductValue = CommissionService.roundMoney(Number(params.grossProductValue || 0));
    const totalMrp =
      params.totalMrp !== undefined
        ? CommissionService.roundMoney(Number(params.totalMrp))
        : undefined;
    const commissionRate = params.commissionRate ?? CommissionService.COMMISSION_RATE_PERCENT;
    const commissionAmount =
      params.commissionAmount !== undefined
        ? CommissionService.roundMoney(Number(params.commissionAmount))
        : CommissionService.calculateCommission(totalMrp ?? grossProductValue, commissionRate);

    let refundedProductValue = 0;
    let commissionReversal = 0;

    if (params.isFullyRefunded) {
      refundedProductValue = grossProductValue;
      commissionReversal = commissionAmount;
    } else {
      refundedProductValue = CommissionService.roundMoney(Number(params.refundedProductValue || 0));
      commissionReversal =
        params.commissionReversal !== undefined
          ? CommissionService.roundMoney(Number(params.commissionReversal))
          : grossProductValue > 0 && refundedProductValue >= grossProductValue
            ? commissionAmount
            : CommissionService.roundMoney(
                (refundedProductValue / (grossProductValue || 1)) * commissionAmount,
              );
    }

    const sellerGstStatus =
      (params.sellerGstStatus || 'UNREGISTERED').toUpperCase() === 'REGISTERED'
        ? 'REGISTERED'
        : 'UNREGISTERED';
    const sellerGstRate = Number(params.sellerGstRate ?? 0);

    const sellerGstAmount =
      params.sellerGstAmount !== undefined
        ? CommissionService.roundMoney(Number(params.sellerGstAmount))
        : sellerGstStatus === 'REGISTERED'
          ? CommissionService.roundMoney(grossProductValue * (sellerGstRate / 100))
          : 0;

    const refundedGstAmount =
      params.refundedGstAmount !== undefined
        ? CommissionService.roundMoney(Number(params.refundedGstAmount))
        : params.isFullyRefunded
          ? sellerGstAmount
          : sellerGstStatus === 'REGISTERED'
            ? grossProductValue > 0 && refundedProductValue >= grossProductValue
              ? sellerGstAmount
              : CommissionService.roundMoney(
                  (refundedProductValue / (grossProductValue || 1)) * sellerGstAmount,
                )
            : 0;

    // Active product value after customer returns
    const activeProductValue = Math.max(0, grossProductValue - refundedProductValue);
    // Commission retained by Navya (100% reversed on returned products)
    const retainedCommission = Math.max(0, commissionAmount - commissionReversal);

    // BM-03: Seller Base Payout = Selling Price - Commission
    const sellerBasePayout = Math.max(0, activeProductValue - retainedCommission);
    // Retained GST component
    const retainedGstAmount =
      sellerGstStatus === 'REGISTERED' ? Math.max(0, sellerGstAmount - refundedGstAmount) : 0;

    // BM-03: Seller Total Payout = Seller Base Payout + Applicable GST
    const sellerTotalPayout = CommissionService.roundMoney(sellerBasePayout + retainedGstAmount);

    const forwardShippingActual = CommissionService.roundMoney(
      Number(params.forwardShippingActual || 0),
    );
    const reverseShippingActual = CommissionService.roundMoney(
      Number(params.reverseShippingActual || 0),
    );
    const returnShippingDeduction = CommissionService.roundMoney(
      forwardShippingActual + reverseShippingActual,
    );

    const sellerDiscounts = CommissionService.roundMoney(Number(params.sellerDiscounts || 0));
    const otherDeductions = CommissionService.roundMoney(Number(params.otherDeductions || 0));
    const adjustments = CommissionService.roundMoney(Number(params.adjustments || 0));

    const rawNet = CommissionService.roundMoney(
      sellerTotalPayout - returnShippingDeduction - sellerDiscounts - otherDeductions + adjustments,
    );
    const unrecoveredDebitLiability = rawNet < 0 ? Math.abs(rawNet) : 0;
    const netSettlementAmount = Math.max(0, rawNet);

    return {
      grossProductValue,
      totalMrp,
      refundedProductValue,
      commissionRate,
      commissionAmount,
      commissionReversal,
      sellerBasePayout,
      sellerGstStatus,
      sellerGstRate,
      sellerGstAmount,
      refundedGstAmount,
      sellerTotalPayout,
      forwardShippingActual,
      reverseShippingActual,
      returnShippingDeduction,
      sellerDiscounts,
      otherDeductions,
      adjustments,
      netSettlementAmount,
      unrecoveredDebitLiability,
    };
  }

  /**
   * Triggered upon confirmed order delivery.
   * Calculates settlement eligibility date = delivery_date + 7 calendar days (Section 2).
   */
  public static async onOrderDelivered(
    orderIdOrShipmentId: string,
    deliveryDate: Date = new Date(),
  ): Promise<void> {
    const eligibilityDate = new Date(
      deliveryDate.getTime() + this.SETTLEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    // 1. Locate Order / Shipment
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrShipmentId },
          { orderNumber: orderIdOrShipmentId },
          { shiprocketOrderId: orderIdOrShipmentId },
          { shiprocketShipmentId: orderIdOrShipmentId },
        ],
      },
      include: {
        vendorOrders: true,
        shipments: true,
      },
    });

    if (!order) return;

    // Update orderItems deliveredAt
    await prisma.orderItem.updateMany({
      where: { orderId: order.id, deliveredAt: null },
      data: { deliveredAt: deliveryDate },
    });

    // Update shipments deliveredAt
    await prisma.shipment.updateMany({
      where: { masterOrderId: order.id, deliveredAt: null },
      data: { deliveredAt: deliveryDate, status: 'DELIVERED' },
    });

    // Update or create SellerSettlement for each vendor order
    for (const vo of order.vendorOrders) {
      const existingSettlement = await prisma.sellerSettlement.findUnique({
        where: { vendorOrderId: vo.id },
      });

      if (existingSettlement) {
        // Do not alter status if already SETTLED or ON_HOLD
        const newStatus =
          existingSettlement.status === 'ON_HOLD'
            ? 'ON_HOLD'
            : existingSettlement.status === 'SETTLED'
              ? 'SETTLED'
              : 'PENDING_SETTLEMENT';

        await prisma.sellerSettlement.update({
          where: { id: existingSettlement.id },
          data: {
            deliveryDate,
            settlementEligibilityDate: eligibilityDate,
            status: newStatus,
          },
        });

        if (newStatus !== 'SETTLED' && newStatus !== 'ON_HOLD') {
          await this.offsetPendingSellerDebits(existingSettlement.id).catch((err) =>
            console.warn('[SETTLEMENT_DEBIT_OFFSET_ERROR]', err),
          );
        }
      } else {
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const settlementNumber = `NC-SET-${timestamp}-${randomSuffix}`;
        const isSellerFunded = vo.couponFundingType === 'SELLER';
        const sellerCouponDiscount = isSellerFunded
          ? CommissionService.roundMoney(Number(vo.allocatedCouponAmount || 0))
          : 0;

        const calc = this.computeSettlementBreakdown({
          grossProductValue: vo.totalAmount,
          totalMrp: vo.totalMrp ? Number(vo.totalMrp) : undefined,
          commissionAmount: vo.commissionAmount ? Number(vo.commissionAmount) : undefined,
          sellerGstStatus: vo.sellerGstStatus,
          sellerGstAmount: vo.sellerGstAmount ? Number(vo.sellerGstAmount) : undefined,
          sellerDiscounts: sellerCouponDiscount,
        });

        const shop = await prisma.shop.findUnique({
          where: { id: vo.shopId },
          select: { ownerId: true },
        });

        const createdSettlement = await prisma.sellerSettlement.create({
          data: {
            settlementNumber,
            masterOrderId: order.id,
            vendorOrderId: vo.id,
            shopId: vo.shopId,
            sellerId: shop?.ownerId || order.userId,
            grossProductValue: calc.grossProductValue,
            refundedProductValue: 0,
            commissionRate: calc.commissionRate,
            commissionAmount: calc.commissionAmount,
            commissionReversal: 0,
            forwardShippingActual: 0,
            reverseShippingActual: 0,
            returnShippingDeduction: 0,
            sellerDiscounts: sellerCouponDiscount,
            netSettlementAmount: calc.netSettlementAmount,
            status: 'PENDING_SETTLEMENT',
            deliveryDate,
            settlementEligibilityDate: eligibilityDate,
          },
        });

        // Automatically offset any outstanding seller debits against this newly created settlement
        await this.offsetPendingSellerDebits(createdSettlement.id).catch((err) =>
          console.warn('[SETTLEMENT_DEBIT_OFFSET_ERROR]', err),
        );
      }
    }

    try {
      const { ContributionService } = await import('./contribution.service');
      await ContributionService.recordOrderContribution(order.id, 'DELIVERED' as any);
    } catch (cErr) {
      console.warn('[BM11_DELIVERY_CONTRIBUTION_WARN]', cErr);
    }
  }

  /**
   * Puts seller settlement ON_HOLD whenever a return or replacement request is initiated (Section 2, 13).
   */
  public static async onReturnRaised(returnRequestId: string): Promise<void> {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { vendorOrder: true },
    });

    if (!returnReq) return;

    const vendorOrderId = returnReq.vendorOrderId;
    const masterOrderId = returnReq.orderId;

    const settlement = await prisma.sellerSettlement.findFirst({
      where: {
        OR: [...(vendorOrderId ? [{ vendorOrderId }] : []), { masterOrderId }],
      },
    });

    if (settlement && settlement.status !== 'SETTLED' && settlement.status !== 'CANCELLED') {
      await prisma.sellerSettlement.update({
        where: { id: settlement.id },
        data: {
          status: 'ON_HOLD',
          holdReason: `Unresolved Return/Replacement Request #${returnReq.requestNumber || returnReq.id} pending review.`,
        },
      });

      await prisma.returnRequest.update({
        where: { id: returnReq.id },
        data: { settlementHoldApplied: true },
      });

      await prisma.financialAuditLog.create({
        data: {
          entityType: 'SETTLEMENT',
          entityId: settlement.id,
          action: 'SETTLEMENT_PLACED_ON_HOLD',
          notes: `Settlement placed ON_HOLD due to Return Request #${returnReq.requestNumber || returnReq.id}.`,
        },
      });
    }

    if (masterOrderId) {
      try {
        const { ContributionService } = await import('./contribution.service');
        await ContributionService.recordOrderContribution(masterOrderId);
      } catch (cErr) {
        console.warn('[BM11_RETURN_RAISED_CONTRIBUTION_WARN]', cErr);
      }
    }
  }

  /**
   * Applies verified return financial adjustments and refund disbursal (BM-01, BM-03, BM-07, BM-08).
   * - Reverses original commission 100% (auditable record, reason: FULL_RETURN / PARTIAL_RETURN).
   * - Deducts actual forward + actual reverse shipping cost from seller.
   * - Disburses customer refund (Prepaid reversal or COD payout).
   * - Restores product and variant inventory stock idempotently.
   * - Pre-settlement: Recalculates settlement before payout.
   * - Post-settlement: Preserves historical settlement; creates immutable debit SellerAdjustment.
   * - Idempotent: Never duplicates refunds, reversals, or adjustments if invoked repeatedly.
   */
  public static async onReturnVerified(params: {
    returnRequestId: string;
    forwardShippingCost?: number | null;
    reverseShippingCost?: number | null;
    performedById?: string;
    notes?: string;
  }): Promise<{
    returnShippingDeduction: number;
    commissionReversal: number;
    refundAmount: number;
    adjustmentCreated: boolean;
    settlementUpdated: boolean;
    inventoryRestored: boolean;
  }> {
    const { returnRequestId, forwardShippingCost, reverseShippingCost, performedById, notes } =
      params;

    const returnReq = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        vendorOrder: true,
        order: {
          include: {
            shipments: true,
            items: true,
            user: true,
            paymentTransactions: true,
          },
        },
        items: {
          include: {
            orderItem: true,
          },
        },
        customerRefund: true,
        adjustments: true,
      },
    });

    if (!returnReq) {
      throw new Error(`Return request ${returnRequestId} not found.`);
    }

    // 1. Idempotency Check (Section 13):
    if (
      (returnReq.status === 'VERIFIED' ||
        returnReq.status === 'REFUNDED' ||
        returnReq.status === 'CLOSED') &&
      returnReq.commissionReversal !== null &&
      returnReq.customerRefund !== null
    ) {
      return {
        returnShippingDeduction: Number(returnReq.returnShippingDeduction || 0),
        commissionReversal: Number(returnReq.commissionReversal || 0),
        refundAmount: Number(returnReq.refundAmount || 0),
        adjustmentCreated: returnReq.adjustments.length > 0,
        settlementUpdated: true,
        inventoryRestored: returnReq.inventoryRestored,
      };
    }

    // 2. Calculate Returned Product Value & Customer Refund (Section 1, 3, 10, BM-02, BM-03, BM-08)
    let returnedProductValue = 0;
    let originalCommission = 0;
    let returnedTaxAmount = 0;
    let totalReturnedCoupon = 0;
    let sellerGstStatus = returnReq.vendorOrder?.sellerGstStatus || 'UNREGISTERED';

    const orderSubtotal = Number(returnReq.order.totalAmount || returnReq.order.finalAmount || 1);
    const orderCouponDiscount = Number(returnReq.order.discountAmount || 0);

    if (returnReq.items && returnReq.items.length > 0) {
      for (const item of returnReq.items) {
        const itemPrice = Number(item.orderItem?.price || 0);
        const qty = item.quantity || 1;
        const lineItemValue = CommissionService.roundMoney(itemPrice * qty);
        returnedProductValue += lineItemValue;

        const itemMrp = Number(item.orderItem?.mrp || item.orderItem?.price || itemPrice);
        const itemCommAmount = Number(item.orderItem?.commissionAmount || 0);
        const itemOrderQty = Number(item.orderItem?.quantity || qty);
        const itemTaxRate = Number(item.orderItem?.taxRate || 0);
        const itemGstStatus =
          item.orderItem?.sellerGstStatus ||
          returnReq.vendorOrder?.sellerGstStatus ||
          'UNREGISTERED';

        // Proportional Coupon Allocation (BM-08 & BM-10)
        let itemCoupon = 0;
        let itemSellerCoupon = 0;
        if (item.orderItem?.sellerCouponAmount && Number(item.orderItem.sellerCouponAmount) > 0) {
          itemSellerCoupon = CommissionService.roundMoney(
            (Number(item.orderItem.sellerCouponAmount) / itemOrderQty) * qty,
          );
          itemCoupon = itemSellerCoupon;
        } else if (
          item.orderItem?.navyaCouponAmount &&
          Number(item.orderItem.navyaCouponAmount) > 0
        ) {
          itemCoupon = CommissionService.roundMoney(
            (Number(item.orderItem.navyaCouponAmount) / itemOrderQty) * qty,
          );
        } else if (orderCouponDiscount > 0 && orderSubtotal > 0) {
          itemCoupon = CommissionService.roundMoney(
            (lineItemValue / orderSubtotal) * orderCouponDiscount,
          );
          if (returnReq.vendorOrder?.couponFundingType === 'SELLER') {
            itemSellerCoupon = itemCoupon;
          }
        }
        totalReturnedCoupon += itemCoupon;
        (totalReturnedCoupon as any).sellerCoupon =
          ((totalReturnedCoupon as any).sellerCoupon || 0) + itemSellerCoupon;

        if (itemGstStatus === 'REGISTERED') {
          sellerGstStatus = 'REGISTERED';
          const itemTaxAmt = Number(item.orderItem?.taxAmount || 0);
          if (itemTaxAmt > 0 && itemOrderQty > 0) {
            returnedTaxAmount += CommissionService.roundMoney((itemTaxAmt / itemOrderQty) * qty);
          } else {
            returnedTaxAmount += CommissionService.roundMoney(
              itemPrice * qty * (itemTaxRate / 100),
            );
          }
        }

        if (itemCommAmount > 0 && itemOrderQty > 0) {
          originalCommission += CommissionService.roundMoney((itemCommAmount / itemOrderQty) * qty);
        } else {
          originalCommission += CommissionService.calculateCommission(itemMrp * qty);
        }
      }
    } else if (returnReq.refundAmount) {
      returnedProductValue = Number(returnReq.refundAmount);
      originalCommission = returnReq.vendorOrder?.commissionAmount
        ? Number(returnReq.vendorOrder.commissionAmount)
        : CommissionService.calculateCommission(returnedProductValue);
      if (sellerGstStatus === 'REGISTERED') {
        const voGst = Number(returnReq.vendorOrder?.sellerGstAmount || 0);
        const voTotal = Number(returnReq.vendorOrder?.totalAmount || returnedProductValue);
        returnedTaxAmount =
          voTotal > 0
            ? CommissionService.roundMoney((returnedProductValue / voTotal) * voGst)
            : voGst;
      }
    } else if (returnReq.vendorOrder) {
      returnedProductValue = Number(returnReq.vendorOrder.totalAmount);
      originalCommission = Number(returnReq.vendorOrder.commissionAmount || 0);
      returnedTaxAmount = Number(returnReq.vendorOrder.sellerGstAmount || 0);
    } else {
      const orderCodFee = Number(returnReq.order.codFee || 0);
      const orderCodFeeTax = Number(returnReq.order.codFeeTax || 0);
      const nonRefundableCod = CommissionService.roundMoney(orderCodFee + orderCodFeeTax);
      returnedProductValue = Math.max(
        0,
        CommissionService.roundMoney(
          Number(returnReq.order.finalAmount || returnReq.order.totalAmount) - nonRefundableCod,
        ),
      );
      originalCommission = CommissionService.calculateCommission(returnedProductValue);
    }

    returnedProductValue = CommissionService.roundMoney(returnedProductValue);
    totalReturnedCoupon = CommissionService.roundMoney(totalReturnedCoupon);
    originalCommission = CommissionService.roundMoney(originalCommission);
    returnedTaxAmount = CommissionService.roundMoney(returnedTaxAmount);

    // Eligible Product Refund = Returned Selling Subtotal - Proportional Coupon + Applicable Customer Tax
    const refundAmount = Math.max(
      0,
      CommissionService.roundMoney(returnedProductValue - totalReturnedCoupon + returnedTaxAmount),
    );

    // 3. Inventory Restoration (BM-08 Section 14)
    let inventoryRestored = returnReq.inventoryRestored;
    if (!returnReq.inventoryRestored && returnReq.items && returnReq.items.length > 0) {
      for (const item of returnReq.items) {
        if (item.orderItem?.productId) {
          const qty = item.quantity || 1;
          await prisma.product.update({
            where: { id: item.orderItem.productId },
            data: { stock: { increment: qty } },
          });

          if (item.orderItem.variantId) {
            await prisma.productVariant.update({
              where: { id: item.orderItem.variantId },
              data: {
                availableStock: { increment: qty },
                stock: { increment: qty },
              },
            });
          }
        }
      }

      await prisma.returnRequest.update({
        where: { id: returnReq.id },
        data: {
          inventoryRestored: true,
          inventoryRestoredAt: new Date(),
        },
      });
      inventoryRestored = true;

      await prisma.returnAuditLog.create({
        data: {
          returnRequestId: returnReq.id,
          performedById: performedById || returnReq.userId,
          action: 'INVENTORY_RESTORED_ON_VERIFIED_RETURN',
          previousStatus: returnReq.status,
          newStatus: 'VERIFIED',
          reason: 'Restored product and variant stock upon return verification.',
        },
      });
    }

    // 4. BM-03 & BM-10 Commission & GST Reversal:
    // On approved/verified return: 100% commission reversed; applicable GST reversed;
    // Seller payout reversed based on net payout earned (accounting for seller-funded coupon).
    const returnSellerCoupon = (totalReturnedCoupon as any).sellerCoupon || 0;
    const returnReversal = CommissionService.calculateReturnPayoutReversal({
      returnedSellingPrice: returnedProductValue,
      returnedMrpCommission: originalCommission,
      returnedTaxAmount,
      sellerGstStatus,
      sellerCouponDiscount: returnSellerCoupon,
    });

    const commissionReversal = returnReversal.commissionReversal;
    const gstReversal = returnReversal.gstPayoutReversal;
    const sellerPayoutReversal = returnReversal.sellerTotalPayoutReversal;

    // 5. Resolve Actual Forward & Reverse Shipping Costs (Section 4, 8)
    const matchedShipment = returnReq.order.shipments.find(
      (s) => s.vendorOrderId === returnReq.vendorOrderId || s.shopId === returnReq.shopId,
    );

    let forwardCost: number | null = null;
    if (forwardShippingCost !== undefined && forwardShippingCost !== null) {
      forwardCost = CommissionService.roundMoney(Math.max(0, forwardShippingCost));
    } else if (
      returnReq.forwardShippingCost !== null &&
      returnReq.forwardShippingCost !== undefined
    ) {
      forwardCost = Number(returnReq.forwardShippingCost);
    } else if (matchedShipment?.actualForwardShippingCost) {
      forwardCost = Number(matchedShipment.actualForwardShippingCost);
    }

    let reverseCost: number | null = null;
    if (reverseShippingCost !== undefined && reverseShippingCost !== null) {
      reverseCost = CommissionService.roundMoney(Math.max(0, reverseShippingCost));
    } else if (
      returnReq.reverseShippingCost !== null &&
      returnReq.reverseShippingCost !== undefined
    ) {
      reverseCost = Number(returnReq.reverseShippingCost);
    } else if (matchedShipment?.actualReverseShippingCost) {
      reverseCost = Number(matchedShipment.actualReverseShippingCost);
    }

    const isReverseShippingAvailable = reverseCost !== null;
    const totalDeduction = isReverseShippingAvailable
      ? CommissionService.roundMoney((forwardCost || 0) + (reverseCost || 0))
      : 0;

    // 6. Customer Refund Record (Section 3, 5, BM-06, BM-07 & BM-08):
    // Real Razorpay Refund for Prepaid & Real Razorpay Payout for COD
    // COD fee is strictly non-refundable and never included in refundAmount.
    const orderCodFee = Number(returnReq.order.codFee || 0);
    const orderCodFeeTax = Number(returnReq.order.codFeeTax || 0);
    const totalNonRefundableCod = CommissionService.roundMoney(orderCodFee + orderCodFeeTax);

    const originalPayment = CommissionService.roundMoney(
      Number(returnReq.order.finalAmount || returnReq.order.totalAmount || 0),
    );

    let customerRefundRecord = returnReq.customerRefund;
    if (!customerRefundRecord) {
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refundNumber = `NC-REF-${timestamp}-${randomSuffix}`;

      const razorpayPaymentId =
        returnReq.order.razorpayPaymentId ||
        returnReq.order.paymentTransactions?.find((p: any) => p.razorpayPaymentId)
          ?.razorpayPaymentId;

      let rzpRefundId: string | null = null;
      let gatewayStatus = 'PENDING';
      let refundTxn = `REF-${refundNumber}`;
      let refundMethod = 'RAZORPAY_REVERSAL';
      let payoutReference: string | null = null;
      let payoutStatus = 'PENDING';

      if (returnReq.order.paymentMethod === 'RAZORPAY' && razorpayPaymentId) {
        try {
          const { createRazorpayRefund } = await import('@/backend/lib/razorpay');
          const amountInPaise = Math.round(refundAmount * 100);
          if (amountInPaise > 0) {
            const rzpRes = await createRazorpayRefund({
              paymentId: razorpayPaymentId,
              amountInPaise,
              notes: {
                returnRequestId: returnReq.id,
                orderId: returnReq.orderId,
                refundNumber,
              },
            });
            rzpRefundId = rzpRes.id;
            refundTxn = rzpRes.id;
            gatewayStatus = rzpRes.status === 'processed' ? 'PROCESSED' : 'PENDING';
          }
        } catch (rfErr: any) {
          console.error('[RAZORPAY_REFUND_API_ERROR]', rfErr);
          gatewayStatus = 'FAILED';
        }
      } else if (returnReq.order.paymentMethod === 'COD') {
        // BM-07 & BM-08 COD Refund: Disburse via Razorpay Payouts using customer-provided bank/UPI destination
        refundMethod = returnReq.refundMethod === 'UPI' ? 'UPI' : 'RAZORPAY_PAYOUT';
        try {
          const { createRazorpayPayout } = await import('@/backend/lib/razorpay');
          const amountInPaise = Math.round(refundAmount * 100);
          if (amountInPaise > 0) {
            const beneficiaryName =
              returnReq.accountHolderName ||
              returnReq.order?.user?.name ||
              (returnReq.order as any).address?.fullName ||
              'Customer';

            const payoutRes = await createRazorpayPayout({
              amountInPaise,
              referenceId: `POUT-${refundNumber}`,
              beneficiaryName,
              bankAccountNumber: returnReq.bankAccountNumber,
              bankIfsc: returnReq.bankIfsc,
              upiId: returnReq.upiId,
              notes: {
                returnRequestId: returnReq.id,
                orderId: returnReq.orderId,
                refundNumber,
                nonRefundableCodFee: totalNonRefundableCod,
              },
            });
            payoutReference = payoutRes.id;
            payoutStatus = payoutRes.status.toUpperCase();
            gatewayStatus = payoutRes.status === 'processed' ? 'PROCESSED' : 'PENDING';
            refundTxn = payoutRes.id;
          }
        } catch (poErr: any) {
          console.error('[RAZORPAY_COD_PAYOUT_ERROR]', poErr);
          gatewayStatus = 'FAILED';
          payoutStatus = 'FAILED';
        }
      }

      customerRefundRecord = await prisma.customerRefund.create({
        data: {
          refundNumber,
          orderId: returnReq.orderId,
          returnRequestId: returnReq.id,
          userId: returnReq.userId,
          amount: refundAmount,
          originalPayment,
          status: gatewayStatus === 'PROCESSED' ? 'REFUNDED' : 'PENDING',
          refundTransaction: refundTxn,
          razorpayRefundId: rzpRefundId,
          razorpayPaymentId: razorpayPaymentId || null,
          gatewayRefundStatus: gatewayStatus,
          refundMethod,
          payoutReference,
          payoutStatus,
          beneficiaryName: returnReq.accountHolderName || returnReq.order?.user?.name || null,
          bankAccountNumber: returnReq.bankAccountNumber || null,
          bankIfsc: returnReq.bankIfsc || null,
          upiId: returnReq.upiId || null,
          nonRefundableCodFee: totalNonRefundableCod,
          isPartial: refundAmount < originalPayment,
          reason: returnReq.reason || 'Approved customer return',
          refundedAt: gatewayStatus === 'PROCESSED' ? new Date() : null,
        },
      });
    }

    // 7. Update ReturnRequest (Section 1, 2, 4, 6, 15)
    const sellerFinalAdjustment = isReverseShippingAvailable
      ? CommissionService.roundMoney(-totalDeduction)
      : 0;

    await prisma.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: 'VERIFIED',
        refundAmount,
        originalPaymentAmount: originalPayment,
        refundStatus: 'PROCESSED',
        refundReference: customerRefundRecord.refundNumber,
        refundedAt: customerRefundRecord.refundedAt || new Date(),
        originalCommission,
        commissionReversal,
        gstReversal,
        sellerPayoutReversal,
        forwardShippingCost: forwardCost,
        reverseShippingCost: reverseCost,
        returnShippingDeduction: isReverseShippingAvailable ? totalDeduction : null,
        sellerFinalAdjustment,
        reviewedById: performedById,
        reviewedAt: new Date(),
      },
    });

    // 7. Update Shipment Actual Costs
    if (matchedShipment) {
      await prisma.shipment.update({
        where: { id: matchedShipment.id },
        data: {
          ...(forwardCost !== null ? { actualForwardShippingCost: forwardCost } : {}),
          ...(reverseCost !== null ? { actualReverseShippingCost: reverseCost } : {}),
          ...(isReverseShippingAvailable ? { returnShippingDeduction: totalDeduction } : {}),
        },
      });
    }

    // 8. Auditable Commission Reversal Log (Section 2, 14)
    const existingCommLog = await prisma.financialAuditLog.findFirst({
      where: {
        entityType: 'COMMISSION',
        entityId: returnReq.id,
        action: 'COMMISSION_REVERSED',
      },
    });

    if (!existingCommLog) {
      const isFullReturn = returnReq.vendorOrder
        ? returnedProductValue >= Number(returnReq.vendorOrder.totalAmount)
        : returnedProductValue >= Number(returnReq.order.finalAmount);

      await prisma.financialAuditLog.create({
        data: {
          entityType: 'COMMISSION',
          entityId: returnReq.id,
          action: 'COMMISSION_REVERSED',
          performedById,
          amount: commissionReversal,
          notes: `Original Commission: ₹${originalCommission}. Commission Reversal: -₹${commissionReversal}. GST Reversal: -₹${gstReversal}. Reason = ${isFullReturn ? 'FULL_RETURN' : 'PARTIAL_RETURN'}.`,
          oldValues: { originalCommission },
          newValues: {
            commissionReversal,
            gstReversal,
            sellerPayoutReversal,
            retainedCommission: 0,
          },
        },
      });
    }

    // 9. Seller Settlement & Adjustment Interaction (Section 7, 9, 10, 13, 15)
    let adjustmentCreated = false;
    let settlementUpdated = false;

    const settlement = await prisma.sellerSettlement.findFirst({
      where: {
        ...(returnReq.vendorOrderId
          ? { vendorOrderId: returnReq.vendorOrderId }
          : returnReq.shopId
            ? { shopId: returnReq.shopId }
            : { masterOrderId: returnReq.orderId }),
      },
    });

    if (settlement) {
      if (settlement.status === 'SETTLED') {
        // Post-settlement return (Section 7, 15):
        // Historical paid settlement remains UNCHANGED.
        // Create separate immutable SellerAdjustment debit record(s) linked to order, settlement, and return request.
        if (isReverseShippingAvailable && totalDeduction > 0) {
          const existingAdj = await prisma.sellerAdjustment.findFirst({
            where: {
              returnRequestId: returnReq.id,
              category: 'RETURN_SHIPPING_LIABILITY',
            },
          });

          if (!existingAdj) {
            const timestamp = Date.now().toString().slice(-6);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const adjustmentNumber = `NC-ADJ-${timestamp}-${randomSuffix}`;

            await prisma.sellerAdjustment.create({
              data: {
                adjustmentNumber,
                shopId: settlement.shopId,
                sellerId: settlement.sellerId,
                settlementId: settlement.id,
                returnRequestId: returnReq.id,
                type: 'DEBIT',
                category: 'RETURN_SHIPPING_LIABILITY',
                amount: totalDeduction,
                reason: `Return shipping liability (Forward ₹${forwardCost || 0} + Reverse ₹${reverseCost || 0}) for Return #${returnReq.requestNumber || returnReq.id} on settled order #${settlement.settlementNumber}.`,
                status: 'PENDING',
              },
            });
            adjustmentCreated = true;
          }
        }

        // Payout recovery adjustment for the returned product payout already disbursed (Section 15)
        // Seller Total Payout Reversal = (Selling Price - Commission) + GST (if registered)
        const netPayoutToRecover = sellerPayoutReversal;
        if (netPayoutToRecover > 0) {
          const existingRecovery = await prisma.sellerAdjustment.findFirst({
            where: {
              returnRequestId: returnReq.id,
              category: 'PAYOUT_RECOVERY',
            },
          });

          if (!existingRecovery) {
            const timestamp = Date.now().toString().slice(-6);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const adjustmentNumber = `NC-ADJ-${timestamp}-${randomSuffix}`;

            await prisma.sellerAdjustment.create({
              data: {
                adjustmentNumber,
                shopId: settlement.shopId,
                sellerId: settlement.sellerId,
                settlementId: settlement.id,
                returnRequestId: returnReq.id,
                type: 'DEBIT',
                category: 'PAYOUT_RECOVERY',
                amount: netPayoutToRecover,
                reason: `Payout recovery (Base ₹${returnReversal.basePayoutReversal}${gstReversal > 0 ? ` + GST ₹${gstReversal}` : ''}) for returned product value ₹${returnedProductValue} less reversed commission ₹${commissionReversal} for Return #${returnReq.requestNumber || returnReq.id} on settled order #${settlement.settlementNumber}.`,
                status: 'PENDING',
              },
            });
            adjustmentCreated = true;
          }
        }

        await prisma.financialAuditLog.create({
          data: {
            entityType: 'ADJUSTMENT',
            entityId: settlement.id,
            action: 'SELLER_DEBIT_ADJUSTMENT_CREATED',
            performedById,
            amount: totalDeduction + netPayoutToRecover,
            notes: `Debit adjustment created for return shipping liability (₹${totalDeduction}) and BM-03 payout recovery (₹${netPayoutToRecover}) post-payout.`,
          },
        });
      } else {
        // Pre-settlement return (Section 7, 15):
        // Recalculate settlement before payout: commission reversed, GST reversed, product value refunded, return shipping liability deducted.
        const currentRefunded = Number(settlement.refundedProductValue || 0);
        const currentCommReversal = Number(settlement.commissionReversal || 0);
        const currentRefundedGst = Number(settlement.refundedGstAmount || 0);

        const newRefundedProductValue = CommissionService.roundMoney(
          currentRefunded + returnedProductValue,
        );
        const newCommissionReversal = CommissionService.roundMoney(
          currentCommReversal + commissionReversal,
        );
        const newRefundedGstAmount = CommissionService.roundMoney(currentRefundedGst + gstReversal);

        const fwdShipping =
          forwardCost !== null ? forwardCost : Number(settlement.forwardShippingActual || 0);
        const revShipping =
          reverseCost !== null ? reverseCost : Number(settlement.reverseShippingActual || 0);

        const breakdown = this.computeSettlementBreakdown({
          grossProductValue: settlement.grossProductValue,
          totalMrp: settlement.totalMrp ?? undefined,
          refundedProductValue: newRefundedProductValue,
          commissionAmount: settlement.commissionAmount,
          commissionReversal: newCommissionReversal,
          sellerGstStatus: settlement.sellerGstStatus || sellerGstStatus,
          sellerGstRate: settlement.sellerGstRate ?? undefined,
          sellerGstAmount: settlement.sellerGstAmount ?? undefined,
          refundedGstAmount: newRefundedGstAmount,
          forwardShippingActual: fwdShipping,
          reverseShippingActual: revShipping,
          sellerDiscounts: settlement.sellerDiscounts,
          otherDeductions: settlement.otherDeductions,
          adjustments: settlement.adjustments,
        });

        await prisma.sellerSettlement.update({
          where: { id: settlement.id },
          data: {
            refundedProductValue: newRefundedProductValue,
            commissionReversal: newCommissionReversal,
            refundedGstAmount: newRefundedGstAmount,
            sellerBasePayout: breakdown.sellerBasePayout,
            sellerTotalPayout: breakdown.sellerTotalPayout,
            forwardShippingActual: fwdShipping,
            reverseShippingActual: revShipping,
            returnShippingDeduction: breakdown.returnShippingDeduction,
            netSettlementAmount: breakdown.netSettlementAmount,
            status: 'ADJUSTED',
            notes: notes
              ? `${settlement.notes || ''} | ${notes}`
              : `${settlement.notes || ''} | Adjusted for return: product refunded ₹${returnedProductValue}, commission reversed ₹${commissionReversal}, GST reversed ₹${gstReversal}, return shipping liability ₹${breakdown.returnShippingDeduction}`,
          },
        });
        settlementUpdated = true;

        if (isReverseShippingAvailable && breakdown.returnShippingDeduction > 0) {
          await prisma.financialAuditLog.create({
            data: {
              entityType: 'RETURN_SHIPPING',
              entityId: settlement.id,
              action: 'RETURN_SHIPPING_DEDUCTION_APPLIED',
              performedById,
              amount: breakdown.returnShippingDeduction,
              notes: `Deducted actual forward (₹${fwdShipping}) + actual reverse (₹${revShipping}) shipping costs from seller settlement.`,
            },
          });
        }

        // RECOVERABLE SELLER DEBIT / RECEIVABLE BALANCE MECHANISM:
        // If the return shipping liability exceeds base seller earnings (e.g. ₹116 liability with ₹0 product earnings),
        // the unrecovered deficit is recorded as a recoverable DEBIT SellerAdjustment in PENDING status.
        // It will be retained as an outstanding debit balance and automatically offset against future settlements.
        if (breakdown.unrecoveredDebitLiability > 0) {
          const existingPendingAdj = await prisma.sellerAdjustment.findFirst({
            where: {
              returnRequestId: returnReq.id,
              category: 'RETURN_SHIPPING_LIABILITY',
            },
          });

          if (!existingPendingAdj) {
            const timestamp = Date.now().toString().slice(-6);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const adjustmentNumber = `NC-ADJ-${timestamp}-${randomSuffix}`;

            await prisma.sellerAdjustment.create({
              data: {
                adjustmentNumber,
                shopId: settlement.shopId,
                sellerId: settlement.sellerId,
                settlementId: settlement.id,
                returnRequestId: returnReq.id,
                type: 'DEBIT',
                category: 'RETURN_SHIPPING_LIABILITY',
                amount: breakdown.unrecoveredDebitLiability,
                recoveredAmount: 0,
                reason: `Unrecovered return shipping liability (Forward ₹${fwdShipping} + Reverse ₹${revShipping}) for Return #${returnReq.requestNumber || returnReq.id}. Deficit retained as recoverable debit balance.`,
                status: 'PENDING',
              },
            });
            adjustmentCreated = true;

            await prisma.financialAuditLog.create({
              data: {
                entityType: 'ADJUSTMENT',
                entityId: settlement.id,
                action: 'RECOVERABLE_SELLER_DEBIT_RECORDED',
                performedById,
                amount: breakdown.unrecoveredDebitLiability,
                notes: `Pre-settlement return liability created unrecovered debit balance of ₹${breakdown.unrecoveredDebitLiability}. Retained as pending receivable against future settlements.`,
              },
            });
          }

          // Check if the seller has any other active settlement with positive net to immediately offset against
          const otherPositiveSettlement = await prisma.sellerSettlement.findFirst({
            where: {
              shopId: settlement.shopId,
              id: { not: settlement.id },
              status: { in: ['PENDING_SETTLEMENT', 'ELIGIBLE_FOR_SETTLEMENT'] },
              netSettlementAmount: { gt: 0 },
            },
            orderBy: { createdAt: 'asc' },
          });

          if (otherPositiveSettlement) {
            await this.offsetPendingSellerDebits(otherPositiveSettlement.id);
          }
        }
      }
    }

    try {
      const { ContributionService } = await import('./contribution.service');
      await ContributionService.recordOrderContribution(returnReq.orderId, 'RETURNED' as any);
    } catch (cErr) {
      console.warn('[BM11_RETURN_CONTRIBUTION_WARN]', cErr);
    }

    return {
      returnShippingDeduction: totalDeduction,
      commissionReversal,
      refundAmount,
      adjustmentCreated,
      settlementUpdated,
      inventoryRestored,
    };
  }

  /**
   * Backwards compatible alias for onReturnVerified.
   */
  public static async onReturnApproved(
    params: Parameters<typeof SettlementService.onReturnVerified>[0],
  ) {
    return this.onReturnVerified(params);
  }

  /**
   * Pure calculation engine for debit offset against seller settlement funds.
   * Can be tested independently with money-safe arithmetic.
   */
  public static calculateDebitOffset(params: {
    netPayableBeforeOffset: number;
    pendingDebits: Array<{ id: string; amount: number; recoveredAmount: number }>;
  }): {
    totalOffset: number;
    remainingNet: number;
    updatedDebits: Array<{
      id: string;
      offsetApplied: number;
      newRecoveredAmount: number;
      isFullyRecovered: boolean;
    }>;
  } {
    let availableFunds = CommissionService.roundMoney(Math.max(0, params.netPayableBeforeOffset));
    let totalOffset = 0;
    const updatedDebits: Array<{
      id: string;
      offsetApplied: number;
      newRecoveredAmount: number;
      isFullyRecovered: boolean;
    }> = [];

    for (const debit of params.pendingDebits) {
      if (availableFunds <= 0) {
        updatedDebits.push({
          id: debit.id,
          offsetApplied: 0,
          newRecoveredAmount: debit.recoveredAmount,
          isFullyRecovered: debit.recoveredAmount >= debit.amount,
        });
        continue;
      }

      const remainingDebit = CommissionService.roundMoney(
        Math.max(0, debit.amount - debit.recoveredAmount),
      );
      if (remainingDebit <= 0) continue;

      const offset = CommissionService.roundMoney(Math.min(availableFunds, remainingDebit));
      availableFunds = CommissionService.roundMoney(availableFunds - offset);
      totalOffset = CommissionService.roundMoney(totalOffset + offset);
      const newRecovered = CommissionService.roundMoney(debit.recoveredAmount + offset);

      updatedDebits.push({
        id: debit.id,
        offsetApplied: offset,
        newRecoveredAmount: newRecovered,
        isFullyRecovered: newRecovered >= debit.amount,
      });
    }

    return {
      totalOffset,
      remainingNet: availableFunds,
      updatedDebits,
    };
  }

  /**
   * Applies outstanding recoverable seller debits against an active seller settlement (Section 7).
   * Automatically offsets pending debits from future settlements until debit reaches zero.
   * Idempotent & non-destructive.
   */
  public static async offsetPendingSellerDebits(settlementId: string): Promise<{
    totalOffset: number;
    remainingNet: number;
    offsetsAppliedCount: number;
  }> {
    const settlement = await prisma.sellerSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement || settlement.status === 'SETTLED' || settlement.status === 'CANCELLED') {
      return {
        totalOffset: 0,
        remainingNet: Number(settlement?.netSettlementAmount || 0),
        offsetsAppliedCount: 0,
      };
    }

    const currentNet = Number(settlement.netSettlementAmount || 0);
    if (currentNet <= 0) {
      return { totalOffset: 0, remainingNet: 0, offsetsAppliedCount: 0 };
    }

    // Query pending DEBIT adjustments for this shop
    const pendingDebits = await prisma.sellerAdjustment.findMany({
      where: {
        shopId: settlement.shopId,
        type: 'DEBIT',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingDebits.length === 0) {
      return { totalOffset: 0, remainingNet: currentNet, offsetsAppliedCount: 0 };
    }

    const calcResult = this.calculateDebitOffset({
      netPayableBeforeOffset: currentNet,
      pendingDebits: pendingDebits.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        recoveredAmount: Number(d.recoveredAmount || 0),
      })),
    });

    if (calcResult.totalOffset <= 0) {
      return { totalOffset: 0, remainingNet: currentNet, offsetsAppliedCount: 0 };
    }

    let offsetsAppliedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const update of calcResult.updatedDebits) {
        if (update.offsetApplied > 0) {
          offsetsAppliedCount++;
          await tx.sellerAdjustment.update({
            where: { id: update.id },
            data: {
              recoveredAmount: update.newRecoveredAmount,
              status: update.isFullyRecovered ? 'APPLIED' : 'PENDING',
              appliedAt: update.isFullyRecovered ? new Date() : undefined,
            },
          });

          await tx.financialAuditLog.create({
            data: {
              entityType: 'ADJUSTMENT',
              entityId: update.id,
              action: 'DEBIT_OFFSET_RECOVERED',
              amount: update.offsetApplied,
              notes: `Offset ₹${update.offsetApplied} against Settlement #${settlement.settlementNumber}. New recovered amount: ₹${update.newRecoveredAmount}. Fully recovered: ${update.isFullyRecovered}.`,
            },
          });
        }
      }

      const newAdjustments = CommissionService.roundMoney(
        Number(settlement.adjustments || 0) - calcResult.totalOffset,
      );

      await tx.sellerSettlement.update({
        where: { id: settlement.id },
        data: {
          adjustments: newAdjustments,
          netSettlementAmount: calcResult.remainingNet,
          notes: `${settlement.notes || ''} | Offset ₹${calcResult.totalOffset} outstanding seller debit balance. Remaining net: ₹${calcResult.remainingNet}.`,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          entityType: 'SETTLEMENT',
          entityId: settlement.id,
          action: 'SELLER_DEBIT_OFFSET_APPLIED',
          amount: calcResult.totalOffset,
          notes: `Settlement net reduced by ₹${calcResult.totalOffset} to recover outstanding seller debit balance.`,
          newValues: {
            previousNet: currentNet,
            offsetAmount: calcResult.totalOffset,
            newNet: calcResult.remainingNet,
          },
        },
      });
    });

    return {
      totalOffset: calcResult.totalOffset,
      remainingNet: calcResult.remainingNet,
      offsetsAppliedCount,
    };
  }

  /**
   * BM-07 AC-09: Authoritative Settlement Eligibility Gate.
   * A seller settlement is eligible for release IF AND ONLY IF:
   * 1. Delivery is confirmed (deliveryDate is not null).
   * 2. T+7 normal settlement window has elapsed (settlementEligibilityDate <= referenceDate).
   * 3. For COD orders: Shiprocket / courier COD remittance MUST be confirmed
   *    (shipment.codRemittanceStatus === 'REMITTED' or 'RECONCILED') for that specific seller's shipment.
   *    Multi-seller isolation: One seller's remittance does NOT unlock another seller's settlement.
   * 4. No active return, replacement, or dispute blocks the settlement.
   * 5. Current status is PENDING_SETTLEMENT.
   */
  public static async isSettlementEligible(
    settlementIdOrRecord: string | any,
    referenceDate: Date = new Date(),
  ): Promise<{
    eligible: boolean;
    reason?: string;
    settlement?: any;
    blockingReturn?: any;
    shipment?: any;
  }> {
    let settlement: any;
    if (typeof settlementIdOrRecord === 'string') {
      settlement = await prisma.sellerSettlement.findUnique({
        where: { id: settlementIdOrRecord },
        include: { vendorOrder: true },
      });
    } else {
      settlement = settlementIdOrRecord;
    }

    if (!settlement) {
      return { eligible: false, reason: 'Settlement record not found.' };
    }

    if (settlement.status !== 'PENDING_SETTLEMENT') {
      return {
        eligible: false,
        reason: `Settlement is currently in ${settlement.status} status.`,
        settlement,
      };
    }

    if (!settlement.deliveryDate) {
      return {
        eligible: false,
        reason: 'Order delivery has not been confirmed.',
        settlement,
      };
    }

    // Gating check 1: Payment Method & Courier COD Remittance Status (AC-09)
    const masterOrder = await prisma.order.findUnique({
      where: { id: settlement.masterOrderId },
      select: { id: true, paymentMethod: true },
    });

    let shipment: any = null;
    if (
      masterOrder?.paymentMethod === PaymentMethod.COD ||
      (masterOrder?.paymentMethod as any) === 'COD'
    ) {
      shipment = await prisma.shipment.findFirst({
        where: {
          OR: [
            ...(settlement.vendorOrderId ? [{ vendorOrderId: settlement.vendorOrderId }] : []),
            { masterOrderId: settlement.masterOrderId, shopId: settlement.shopId },
          ],
        },
        select: {
          id: true,
          shipmentNumber: true,
          codRemittanceStatus: true,
          remittedAt: true,
        },
      });

      const isRemitted =
        shipment?.codRemittanceStatus === 'REMITTED' ||
        shipment?.codRemittanceStatus === 'RECONCILED';

      if (!isRemitted) {
        return {
          eligible: false,
          reason: 'Courier COD remittance pending (remittance gate blocked).',
          settlement,
          shipment,
        };
      }
    }

    // Gating check 2: T+7 Settlement Window
    if (
      settlement.settlementEligibilityDate &&
      new Date(settlement.settlementEligibilityDate).getTime() > referenceDate.getTime()
    ) {
      return {
        eligible: false,
        reason: 'Settlement window (T+7 days) has not yet elapsed.',
        settlement,
        shipment,
      };
    }

    // Gating check 3: Blocking active return / replacement / dispute
    const blockingReturn = await prisma.returnRequest.findFirst({
      where: {
        OR: [
          ...(settlement.vendorOrderId ? [{ vendorOrderId: settlement.vendorOrderId }] : []),
          { orderId: settlement.masterOrderId },
        ],
        status: {
          in: [
            'REQUESTED',
            'UNDER_REVIEW',
            'APPROVED',
            'PICKUP_PENDING',
            'PICKUP_INITIATED',
            'IN_TRANSIT',
            'RECEIVED',
            'VERIFIED',
            'REFUND_PENDING',
            'REPLACEMENT_PENDING',
          ] as ReturnStatus[],
        },
      },
    });

    if (blockingReturn) {
      return {
        eligible: false,
        reason: `Blocking active return request #${blockingReturn.requestNumber || blockingReturn.id} (${blockingReturn.status}).`,
        settlement,
        blockingReturn,
        shipment,
      };
    }

    return {
      eligible: true,
      settlement,
      shipment,
    };
  }

  /**
   * Automated / Cron Settlement Processing (Section 22).
   * Periodically identifies orders where:
   * delivery_date + 7 days <= current time
   * and courier COD remittance is confirmed (for COD orders)
   * and no blocking return/replacement/dispute exists.
   * Then marks seller settlement as: ELIGIBLE_FOR_SETTLEMENT.
   * Idempotent: Does not alter already eligible, settled, or adjusted settlements.
   */
  public static async processSettlementEligibilityCron(): Promise<{
    processedCount: number;
    eligibleCount: number;
    heldCount: number;
  }> {
    const now = new Date();

    // 1. Query settlements where eligibility date has arrived and still PENDING_SETTLEMENT
    const pendingSettlements = await prisma.sellerSettlement.findMany({
      where: {
        status: 'PENDING_SETTLEMENT',
        settlementEligibilityDate: { lte: now },
        deliveryDate: { not: null },
      },
      include: {
        vendorOrder: true,
      },
    });

    let eligibleCount = 0;
    let heldCount = 0;

    for (const settlement of pendingSettlements) {
      const eligibility = await this.isSettlementEligible(settlement, now);

      if (!eligibility.eligible) {
        if (eligibility.blockingReturn) {
          // Place ON_HOLD to prevent release
          await prisma.sellerSettlement.update({
            where: { id: settlement.id },
            data: {
              status: 'ON_HOLD',
              holdReason: eligibility.reason,
            },
          });
          heldCount++;

          await prisma.financialAuditLog.create({
            data: {
              entityType: 'SETTLEMENT',
              entityId: settlement.id,
              action: 'AUTOMATED_SETTLEMENT_HELD',
              notes: `Settlement held automatically during eligibility scan due to active return.`,
            },
          });
        }
        // If ineligible due to COD remittance pending or window not elapsed, remain in PENDING_SETTLEMENT
        continue;
      }

      // Safe to release: Offset pending debits & mark ELIGIBLE_FOR_SETTLEMENT
      await this.offsetPendingSellerDebits(settlement.id).catch((err) =>
        console.warn('[CRON_SETTLEMENT_DEBIT_OFFSET_ERROR]', err),
      );

      await prisma.sellerSettlement.update({
        where: { id: settlement.id },
        data: {
          status: 'ELIGIBLE_FOR_SETTLEMENT',
          holdReason: null,
        },
      });
      eligibleCount++;

      await prisma.financialAuditLog.create({
        data: {
          entityType: 'SETTLEMENT',
          entityId: settlement.id,
          action: 'AUTOMATED_SETTLEMENT_MARKED_ELIGIBLE',
          notes: `Delivery + 7 days and remittance confirmed with no disputes. Marked ELIGIBLE_FOR_SETTLEMENT.`,
        },
      });
    }

    return {
      processedCount: pendingSettlements.length,
      eligibleCount,
      heldCount,
    };
  }

  /**
   * Authoritative RTO Financial Ledger & Cost Allocation (BM-04 Section 20-25):
   * When an order consignment becomes RTO (Return-To-Origin):
   * - RTO-related eligible loss/cost = 50% Navya + 50% Seller.
   * - Does NOT create guessed amounts if authoritative cost is unavailable.
   * - Strictly idempotent: never creates duplicate debits or adjustments.
   * - Distinguishes RTO from BM-01 customer returns (Customer returns are 100% seller freight liability).
   */
  public static async onRtoDelivered(params: {
    shipmentId: string;
    rtoCost?: number | null;
    performedById?: string;
    notes?: string;
    rtoReason?: string;
  }): Promise<{
    shipmentId: string;
    totalRtoCost: number;
    navyaShare: number;
    sellerShare: number;
    adjustmentCreated: boolean;
    adjustmentId?: string;
    refundProcessed?: boolean;
    refundAmount?: number;
    inventoryRestored?: boolean;
    settlementCancelled?: boolean;
    message: string;
  }> {
    const { RtoService } = await import('@/backend/services/shipping/rto.service');
    return RtoService.processRtoDelivered(params);
  }
}
