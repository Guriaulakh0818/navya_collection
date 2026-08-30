import { describe, expect, it } from 'vitest';

import {
  generateVariantSku,
  normalizeColorCode,
  normalizeSizeCode,
} from '../../src/backend/lib/sku-generator';
import { StatusAggregatorService } from '../../src/backend/services/shipping/status-aggregator.service';
import { TrackingService } from '../../src/backend/services/shipping/tracking.service';

describe('Multi-Seller Shipping & Status Aggregator Engine', () => {
  describe('StatusAggregatorService.calculateMasterOrderStatus', () => {
    it('returns PENDING when no shipments exist', () => {
      expect(StatusAggregatorService.calculateMasterOrderStatus([])).toBe('PENDING');
    });

    it('returns CANCELLED when all shipments are cancelled', () => {
      const shipments = [{ status: 'CANCELLED' }, { status: 'CANCELLED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('CANCELLED');
    });

    it('returns DELIVERED when all shipments are delivered', () => {
      const shipments = [{ status: 'DELIVERED' }, { status: 'DELIVERED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('DELIVERED');
    });

    it('returns DELIVERED when active shipments are delivered despite one cancelled shipment', () => {
      const shipments = [{ status: 'DELIVERED' }, { status: 'CANCELLED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('DELIVERED');
    });

    it('returns SHIPPED when at least one shipment is in transit or out for delivery', () => {
      const shipments = [{ status: 'DELIVERED' }, { status: 'IN_TRANSIT' }, { status: 'PACKED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('SHIPPED');
    });

    it('returns PROCESSING when shipments are packed or pickup scheduled without dispatch', () => {
      const shipments = [{ status: 'PACKED' }, { status: 'PICKUP_SCHEDULED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('PROCESSING');
    });

    it('returns CONFIRMED when shipments are newly created or confirmed', () => {
      const shipments = [{ status: 'CREATED' }, { status: 'CONFIRMED' }];
      expect(StatusAggregatorService.calculateMasterOrderStatus(shipments)).toBe('CONFIRMED');
    });
  });

  describe('TrackingService.normalizeStatus', () => {
    it('normalizes various Shiprocket status codes and text accurately', () => {
      expect(TrackingService.normalizeStatus('DELIVERED')).toBe('DELIVERED');
      expect(TrackingService.normalizeStatus('OUT FOR DELIVERY')).toBe('OUT_FOR_DELIVERY');
      expect(TrackingService.normalizeStatus('IN TRANSIT')).toBe('IN_TRANSIT');
      expect(TrackingService.normalizeStatus('6')).toBe('IN_TRANSIT');
      expect(TrackingService.normalizeStatus('PICKUP SCHEDULED')).toBe('PICKUP_SCHEDULED');
      expect(TrackingService.normalizeStatus('4')).toBe('PICKUP_SCHEDULED');
      expect(TrackingService.normalizeStatus('PACKED')).toBe('PACKED');
      expect(TrackingService.normalizeStatus('1')).toBe('PACKED');
      expect(TrackingService.normalizeStatus('RTO INITIATED')).toBe('RTO');
      expect(TrackingService.normalizeStatus('9')).toBe('RTO');
      expect(TrackingService.normalizeStatus('CANCELLED')).toBe('CANCELLED');
      expect(TrackingService.normalizeStatus('5')).toBe('CANCELLED');
      expect(TrackingService.normalizeStatus('')).toBe('PENDING');
    });

    it('builds a multi-step chronological order timeline', () => {
      const checkpoints = [
        {
          date: '2026-08-29T10:00:00Z',
          status: 'IN TRANSIT',
          activity: 'Departed sorting facility',
          location: 'Delhi Hub',
        },
      ];

      const timeline = TrackingService.buildTimeline('IN_TRANSIT', checkpoints);
      expect(timeline.length).toBe(6);

      const pendingStep = timeline.find((s) => s.status === 'PENDING');
      const inTransitStep = timeline.find((s) => s.status === 'IN_TRANSIT');
      const deliveredStep = timeline.find((s) => s.status === 'DELIVERED');

      expect(pendingStep?.isCompleted).toBe(true);
      expect(inTransitStep?.isCurrent).toBe(true);
      expect(inTransitStep?.activity).toBe('Departed sorting facility');
      expect(inTransitStep?.location).toBe('Delhi Hub');
      expect(deliveredStep?.isCompleted).toBe(false);
    });
  });

  describe('Variant SKU & Code Formatting', () => {
    it('properly structures multi-vendor product variant codes', () => {
      expect(generateVariantSku('NVC-000001', 'Black', 'XL')).toBe('NVC-000001-BLK-XL');
      expect(generateVariantSku('NVC-000002', 'Navy Blue', '2XL')).toBe('NVC-000002-NVY-2XL');
    });
  });
});
