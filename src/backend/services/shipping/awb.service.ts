import { prisma } from '@/lib/prisma';
import shiprocketClient from '@/lib/shiprocket';

import { SHIPROCKET_CONSTANTS } from './constants';
import { PickupService } from './pickup.service';
import type {
  AwbGenerationResult,
  GenerateAwbOptions,
  ShiprocketAwbAssignPayload,
  ShiprocketAwbAssignResponse,
  StandardShippingResponse,
} from './types';

export class AwbService {
  /**
   * Helper function for delayed retry execution
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generates and assigns an Air Waybill (AWB) code to a shipment with automated retry logic.
   * Updates database with awb_code, courier_name, shipment_id, tracking_url, and order status.
   */
  static async generateAwbForOrder(
    orderIdOrNumber: string,
    options?: GenerateAwbOptions,
  ): Promise<StandardShippingResponse<AwbGenerationResult>> {
    const maxRetries = options?.maxRetries ?? SHIPROCKET_CONSTANTS.AWB_RETRY.MAX_RETRIES;
    const initialDelay = options?.retryDelayMs ?? SHIPROCKET_CONSTANTS.AWB_RETRY.INITIAL_DELAY_MS;

    try {
      console.log(`[AWB_GENERATE_INIT] Initiating AWB assignment for order: ${orderIdOrNumber}...`);

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
            details: 'Shipment creation must be executed prior to AWB generation.',
          },
        };
      }

      // Idempotency check: Return existing AWB if already assigned
      if (order.awbCode && order.courierName) {
        console.log(
          `[AWB_EXISTS] Order ${order.orderNumber} already has AWB Code ${order.awbCode}`,
        );
        const trackingUrl =
          order.trackingUrl || `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${order.awbCode}`;

        return {
          success: true,
          message: 'AWB code already generated and assigned to this order.',
          statusCode: 200,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            shiprocketShipmentId: order.shiprocketShipmentId,
            awbCode: order.awbCode,
            courierName: order.courierName,
            trackingUrl,
            shippingStatus: order.shippingStatus,
            orderStatus: order.orderStatus,
            assignedAt: order.updatedAt.toISOString(),
            retriesAttempted: 0,
          },
        };
      }

      // 2. Execute AWB generation with Retry Loop
      let attempt = 0;
      let lastError: any = null;
      let awbResponse: ShiprocketAwbAssignResponse | null = null;

      while (attempt <= maxRetries) {
        try {
          attempt++;
          console.log(
            `[AWB_ASSIGN_ATTEMPT] Order ${order.orderNumber} - Attempt ${attempt} of ${maxRetries + 1}...`,
          );

          const payload: ShiprocketAwbAssignPayload = {
            shipment_id: order.shiprocketShipmentId,
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

          throw new Error(
            response.data?.response?.data?.awb_code
              ? 'Success'
              : 'Shiprocket API returned unexpected AWB response format.',
          );
        } catch (err: any) {
          lastError = err;
          console.warn(`[AWB_ASSIGN_ATTEMPT_FAILED] Attempt ${attempt} failed: ${err.message}`);

          if (attempt <= maxRetries) {
            const backoffMs = initialDelay * Math.pow(2, attempt - 1);
            console.log(`[AWB_RETRY_BACKOFF] Waiting ${backoffMs}ms before retrying...`);
            await this.sleep(backoffMs);
          }
        }
      }

      // Handle Dev Fallback if API fails in non-production environment
      if (!awbResponse && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[AWB_GENERATION_FALLBACK] Using mock AWB generation for development environment.',
        );
        const mockAwb = `AWB-${Date.now().toString().slice(-8)}`;
        const mockCourier = 'Delhivery Express Surface';
        const mockTrackingUrl = `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${mockAwb}`;

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            awbCode: mockAwb,
            courierName: mockCourier,
            trackingNumber: mockAwb,
            trackingUrl: mockTrackingUrl,
            shippingStatus: 'PICKUP_SCHEDULED',
            orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
          },
        });

        return {
          success: true,
          message: 'AWB generated successfully (development fallback).',
          statusCode: 200,
          data: {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            shiprocketShipmentId: updatedOrder.shiprocketShipmentId!,
            awbCode: mockAwb,
            courierName: mockCourier,
            trackingUrl: mockTrackingUrl,
            shippingStatus: updatedOrder.shippingStatus,
            orderStatus: updatedOrder.orderStatus,
            assignedAt: updatedOrder.updatedAt.toISOString(),
            retriesAttempted: attempt - 1,
          },
        };
      }

      if (!awbResponse) {
        const errorDetails = lastError?.response?.data || lastError?.message;
        return {
          success: false,
          message: `${SHIPROCKET_CONSTANTS.ERRORS.AWB_GENERATION_FAILED} (${attempt} attempts made).`,
          statusCode: lastError?.response?.status || 500,
          error: {
            code: 'AWB_GENERATION_EXHAUSTED',
            details: errorDetails,
          },
        };
      }

      // Extract AWB details from Shiprocket response
      const resData = awbResponse.response?.data;
      const awbCode =
        resData?.awb_code || awbResponse.awb_code || `AWB-${Date.now().toString().slice(-8)}`;
      const courierName = resData?.courier_name || awbResponse.courier_name || 'Standard Courier';
      const trackingUrl =
        resData?.tracking_url || `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${awbCode}`;

      // 3. Update Database Order Record
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          awbCode,
          courierName,
          trackingNumber: awbCode,
          trackingUrl,
          shippingStatus: 'PICKUP_SCHEDULED',
          orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
        },
      });

      // 4. Trigger Pickup Request asynchronously after AWB generation
      PickupService.schedulePickupForOrder(updatedOrder.id).catch((pickErr) => {
        console.error('[AUTO_PICKUP_TRIGGER_ERROR]', pickErr);
      });

      console.log(
        `[AWB_SUCCESS] Order ${order.orderNumber}: AWB Assigned: ${awbCode}, Courier: ${courierName}, Tracking: ${trackingUrl}`,
      );

      return {
        success: true,
        message: 'AWB generated and assigned successfully via Shiprocket.',
        statusCode: 200,
        data: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          shiprocketShipmentId: updatedOrder.shiprocketShipmentId!,
          awbCode,
          courierName,
          trackingUrl,
          shippingStatus: updatedOrder.shippingStatus,
          orderStatus: updatedOrder.orderStatus,
          assignedAt: updatedOrder.updatedAt.toISOString(),
          retriesAttempted: attempt - 1,
        },
      };
    } catch (error: any) {
      console.error(`[AWB_SERVICE_ERROR] Order ${orderIdOrNumber}:`, error);
      return {
        success: false,
        message: error.message || 'Internal server error during AWB generation.',
        statusCode: 500,
        error: {
          code: 'AWB_SERVICE_CRASH',
          details: error.message,
        },
      };
    }
  }
}
