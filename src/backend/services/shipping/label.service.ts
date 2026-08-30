import { shiprocketClient } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';
import type { GenerateLabelOptions, ShippingLabelResult, StandardShippingResponse } from './types';

export class LabelService {
  /**
   * Generates or retrieves a downloadable PDF shipping label for a Shipment.
   * Persists labelUrl in database for instant printing.
   */
  static async generateLabelForShipment(
    shipmentIdOrNumber: string,
    options?: GenerateLabelOptions,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    try {
      ShiprocketLogger.info(
        `[LABEL_GENERATE_INIT] Generating label for shipment: ${shipmentIdOrNumber}`,
      );

      const shipment = await prisma.shipment.findFirst({
        where: {
          OR: [{ id: shipmentIdOrNumber }, { shipmentNumber: shipmentIdOrNumber }],
        },
        include: { masterOrder: true },
      });

      if (!shipment) {
        return this.generateLabelForOrder(shipmentIdOrNumber, options);
      }

      if (!shipment.shiprocketShipmentId) {
        return {
          success: false,
          message: 'Shipment has not been registered on Shiprocket yet.',
          statusCode: 400,
        };
      }

      // Return stored labelUrl if present and not forceRefresh
      if (shipment.labelUrl && !options?.forceRefresh) {
        return {
          success: true,
          message: 'Shipping label retrieved successfully.',
          statusCode: 200,
          data: {
            orderId: shipment.masterOrderId,
            orderNumber: shipment.shipmentNumber,
            shiprocketShipmentId: shipment.shiprocketShipmentId,
            awbCode: shipment.awbCode || 'N/A',
            courierName: shipment.courierName || 'Standard Courier',
            labelUrl: shipment.labelUrl,
            downloadUrl: shipment.labelUrl,
            generatedAt: shipment.updatedAt.toISOString(),
            isStoredUrl: true,
            isDevFallback: false,
          },
        };
      }

      // Call Shiprocket Label API
      const response = await shiprocketClient.post(SHIPROCKET_CONSTANTS.ENDPOINTS.GENERATE_LABEL, {
        shipment_id: [Number(shipment.shiprocketShipmentId) || shipment.shiprocketShipmentId],
      });

      const labelUrl =
        response.data?.label_url ||
        response.data?.response?.label_url ||
        response.data?.data?.label_url;

      if (!labelUrl) {
        return {
          success: false,
          message: response.data?.message || 'Failed to retrieve shipping label from Shiprocket.',
          statusCode: 502,
        };
      }

      // Update Shipment record
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { labelUrl },
      });

      if (shipment.vendorOrderId) {
        await prisma.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: { labelUrl },
          })
          .catch(() => {});
      }

      return {
        success: true,
        message: 'Shipping label generated successfully.',
        statusCode: 200,
        data: {
          orderId: shipment.masterOrderId,
          orderNumber: shipment.shipmentNumber,
          shiprocketShipmentId: shipment.shiprocketShipmentId,
          awbCode: shipment.awbCode || 'N/A',
          courierName: shipment.courierName || 'Standard Courier',
          labelUrl,
          downloadUrl: labelUrl,
          generatedAt: new Date().toISOString(),
          isStoredUrl: false,
          isDevFallback: false,
        },
      };
    } catch (error: any) {
      ShiprocketLogger.error('[LABEL_GENERATE_ERROR]', undefined, { error: error.message });
      return {
        success: false,
        message: error.message || 'Error generating shipping label.',
        statusCode: 500,
      };
    }
  }

  /**
   * Legacy Order ID helper
   */
  static async generateLabelForOrder(
    orderIdOrNumber: string,
    options?: GenerateLabelOptions,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
      include: { shipments: true },
    });

    if (!order || !order.shipments || order.shipments.length === 0) {
      return { success: false, message: 'No shipments found for order.', statusCode: 404 };
    }

    return this.generateLabelForShipment(order.shipments[0].id, options);
  }

  /**
   * Retrieves label details for a shipment or order.
   */
  static async getLabelDetails(orderIdOrNumber: string) {
    return this.generateLabelForOrder(orderIdOrNumber, { forceRefresh: false });
  }
}
