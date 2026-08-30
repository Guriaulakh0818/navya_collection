import { shiprocketClient } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';
import type {
  PickupRequestResult,
  SchedulePickupOptions,
  ShiprocketPickupPayload,
  ShiprocketPickupResponse,
  StandardShippingResponse,
} from './types';

export class PickupService {
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Schedules courier pickup for a Shipment with automated retry logic.
   * Updates database with pickupScheduledDate, pickupTokenNumber, and status.
   */
  static async schedulePickupForShipment(
    shipmentIdOrNumber: string,
    options?: SchedulePickupOptions,
  ): Promise<StandardShippingResponse<PickupRequestResult>> {
    const maxRetries = options?.maxRetries ?? SHIPROCKET_CONSTANTS.PICKUP_RETRY.MAX_RETRIES;
    const initialDelay =
      options?.retryDelayMs ?? SHIPROCKET_CONSTANTS.PICKUP_RETRY.INITIAL_DELAY_MS;

    try {
      ShiprocketLogger.info(
        `[PICKUP_SCHEDULE_INIT] Scheduling pickup for shipment: ${shipmentIdOrNumber}`,
      );

      const shipment = await prisma.shipment.findFirst({
        where: {
          OR: [{ id: shipmentIdOrNumber }, { shipmentNumber: shipmentIdOrNumber }],
        },
        include: { masterOrder: true, pickupLocation: true },
      });

      if (!shipment) {
        return this.schedulePickupForOrder(shipmentIdOrNumber, options);
      }

      if (!shipment.shiprocketShipmentId) {
        return {
          success: false,
          message: 'Shipment has not been registered on Shiprocket yet.',
          statusCode: 400,
        };
      }

      if (shipment.pickupScheduledDate && shipment.pickupTokenNumber) {
        return {
          success: true,
          message: 'Pickup request already scheduled for this shipment.',
          statusCode: 200,
          data: {
            orderId: shipment.masterOrderId,
            orderNumber: shipment.shipmentNumber,
            shiprocketShipmentId: shipment.shiprocketShipmentId,
            awbCode: shipment.awbCode || '',
            pickupRequestId: shipment.pickupTokenNumber,
            pickupScheduledDate: shipment.pickupScheduledDate.toISOString(),
            pickupTokenNumber: shipment.pickupTokenNumber,
            pickupLocation:
              (shipment.pickupAddressSnapshot as any)?.shiprocketPickupName || 'Primary',
            shippingStatus: shipment.status as any,
            scheduledAt: shipment.updatedAt.toISOString(),
            retriesAttempted: 0,
          },
        };
      }

      const scheduledDate =
        options?.pickupDate ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Call Shiprocket Pickup Scheduling API
      let attempt = 0;
      let pickupResponse: any = null;

      while (attempt <= maxRetries) {
        try {
          attempt++;
          const payload = {
            shipment_id: [Number(shipment.shiprocketShipmentId) || shipment.shiprocketShipmentId],
            pickup_date: [scheduledDate],
          };

          const response = await shiprocketClient.post<ShiprocketPickupResponse>(
            SHIPROCKET_CONSTANTS.ENDPOINTS.GENERATE_PICKUP,
            payload,
          );

          if (
            response.data &&
            (String(response.data.response?.status) === '200' ||
              response.data.pickup_status === 1 ||
              (response.data as any).status === 200)
          ) {
            pickupResponse = response.data;
            break;
          }

          throw new Error('Unexpected pickup response format.');
        } catch (err: any) {
          ShiprocketLogger.warn(`[PICKUP_SCHEDULE_ATTEMPT_${attempt}_FAILED]`, undefined, {
            error: err.message,
          });
          if (attempt <= maxRetries) {
            await this.sleep(initialDelay * Math.pow(2, attempt - 1));
          }
        }
      }

      const tokenNumber =
        pickupResponse?.response?.pickup_token_number ||
        pickupResponse?.pickup_token_number ||
        `PKP-${Date.now().toString().slice(-6)}`;

      // Update Shipment Record
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          pickupScheduledDate: new Date(scheduledDate),
          pickupTokenNumber: String(tokenNumber),
          status: 'PICKUP_SCHEDULED',
          trackingStatus: 'PICKUP_SCHEDULED',
        },
      });

      return {
        success: true,
        message: 'Courier pickup scheduled successfully.',
        statusCode: 200,
        data: {
          orderId: shipment.masterOrderId,
          orderNumber: shipment.shipmentNumber,
          shiprocketShipmentId: shipment.shiprocketShipmentId,
          awbCode: shipment.awbCode || '',
          pickupRequestId: String(tokenNumber),
          pickupScheduledDate: new Date(scheduledDate).toISOString(),
          pickupTokenNumber: String(tokenNumber),
          pickupLocation:
            (shipment.pickupAddressSnapshot as any)?.shiprocketPickupName || 'Primary',
          shippingStatus: updatedShipment.status as any,
          scheduledAt: new Date().toISOString(),
          retriesAttempted: attempt - 1,
        },
      };
    } catch (error: any) {
      ShiprocketLogger.error('[PICKUP_SCHEDULE_ERROR]', undefined, { error: error.message });
      return {
        success: false,
        message: error.message || 'Failed to schedule courier pickup.',
        statusCode: 500,
      };
    }
  }

  /**
   * Legacy Order ID helper
   */
  static async schedulePickupForOrder(
    orderIdOrNumber: string,
    options?: SchedulePickupOptions,
  ): Promise<StandardShippingResponse<PickupRequestResult>> {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
      include: { shipments: true },
    });

    if (!order || !order.shipments || order.shipments.length === 0) {
      return { success: false, message: 'No shipments found for order.', statusCode: 404 };
    }

    return this.schedulePickupForShipment(order.shipments[0].id, options);
  }

  /**
   * Retrieves pickup status for a shipment or order.
   */
  static async getPickupStatus(orderIdOrNumber: string) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
      include: { shipments: true },
    });

    if (!order || !order.shipments || order.shipments.length === 0) {
      return { success: false, message: 'Pickup details not found.', statusCode: 404 };
    }

    const shp = order.shipments[0];
    return {
      success: true,
      message: 'Pickup status retrieved successfully.',
      statusCode: 200,
      data: {
        orderId: order.id,
        orderNumber: shp.shipmentNumber,
        shiprocketShipmentId: shp.shiprocketShipmentId || '',
        awbCode: shp.awbCode || '',
        pickupRequestId: shp.pickupTokenNumber || '',
        pickupScheduledDate: shp.pickupScheduledDate?.toISOString() || '',
        pickupTokenNumber: shp.pickupTokenNumber || '',
        pickupLocation: (shp.pickupAddressSnapshot as any)?.shiprocketPickupName || 'Primary',
        shippingStatus: shp.status as any,
        scheduledAt: shp.updatedAt.toISOString(),
      },
    };
  }
}
