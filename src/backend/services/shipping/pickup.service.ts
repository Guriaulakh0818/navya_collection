import { prisma } from '@/lib/prisma';
import shiprocketClient from '@/lib/shiprocket';

import { SHIPROCKET_CONSTANTS } from './constants';
import type {
  PickupRequestResult,
  PickupStatusResult,
  SchedulePickupOptions,
  ShiprocketPickupPayload,
  ShiprocketPickupResponse,
  StandardShippingResponse,
} from './types';

export class PickupService {
  /**
   * Helper function for delayed retry execution
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Schedules courier pickup for a shipment with automated retry logic and settings-driven pickup location.
   * Updates database with pickup_request_id, pickup_scheduled_date, pickup_token_number, and pickup_location.
   */
  static async schedulePickupForOrder(
    orderIdOrNumber: string,
    options?: SchedulePickupOptions,
  ): Promise<StandardShippingResponse<PickupRequestResult>> {
    const maxRetries = options?.maxRetries ?? SHIPROCKET_CONSTANTS.PICKUP_RETRY.MAX_RETRIES;
    const initialDelay =
      options?.retryDelayMs ?? SHIPROCKET_CONSTANTS.PICKUP_RETRY.INITIAL_DELAY_MS;

    try {
      console.log(
        `[PICKUP_SCHEDULE_INIT] Initiating pickup scheduling for order: ${orderIdOrNumber}...`,
      );

      // 1. Fetch Order from DB
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
          deletedAt: null,
        },
      });

      if (!order) {
        return {
          success: false,
          message: `${SHIPROCKET_CONSTANTS.ERRORS.ORDER_NOT_FOUND}: '${orderIdOrNumber}'`,
          statusCode: 404,
        };
      }

      if (!order.shiprocketShipmentId) {
        return {
          success: false,
          message: SHIPROCKET_CONSTANTS.ERRORS.NO_SHIPMENT_FOUND,
          statusCode: 400,
          error: {
            code: 'NO_SHIPMENT_ID',
            details: 'Shipment creation must be executed prior to scheduling pickup.',
          },
        };
      }

      // Idempotency check: Return existing pickup info if already scheduled
      if (order.pickupRequestId && order.pickupScheduledDate) {
        console.log(
          `[PICKUP_EXISTS] Order ${order.orderNumber} already has Pickup Request ID ${order.pickupRequestId}`,
        );
        return {
          success: true,
          message: 'Pickup request already scheduled for this order.',
          statusCode: 200,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            shiprocketShipmentId: order.shiprocketShipmentId,
            awbCode: order.awbCode || '',
            pickupRequestId: order.pickupRequestId,
            pickupScheduledDate: order.pickupScheduledDate.toISOString(),
            pickupTokenNumber: order.pickupTokenNumber || '',
            pickupLocation: order.pickupLocation || SHIPROCKET_CONSTANTS.DEFAULTS.PICKUP_LOCATION,
            shippingStatus: order.shippingStatus,
            scheduledAt: order.updatedAt.toISOString(),
            retriesAttempted: 0,
          },
        };
      }

      // Resolve pickup address/location from settings / environment variables
      const pickupLocation =
        options?.pickupLocation ||
        order.pickupLocation ||
        process.env.SHIPROCKET_PICKUP_LOCATION ||
        SHIPROCKET_CONSTANTS.DEFAULTS.PICKUP_LOCATION;

      // 2. Execute Pickup Scheduling with Retry Loop
      let attempt = 0;
      let lastError: any = null;
      let pickupResponse: ShiprocketPickupResponse | null = null;

      while (attempt <= maxRetries) {
        try {
          attempt++;
          console.log(
            `[PICKUP_ATTEMPT] Order ${order.orderNumber} - Attempt ${attempt} of ${maxRetries + 1}...`,
          );

          const payload: ShiprocketPickupPayload = {
            shipment_id: [Number(order.shiprocketShipmentId)],
            pickup_date: options?.pickupDate ? [options.pickupDate] : undefined,
          };

          const response = await shiprocketClient.post<ShiprocketPickupResponse>(
            SHIPROCKET_CONSTANTS.ENDPOINTS.GENERATE_PICKUP,
            payload,
          );

          if (response.data && (response.data.pickup_status === 1 || response.data.response)) {
            pickupResponse = response.data;
            break;
          }

          throw new Error('Shiprocket API returned unexpected pickup response format.');
        } catch (err: any) {
          lastError = err;
          console.warn(`[PICKUP_ATTEMPT_FAILED] Attempt ${attempt} failed: ${err.message}`);

          if (attempt <= maxRetries) {
            const backoffMs = initialDelay * Math.pow(2, attempt - 1);
            console.log(`[PICKUP_RETRY_BACKOFF] Waiting ${backoffMs}ms before retrying...`);
            await this.sleep(backoffMs);
          }
        }
      }

      // Handle Dev Fallback if API fails in non-production environment
      if (!pickupResponse && process.env.NODE_ENV !== 'production') {
        console.warn('[PICKUP_FALLBACK] Using mock pickup scheduling for development environment.');
        const mockPickupId = `PU-${Date.now().toString().slice(-8)}`;
        const mockTokenNumber = `TOKEN-${Math.floor(100000 + Math.random() * 900000)}`;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            pickupRequestId: mockPickupId,
            pickupScheduledDate: tomorrow,
            pickupTokenNumber: mockTokenNumber,
            pickupLocation,
            shippingStatus: 'PICKUP_SCHEDULED',
            orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
          },
        });

        return {
          success: true,
          message: 'Pickup scheduled successfully (development fallback).',
          statusCode: 200,
          data: {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            shiprocketShipmentId: updatedOrder.shiprocketShipmentId!,
            awbCode: updatedOrder.awbCode || '',
            pickupRequestId: mockPickupId,
            pickupScheduledDate: tomorrow.toISOString(),
            pickupTokenNumber: mockTokenNumber,
            pickupLocation,
            shippingStatus: updatedOrder.shippingStatus,
            scheduledAt: updatedOrder.updatedAt.toISOString(),
            retriesAttempted: attempt - 1,
          },
        };
      }

      if (!pickupResponse) {
        const errorDetails = lastError?.response?.data || lastError?.message;
        return {
          success: false,
          message: `${SHIPROCKET_CONSTANTS.ERRORS.PICKUP_REQUEST_FAILED} (${attempt} attempts made).`,
          statusCode: lastError?.response?.status || 500,
          error: {
            code: 'PICKUP_SCHEDULING_EXHAUSTED',
            details: errorDetails,
          },
        };
      }

      // Extract pickup details from Shiprocket response
      const resObj = pickupResponse.response;
      const pickupRequestId = String(
        resObj?.pickup_id || pickupResponse.pickup_id || `PU-${Date.now().toString().slice(-8)}`,
      );
      const pickupTokenNumber = String(
        resObj?.pickup_token_number ||
          pickupResponse.pickup_token_number ||
          `TOKEN-${Date.now().toString().slice(-6)}`,
      );
      const rawDateStr = resObj?.pickup_scheduled_date || pickupResponse.pickup_scheduled_date;
      const pickupScheduledDate = rawDateStr
        ? new Date(rawDateStr)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 3. Update Database Order Record
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          pickupRequestId,
          pickupScheduledDate,
          pickupTokenNumber,
          pickupLocation,
          shippingStatus: 'PICKUP_SCHEDULED',
        },
      });

      console.log(
        `[PICKUP_SUCCESS] Order ${order.orderNumber}: Pickup Request ID: ${pickupRequestId}, Token: ${pickupTokenNumber}, Location: ${pickupLocation}`,
      );

      return {
        success: true,
        message: 'Pickup scheduled successfully via Shiprocket.',
        statusCode: 200,
        data: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          shiprocketShipmentId: updatedOrder.shiprocketShipmentId!,
          awbCode: updatedOrder.awbCode || '',
          pickupRequestId,
          pickupScheduledDate: pickupScheduledDate.toISOString(),
          pickupTokenNumber,
          pickupLocation,
          shippingStatus: updatedOrder.shippingStatus,
          scheduledAt: updatedOrder.updatedAt.toISOString(),
          retriesAttempted: attempt - 1,
        },
      };
    } catch (error: any) {
      console.error(`[PICKUP_SERVICE_ERROR] Order ${orderIdOrNumber}:`, error);
      return {
        success: false,
        message: error.message || 'Internal server error scheduling pickup.',
        statusCode: 500,
        error: {
          code: 'PICKUP_SERVICE_CRASH',
          details: error.message,
        },
      };
    }
  }

  /**
   * Tracks pickup request status from database or Shiprocket API.
   */
  static async getPickupStatus(
    orderIdOrPickupId: string,
  ): Promise<StandardShippingResponse<PickupStatusResult>> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: orderIdOrPickupId },
            { orderNumber: orderIdOrPickupId },
            { pickupRequestId: orderIdOrPickupId },
            { pickupTokenNumber: orderIdOrPickupId },
          ],
        },
      });

      if (!order || !order.pickupRequestId) {
        return {
          success: false,
          message: 'No scheduled pickup request found for the specified ID.',
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Pickup request status retrieved successfully.',
        statusCode: 200,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          pickupRequestId: order.pickupRequestId,
          pickupScheduledDate: order.pickupScheduledDate?.toISOString(),
          pickupTokenNumber: order.pickupTokenNumber || undefined,
          pickupLocation: order.pickupLocation || undefined,
          shippingStatus: order.shippingStatus,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve pickup status.',
        statusCode: 500,
      };
    }
  }
}
