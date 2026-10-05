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

    const isRto = (s: string) => s === 'RTO' || s.startsWith('RTO_');
    const isCancelled = (s: string) => s === 'CANCELLED';
    const isTerminated = (s: string) => isCancelled(s) || isRto(s);

    // 1. All Cancelled -> CANCELLED
    if (statuses.every(isCancelled)) {
      return OrderStatus.CANCELLED;
    }

    // 2. All RTO (or combination of RTO and Cancelled)
    if (statuses.every(isTerminated)) {
      if (statuses.some(isRto)) {
        return OrderStatus.RTO;
      }
      return OrderStatus.CANCELLED;
    }

    // Filter out cancelled and RTO shipments to evaluate remaining active fulfillment (BM-09 Multi-seller isolation)
    const activeStatuses = statuses.filter((s) => !isTerminated(s));
    if (activeStatuses.length === 0) {
      return statuses.some(isRto) ? OrderStatus.RTO : OrderStatus.CANCELLED;
    }

    // 3. All remaining active Delivered -> DELIVERED
    if (activeStatuses.every((s) => s === 'DELIVERED')) {
      return OrderStatus.DELIVERED;
    }

    // 4. Any active in transit or out for delivery -> SHIPPED
    const hasShippedOrInTransit = activeStatuses.some((s) =>
      [
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'PICKED_UP',
        'DISPATCHED',
        'UNDELIVERED',
      ].includes(s),
    );
    if (hasShippedOrInTransit) {
      return OrderStatus.SHIPPED;
    }

    // 5. Any packed, processing, ready, or pickup scheduled -> PROCESSING
    const hasProcessing = activeStatuses.some((s) =>
      ['PACKED', 'PROCESSING', 'READY_TO_SHIP', 'READY', 'PICKUP_SCHEDULED'].includes(s),
    );
    if (hasProcessing) {
      return OrderStatus.PROCESSING;
    }

    // 6. Any confirmed or created -> CONFIRMED
    const hasConfirmed = activeStatuses.some((s) => ['CREATED', 'CONFIRMED'].includes(s));
    if (hasConfirmed) {
      return OrderStatus.CONFIRMED;
    }

    return OrderStatus.PENDING;
  }
}
