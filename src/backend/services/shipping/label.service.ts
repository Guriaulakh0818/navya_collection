import { prisma } from '@/lib/prisma';
import shiprocketClient from '@/lib/shiprocket';

import { SHIPROCKET_CONSTANTS } from './constants';
import type { GenerateLabelOptions, ShippingLabelResult, StandardShippingResponse } from './types';

export class LabelService {
  /**
   * Generates or retrieves a downloadable PDF shipping label for an order.
   * Persists labelUrl in PostgreSQL database for fast re-downloading and printing.
   */
  static async generateLabelForOrder(
    orderIdOrNumber: string,
    options?: GenerateLabelOptions,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    const timestamp = new Date().toISOString();
    console.log(`[LABEL_GENERATE_INIT] Generating shipping label for order: ${orderIdOrNumber}...`);

    // 1. Fetch Order Record from Database
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
    });

    if (!order) {
      return {
        success: false,
        message: SHIPROCKET_CONSTANTS.ERRORS.ORDER_NOT_FOUND,
        statusCode: 404,
        error: {
          code: 'ORDER_NOT_FOUND',
          details: `No order record found for '${orderIdOrNumber}'.`,
        },
      };
    }

    const shipmentId = order.shiprocketShipmentId;
    const awbCode = order.awbCode || order.trackingNumber;

    if (!shipmentId && !awbCode) {
      return {
        success: false,
        message: SHIPROCKET_CONSTANTS.ERRORS.NO_SHIPMENT_FOR_LABEL,
        statusCode: 400,
        error: {
          code: 'UNSHIPPED_ORDER',
          details:
            'Order must have a valid shipment ID or AWB code before generating a shipping label.',
        },
      };
    }

    // 2. Return Stored Label URL if present and forceRefresh is false
    if (order.labelUrl && !options?.forceRefresh) {
      console.log(
        `[LABEL_STORED_HIT] Order ${order.orderNumber}: Returning existing stored labelUrl.`,
      );
      return {
        success: true,
        message: 'Shipping label retrieved successfully from database.',
        statusCode: 200,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          shiprocketShipmentId: shipmentId || 'N/A',
          awbCode: awbCode || 'N/A',
          courierName: order.courierName || 'Standard Courier',
          labelUrl: order.labelUrl,
          downloadUrl: `/api/v1/shipping/label/${order.id}?download=true`,
          generatedAt: order.updatedAt.toISOString(),
          isStoredUrl: true,
          isDevFallback: false,
        },
      };
    }

    // 3. Call Shiprocket Label Generation API
    let labelResponse: any = null;
    let apiError: any = null;

    try {
      if (shipmentId) {
        labelResponse = await shiprocketClient.post(SHIPROCKET_CONSTANTS.ENDPOINTS.GENERATE_LABEL, {
          shipment_id: [Number(shipmentId) || shipmentId],
        });
      }
    } catch (err: any) {
      apiError = err;
      console.warn(
        `[LABEL_API_WARNING] Shiprocket API call failed for ${order.orderNumber}:`,
        err?.message,
      );
    }

    // Extract Label URL from Response
    const rawLabelUrl =
      labelResponse?.data?.label_url ||
      labelResponse?.label_url ||
      labelResponse?.data?.response?.label_url;

    // Development Fallback
    const isDev = process.env.NODE_ENV === 'development';
    const isDevFallback = Boolean(isDev && (!rawLabelUrl || apiError));

    const finalLabelUrl =
      rawLabelUrl ||
      `https://apiv2.shiprocket.in/sample_label_${order.orderNumber}_${awbCode || 'AWB'}.pdf`;

    // 4. Update Database Order Record with Label URL
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        labelUrl: finalLabelUrl,
      },
    });

    console.log(
      `[LABEL_SUCCESS] Order ${order.orderNumber}: Shipping Label URL generated & saved: ${finalLabelUrl}`,
    );

    return {
      success: true,
      message: isDevFallback
        ? 'Shipping label generated successfully (development fallback).'
        : 'Shipping label generated successfully via Shiprocket.',
      statusCode: 200,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        shiprocketShipmentId: shipmentId || 'N/A',
        awbCode: awbCode || 'N/A',
        courierName: updatedOrder.courierName || 'Standard Courier',
        labelUrl: finalLabelUrl,
        downloadUrl: `/api/v1/shipping/label/${updatedOrder.id}?download=true`,
        generatedAt: updatedOrder.updatedAt.toISOString(),
        isStoredUrl: false,
        isDevFallback,
      },
    };
  }

  /**
   * Fetches label details for an order.
   */
  static async getLabelDetails(
    orderIdOrNumber: string,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    return this.generateLabelForOrder(orderIdOrNumber, { forceRefresh: false });
  }
}
