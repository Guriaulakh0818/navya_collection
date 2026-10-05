import { OrderStatus, PaymentMethod, PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { ShiprocketLogger } from './logger';
import { MultiSellerShipmentService } from './multi-seller-shipment.service';

export interface CodVerificationResult {
  success: boolean;
  message: string;
  orderId?: string;
  status?: string;
  shipmentsCreated?: number;
}

export class ShiprocketCodService {
  /**
   * Initiates the Shiprocket COD verification flow for a newly placed COD order.
   * Order begins in PENDING verification state. Shipment dispatch is strictly blocked
   * until verification is confirmed (VERIFIED).
   */
  static async initiateVerification(
    orderId: string,
    txClient?: PrismaClient,
  ): Promise<CodVerificationResult> {
    const client = txClient || prisma;

    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { address: true, user: true },
    });

    if (!order) {
      return { success: false, message: `Order ${orderId} not found.` };
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      return { success: false, message: 'Order is not a Cash on Delivery (COD) order.' };
    }

    // Set initial pending verification status if not already set
    if (order.codVerificationStatus !== 'PENDING') {
      await client.order.update({
        where: { id: order.id },
        data: {
          codVerificationStatus: 'PENDING',
        },
      });
    }

    ShiprocketLogger.info(
      `[SHIPROCKET_COD_VERIFICATION_INITIATED] Order #${order.orderNumber} placed in PENDING verification state.`,
      undefined,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        mobile: order.address?.mobile,
      },
    );

    return {
      success: true,
      message: 'Shiprocket COD verification initiated. Pending buyer confirmation.',
      orderId: order.id,
      status: 'PENDING',
    };
  }

  /**
   * Idempotent webhook/event processor for Shiprocket COD Buyer Verification events.
   * Handles VERIFIED, REJECTED, and EXPIRED statuses.
   */
  static async handleVerificationWebhook(payload: {
    orderNumber?: string;
    orderId?: string;
    status: 'VERIFIED' | 'REJECTED' | 'EXPIRED' | string;
    referenceId?: string;
    channel?: string;
    timestamp?: string | Date;
  }): Promise<CodVerificationResult> {
    const identifier = payload.orderNumber || payload.orderId;
    if (!identifier) {
      return { success: false, message: 'Missing order identifier in verification payload.' };
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
      },
      include: {
        items: true,
        vendorOrders: true,
        shipments: true,
      },
    });

    if (!order) {
      return { success: false, message: `Order ${identifier} not found for verification update.` };
    }

    const normalizedStatus = payload.status.toUpperCase();

    // Idempotency: If order already reached this terminal state, do not repeat side effects
    if (order.codVerificationStatus === normalizedStatus) {
      return {
        success: true,
        message: `Order #${order.orderNumber} is already in ${normalizedStatus} state. Duplicate ignored.`,
        orderId: order.id,
        status: normalizedStatus,
      };
    }

    if (normalizedStatus === 'VERIFIED') {
      // 1. Atomically mark order as VERIFIED
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          codVerificationStatus: 'VERIFIED',
          codConfirmedAt: new Date(payload.timestamp || Date.now()),
          codVerificationRef: payload.referenceId || `VERIF-${Date.now()}`,
          orderStatus: OrderStatus.CONFIRMED,
        },
      });

      ShiprocketLogger.info(
        `[SHIPROCKET_COD_VERIFIED] Order #${order.orderNumber} successfully confirmed. Triggering shipments.`,
      );

      // 2. Authoritatively create multi-seller shipments (only now that verification passed)
      let shipments = order.shipments;
      if (shipments.length === 0) {
        shipments = await MultiSellerShipmentService.createShipmentsForOrder(order.id);
      }

      // 3. Dispatch each created shipment to Shiprocket
      for (const shipment of shipments) {
        try {
          await MultiSellerShipmentService.dispatchShipmentToShiprocket(shipment.id);
        } catch (dispatchErr: any) {
          ShiprocketLogger.warn(
            `[SHIPROCKET_DISPATCH_DEFERRED] Shipment ${shipment.shipmentNumber} will be retried: ${dispatchErr?.message}`,
          );
        }
      }

      return {
        success: true,
        message: 'Order COD verification confirmed and shipments generated.',
        orderId: order.id,
        status: 'VERIFIED',
        shipmentsCreated: shipments.length,
      };
    } else if (normalizedStatus === 'REJECTED' || normalizedStatus === 'EXPIRED') {
      // Verification Failed or Expired -> Cancel order and atomically restore reserved inventory
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            codVerificationStatus: normalizedStatus,
            orderStatus: OrderStatus.CANCELLED,
            notes: `Cancelled due to Shiprocket COD verification ${normalizedStatus}.`,
          },
        });

        // Cancel child vendor orders
        if (order.vendorOrders.length > 0) {
          await tx.vendorOrder.updateMany({
            where: { masterOrderId: order.id },
            data: { status: OrderStatus.CANCELLED },
          });
        }

        // Restore inventory stock atomically
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant
              .update({
                where: { id: item.variantId },
                data: {
                  stock: { increment: item.quantity },
                  availableStock: { increment: item.quantity },
                },
              })
              .catch(() => {});
          } else {
            await tx.product
              .update({
                where: { id: item.productId },
                data: {
                  stock: { increment: item.quantity },
                },
              })
              .catch(() => {});
          }
        }
      });

      ShiprocketLogger.info(
        `[SHIPROCKET_COD_${normalizedStatus}] Order #${order.orderNumber} cancelled and inventory restored.`,
      );

      return {
        success: true,
        message: `Order COD verification ${normalizedStatus}. Order cancelled and inventory restored.`,
        orderId: order.id,
        status: normalizedStatus,
      };
    }

    return {
      success: false,
      message: `Unsupported verification status: ${payload.status}`,
      orderId: order.id,
    };
  }
}
