import { OrderStatus, PaymentMethod, Prisma, ShippingStatus } from '@prisma/client';

import { createRazorpayRefund } from '@/backend/lib/razorpay';
import { prisma } from '@/lib/prisma';

import { CommissionService } from '../commission.service';
import { CustomerShippingService } from './customer-shipping.service';
import { ShiprocketLogger } from './logger';
import { StatusAggregatorService } from './status-aggregator.service';

export interface RtoProcessResult {
  shipmentId: string;
  rtoStatus: string;
  totalRtoCost: number;
  navyaShare: number;
  sellerShare: number;
  adjustmentCreated: boolean;
  adjustmentId?: string;
  refundProcessed: boolean;
  refundAmount: number;
  inventoryRestored: boolean;
  settlementCancelled: boolean;
  message: string;
}

export class RtoService {
  /**
   * Transition guard: determines if transition to an RTO state is valid.
   * DELIVERED -> RTO is strictly illegal.
   */
  public static validateTransition(
    currentStatus: string,
    targetStatus: string,
  ): { allowed: boolean; reason?: string } {
    const cur = (currentStatus || '').toUpperCase().trim();
    const tgt = (targetStatus || '').toUpperCase().trim();

    if (cur === 'DELIVERED') {
      return {
        allowed: false,
        reason:
          'Delivered shipment cannot transition to RTO. Customer return required if goods received.',
      };
    }

    if (cur === 'CUSTOMER_RETURN_VERIFIED' || cur === 'RETURNED') {
      return {
        allowed: false,
        reason: 'Customer return cannot transition to courier RTO.',
      };
    }

    if (cur === 'RTO_DELIVERED' && tgt === 'RTO_INITIATED') {
      return {
        allowed: false,
        reason: 'Delivered RTO cannot revert to RTO_INITIATED.',
      };
    }

    return { allowed: true };
  }

  /**
   * Registers RTO initiation without premature financial or inventory actions (BM-09 AC-02).
   */
  public static async registerRtoInitiated(params: {
    shipmentId: string;
    reason?: string;
    rtoShipmentId?: string;
  }) {
    const { shipmentId, reason, rtoShipmentId } = params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { masterOrder: { include: { shipments: true } } },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }

    const check = this.validateTransition(shipment.status, 'RTO_INITIATED');
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const shp = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'RTO_INITIATED',
          trackingStatus: 'RTO_INITIATED',
          rtoStatus: 'RTO_INITIATED',
          rtoInitiatedAt: new Date(),
          rtoReason: reason || shipment.rtoReason || 'Undelivered courier turnaround',
          ...(rtoShipmentId ? { rtoShipmentId } : {}),
        },
      });

      if (shipment.vendorOrderId) {
        await tx.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              shippingStatus: 'RTO_INITIATED' as any,
            },
          })
          .catch(() => {});
      }

      // Recalculate master order
      const allShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: 'RTO_INITIATED' } : s,
      );
      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(allShipments);

      await tx.order.update({
        where: { id: shipment.masterOrderId },
        data: { orderStatus: masterStatus },
      });

      return shp;
    });

    return updated;
  }

  /**
   * Registers RTO In Transit without premature financial or inventory actions (BM-09 AC-02).
   */
  public static async registerRtoInTransit(params: { shipmentId: string; rtoShipmentId?: string }) {
    const { shipmentId, rtoShipmentId } = params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }

    const check = this.validateTransition(shipment.status, 'RTO_IN_TRANSIT');
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    return await prisma.$transaction(async (tx) => {
      const shp = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'RTO_IN_TRANSIT',
          trackingStatus: 'RTO_IN_TRANSIT',
          rtoStatus: 'RTO_IN_TRANSIT',
          rtoInTransitAt: new Date(),
          ...(rtoShipmentId ? { rtoShipmentId } : {}),
        },
      });

      if (shipment.vendorOrderId) {
        await tx.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              shippingStatus: 'RTO_IN_TRANSIT' as any,
            },
          })
          .catch(() => {});
      }

      return shp;
    });
  }

  /**
   * Authoritative execution point for RTO Delivered (BM-09 AC-03 through AC-14).
   * Executed when consignment is received back at origin/seller warehouse:
   * 1. Cancels/voids seller settlement payout for undelivered goods (pre-settlement)
   *    or creates recoverable PAYOUT_RECOVERY adjustment (post-settlement).
   * 2. Reverses Navya commission 100%.
   * 3. Calculates 50% Navya / 50% Seller eligible RTO courier cost split (BM-04).
   * 4. Refunds customer order payment for prepaid orders (BM-06).
   * 5. Closes COD order cleanly with ₹0 refund and 0 remittance (BM-07).
   * 6. Restores inventory stock idempotently (Product and ProductVariant).
   * 7. Preserves multi-seller isolation.
   */
  public static async processRtoDelivered(params: {
    shipmentId: string;
    rtoCost?: number | null;
    performedById?: string;
    notes?: string;
    rtoReason?: string;
  }): Promise<RtoProcessResult> {
    const { shipmentId, rtoCost, performedById, notes, rtoReason } = params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        vendorOrder: true,
        masterOrder: {
          include: {
            shipments: true,
            items: true,
            user: true,
            paymentTransactions: true,
          },
        },
        items: true,
        shop: true,
      },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found for RTO processing.`);
    }

    const check = this.validateTransition(shipment.status, 'RTO_DELIVERED');
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    // 1. Idempotency Check:
    if (shipment.rtoDeliveredAt && shipment.rtoSettlementVoided && shipment.rtoInventoryRestored) {
      return {
        shipmentId: shipment.id,
        rtoStatus: 'RTO_DELIVERED',
        totalRtoCost: 0,
        navyaShare: 0,
        sellerShare: 0,
        adjustmentCreated: false,
        refundProcessed: shipment.rtoRefundProcessed || false,
        refundAmount: 0,
        inventoryRestored: true,
        settlementCancelled: true,
        message: 'RTO delivered lifecycle already processed idempotently.',
      };
    }

    // 2. Resolve Authoritative Eligible RTO Courier Cost (BM-04)
    let eligibleCost = 0;
    let isCostPending = false;

    if (rtoCost !== undefined && rtoCost !== null && Number(rtoCost) > 0) {
      eligibleCost = CommissionService.roundMoney(Number(rtoCost));
    } else {
      const fwd = Number(shipment.actualForwardShippingCost || 0);
      const rev = Number(shipment.actualReverseShippingCost || 0);
      if (fwd > 0 || rev > 0) {
        eligibleCost = CommissionService.roundMoney(fwd + rev);
      } else {
        isCostPending = true;
      }
    }

    let split = { totalCost: 0, totalRtoCost: 0, navyaShare: 0, sellerShare: 0 };
    if (!isCostPending && eligibleCost > 0) {
      split = CustomerShippingService.calculateRtoSplit(eligibleCost);
    }

    // 3. Locate Linked Settlement
    const settlement = await prisma.sellerSettlement.findFirst({
      where: {
        OR: [
          ...(shipment.vendorOrderId ? [{ vendorOrderId: shipment.vendorOrderId }] : []),
          { shopId: shipment.shopId, masterOrderId: shipment.masterOrderId },
        ],
      },
    });

    let adjustmentCreated = false;
    let adjustmentId: string | undefined;
    let settlementCancelled = false;
    let refundProcessed = false;
    let refundAmount = 0;
    let inventoryRestored = false;

    await prisma.$transaction(async (tx) => {
      // 4. Pre-Settlement vs Post-Settlement Seller Protection (BM-01 & BM-09)
      if (settlement) {
        if (settlement.status === 'SETTLED') {
          // Post-settlement: Historical settlement remains IMMUTABLE.
          // Create DEBIT SellerAdjustment for PAYOUT_RECOVERY
          const timestamp = Date.now().toString().slice(-6);
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const recoveryAdjNumber = `NC-ADJ-REC-${timestamp}-${randomSuffix}`;

          const payoutRecovery = Number(
            settlement.sellerTotalPayout || settlement.netSettlementAmount || 0,
          );
          if (payoutRecovery > 0) {
            await tx.sellerAdjustment.create({
              data: {
                adjustmentNumber: recoveryAdjNumber,
                shopId: shipment.shopId,
                sellerId: shipment.sellerId,
                settlementId: settlement.id,
                type: 'DEBIT',
                category: 'PAYOUT_RECOVERY',
                amount: payoutRecovery,
                reason: `Payout recovery for undelivered RTO shipment #${shipment.shipmentNumber}. Consignment returned to origin after settlement.`,
                status: 'PENDING',
              },
            });
            adjustmentCreated = true;
          }

          // Create DEBIT SellerAdjustment for 50% RTO courier liability
          if (split.sellerShare > 0) {
            const rtoAdjNumber = `NC-ADJ-RTO-${timestamp}-${randomSuffix}`;
            const rtoAdj = await tx.sellerAdjustment.create({
              data: {
                adjustmentNumber: rtoAdjNumber,
                shopId: shipment.shopId,
                sellerId: shipment.sellerId,
                settlementId: settlement.id,
                type: 'DEBIT',
                category: 'RTO_SHIPPING_LIABILITY',
                amount: split.sellerShare,
                reason: `50% RTO courier liability share (Total RTO cost: ₹${split.totalCost}, Navya 50%: ₹${split.navyaShare}, Seller 50%: ₹${split.sellerShare}) for Shipment #${shipment.shipmentNumber}.`,
                status: 'PENDING',
              },
            });
            adjustmentId = rtoAdj.id;
            adjustmentCreated = true;
          }
        } else {
          // Pre-settlement: Zero out settlement product payout and mark CANCELLED
          await tx.sellerSettlement.update({
            where: { id: settlement.id },
            data: {
              status: 'CANCELLED',
              grossProductValue: 0,
              sellerBasePayout: 0,
              sellerTotalPayout: 0,
              netSettlementAmount: 0,
              commissionReversal: Number(settlement.commissionAmount || 0),
              refundedGstAmount: Number(settlement.sellerGstAmount || 0),
              notes:
                `${settlement.notes || ''} | Cancelled due to RTO Delivered on shipment #${shipment.shipmentNumber}. Product payout voided.`.trim(),
            },
          });
          settlementCancelled = true;

          // Record 100% Commission Reversal on Ledger
          await tx.financialAuditLog.create({
            data: {
              entityType: 'COMMISSION',
              entityId: settlement.id,
              action: 'RTO_COMMISSION_REVERSED',
              performedById,
              amount: Number(settlement.commissionAmount || 0),
              notes: `Commission 100% reversed for unfulfilled RTO shipment #${shipment.shipmentNumber}.`,
            },
          });

          // Create DEBIT SellerAdjustment for 50% RTO courier liability
          if (split.sellerShare > 0) {
            const timestamp = Date.now().toString().slice(-6);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const rtoAdjNumber = `NC-ADJ-RTO-${timestamp}-${randomSuffix}`;

            const rtoAdj = await tx.sellerAdjustment.create({
              data: {
                adjustmentNumber: rtoAdjNumber,
                shopId: shipment.shopId,
                sellerId: shipment.sellerId,
                settlementId: settlement.id,
                type: 'DEBIT',
                category: 'RTO_SHIPPING_LIABILITY',
                amount: split.sellerShare,
                reason: `50% RTO courier liability share (Total RTO cost: ₹${split.totalCost}, Navya 50%: ₹${split.navyaShare}, Seller 50%: ₹${split.sellerShare}) for Shipment #${shipment.shipmentNumber}.`,
                status: 'PENDING',
              },
            });
            adjustmentId = rtoAdj.id;
            adjustmentCreated = true;
          }
        }
      }

      // 5. Customer Prepaid Refund Disbursal (BM-06 & BM-09)
      const isCod =
        shipment.paymentMethod === PaymentMethod.COD ||
        (shipment.paymentMethod as any) === 'COD' ||
        shipment.masterOrder?.paymentMethod === PaymentMethod.COD ||
        (shipment.masterOrder?.paymentMethod as any) === 'COD';

      if (!isCod) {
        // Calculate refundable amount from historical line-item snapshots
        let shipmentProductValue = 0;
        let shipmentTax = 0;

        for (const item of shipment.items) {
          const matchedOrderLine = shipment.masterOrder.items.find(
            (oi) => oi.id === item.orderItemId || oi.sku === item.sku,
          );
          const price = Number(matchedOrderLine?.price || item.price || 0);
          const qty = item.quantity;
          shipmentProductValue = CommissionService.roundMoney(shipmentProductValue + price * qty);

          const tax = Number(matchedOrderLine?.taxAmount || 0);
          const orderQty = matchedOrderLine?.quantity || qty;
          if (tax > 0 && orderQty > 0) {
            shipmentTax = CommissionService.roundMoney(shipmentTax + (tax / orderQty) * qty);
          }
        }

        // Allocated coupon deduction
        const masterSubtotal = Number(shipment.masterOrder.totalAmount || 0);
        const masterCoupon = Number(shipment.masterOrder.discountAmount || 0);
        let allocatedCoupon = 0;
        if (masterCoupon > 0 && masterSubtotal > 0) {
          allocatedCoupon = CommissionService.roundMoney(
            (shipmentProductValue / masterSubtotal) * masterCoupon,
          );
        }

        // Customer shipping: Refunded if customer paid shipping for this shipment
        const customerShipping = Number(shipment.shippingCharge || 0);

        refundAmount = CommissionService.roundMoney(
          Math.max(0, shipmentProductValue - allocatedCoupon + shipmentTax + customerShipping),
        );

        const paymentTx = shipment.masterOrder.paymentTransactions?.find(
          (pt) => pt.status === 'PAID' && pt.razorpayPaymentId,
        );

        if (paymentTx?.razorpayPaymentId && refundAmount > 0) {
          const rzpRefundRes = await createRazorpayRefund({
            paymentId: paymentTx.razorpayPaymentId,
            amountInPaise: Math.round(refundAmount * 100),
            notes: {
              reason: 'RTO_UNDELIVERED_REFUND',
              orderNumber: shipment.masterOrder.orderNumber,
              shipmentNumber: shipment.shipmentNumber,
            },
          });

          const timestamp = Date.now().toString().slice(-6);
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const refundNumber = `NC-RFND-RTO-${timestamp}-${randomSuffix}`;

          await tx.customerRefund.create({
            data: {
              refundNumber,
              orderId: shipment.masterOrderId,
              userId: shipment.masterOrder.userId,
              amount: refundAmount,
              originalPayment: Number(shipment.masterOrder.totalAmount || refundAmount),
              status: 'REFUNDED',
              refundTransaction: rzpRefundRes.id,
              razorpayRefundId: rzpRefundRes.id,
              gatewayRefundStatus: 'PROCESSED',
              refundMethod: 'RAZORPAY_REVERSAL',
              reason: `RTO undelivered consignment refund for shipment #${shipment.shipmentNumber}`,
              refundedAt: new Date(),
            },
          });

          refundProcessed = true;

          await tx.financialAuditLog.create({
            data: {
              entityType: 'SETTLEMENT',
              entityId: shipment.id,
              action: 'RTO_PREPAID_REFUND_EXECUTED',
              performedById,
              amount: refundAmount,
              notes: `Refund of ₹${refundAmount} issued via Razorpay (${rzpRefundRes.id}) for RTO shipment #${shipment.shipmentNumber}.`,
            },
          });
        }
      } else {
        // COD order: Cash was uncollected at doorstep; refund is ₹0
        refundProcessed = true;
        refundAmount = 0;
      }

      // 6. Inventory Restoration (Exact shipped quantities, exactly once)
      if (!shipment.rtoInventoryRestored) {
        for (const item of shipment.items) {
          if (item.variantId) {
            await tx.productVariant
              .update({
                where: { id: item.variantId },
                data: {
                  availableStock: { increment: item.quantity },
                  soldStock: { decrement: item.quantity },
                },
              })
              .catch(() => {});
          }

          await tx.product
            .update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            })
            .catch(() => {});
        }
        inventoryRestored = true;

        await tx.financialAuditLog.create({
          data: {
            entityType: 'SETTLEMENT',
            entityId: shipment.id,
            action: 'RTO_INVENTORY_RESTORED',
            performedById,
            notes: `Restored ${shipment.items.reduce((s, i) => s + i.quantity, 0)} items to inventory for RTO shipment #${shipment.shipmentNumber}.`,
          },
        });
      }

      // 7. Update Shipment Status
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'RTO_DELIVERED',
          trackingStatus: 'RTO_DELIVERED',
          rtoStatus: 'RTO_DELIVERED',
          rtoDeliveredAt: new Date(),
          rtoReason: rtoReason || shipment.rtoReason || 'Undelivered return to origin',
          rtoCostPending: isCostPending,
          rtoSettlementVoided: true,
          rtoInventoryRestored: true,
          rtoRefundProcessed: refundProcessed,
        },
      });

      // 8. Update Child VendorOrder
      if (shipment.vendorOrderId) {
        await tx.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              status: OrderStatus.RTO,
              shippingStatus: ShippingStatus.RTO_DELIVERED,
            },
          })
          .catch(() => {});
      }

      // 9. Recalculate Master Order Status (Multi-seller isolation safe)
      const allShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: 'RTO_DELIVERED' } : s,
      );
      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(allShipments);

      const orderUpdate: any = { orderStatus: masterStatus };
      if (isCod && (masterStatus === OrderStatus.RTO || masterStatus === OrderStatus.CANCELLED)) {
        orderUpdate.paymentStatus = 'FAILED';
      } else if (!isCod && refundProcessed && refundAmount > 0) {
        orderUpdate.paymentStatus =
          masterStatus === OrderStatus.RTO ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      }

      await tx.order.update({
        where: { id: shipment.masterOrderId },
        data: orderUpdate,
      });

      // 10. Record 50/50 RTO Shipping Ledger Entry
      if (split.totalCost > 0) {
        await tx.financialAuditLog.create({
          data: {
            entityType: 'RTO_SHIPPING',
            entityId: shipment.id,
            action: 'RTO_50_50_ALLOCATION',
            performedById,
            amount: split.totalCost,
            notes: `RTO 50/50 split finalized: Total ₹${split.totalCost} | Navya ₹${split.navyaShare} | Seller ₹${split.sellerShare}.`,
            idempotencyKey: `RTO_50_50:${shipment.id}`,
            newValues: {
              totalCost: split.totalCost,
              navyaShare: split.navyaShare,
              sellerShare: split.sellerShare,
            },
          },
        });
      }

      try {
        const { ContributionService } = await import('../contribution.service');
        await ContributionService.recordOrderContribution(shipment.masterOrderId, 'RTO' as any, tx);
      } catch (cErr) {
        console.warn('[BM11_RTO_CONTRIBUTION_WARN]', cErr);
      }
    });

    ShiprocketLogger.info(
      `[RTO_DELIVERED_PROCESSED] Shipment #${shipment.shipmentNumber} completed. Refund: ₹${refundAmount}, Restored: ${inventoryRestored}, Voided: ${settlementCancelled}`,
    );

    return {
      shipmentId: shipment.id,
      rtoStatus: 'RTO_DELIVERED',
      totalRtoCost: split.totalCost,
      navyaShare: split.navyaShare,
      sellerShare: split.sellerShare,
      adjustmentCreated,
      adjustmentId,
      refundProcessed,
      refundAmount,
      inventoryRestored,
      settlementCancelled,
      message: isCostPending
        ? 'RTO delivered processed. Shipping liability deferred until courier cost confirmed.'
        : 'RTO delivered and 50/50 financial liability finalized.',
    };
  }

  /**
   * Updates confirmed actual logistics cost for an RTO shipment where cost was previously pending (BM-09 AC-09).
   * Calculates 50% Navya / 50% Seller split and creates or updates the SellerAdjustment debit.
   */
  public static async updateConfirmedRtoCost(params: {
    shipmentId: string;
    actualCost: number;
    performedById?: string;
  }) {
    const { shipmentId, actualCost, performedById } = params;
    const numericCost = CommissionService.roundMoney(Number(actualCost));
    if (numericCost <= 0) {
      throw new Error('Actual RTO logistics cost must be greater than zero.');
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { shop: true },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }

    const split = CustomerShippingService.calculateRtoSplit(numericCost);

    return await prisma.$transaction(async (tx) => {
      // Update shipment
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          actualReverseShippingCost: numericCost,
          rtoCostPending: false,
        },
      });

      // Find or create SellerAdjustment for 50% RTO courier liability
      let existingAdj = await tx.sellerAdjustment.findFirst({
        where: {
          shopId: shipment.shopId,
          category: 'RTO_SHIPPING_LIABILITY',
          reason: { contains: shipment.shipmentNumber },
        },
      });

      if (existingAdj) {
        existingAdj = await tx.sellerAdjustment.update({
          where: { id: existingAdj.id },
          data: {
            amount: split.sellerShare,
            reason: `50% RTO courier liability share (Total RTO cost: ₹${split.totalCost}, Navya 50%: ₹${split.navyaShare}, Seller 50%: ₹${split.sellerShare}) for Shipment #${shipment.shipmentNumber}.`,
          },
        });
      } else {
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const rtoAdjNumber = `NC-ADJ-RTO-${timestamp}-${randomSuffix}`;

        existingAdj = await tx.sellerAdjustment.create({
          data: {
            adjustmentNumber: rtoAdjNumber,
            shopId: shipment.shopId,
            sellerId: shipment.sellerId,
            type: 'DEBIT',
            category: 'RTO_SHIPPING_LIABILITY',
            amount: split.sellerShare,
            reason: `50% RTO courier liability share (Total RTO cost: ₹${split.totalCost}, Navya 50%: ₹${split.navyaShare}, Seller 50%: ₹${split.sellerShare}) for Shipment #${shipment.shipmentNumber}.`,
            status: 'PENDING',
          },
        });
      }

      // Record audit log
      await tx.financialAuditLog.create({
        data: {
          entityType: 'RTO_SHIPPING',
          entityId: shipment.id,
          action: 'RTO_50_50_ALLOCATION_UPDATED',
          performedById,
          amount: split.totalCost,
          notes: `RTO 50/50 logistics liability finalized with confirmed carrier charges: Total ₹${split.totalCost} | Navya 50%: ₹${split.navyaShare} | Seller 50%: ₹${split.sellerShare}`,
          idempotencyKey: `RTO_50_50_CONFIRMED:${shipment.id}`,
          newValues: {
            totalCost: split.totalCost,
            navyaShare: split.navyaShare,
            sellerShare: split.sellerShare,
          },
        },
      });

      try {
        const { ContributionService } = await import('../contribution.service');
        await ContributionService.recordOrderContribution(shipment.masterOrderId, 'RTO' as any, tx);
      } catch (cErr) {
        console.warn('[BM11_RTO_CONFIRMED_CONTRIBUTION_WARN]', cErr);
      }

      return {
        shipmentId: shipment.id,
        totalCost: split.totalCost,
        navyaShare: split.navyaShare,
        sellerShare: split.sellerShare,
        adjustmentId: existingAdj.id,
      };
    });
  }
}
