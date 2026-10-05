import { PaymentMethod } from '@prisma/client';

import { CommissionService } from '@/backend/services/commission.service';
import { prisma } from '@/lib/prisma';

export interface RemittanceRecordInput {
  shipmentNumber?: string;
  shipmentId?: string;
  remittedAmount: number;
  remittanceRef: string;
}

export interface ProcessBatchInput {
  courierPartner?: string;
  bankReference?: string;
  records: RemittanceRecordInput[];
  notes?: string;
}

export class CodReconciliationService {
  /**
   * Retrieves an authoritative overview of all COD orders, their verification states,
   * shipment collection amounts, and courier remittance statuses.
   */
  static async getCodOrdersOverview(
    params: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { status, limit = 50, offset = 0 } = params;

    const where: any = {
      paymentMethod: PaymentMethod.COD,
    };

    if (status) {
      where.orderStatus = status;
    }

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          address: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          shipments: {
            include: {
              shop: {
                select: { id: true, name: true, shopCode: true },
              },
            },
          },
          customerRefunds: true,
        },
      }),
    ]);

    const formattedOrders = orders.map((o) => {
      const totalShipmentCod = o.shipments.reduce((sum, s) => sum + Number(s.codAmount || 0), 0);
      const isReconciled =
        CommissionService.roundMoney(totalShipmentCod) ===
        CommissionService.roundMoney(Number(o.finalAmount));

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.address?.fullName || o.user?.name || 'Customer',
        customerPhone: o.address?.mobile || null,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        codVerificationStatus: o.codVerificationStatus || 'PENDING',
        codConfirmedAt: o.codConfirmedAt,
        codVerificationRef: o.codVerificationRef,
        sellingSubtotal: Number(o.totalAmount),
        couponDiscount: Number(o.discountAmount),
        shippingAmount: Number(o.shippingAmount),
        taxAmount: Number(o.taxAmount),
        codFee: Number(o.codFee || 0),
        codFeeTax: Number(o.codFeeTax || 0),
        finalPayable: Number(o.finalAmount),
        shipments: o.shipments.map((s) => ({
          id: s.id,
          shipmentNumber: s.shipmentNumber,
          shopName: s.shop.name,
          sellerSubtotal: Number(s.sellerSubtotal || 0),
          shippingCharge: Number(s.shippingCharge || 0),
          codFee: Number(s.codFee || 0),
          codFeeTax: Number(s.codFeeTax || 0),
          codAmount: Number(s.codAmount || 0),
          status: s.status,
          codRemittanceStatus: s.codRemittanceStatus || 'PENDING',
          codRemittanceRef: s.codRemittanceRef || null,
          codRemittedAmount: s.codRemittedAmount ? Number(s.codRemittedAmount) : null,
          remittedAt: s.remittedAt || null,
        })),
        isShipmentCodReconciled: isReconciled,
        refunds: o.customerRefunds.map((r) => ({
          refundNumber: r.refundNumber,
          amount: Number(r.amount),
          status: r.status,
          refundMethod: r.refundMethod,
          payoutReference: r.payoutReference,
          payoutStatus: r.payoutStatus,
          nonRefundableCodFee: Number(r.nonRefundableCodFee || 0),
          refundedAt: r.refundedAt,
        })),
        createdAt: o.createdAt,
      };
    });

    return {
      success: true,
      totalCount,
      limit,
      offset,
      orders: formattedOrders,
    };
  }

  /**
   * Processes a courier remittance batch: marks shipments as REMITTED and persists
   * an immutable CodRemittanceBatch record in the database.
   */
  static async processCourierRemittanceBatch(input: ProcessBatchInput) {
    const { courierPartner = 'Shiprocket', bankReference, records, notes } = input;

    if (!records || records.length === 0) {
      throw new Error('Remittance batch must contain at least one shipment record.');
    }

    // Idempotency check 1: Bank Reference
    if (bankReference) {
      const existingBatch = await prisma.codRemittanceBatch.findFirst({
        where: { bankReference },
      });
      if (existingBatch) {
        // Only treat as duplicate if all shipments in records are already REMITTED
        const anyUnremitted = await prisma.shipment.findFirst({
          where: {
            OR: records.map((r) => ({
              ...(r.shipmentId ? { id: r.shipmentId } : {}),
              ...(r.shipmentNumber ? { shipmentNumber: r.shipmentNumber } : {}),
            })),
            codRemittanceStatus: { not: 'REMITTED' },
          },
        });

        if (!anyUnremitted) {
          return {
            success: true,
            batchNumber: existingBatch.batchNumber,
            totalOrdersCount: existingBatch.totalOrdersCount,
            totalCollected: Number(existingBatch.totalCollected),
            totalRemitted: Number(existingBatch.totalRemitted),
            reconciledShipmentsCount: existingBatch.totalOrdersCount,
            isDuplicate: true,
            message: 'Remittance batch already processed (idempotent)',
          };
        }
      }
    }

    // Idempotency check 2: All shipments in batch already remitted with same remittanceRef
    const allAlreadyRemitted = await Promise.all(
      records.map(async (rec) => {
        const s = await prisma.shipment.findFirst({
          where: {
            OR: [
              ...(rec.shipmentId ? [{ id: rec.shipmentId }] : []),
              ...(rec.shipmentNumber ? [{ shipmentNumber: rec.shipmentNumber }] : []),
            ],
          },
          select: { codRemittanceStatus: true, codRemittanceRef: true, remittanceBatchId: true },
        });
        return s?.codRemittanceStatus === 'REMITTED' && s?.codRemittanceRef === rec.remittanceRef;
      }),
    );

    if (allAlreadyRemitted.length > 0 && allAlreadyRemitted.every(Boolean)) {
      const firstShipment = await prisma.shipment.findFirst({
        where: {
          OR: [
            ...(records[0].shipmentId ? [{ id: records[0].shipmentId }] : []),
            ...(records[0].shipmentNumber ? [{ shipmentNumber: records[0].shipmentNumber }] : []),
          ],
        },
        select: { remittanceBatchId: true },
      });

      const existingBatch = firstShipment?.remittanceBatchId
        ? await prisma.codRemittanceBatch.findUnique({
            where: { batchNumber: firstShipment.remittanceBatchId },
          })
        : null;

      if (existingBatch) {
        return {
          success: true,
          batchNumber: existingBatch.batchNumber,
          totalOrdersCount: existingBatch.totalOrdersCount,
          totalCollected: Number(existingBatch.totalCollected),
          totalRemitted: Number(existingBatch.totalRemitted),
          reconciledShipmentsCount: existingBatch.totalOrdersCount,
          isDuplicate: true,
          message: 'Remittance batch already processed (idempotent)',
        };
      }
    }

    const batchNumber = `NC-CRB-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    let totalCollected = 0;
    let totalRemitted = 0;
    const reconciledShipments = [];

    // Atomic transaction for batch reconciliation
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        const shipment = await tx.shipment.findFirst({
          where: {
            OR: [
              ...(rec.shipmentId ? [{ id: rec.shipmentId }] : []),
              ...(rec.shipmentNumber ? [{ shipmentNumber: rec.shipmentNumber }] : []),
            ],
          },
        });

        if (!shipment) {
          throw new Error(`Shipment ${rec.shipmentNumber || rec.shipmentId} not found.`);
        }

        const expectedCod = Number(shipment.codAmount || 0);
        totalCollected = CommissionService.roundMoney(totalCollected + expectedCod);
        totalRemitted = CommissionService.roundMoney(totalRemitted + rec.remittedAmount);

        const updated = await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            codRemittanceStatus: 'REMITTED',
            codRemittanceRef: rec.remittanceRef,
            codRemittedAmount: rec.remittedAmount,
            remittedAt: new Date(),
            remittanceBatchId: batchNumber,
          },
        });

        reconciledShipments.push(updated);
      }

      // Persist CodRemittanceBatch ledger record
      await tx.codRemittanceBatch.create({
        data: {
          batchNumber,
          courierPartner,
          totalOrdersCount: records.length,
          totalCollected,
          totalRemitted,
          bankReference: bankReference || null,
          status: 'RECONCILED',
          notes: notes || `Remitted via ${courierPartner} batch`,
        },
      });
    });

    return {
      success: true,
      batchNumber,
      totalOrdersCount: records.length,
      totalCollected,
      totalRemitted,
      reconciledShipmentsCount: reconciledShipments.length,
    };
  }
}
