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

      if (!shipment.shiprocketShipmentId || !shipment.awbCode) {
        // Auto-fulfill on demand (Dispatch -> AWB -> Pickup -> Label)
        const { MultiSellerShipmentService } = await import('./multi-seller-shipment.service');
        const fulfillRes = await MultiSellerShipmentService.autoFulfillShipment(shipment.id);
        if (fulfillRes.success && fulfillRes.labelUrl) {
          return {
            success: true,
            message: 'Shipping label generated successfully via automated pipeline.',
            statusCode: 200,
            data: {
              orderId: shipment.masterOrderId,
              orderNumber: shipment.shipmentNumber,
              shiprocketShipmentId: String(shipment.shiprocketShipmentId || 'AUTO'),
              awbCode: fulfillRes.awbCode || 'N/A',
              courierName: fulfillRes.courierName || 'Standard Courier',
              labelUrl: fulfillRes.labelUrl,
              downloadUrl: fulfillRes.labelUrl,
              generatedAt: new Date().toISOString(),
              isStoredUrl: false,
              isDevFallback: false,
            },
          };
        }
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
   * Universal Order / Shipment / VendorOrder Label Helper
   */
  static async generateLabelForOrder(
    orderIdOrNumber: string,
    options?: GenerateLabelOptions,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    // 1. Direct Shipment search
    const directShipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { id: orderIdOrNumber },
          { shipmentNumber: orderIdOrNumber },
          { vendorOrderId: orderIdOrNumber },
        ],
      },
    });

    if (directShipment) {
      return this.generateLabelForShipment(directShipment.id, options);
    }

    // 2. VendorOrder lookup
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { vendorOrderNumber: orderIdOrNumber }],
      },
      include: { shipments: true },
    });

    if (vendorOrder) {
      if (vendorOrder.shipments?.[0]) {
        return this.generateLabelForShipment(vendorOrder.shipments[0].id, options);
      }
      // If vendor order exists but has no shipments yet, auto-create shipments
      const { MultiSellerShipmentService } = await import('./multi-seller-shipment.service');
      const createdShipments = await MultiSellerShipmentService.createShipmentsForOrder(
        vendorOrder.masterOrderId,
      );
      const matching =
        createdShipments.find((s) => s.vendorOrderId === vendorOrder.id) || createdShipments[0];
      if (matching) {
        return this.generateLabelForShipment(matching.id, options);
      }
    }

    // 3. Master Order lookup
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
      include: { shipments: true },
    });

    if (!order) {
      return { success: false, message: 'Order or shipment not found.', statusCode: 404 };
    }

    if (!order.shipments || order.shipments.length === 0) {
      const { MultiSellerShipmentService } = await import('./multi-seller-shipment.service');
      const createdShipments = await MultiSellerShipmentService.createShipmentsForOrder(order.id);
      if (createdShipments && createdShipments.length > 0) {
        return this.generateLabelForShipment(createdShipments[0].id, options);
      }
      return { success: false, message: 'No shipments found for this order.', statusCode: 404 };
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
