import { CourierService } from '@/backend/services/shipping/courier.service';

export async function testCourierRecommendationModule() {
  console.log('--- Running Courier Recommendation Unit Tests ---');

  // 1. Test invalid delivery pincode rejection
  const invalidPincodeRes = await CourierService.getCourierRecommendations({
    deliveryPincode: '123', // Invalid 3-digit PIN code
  });

  if (invalidPincodeRes.success !== false) {
    throw new Error('Courier recommendation should fail for invalid pincode.');
  }

  // 2. Test valid pincode query & automatic cheapest courier recommendation
  CourierService.clearAllCache();

  const validQueryRes = await CourierService.getCourierRecommendations({
    deliveryPincode: '110001',
    weight: 0.5,
    isCod: true,
  });

  if (!validQueryRes.success || !validQueryRes.data) {
    throw new Error(`Valid courier recommendation query failed: ${validQueryRes.message}`);
  }

  const data = validQueryRes.data;
  if (!data.recommendedCourier) {
    throw new Error('Recommended courier should be defined.');
  }

  if (!data.cheapestCourier) {
    throw new Error('Cheapest courier should be defined.');
  }

  if (data.recommendedCourier.id !== data.cheapestCourier.id) {
    throw new Error('By default, the recommended courier should match the cheapest courier.');
  }

  if (data.isCachedResponse !== false) {
    throw new Error('First call should not be marked as cached response.');
  }

  // 3. Test caching mechanism
  const cachedQueryRes = await CourierService.getCourierRecommendations({
    deliveryPincode: '110001',
    weight: 0.5,
    isCod: true,
  });

  if (!cachedQueryRes.success || !cachedQueryRes.data?.isCachedResponse) {
    throw new Error(
      'Second identical query should return cached response (isCachedResponse: true).',
    );
  }

  // 4. Test Admin Courier Override
  const adminOverrideRes = await CourierService.getCourierRecommendations({
    deliveryPincode: '110001',
    weight: 0.5,
    isCod: true,
    selectedCourierId: 3, // Select Courier ID 3 as admin override
  });

  if (!adminOverrideRes.success || !adminOverrideRes.data) {
    throw new Error('Admin courier override query failed.');
  }

  const adminData = adminOverrideRes.data;
  if (adminData.recommendedCourier?.id !== 3) {
    throw new Error(
      `Admin override should set courier ID to 3, got: ${adminData.recommendedCourier?.id}`,
    );
  }

  if (adminData.recommendedCourier?.isAdminOverride !== true) {
    throw new Error('Recommended courier should have isAdminOverride set to true.');
  }

  // 5. Test clear cache functionality
  CourierService.clearAllCache();

  console.log('✅ All Courier Recommendation unit tests passed successfully!');
  return true;
}

testCourierRecommendationModule();
