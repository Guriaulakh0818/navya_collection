import { OrderStatus } from '@prisma/client';

/**
 * StatusAggregatorService
 * Centralized deterministic rule engine for aggregating child Shipment statuses
 * into the Master Customer Order status.
 */
export class StatusAggregatorService {
  /**
   * Calculates the authoritative master OrderStatus based on all child shipments.
   */
  static calculateMasterOrderStatus(shipments: { status: string }[]): OrderStatus {
    if (!shipments || shipments.length === 0) {
      return OrderStatus.PENDING;
    }

    const statuses = shipments.map((s) => (s.status || '').toUpperCase());

    // 1. All Cancelled -> CANCELLED
    if (statuses.every((s) => s === 'CANCELLED')) {
      return OrderStatus.CANCELLED;
    }

    // Filter out cancelled shipments to evaluate remaining active fulfillment
    const activeStatuses = statuses.filter((s) => s !== 'CANCELLED');
    if (activeStatuses.length === 0) {
      return OrderStatus.CANCELLED;
    }

    // 2. All active Delivered -> DELIVERED
    if (activeStatuses.every((s) => s === 'DELIVERED')) {
      return OrderStatus.DELIVERED;
    }

    // 3. Any active in transit or out for delivery -> SHIPPED
    const hasShippedOrInTransit = activeStatuses.some((s) =>
      ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s),
    );
    if (hasShippedOrInTransit) {
      return OrderStatus.SHIPPED;
    }

    // 4. Any packed or pickup scheduled -> PROCESSING
    const hasProcessing = activeStatuses.some((s) =>
      ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED'].includes(s),
    );
    if (hasProcessing) {
      return OrderStatus.PROCESSING;
    }

    // 5. Any confirmed or created -> CONFIRMED
    const hasConfirmed = activeStatuses.some((s) => ['CREATED', 'CONFIRMED'].includes(s));
    if (hasConfirmed) {
      return OrderStatus.CONFIRMED;
    }

    return OrderStatus.PENDING;
  }
}
