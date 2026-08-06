import { prisma } from '@/lib/prisma';
import { getShiprocketMetrics } from '@/lib/shiprocket';

import { getShiprocketToken, isShiprocketTokenValid } from './auth';
import { AwbService } from './awb.service';
import { CourierService } from './courier.service';
import { LabelService } from './label.service';
import { ShiprocketLogger } from './logger';
import { PickupService } from './pickup.service';
import { ShipmentService } from './shipment.service';
import { TrackingService } from './tracking.service';
import type {
  AwbGenerationResult,
  CourierRecommendationResult,
  CreatedShipmentData,
  GenerateAwbOptions,
  GenerateLabelOptions,
  PickupRequestResult,
  SchedulePickupOptions,
  ServiceabilityQueryInput,
  ShippingLabelResult,
  ShiprocketHealthStatus,
  StandardShippingResponse,
  TrackingResult,
} from './types';

/**
 * Unified Facade for Shiprocket Module (Module 4.6.8 Production Ready)
 * Provides centralized access to all shipping sub-services, resilience controls,
 * rate limiting metrics, and diagnostic health monitoring.
 */
export class ShiprocketModule {
  /**
   * Health Check Diagnostic Evaluator
   */
  static async getHealthStatus(): Promise<ShiprocketHealthStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV || 'development';

    let dbStatus: 'HEALTHY' | 'UNHEALTHY' = 'HEALTHY';
    let dbLatency = 0;
    let dbMessage = 'Database connection operational.';

    // 1. Check Database Connectivity
    try {
      const dbStart = Date.now();
      await prisma.order.count();
      dbLatency = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'UNHEALTHY';
      dbMessage = `Database connection error: ${err.message}`;
    }

    // 2. Check Auth Token Status
    let authStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    let authMessage = 'Shiprocket authentication active.';
    let isTokenCached = false;
    let tokenAgeSeconds = 0;

    try {
      isTokenCached = isShiprocketTokenValid();
      await getShiprocketToken();
    } catch (err: any) {
      authStatus = env === 'development' ? 'DEGRADED' : 'UNHEALTHY';
      authMessage = `Auth token issue: ${err.message}`;
    }

    // 3. Check Shiprocket API Ping / Serviceability Status
    let apiStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    let apiLatency = Date.now() - startTime;
    let apiMessage = 'Shiprocket API operational.';

    try {
      const pingStart = Date.now();
      const testCheck = await CourierService.getCourierRecommendations({
        pickupPincode: '125050',
        deliveryPincode: '110001',
        weight: 0.5,
        isCod: true,
      });
      apiLatency = Date.now() - pingStart;

      if (!testCheck.success) {
        apiStatus = env === 'development' ? 'DEGRADED' : 'UNHEALTHY';
        apiMessage = testCheck.message || 'API ping serviceability degraded.';
      }
    } catch (err: any) {
      apiStatus = env === 'development' ? 'DEGRADED' : 'UNHEALTHY';
      apiMessage = `API ping failed: ${err.message}`;
    }

    // 4. Rate Limiter Metrics
    const metrics = getShiprocketMetrics();
    const rateLimiterStatus: 'HEALTHY' | 'DEGRADED' =
      metrics.rateLimitedRequests > 0 ? 'DEGRADED' : 'HEALTHY';

    // Determine Overall Module Status
    const isUnhealthy =
      dbStatus === 'UNHEALTHY' || authStatus === 'UNHEALTHY' || apiStatus === 'UNHEALTHY';
    const isDegraded =
      authStatus === 'DEGRADED' || apiStatus === 'DEGRADED' || rateLimiterStatus === 'DEGRADED';

    const overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = isUnhealthy
      ? 'UNHEALTHY'
      : isDegraded
        ? 'DEGRADED'
        : 'HEALTHY';

    ShiprocketLogger.info(`[MODULE_HEALTH_CHECK] Evaluated status: ${overallStatus}`);

    return {
      status: overallStatus,
      timestamp,
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env,
      components: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          message: dbMessage,
        },
        authentication: {
          status: authStatus,
          message: authMessage,
          details: { isTokenCached },
        },
        shiprocketApi: {
          status: apiStatus,
          latencyMs: apiLatency,
          message: apiMessage,
        },
        rateLimiter: {
          status: rateLimiterStatus,
          message: `${metrics.activeRequestsInWindow}/100 active requests in window.`,
        },
      },
      metrics: {
        totalRequests: metrics.totalRequests,
        failedRequests: metrics.failedRequests,
        rateLimitedRequests: metrics.rateLimitedRequests,
        tokenCached: isTokenCached,
        tokenAgeSeconds,
      },
    };
  }

  // =========================================================================
  // SUB-SERVICE FACADE DELEGATIONS
  // =========================================================================

  static async authenticate(forceRefresh?: boolean): Promise<string> {
    return getShiprocketToken(forceRefresh);
  }

  static async recommendCouriers(
    input: ServiceabilityQueryInput,
  ): Promise<StandardShippingResponse<CourierRecommendationResult>> {
    return CourierService.getCourierRecommendations(input);
  }

  static async createShipment(
    orderIdOrNumber: string,
    options?: {
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;
      pickupLocation?: string;
    },
  ): Promise<StandardShippingResponse<CreatedShipmentData>> {
    return ShipmentService.createShipmentForOrder(orderIdOrNumber, options);
  }

  static async assignAwb(
    orderIdOrNumber: string,
    options?: GenerateAwbOptions,
  ): Promise<StandardShippingResponse<AwbGenerationResult>> {
    return AwbService.generateAwbForOrder(orderIdOrNumber, options);
  }

  static async schedulePickup(
    orderIdOrNumber: string,
    options?: SchedulePickupOptions,
  ): Promise<StandardShippingResponse<PickupRequestResult>> {
    return PickupService.schedulePickupForOrder(orderIdOrNumber, options);
  }

  static async trackOrder(
    orderIdOrNumber: string,
  ): Promise<StandardShippingResponse<TrackingResult>> {
    return TrackingService.trackShipment(orderIdOrNumber);
  }

  static async generateLabel(
    orderIdOrNumber: string,
    options?: GenerateLabelOptions,
  ): Promise<StandardShippingResponse<ShippingLabelResult>> {
    return LabelService.generateLabelForOrder(orderIdOrNumber, options);
  }
}
