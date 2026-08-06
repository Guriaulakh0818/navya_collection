import { checkAndRegisterRateLimit, getShiprocketMetrics } from '../../backend/lib/shiprocket';
import { ShiprocketLogger } from '../../backend/services/shipping/logger';
import { ShiprocketModule } from '../../backend/services/shipping/shiprocket-module';

export async function testProductionReadyShiprocketModule() {
  console.log('--- Running Shiprocket Production-Ready Module Unit Tests ---');

  // 1. Test ShiprocketLogger
  ShiprocketLogger.clearLogs();
  ShiprocketLogger.info('Test Info Message', 'CID-101', { test: true });
  ShiprocketLogger.warn('Test Warn Message', 'CID-102');
  ShiprocketLogger.error('Test Error Message', 'CID-103');

  const logs = ShiprocketLogger.getRecentLogs(10);
  if (logs.length !== 3) {
    throw new Error(`Expected 3 logged events in buffer, got ${logs.length}.`);
  }
  if (logs[0].level !== 'INFO' || logs[1].level !== 'WARN' || logs[2].level !== 'ERROR') {
    throw new Error('Logged event levels do not match expectation.');
  }

  // 2. Test Rate Limiter and Metrics
  const rateOk = checkAndRegisterRateLimit();
  if (!rateOk) {
    throw new Error('First rate limit check should succeed.');
  }

  const metrics = getShiprocketMetrics();
  if (metrics.totalRequests < 1 || metrics.activeRequestsInWindow < 1) {
    throw new Error('Shiprocket metrics should report active requests.');
  }

  // 3. Test ShiprocketModule Health Status
  const health = await ShiprocketModule.getHealthStatus();
  if (!health || !health.status || !health.components) {
    throw new Error('Health check status output is incomplete or invalid.');
  }

  if (
    !health.components.database ||
    !health.components.authentication ||
    !health.components.shiprocketApi ||
    !health.components.rateLimiter
  ) {
    throw new Error('Health check components missing required sub-service metrics.');
  }

  // 4. Test Facade delegation validation
  const invalidLabel = await ShiprocketModule.generateLabel('NON_EXISTENT_FACADE_999');
  if (invalidLabel.success !== false || invalidLabel.statusCode !== 404) {
    throw new Error('Facade generateLabel should handle invalid order gracefully.');
  }

  console.log('✅ All Production-Ready Shiprocket Module unit tests passed successfully!');
  return true;
}

testProductionReadyShiprocketModule();
