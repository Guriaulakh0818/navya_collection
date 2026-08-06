import {
  clearShiprocketTokenCache,
  getShiprocketTokenStatus,
} from '@/backend/services/shipping/auth';

export function testShiprocketAuthModule() {
  clearShiprocketTokenCache();

  const initialStatus = getShiprocketTokenStatus();
  if (initialStatus.hasToken !== false) {
    throw new Error('Initial status hasToken should be false.');
  }
  if (initialStatus.isExpired !== true) {
    throw new Error('Initial status isExpired should be true.');
  }
  if (initialStatus.expiresAt !== null) {
    throw new Error('Initial status expiresAt should be null.');
  }

  clearShiprocketTokenCache();
  const resetStatus = getShiprocketTokenStatus();
  if (resetStatus.hasToken !== false) {
    throw new Error('Reset status hasToken should be false.');
  }

  return true;
}

testShiprocketAuthModule();
