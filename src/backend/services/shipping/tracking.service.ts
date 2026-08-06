import { prisma } from '@/lib/prisma';
import shiprocketClient from '@/lib/shiprocket';

import { SHIPROCKET_CONSTANTS } from './constants';
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
  /**
   * Clears the in-memory tracking response cache.
   */
  static clearCache(): void {
    trackingCache.clear();
    console.log('[TRACKING_SERVICE] In-memory tracking cache cleared.');
  }

  /**
   * Maps raw Shiprocket status string or status code to standard application status.
   */
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

  /**
   * Builds an 8-step chronological Order Timeline with activity checkpoints.
   */
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

      // Find matching checkpoint date/location if present
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
   * Tracks a shipment by Order ID, Order Number, or AWB Code.
   * Syncs status in database, constructs order timeline, and returns cached/live response.
   */
  static async trackShipment(
    orderIdOrAwb: string,
    options?: { skipCache?: boolean },
  ): Promise<StandardShippingResponse<TrackingResult>> {
    const timestamp = new Date().toISOString();
    const queryKey = orderIdOrAwb.trim().toUpperCase();

    // 1. Check In-Memory Cache
    if (!options?.skipCache && trackingCache.has(queryKey)) {
      const cachedEntry = trackingCache.get(queryKey)!;
      if (Date.now() < cachedEntry.expiresAt) {
        console.log(`[TRACKING_CACHE_HIT] Key: ${queryKey}`);
        return {
          ...cachedEntry.result,
          data: cachedEntry.result.data
            ? { ...cachedEntry.result.data, isCachedResponse: true }
            : undefined,
        };
      }
      trackingCache.delete(queryKey);
    }

    console.log(`[TRACKING_INIT] Fetching tracking for: ${queryKey}...`);

    // 2. Lookup Order in Database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrAwb },
          { orderNumber: orderIdOrAwb },
          { awbCode: orderIdOrAwb },
          { shiprocketShipmentId: orderIdOrAwb },
          { trackingNumber: orderIdOrAwb },
        ],
      },
    });

    if (!order) {
      return {
        success: false,
        message: SHIPROCKET_CONSTANTS.ERRORS.ORDER_NOT_FOUND,
        statusCode: 404,
        error: {
          code: 'ORDER_NOT_FOUND',
          details: `No order record matching '${orderIdOrAwb}'.`,
        },
      };
    }

    const awbCode = order.awbCode || order.trackingNumber;
    const shipmentId = order.shiprocketShipmentId;

    if (!awbCode && !shipmentId) {
      return {
        success: false,
        message: SHIPROCKET_CONSTANTS.ERRORS.NO_AWB_OR_SHIPMENT,
        statusCode: 400,
        error: {
          code: 'UNSHIPPED_ORDER',
          details: 'Order has not been assigned an AWB code or shipment ID yet.',
        },
      };
    }

    // 3. Attempt Live Shiprocket Tracking API Call
    let liveTrackingData: any = null;
    let apiError: any = null;

    try {
      if (awbCode) {
        const url = `${SHIPROCKET_CONSTANTS.ENDPOINTS.TRACK_AWB}/${awbCode}`;
        liveTrackingData = await shiprocketClient.get(url);
      } else if (shipmentId) {
        const url = `${SHIPROCKET_CONSTANTS.ENDPOINTS.TRACK_SHIPMENT}/${shipmentId}`;
        liveTrackingData = await shiprocketClient.get(url);
      }
    } catch (err: any) {
      apiError = err;
      console.warn(
        `[TRACKING_API_WARNING] Live API call failed for ${order.orderNumber}:`,
        err?.message,
      );
    }

    // Extract Tracking Payload & Checkpoints
    const trackData = liveTrackingData?.data?.tracking_data || liveTrackingData?.tracking_data;
    const rawStatus =
      trackData?.shipment_track?.[0]?.current_status ||
      trackData?.track_status ||
      order.shippingStatus;
    const checkpointsRaw: any[] = trackData?.shipment_track_activities || [];

    const checkpoints: ShiprocketTrackingCheckpoint[] = checkpointsRaw.map((cp: any) => ({
      date: cp.date || cp['sr-status-label-date'] || new Date().toISOString(),
      status: cp.status || cp['sr-status'] || 'IN_TRANSIT',
      activity: cp.activity || cp['sr-status-label'] || 'Package updated',
      location: cp.location || cp.city || 'Transit Hub',
      sr_status_label: cp['sr-status-label'],
    }));

    // Normalize Status
    const normalizedStatus = this.normalizeStatus(rawStatus);

    // Development Fallback if live tracking API returned error or empty data
    const isDev = process.env.NODE_ENV === 'development';
    const isDevFallback = Boolean(isDev && (!liveTrackingData || apiError));

    const finalStatus: NormalizedTrackingStatus = isDevFallback
      ? (order.shippingStatus as NormalizedTrackingStatus) || 'PICKUP_SCHEDULED'
      : normalizedStatus;

    // 4. Update Database Order Record & Status Timeline
    const updateData: any = {
      shippingStatus: finalStatus,
    };

    if (finalStatus === 'DELIVERED') {
      updateData.orderStatus = 'DELIVERED';
    } else if (finalStatus === 'CANCELLED') {
      updateData.orderStatus = 'CANCELLED';
    } else if (finalStatus === 'RTO') {
      updateData.orderStatus = 'RETURNED';
    } else if (finalStatus === 'IN_TRANSIT' && order.orderStatus === 'CONFIRMED') {
      updateData.orderStatus = 'SHIPPED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    const timeline = this.buildTimeline(finalStatus, checkpoints, updatedOrder.createdAt);

    const result: StandardShippingResponse<TrackingResult> = {
      success: true,
      message: isDevFallback
        ? 'Tracking details retrieved successfully (development fallback).'
        : 'Tracking details retrieved successfully via Shiprocket.',
      statusCode: 200,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        shiprocketShipmentId: updatedOrder.shiprocketShipmentId || undefined,
        awbCode: updatedOrder.awbCode || updatedOrder.trackingNumber || 'N/A',
        courierName: updatedOrder.courierName || 'Standard Courier',
        currentStatus: finalStatus,
        rawShiprocketStatus: String(rawStatus),
        statusCode: liveTrackingData?.data?.shipment_status || 200,
        origin: trackData?.origin || 'Warehouse',
        destination: trackData?.destination || 'Customer Address',
        estimatedDeliveryDate:
          updatedOrder.estimatedDelivery?.toISOString() || trackData?.etd || undefined,
        lastUpdated: new Date().toISOString(),
        isCachedResponse: false,
        isDevFallback,
        timeline,
        checkpoints:
          checkpoints.length > 0
            ? checkpoints
            : [
                {
                  date: updatedOrder.updatedAt.toISOString(),
                  status: finalStatus,
                  activity: `Package status: ${finalStatus}`,
                  location: 'Fulfilment Center',
                },
              ],
      },
    };

    // Store in Cache
    trackingCache.set(queryKey, {
      result,
      expiresAt: Date.now() + SHIPROCKET_CONSTANTS.TRACKING_CACHE_TTL_MS,
    });

    return result;
  }
}
