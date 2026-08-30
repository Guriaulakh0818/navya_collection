import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { ShiprocketLogger } from '@/backend/services/shipping/logger';
import { StatusAggregatorService } from '@/backend/services/shipping/status-aggregator.service';
import { TrackingService } from '@/backend/services/shipping/tracking.service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/webhooks/shiprocket
 *
 * Official Shiprocket webhook receiver for tracking status updates, scan events, and delivery confirmations.
 * Implements strict event deduplication (idempotency) and triggers master order status aggregation.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 },
      );
    }

    ShiprocketLogger.info('[SHIPROCKET_WEBHOOK_RECEIVED]', undefined, body);

    // Optional: Validate Webhook Secret or X-Api-Key if configured
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization');
      if (authHeader && authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        ShiprocketLogger.warn('[SHIPROCKET_WEBHOOK_UNAUTHORIZED_REJECTED]');
        return NextResponse.json(
          { success: false, message: 'Unauthorized webhook request' },
          { status: 401 },
        );
      }
    }

    const {
      order_id,
      shipment_id,
      awb,
      current_status,
      current_status_id,
      scans = [],
      courier_name,
      location,
      etd,
    } = body;

    const queryIdentifier = order_id || shipment_id || awb;
    if (!queryIdentifier) {
      return NextResponse.json(
        { success: false, message: 'Missing order_id, shipment_id, or awb in webhook payload.' },
        { status: 400 },
      );
    }

    // 1. Locate Target Shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          ...(order_id ? [{ shipmentNumber: String(order_id) }, { id: String(order_id) }] : []),
          ...(shipment_id ? [{ shiprocketShipmentId: String(shipment_id) }] : []),
          ...(awb ? [{ awbCode: String(awb) }] : []),
        ],
      },
      include: {
        masterOrder: {
          include: { shipments: true },
        },
      },
    });

    if (!shipment) {
      ShiprocketLogger.warn(
        `[SHIPROCKET_WEBHOOK_SHIPMENT_NOT_FOUND] Identifier: ${queryIdentifier}`,
      );
      // Return 200 to prevent Shiprocket from continually retrying unknown historical test orders
      return NextResponse.json({
        success: true,
        message: 'Shipment not found in marketplace database.',
      });
    }

    const normalizedStatus = TrackingService.normalizeStatus(current_status || current_status_id);
    const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
    const eventTime = latestScan?.date ? new Date(latestScan.date) : new Date();
    const activity = latestScan?.activity || current_status || 'Tracking status update';
    const eventLocation = latestScan?.location || location || null;

    // 2. Generate Idempotency Event Key
    const eventHash = crypto
      .createHash('md5')
      .update(`${shipment.id}_${normalizedStatus}_${eventTime.toISOString()}_${activity}`)
      .digest('hex');

    const existingEvent = await prisma.shipmentTrackingEvent.findUnique({
      where: { eventId: eventHash },
    });

    if (existingEvent) {
      ShiprocketLogger.info(`[SHIPROCKET_WEBHOOK_DUPLICATE_IGNORED] Event: ${eventHash}`);
      return NextResponse.json({ success: true, message: 'Duplicate event already processed.' });
    }

    // 3. Atomically Record Tracking Event & Update Shipment
    await prisma.$transaction(async (tx) => {
      // Record Event
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          eventId: eventHash,
          status: normalizedStatus,
          activity,
          location: eventLocation,
          eventTimestamp: eventTime,
          rawData: body,
        },
      });

      // Update Shipment
      const updateData: any = {
        status: normalizedStatus,
        trackingStatus: normalizedStatus,
      };

      if (awb && !shipment.awbCode) updateData.awbCode = String(awb);
      if (courier_name && !shipment.courierName) updateData.courierName = String(courier_name);
      if (normalizedStatus === 'DELIVERED') updateData.deliveredAt = eventTime;
      if (normalizedStatus === 'IN_TRANSIT' && !shipment.shippedAt)
        updateData.shippedAt = eventTime;
      if (normalizedStatus === 'CANCELLED') updateData.cancelledAt = eventTime;

      await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData,
      });

      // Update linked VendorOrder if present
      if (shipment.vendorOrderId) {
        await tx.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              shippingStatus:
                normalizedStatus === 'DELIVERED'
                  ? 'DELIVERED'
                  : normalizedStatus === 'CANCELLED'
                    ? 'CANCELLED'
                    : 'IN_TRANSIT',
              ...(normalizedStatus === 'DELIVERED' ? { status: 'DELIVERED' } : {}),
              ...(normalizedStatus === 'CANCELLED' ? { status: 'CANCELLED' } : {}),
            },
          })
          .catch(() => {});
      }

      // 4. Recalculate Master Order Status
      const allShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: normalizedStatus } : s,
      );

      const aggregatedOrderStatus =
        StatusAggregatorService.calculateMasterOrderStatus(allShipments);

      await tx.order.update({
        where: { id: shipment.masterOrderId },
        data: {
          orderStatus: aggregatedOrderStatus,
          ...(aggregatedOrderStatus === 'DELIVERED' ? { shippingStatus: 'DELIVERED' } : {}),
        },
      });
    });

    // Clear Tracking in-memory cache for this shipment
    TrackingService.clearCache();

    ShiprocketLogger.info(
      `[SHIPROCKET_WEBHOOK_PROCESSED_SUCCESS] Shipment: ${shipment.shipmentNumber} -> ${normalizedStatus}`,
    );

    return NextResponse.json({
      success: true,
      message: 'Shiprocket tracking webhook processed successfully.',
      data: {
        shipmentNumber: shipment.shipmentNumber,
        status: normalizedStatus,
      },
    });
  } catch (error: any) {
    ShiprocketLogger.error('[SHIPROCKET_WEBHOOK_ERROR]', undefined, { error: error.message });
    return NextResponse.json(
      { success: false, message: error.message || 'Error processing Shiprocket webhook.' },
      { status: 500 },
    );
  }
}
