import { shiprocketClient } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';
import { StatusAggregatorService } from './status-aggregator.service';
import type {
  NormalizedTrackingStatus,
  OrderTimelineItem,
  ShiprocketTrackingCheckpoint,
  StandardShippingResponse,
  TrackingResult,
} from './types';

// In-memory caching for tracking query responses (15-minute TTL)
const trackingCache = new Map<
  string,
  {
    result: StandardShippingResponse<TrackingResult>;
    expiresAt: number;
  }
>();

export class TrackingService {
  static clearCache(): void {
    trackingCache.clear();
  }

  static normalizeStatus(statusRaw?: string | number): NormalizedTrackingStatus {
    if (!statusRaw) return 'PENDING';
    const strStatus = String(statusRaw).toUpperCase().trim();

    if (strStatus.includes('DELIVERED')) return 'DELIVERED';
    if (strStatus.includes('OUT FOR DELIVERY')) return 'OUT_FOR_DELIVERY';
    if (strStatus.includes('IN TRANSIT') || strStatus.includes('SHIPPED') || strStatus === '6') {
      return 'IN_TRANSIT';
    }
    if (
      strStatus.includes('PICKUP SCHEDULED') ||
      strStatus.includes('PICKUP GENERATED') ||
      strStatus.includes('PICKED UP') ||
      strStatus === '4'
    ) {
      return 'PICKUP_SCHEDULED';
    }
    if (
      strStatus.includes('PACKED') ||
      strStatus.includes('MANIFEST') ||
      strStatus.includes('AWB ASSIGNED') ||
      strStatus === '1'
    ) {
      return 'PACKED';
    }
    if (
      strStatus.includes('RTO') ||
      strStatus.includes('RETURN') ||
      strStatus.includes('UNDELIVERED') ||
      strStatus === '9'
    ) {
      return 'RTO';
    }
    if (strStatus.includes('CANCEL') || strStatus === '5') return 'CANCELLED';

    return 'PENDING';
  }

  static buildTimeline(
    currentStatus: NormalizedTrackingStatus,
    checkpoints: ShiprocketTrackingCheckpoint[],
    orderCreatedAt?: Date,
  ): OrderTimelineItem[] {
    const statusOrder: NormalizedTrackingStatus[] = [
      'PENDING',
      'PACKED',
      'PICKUP_SCHEDULED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const labels: Record<NormalizedTrackingStatus, { label: string; description: string }> = {
      PENDING: { label: 'Order Placed', description: 'Order confirmed and payment verified' },
      PACKED: {
        label: 'Packed & Manifested',
        description: 'Package items packed and shipping label attached',
      },
      PICKUP_SCHEDULED: {
        label: 'Pickup Scheduled',
        description: 'Courier partner assigned for warehouse pickup',
      },
      IN_TRANSIT: {
        label: 'In Transit',
        description: 'Package on the way to destination facility',
      },
      OUT_FOR_DELIVERY: {
        label: 'Out for Delivery',
        description: 'Courier agent out for final delivery',
      },
      DELIVERED: { label: 'Delivered', description: 'Package successfully delivered to customer' },
      RTO: { label: 'Returned to Origin', description: 'Shipment returning to seller warehouse' },
      CANCELLED: { label: 'Order Cancelled', description: 'Shipment or order has been cancelled' },
    };

    const isAbnormal = currentStatus === 'RTO' || currentStatus === 'CANCELLED';
    const activeStatusIndex = isAbnormal ? -1 : statusOrder.indexOf(currentStatus);

    const timeline: OrderTimelineItem[] = statusOrder.map((st, idx) => {
      const isCompleted =
        !isAbnormal && (idx <= activeStatusIndex || (activeStatusIndex === -1 && idx === 0));
      const isCurrent = !isAbnormal && idx === activeStatusIndex;

      const matchingCheck = checkpoints.find((c) => this.normalizeStatus(c.status) === st);

      return {
        status: st,
        label: labels[st].label,
        description: labels[st].description,
        timestamp:
          matchingCheck?.date ||
          (st === 'PENDING' && orderCreatedAt ? orderCreatedAt.toISOString() : undefined),
        location: matchingCheck?.location,
        activity: matchingCheck?.activity,
        isCompleted,
        isCurrent,
      };
    });

    if (isAbnormal) {
      timeline.push({
        status: currentStatus,
        label: labels[currentStatus].label,
        description: labels[currentStatus].description,
        timestamp: checkpoints[0]?.date || new Date().toISOString(),
        location: checkpoints[0]?.location,
        activity: checkpoints[0]?.activity,
        isCompleted: true,
        isCurrent: true,
      });
    }

    return timeline;
  }

  /**
   * Tracks a Shipment by Shipment ID, Shipment Number, or AWB Code.
   */
  static async trackShipment(
    idOrAwb: string,
    options?: { skipCache?: boolean },
  ): Promise<StandardShippingResponse<TrackingResult>> {
    const queryKey = idOrAwb.trim().toUpperCase();

    // Check cache
    if (!options?.skipCache && trackingCache.has(queryKey)) {
      const cachedEntry = trackingCache.get(queryKey)!;
      if (Date.now() < cachedEntry.expiresAt) {
        return cachedEntry.result;
      }
      trackingCache.delete(queryKey);
    }

    // Lookup Shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { id: idOrAwb },
          { shipmentNumber: idOrAwb },
          { awbCode: idOrAwb },
          { shiprocketShipmentId: idOrAwb },
        ],
      },
      include: {
        masterOrder: true,
        shop: true,
        trackingEvents: { orderBy: { eventTimestamp: 'desc' } },
      },
    });

    if (!shipment) {
      // Fallback lookup on master order
      const order = await prisma.order.findFirst({
        where: { OR: [{ id: idOrAwb }, { orderNumber: idOrAwb }] },
        include: { shipments: true },
      });

      if (order && order.shipments && order.shipments.length > 0) {
        return this.trackShipment(order.shipments[0].id, options);
      }

      return {
        success: false,
        message: SHIPROCKET_CONSTANTS.ERRORS.ORDER_NOT_FOUND,
        statusCode: 404,
      };
    }

    const awbCode = shipment.awbCode;
    const shipmentId = shipment.shiprocketShipmentId;

    let checkpoints: ShiprocketTrackingCheckpoint[] = shipment.trackingEvents.map((te) => ({
      date: te.eventTimestamp.toISOString(),
      status: te.status,
      activity: te.activity || '',
      location: te.location || '',
    }));

    let currentStatusNormalized = this.normalizeStatus(shipment.status);

    // Call live Shiprocket tracking API if AWB or shipmentId is available
    if (awbCode || shipmentId) {
      try {
        let liveTrackingData: any = null;
        if (awbCode) {
          const url = `${SHIPROCKET_CONSTANTS.ENDPOINTS.TRACK_AWB}/${awbCode}`;
          liveTrackingData = await shiprocketClient.get(url);
        } else if (shipmentId) {
          const url = `${SHIPROCKET_CONSTANTS.ENDPOINTS.TRACK_SHIPMENT}/${shipmentId}`;
          liveTrackingData = await shiprocketClient.get(url);
        }

        const trackData = liveTrackingData?.data?.tracking_data || liveTrackingData?.tracking_data;
        const rawStatus = trackData?.shipment_track?.[0]?.current_status || trackData?.track_status;
        const activities: any[] = trackData?.shipment_track_activities || [];

        if (rawStatus) {
          currentStatusNormalized = this.normalizeStatus(rawStatus);

          // Update status on shipment
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              status: currentStatusNormalized,
              trackingStatus: currentStatusNormalized,
              ...(currentStatusNormalized === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            },
          });
        }

        if (activities && activities.length > 0) {
          checkpoints = activities.map((a: any) => ({
            date: a.date,
            status: a.status || a.activity,
            activity: a.activity,
            location: a.location,
          }));
        }
      } catch (err: any) {
        ShiprocketLogger.warn('[TRACKING_LIVE_API_WARNING]', undefined, { error: err.message });
      }
    }

    const timeline = this.buildTimeline(currentStatusNormalized, checkpoints, shipment.createdAt);
    const trackingUrl = awbCode
      ? `${SHIPROCKET_CONSTANTS.DEFAULTS.TRACKING_BASE_URL}${awbCode}`
      : '';

    const result: StandardShippingResponse<TrackingResult> = {
      success: true,
      message: 'Tracking details retrieved successfully.',
      statusCode: 200,
      data: {
        orderId: shipment.masterOrderId,
        orderNumber: shipment.shipmentNumber,
        shiprocketShipmentId: shipment.shiprocketShipmentId || 'N/A',
        awbCode: shipment.awbCode || 'N/A',
        courierName: shipment.courierName || 'Standard Courier',
        trackingUrl,
        status: currentStatusNormalized,
        currentStatus: currentStatusNormalized,
        statusCode: 1,
        etd: undefined,
        originCity: (shipment.pickupAddressSnapshot as any)?.city || 'Seller Hub',
        destinationCity: (shipment.deliveryAddressSnapshot as any)?.city || 'Customer City',
        checkpoints,
        timeline,
        lastUpdated: new Date().toISOString(),
        isDelivered: currentStatusNormalized === 'DELIVERED',
        isCancelled: currentStatusNormalized === 'CANCELLED',
        isRTO: currentStatusNormalized === 'RTO',
        isCachedResponse: false,
      },
    };

    trackingCache.set(queryKey, {
      result,
      expiresAt: Date.now() + SHIPROCKET_CONSTANTS.TRACKING_CACHE_TTL_MS,
    });

    return result;
  }
}
