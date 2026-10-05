import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { OrderEmailNotificationService } from '@/backend/services/order-email.service';
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

    // Validate Webhook Secret or X-Api-Key (Mandatory in production - BM-09 AC-18)
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      ShiprocketLogger.error('[SHIPROCKET_WEBHOOK_SECRET_MISSING_IN_PRODUCTION]');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error: Webhook secret missing in production.',
        },
        { status: 500 },
      );
    }

    if (webhookSecret) {
      const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization');
      if (
        !authHeader ||
        (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`)
      ) {
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
      // Check if this is a buyer confirmation / verification webhook
      if (
        body.verification_status ||
        body.event === 'order_verification' ||
        body.confirmed !== undefined
      ) {
        const { ShiprocketCodService } =
          await import('@/backend/services/shipping/shiprocket-cod.service');
        const verResult = await ShiprocketCodService.handleVerificationWebhook({
          orderNumber: String(body.order_number || body.order_id || body.orderId),
          status: String(body.verification_status || (body.confirmed ? 'VERIFIED' : 'REJECTED')),
          referenceId: body.reference_id ? String(body.reference_id) : undefined,
          channel: body.channel || 'shiprocket_webhook',
        });
        return NextResponse.json(verResult, { status: verResult.success ? 200 : 400 });
      }

      // Acknowledge test pings / verification handshakes from Shiprocket with 200 OK
      ShiprocketLogger.info('[SHIPROCKET_WEBHOOK_TEST_HANDSHAKE_RECEIVED]', undefined, body);
      return NextResponse.json(
        { success: true, message: 'Webhook endpoint active (handshake/test ping verified).' },
        { status: 200 },
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

    const rawStatus = current_status || current_status_id;
    const normalizedStatus = TrackingService.normalizeStatus(rawStatus);
    const rtoSubStatus = TrackingService.normalizeRtoStatus(rawStatus);
    const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
    const eventTime = latestScan?.date ? new Date(latestScan.date) : new Date();
    const activity = latestScan?.activity || current_status || 'Tracking status update';
    const eventLocation = latestScan?.location || location || null;

    // Transition Guard: Check if state transition is legally permitted
    const { RtoService } = await import('@/backend/services/shipping/rto.service');
    const transitionCheck = RtoService.validateTransition(shipment.status, normalizedStatus);
    if (!transitionCheck.allowed) {
      ShiprocketLogger.warn(
        `[SHIPROCKET_ILLEGAL_TRANSITION_IGNORED] Shipment: ${shipment.shipmentNumber}, Current: ${shipment.status}, Target: ${normalizedStatus}. Reason: ${transitionCheck.reason}`,
      );
      return NextResponse.json({
        success: true,
        message: `Illegal transition ignored: ${transitionCheck.reason}`,
      });
    }

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

    // If authoritative RTO Delivered event arrives, trigger complete RTO financial & inventory execution
    if (rtoSubStatus === 'RTO_DELIVERED' || normalizedStatus === 'RTO_DELIVERED') {
      await prisma.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          eventId: eventHash,
          status: 'RTO_DELIVERED',
          activity,
          location: eventLocation,
          eventTimestamp: eventTime,
          rawData: body,
        },
      });

      const rtoResult = await RtoService.processRtoDelivered({
        shipmentId: shipment.id,
        rtoReason: activity,
      });

      TrackingService.clearCache();

      return NextResponse.json({
        success: true,
        message: 'Shiprocket RTO delivered processed successfully.',
        data: rtoResult,
      });
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
      const isCod =
        shipment.paymentMethod === 'COD' || shipment.masterOrder.paymentMethod === 'COD';
      const updateData: any = {
        status: normalizedStatus,
        trackingStatus: normalizedStatus,
      };

      if (awb && !shipment.awbCode) updateData.awbCode = String(awb);
      if (courier_name && !shipment.courierName) updateData.courierName = String(courier_name);
      if (normalizedStatus === 'DELIVERED') {
        updateData.deliveredAt = eventTime;
        if (isCod) {
          updateData.codRemittanceStatus = 'REMITTANCE_PENDING';
        }
      }
      if (normalizedStatus === 'IN_TRANSIT' && !shipment.shippedAt)
        updateData.shippedAt = eventTime;
      if (normalizedStatus === 'CANCELLED') updateData.cancelledAt = eventTime;
      if (rtoSubStatus === 'RTO_INITIATED' || normalizedStatus === 'RTO') {
        updateData.rtoStatus = 'RTO_INITIATED';
        if (!shipment.rtoInitiatedAt) updateData.rtoInitiatedAt = eventTime;
      }
      if (rtoSubStatus === 'RTO_IN_TRANSIT') {
        updateData.rtoStatus = 'RTO_IN_TRANSIT';
        if (!shipment.rtoInTransitAt) updateData.rtoInTransitAt = eventTime;
      }

      await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData,
      });

      // Update linked VendorOrder if present (BM-09 Multi-seller isolation)
      if (shipment.vendorOrderId) {
        const isDelivered = normalizedStatus === 'DELIVERED';
        const isCancelled = normalizedStatus === 'CANCELLED';
        const isRto = normalizedStatus === 'RTO' || normalizedStatus.startsWith('RTO_');
        const isUndelivered = normalizedStatus === 'UNDELIVERED';

        let voShippingStatus: any = 'IN_TRANSIT';
        if (isDelivered) voShippingStatus = 'DELIVERED';
        else if (isCancelled) voShippingStatus = 'CANCELLED';
        else if (isRto) voShippingStatus = 'RTO_INITIATED';
        else if (isUndelivered) voShippingStatus = 'UNDELIVERED';

        await tx.vendorOrder
          .update({
            where: { id: shipment.vendorOrderId },
            data: {
              shippingStatus: voShippingStatus,
              ...(isDelivered ? { status: 'DELIVERED' } : {}),
              ...(isCancelled ? { status: 'CANCELLED' } : {}),
            },
          })
          .catch(() => {});
      }

      // 4. Recalculate Master Order Status & COD Delivery Payment State (BM-07 Section 13 & BM-09)
      const allShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: normalizedStatus } : s,
      );

      const aggregatedOrderStatus =
        StatusAggregatorService.calculateMasterOrderStatus(allShipments);

      const orderUpdateData: any = {
        orderStatus: aggregatedOrderStatus,
        ...(aggregatedOrderStatus === 'DELIVERED' ? { shippingStatus: 'DELIVERED' } : {}),
      };

      // When COD order is delivered, cash is collected at doorstep by courier partner:
      // Transition internal COD payment state to PAID
      if (isCod && (aggregatedOrderStatus === 'DELIVERED' || normalizedStatus === 'DELIVERED')) {
        orderUpdateData.paymentStatus = 'PAID';
      }

      await tx.order.update({
        where: { id: shipment.masterOrderId },
        data: orderUpdateData,
      });
    });

    // Clear Tracking in-memory cache for this shipment
    TrackingService.clearCache();

    // Trigger Automated Lifecycle Email to Customer (and Seller if cancelled)
    OrderEmailNotificationService.notifyOrderStatusChanged(
      shipment.masterOrderId,
      normalizedStatus,
      {
        trackingNumber: awb || shipment.awbCode,
        courierName: courier_name || shipment.courierName,
      },
    ).catch((emailErr) => {
      ShiprocketLogger.warn('[SHIPROCKET_WEBHOOK_EMAIL_NOTIFY_ERROR]', undefined, emailErr);
    });

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
