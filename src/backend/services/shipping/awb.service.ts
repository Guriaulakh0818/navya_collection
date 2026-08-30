import { shiprocketClient } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';
import type {
  AwbGenerationResult,
  GenerateAwbOptions,
  ShiprocketAwbAssignPayload,
  ShiprocketAwbAssignResponse,
  StandardShippingResponse,
} from './types';

export class AwbService {
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generates and assigns an Air Waybill (AWB) code to a Shipment.
   * Updates database with awbCode, courierName, courierCompanyId, and status.
   */
  static async generateAwbForShipment(
    shipmentIdOrNumber: string,
    options?: GenerateAwbOptions,
  ): Promise<StandardShippingResponse<AwbGenerationResult>> {
    const maxRetries = options?.maxRetries ?? SHIPROCKET_CONSTANTS.AWB_RETRY.MAX_RETRIES;
    const initialDelay = options?.retryDelayMs ?? SHIPROCKET_CONSTANTS.AWB_RETRY.INITIAL_DELAY_MS;

    try {
      ShiprocketLogger.info(
        `[AWB_GENERATE_INIT] Generating AWB for shipment: ${shipmentIdOrNumber}`,
      );

      // 1. Fetch Shipment from DB
      const shipment = await prisma.shipment.findFirst({
        where: {
          OR: [{ id: shipmentIdOrNumber }, { shipmentNumber: shipmentIdOrNumber }],
        },
        include: {
          masterOrder: true,
          shop: true,
        },
      });

      if (!shipment) {
        // Backward compatibility fallback to Order
        return this.generateAwbForOrder(shipmentIdOrNumber, options);
      }

      if (!shipment.shiprocketShipmentId) {
        return {
          success: false,
          message: 'Shipment has not been registered on Shiprocket yet.',
          statusCode: 400,
        };
      }

      // Return stored AWB if already present
      if (shipment.awbCode && shipment.courierName) {
        const trackingUrl = `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${shipment.awbCode}`;
        return {
          success: true,
          message: 'AWB code already generated and assigned.',
          statusCode: 200,
          data: {
            orderId: shipment.masterOrderId,
            orderNumber: shipment.shipmentNumber,
            shiprocketShipmentId: shipment.shiprocketShipmentId,
            awbCode: shipment.awbCode,
            courierName: shipment.courierName,
            trackingUrl,
            shippingStatus: shipment.status as any,
            orderStatus: shipment.masterOrder.orderStatus,
            assignedAt: shipment.updatedAt.toISOString(),
            retriesAttempted: 0,
          },
        };
      }

      // 2. Call Shiprocket AWB Assignment API
      let attempt = 0;
      let awbResponse: any = null;

      while (attempt <= maxRetries) {
        try {
          attempt++;
          const payload: ShiprocketAwbAssignPayload = {
            shipment_id: shipment.shiprocketShipmentId,
            courier_id: options?.courierId ? String(options.courierId) : undefined,
          };

          const response = await shiprocketClient.post<ShiprocketAwbAssignResponse>(
            SHIPROCKET_CONSTANTS.ENDPOINTS.ASSIGN_AWB,
            payload,
          );

          if (
            response.data &&
            (response.data.status === 200 || response.data.awb_assign_status === 1)
          ) {
            awbResponse = response.data;
            break;
          }

          throw new Error('Unexpected AWB response format from Shiprocket.');
        } catch (err: any) {
          ShiprocketLogger.warn(`[AWB_ASSIGN_ATTEMPT_${attempt}_FAILED]`, undefined, {
            error: err.message,
          });
          if (attempt <= maxRetries) {
            await this.sleep(initialDelay * Math.pow(2, attempt - 1));
          }
        }
      }

      let finalAwb = awbResponse?.response?.data?.awb_code || awbResponse?.awb_code;
      let finalCourier =
        awbResponse?.response?.data?.courier_name ||
        awbResponse?.courier_name ||
        'Standard Courier';
      let courierCompanyId = awbResponse?.response?.data?.courier_company_id || undefined;

      if (!finalAwb) {
        return {
          success: false,
          message: 'Failed to generate AWB code from Shiprocket.',
          statusCode: 502,
        };
      }

      // 3. Update Shipment Record
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          awbCode: finalAwb,
          courierName: finalCourier,
          courierCompanyId: courierCompanyId ? Number(courierCompanyId) : undefined,
          status: 'READY_TO_SHIP',
          trackingStatus: 'AWB_ASSIGNED',
        },
      });

      // Also update child vendor order
      if (shipment.vendorOrderId) {
        await prisma.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              awbCode: finalAwb,
              courierName: finalCourier,
              shippingStatus: 'IN_TRANSIT',
            },
          })
          .catch(() => {});
      }

      const trackingUrl = `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${finalAwb}`;

      return {
        success: true,
        message: 'AWB code generated successfully.',
        statusCode: 200,
        data: {
          orderId: shipment.masterOrderId,
          orderNumber: shipment.shipmentNumber,
          shiprocketShipmentId: shipment.shiprocketShipmentId,
          awbCode: finalAwb,
          courierName: finalCourier,
          trackingUrl,
          shippingStatus: updatedShipment.status as any,
          orderStatus: shipment.masterOrder.orderStatus,
          assignedAt: new Date().toISOString(),
          retriesAttempted: attempt - 1,
        },
      };
    } catch (error: any) {
      ShiprocketLogger.error('[AWB_GENERATE_ERROR]', undefined, { error: error.message });
      return {
        success: false,
        message: error.message || 'Failed to generate AWB.',
        statusCode: 500,
      };
    }
  }

  /**
   * Backward-compatible helper for legacy calls by Order ID
   */
  static async generateAwbForOrder(
    orderIdOrNumber: string,
    options?: GenerateAwbOptions,
  ): Promise<StandardShippingResponse<AwbGenerationResult>> {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
      include: { shipments: true },
    });

    if (!order) {
      return { success: false, message: 'Order not found.', statusCode: 404 };
    }

    if (order.shipments && order.shipments.length > 0) {
      return this.generateAwbForShipment(order.shipments[0].id, options);
    }

    return {
      success: false,
      message: 'No shipments associated with this order.',
      statusCode: 400,
    };
  }
}
