import { TrackingService } from '@/backend/services/shipping/tracking.service';

export async function testTrackingServiceModule() {
  console.log('--- Running Order Tracking Unit Tests ---');

  // 1. Test status normalization
  if (TrackingService.normalizeStatus('DELIVERED') !== 'DELIVERED') {
    throw new Error('Status normalization failed for DELIVERED.');
  }
  if (TrackingService.normalizeStatus('OUT FOR DELIVERY') !== 'OUT_FOR_DELIVERY') {
    throw new Error('Status normalization failed for OUT_FOR_DELIVERY.');
  }
  if (TrackingService.normalizeStatus('In Transit') !== 'IN_TRANSIT') {
    throw new Error('Status normalization failed for IN_TRANSIT.');
  }
  if (TrackingService.normalizeStatus('Pickup Scheduled') !== 'PICKUP_SCHEDULED') {
    throw new Error('Status normalization failed for PICKUP_SCHEDULED.');
  }
  if (TrackingService.normalizeStatus('Canceled') !== 'CANCELLED') {
    throw new Error('Status normalization failed for CANCELLED.');
  }

  // 2. Test timeline construction
  const timeline = TrackingService.buildTimeline('IN_TRANSIT', [
    {
      date: new Date().toISOString(),
      status: 'IN_TRANSIT',
      activity: 'In transit to Hub',
      location: 'Delhi',
    },
  ]);

  if (timeline.length < 6) {
    throw new Error('Order timeline should contain at least 6 standard progression steps.');
  }

  const inTransitStep = timeline.find((t) => t.status === 'IN_TRANSIT');
  if (!inTransitStep || !inTransitStep.isCurrent) {
    throw new Error('IN_TRANSIT step in timeline should be marked as current.');
  }

  // 3. Test non-existent order tracking query
  const missingRes = await TrackingService.trackShipment('NON_EXISTENT_ORDER_777');
  if (missingRes.success !== false || missingRes.statusCode !== 404) {
    throw new Error('Tracking should fail for non-existent order.');
  }

  // 4. Test cache clear utility
  TrackingService.clearCache();

  console.log('✅ All Order Tracking unit tests passed successfully!');
  return true;
}

testTrackingServiceModule();
