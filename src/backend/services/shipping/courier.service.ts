import shiprocketClient from '@/lib/shiprocket';

import { SHIPROCKET_CONSTANTS } from './constants';
import type {
  CourierCompany,
  CourierRecommendationResult,
  ServiceabilityQueryInput,
  StandardShippingResponse,
} from './types';

/**
 * In-Memory Serviceability Response Cache
 * Caches courier recommendation query results for 15 minutes to reduce API latency & rate limits.
 */
interface CacheEntry {
  data: CourierRecommendationResult;
  expiresAt: number;
}

const serviceabilityCache = new Map<string, CacheEntry>();

export class CourierService {
  /**
   * Generates a deterministic cache key for serviceability queries.
   */
  private static generateCacheKey(input: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    isCod: boolean;
    selectedCourierId?: number;
  }): string {
    return `${input.pickupPincode}:${input.deliveryPincode}:${input.weight}:${input.isCod ? 'COD' : 'PREPAID'}:${input.selectedCourierId || 'NONE'}`;
  }

  /**
   * Clears expired entries from in-memory serviceability cache.
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of serviceabilityCache.entries()) {
      if (now >= entry.expiresAt) {
        serviceabilityCache.delete(key);
      }
    }
  }

  /**
   * Clears the entire serviceability cache manually.
   */
  static clearAllCache(): void {
    serviceabilityCache.clear();
    console.log('[COURIER_SERVICE] In-memory serviceability cache cleared.');
  }

  /**
   * Queries Shiprocket Courier Serviceability API, compares available options,
   * automatically recommends the cheapest courier (or applies admin override),
   * and caches the result for 15 minutes.
   */
  static async getCourierRecommendations(
    input: ServiceabilityQueryInput,
  ): Promise<StandardShippingResponse<CourierRecommendationResult>> {
    try {
      const pickupPincode = (
        input.pickupPincode ||
        SHIPROCKET_CONSTANTS.DEFAULTS.PICKUP_PINCODE ||
        '125050'
      ).replace(/\D/g, '');
      const deliveryPincode = (input.deliveryPincode || '').replace(/\D/g, '');
      const weight = Math.max(0.1, Number(input.weight || SHIPROCKET_CONSTANTS.DEFAULTS.WEIGHT_KG));
      const isCod = Boolean(input.isCod);
      const selectedCourierId = input.selectedCourierId
        ? Number(input.selectedCourierId)
        : undefined;

      // Validate 6-digit Indian PIN code format
      if (!/^[1-9][0-9]{5}$/.test(deliveryPincode)) {
        return {
          success: false,
          message: SHIPROCKET_CONSTANTS.ERRORS.INVALID_PINCODE,
          statusCode: 400,
          error: {
            code: 'INVALID_DELIVERY_PINCODE',
            details: `Pincode '${input.deliveryPincode}' is not a valid 6-digit Indian postal code.`,
          },
        };
      }

      // Check In-Memory Cache
      this.clearExpiredCache();
      const cacheKey = this.generateCacheKey({
        pickupPincode,
        deliveryPincode,
        weight,
        isCod,
        selectedCourierId,
      });

      const cachedEntry = serviceabilityCache.get(cacheKey);
      if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
        console.log(`[COURIER_CACHE_HIT] Key: ${cacheKey}`);
        return {
          success: true,
          message: 'Retrieved courier recommendations from cache.',
          statusCode: 200,
          data: {
            ...cachedEntry.data,
            isCachedResponse: true,
          },
        };
      }

      console.log(
        `[COURIER_SERVICEABILITY_FETCH] Pickup: ${pickupPincode}, Delivery: ${deliveryPincode}, Weight: ${weight}kg, Payment: ${isCod ? 'COD' : 'Prepaid'}...`,
      );

      // Query Shiprocket Courier Serviceability API
      const response = await shiprocketClient.get(SHIPROCKET_CONSTANTS.ENDPOINTS.SERVICEABILITY, {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod: isCod ? 1 : 0,
          order_id: input.orderId || undefined,
        },
      });

      const rawCouriers: any[] =
        response.data?.data?.available_courier_companies ||
        response.data?.available_courier_companies ||
        [];

      if (!Array.isArray(rawCouriers) || rawCouriers.length === 0) {
        return {
          success: false,
          message: SHIPROCKET_CONSTANTS.ERRORS.NO_SERVICEABLE_COURIERS,
          statusCode: 404,
          error: {
            code: 'NO_SERVICEABLE_COURIERS',
            details: `No serviceable couriers found for pincode ${deliveryPincode}.`,
          },
        };
      }

      // Map raw API objects to clean CourierCompany interfaces
      const couriers: CourierCompany[] = rawCouriers.map((c: any) => {
        const rate = Number(c.rate || c.freight_charge || 0);
        const codCharges = Number(c.cod_charges || 0);
        const totalCharge = Number(c.total_charge || rate + (isCod ? codCharges : 0));
        const estimatedDays = parseInt(
          c.estimated_delivery_days || c.etd?.replace(/\D/g, '') || '3',
          10,
        );

        return {
          id: Number(c.courier_company_id || c.id),
          name: String(c.courier_name || c.name || 'Courier Partner'),
          minWeight: Number(c.min_weight || 0.5),
          rate,
          freightCharge: Number(c.freight_charge || rate),
          codCharges,
          totalCharge,
          etd: String(c.etd || `${estimatedDays} Days`),
          estimatedDeliveryDays: isNaN(estimatedDays) ? 3 : estimatedDays,
          rating: Number(c.rating || 4.0),
          codAvailable: Number(c.cod) === 1 || c.cod === true,
          realtimeTracking: Boolean(c.realtime_tracking ?? true),
          recommended: false,
        };
      });

      // Filter by COD requirement if COD is requested
      const eligibleCouriers = isCod ? couriers.filter((c) => c.codAvailable) : couriers;
      const activeList = eligibleCouriers.length > 0 ? eligibleCouriers : couriers;

      // Identify Cheapest Courier
      const cheapestCourier =
        [...activeList].sort((a, b) => a.totalCharge - b.totalCharge)[0] || null;

      // Identify Fastest Courier
      const fastestCourier =
        [...activeList].sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays)[0] ||
        null;

      let recommendedCourier: CourierCompany | null = null;

      // Check Admin Override first
      if (selectedCourierId) {
        const foundOverride = couriers.find((c) => c.id === selectedCourierId);
        if (foundOverride) {
          recommendedCourier = {
            ...foundOverride,
            recommended: true,
            recommendationReason: 'Admin Specified Override',
            isAdminOverride: true,
          };
        }
      }

      // If no admin override, default to Cheapest Courier
      if (!recommendedCourier && cheapestCourier) {
        recommendedCourier = {
          ...cheapestCourier,
          recommended: true,
          recommendationReason: 'Cheapest Available Courier',
          isAdminOverride: false,
        };
      }

      // Update recommended flag in availableCouriers list
      const formattedCouriers = couriers.map((c) => {
        if (recommendedCourier && c.id === recommendedCourier.id) {
          return {
            ...c,
            recommended: true,
            recommendationReason: recommendedCourier.recommendationReason,
            isAdminOverride: recommendedCourier.isAdminOverride,
          };
        }
        return c;
      });

      const result: CourierRecommendationResult = {
        pickupPincode,
        deliveryPincode,
        weight,
        isCod,
        recommendedCourier,
        cheapestCourier,
        fastestCourier,
        availableCouriers: formattedCouriers,
        totalAvailable: formattedCouriers.length,
        isCachedResponse: false,
      };

      // Store in memory cache for 15 minutes
      serviceabilityCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + SHIPROCKET_CONSTANTS.SERVICEABILITY_CACHE_TTL_MS,
      });

      console.log(
        `[COURIER_RECOMMENDED] Recommended Courier: ${recommendedCourier?.name} (Rate: ₹${recommendedCourier?.totalCharge}, ETD: ${recommendedCourier?.etd})`,
      );

      return {
        success: true,
        message: 'Retrieved serviceable couriers and recommendation successfully.',
        statusCode: 200,
        data: result,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to retrieve courier recommendations from Shiprocket.';

      console.error('[COURIER_RECOMMENDATION_ERROR]', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });

      // Fallback for Development & Testing when API credentials or network call is unavailable
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[COURIER_RECOMMENDATION_FALLBACK] Using mock courier options for dev/testing environment.',
        );

        const pickupPincode = (
          input.pickupPincode ||
          SHIPROCKET_CONSTANTS.DEFAULTS.PICKUP_PINCODE ||
          '125050'
        ).replace(/\D/g, '');
        const deliveryPincode = (input.deliveryPincode || '').replace(/\D/g, '');
        const weight = Math.max(
          0.1,
          Number(input.weight || SHIPROCKET_CONSTANTS.DEFAULTS.WEIGHT_KG),
        );
        const isCod = Boolean(input.isCod);
        const selectedCourierId = input.selectedCourierId
          ? Number(input.selectedCourierId)
          : undefined;

        const mockCouriers: CourierCompany[] = [
          {
            id: 1,
            name: 'Shadowfax Surface',
            minWeight: 0.5,
            rate: 45,
            freightCharge: 45,
            codCharges: isCod ? 25 : 0,
            totalCharge: isCod ? 70 : 45,
            etd: '4-5 Days',
            estimatedDeliveryDays: 4,
            rating: 4.2,
            codAvailable: true,
            realtimeTracking: true,
            recommended: false,
          },
          {
            id: 2,
            name: 'Delhivery Surface',
            minWeight: 0.5,
            rate: 60,
            freightCharge: 60,
            codCharges: isCod ? 30 : 0,
            totalCharge: isCod ? 90 : 60,
            etd: '3-4 Days',
            estimatedDeliveryDays: 3,
            rating: 4.5,
            codAvailable: true,
            realtimeTracking: true,
            recommended: false,
          },
          {
            id: 3,
            name: 'Bluedart Express',
            minWeight: 0.5,
            rate: 110,
            freightCharge: 110,
            codCharges: isCod ? 40 : 0,
            totalCharge: isCod ? 150 : 110,
            etd: '1-2 Days',
            estimatedDeliveryDays: 1,
            rating: 4.8,
            codAvailable: true,
            realtimeTracking: true,
            recommended: false,
          },
        ];

        const cheapestCourier = [...mockCouriers].sort((a, b) => a.totalCharge - b.totalCharge)[0];
        const fastestCourier = [...mockCouriers].sort(
          (a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays,
        )[0];

        let recommendedCourier: CourierCompany | null = null;
        if (selectedCourierId) {
          const found = mockCouriers.find((c) => c.id === selectedCourierId);
          if (found) {
            recommendedCourier = {
              ...found,
              recommended: true,
              recommendationReason: 'Admin Specified Override',
              isAdminOverride: true,
            };
          }
        }

        if (!recommendedCourier && cheapestCourier) {
          recommendedCourier = {
            ...cheapestCourier,
            recommended: true,
            recommendationReason: 'Cheapest Available Courier',
            isAdminOverride: false,
          };
        }

        const formattedCouriers = mockCouriers.map((c) => {
          if (recommendedCourier && c.id === recommendedCourier.id) {
            return {
              ...c,
              recommended: true,
              recommendationReason: recommendedCourier.recommendationReason,
              isAdminOverride: recommendedCourier.isAdminOverride,
            };
          }
          return c;
        });

        const fallbackResult: CourierRecommendationResult = {
          pickupPincode,
          deliveryPincode,
          weight,
          isCod,
          recommendedCourier,
          cheapestCourier,
          fastestCourier,
          availableCouriers: formattedCouriers,
          totalAvailable: formattedCouriers.length,
          isCachedResponse: false,
        };

        const cacheKey = this.generateCacheKey({
          pickupPincode,
          deliveryPincode,
          weight,
          isCod,
          selectedCourierId,
        });

        serviceabilityCache.set(cacheKey, {
          data: fallbackResult,
          expiresAt: Date.now() + SHIPROCKET_CONSTANTS.SERVICEABILITY_CACHE_TTL_MS,
        });

        return {
          success: true,
          message: 'Retrieved courier recommendations (development fallback).',
          statusCode: 200,
          data: fallbackResult,
        };
      }

      return {
        success: false,
        message: errorMessage,
        statusCode: error.response?.status || 500,
        error: {
          code: 'COURIER_SERVICEABILITY_FAILED',
          details: error.response?.data || error.message,
        },
      };
    }
  }
}
