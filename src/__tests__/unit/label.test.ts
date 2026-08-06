import { LabelService } from '../../backend/services/shipping/label.service';

export async function testLabelServiceModule() {
  console.log('--- Running Shipping Label Unit Tests ---');

  // 1. Test non-existent order rejection
  const missingRes = await LabelService.generateLabelForOrder('NON_EXISTENT_ORDER_666');
  if (missingRes.success !== false || missingRes.statusCode !== 404) {
    throw new Error('Label generation should fail for non-existent order.');
  }

  // 2. Test getLabelDetails for non-existent order
  const missingDetailsRes = await LabelService.getLabelDetails('NON_EXISTENT_ORDER_666');
  if (missingDetailsRes.success !== false || missingDetailsRes.statusCode !== 404) {
    throw new Error('Label details query should fail for non-existent order.');
  }

  console.log('✅ All Shipping Label unit tests passed successfully!');
  return true;
}

testLabelServiceModule();
