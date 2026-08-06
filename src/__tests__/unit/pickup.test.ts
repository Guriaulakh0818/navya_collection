import { PickupService } from '@/backend/services/shipping/pickup.service';

export async function testPickupServiceModule() {
  console.log('--- Running Pickup Request Unit Tests ---');

  // 1. Test non-existent order rejection
  const missingOrderRes = await PickupService.schedulePickupForOrder('NON_EXISTENT_ORDER_888');
  if (missingOrderRes.success !== false || missingOrderRes.statusCode !== 404) {
    throw new Error('Pickup scheduling should fail for non-existent order.');
  }

  // 2. Test status tracking for non-existent order
  const missingStatusRes = await PickupService.getPickupStatus('NON_EXISTENT_ORDER_888');
  if (missingStatusRes.success !== false || missingStatusRes.statusCode !== 404) {
    throw new Error('Pickup status query should fail for non-existent order.');
  }

  console.log('✅ All Pickup Request unit tests passed successfully!');
  return true;
}

testPickupServiceModule();
