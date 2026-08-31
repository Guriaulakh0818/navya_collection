import { prisma } from '@/lib/prisma';

// Pre-seeded zones and rules for fallback & offline testing
const FALLBACK_ZONES = [
  {
    id: 'zone_metro',
    name: 'Metro Cities & Major States',
    states: [
      'Maharashtra',
      'Delhi',
      'Karnataka',
      'Tamil Nadu',
      'West Bengal',
      'Telangana',
      'Gujarat',
      'Haryana',
    ],
    pincodes: null,
    isActive: true,
    rules: [
      {
        id: 'rule_metro_standard',
        methodName: 'Standard Delivery',
        methodCode: 'STANDARD',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 49,
        freeShippingThreshold: 999,
        estimatedDeliveryDays: '5-7 business days',
        isCodAvailable: true,
        isActive: true,
      },
      {
        id: 'rule_metro_express',
        methodName: 'Express Delivery',
        methodCode: 'EXPRESS',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 99,
        freeShippingThreshold: 999,
        estimatedDeliveryDays: '2-3 business days',
        isCodAvailable: true,
        isActive: true,
      },
      {
        id: 'rule_metro_same_day',
        methodName: 'Same Day Delivery',
        methodCode: 'SAME-DAY',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 149,
        freeShippingThreshold: 1999,
        estimatedDeliveryDays: 'Same day',
        isCodAvailable: true,
        isActive: true,
      },
    ],
  },
  {
    id: 'zone_rest_of_india',
    name: 'Rest of India',
    states: null,
    pincodes: null,
    isActive: true,
    rules: [
      {
        id: 'rule_rest_standard',
        methodName: 'Standard Delivery',
        methodCode: 'STANDARD',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 49,
        freeShippingThreshold: 999,
        estimatedDeliveryDays: '5-7 business days',
        isCodAvailable: true,
        isActive: true,
      },
      {
        id: 'rule_rest_express',
        methodName: 'Express Delivery',
        methodCode: 'EXPRESS',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 99,
        freeShippingThreshold: 999,
        estimatedDeliveryDays: '2-3 business days',
        isCodAvailable: true,
        isActive: true,
      },
      {
        id: 'rule_rest_same_day',
        methodName: 'Same Day Delivery',
        methodCode: 'SAME-DAY',
        minimumOrderAmount: 0,
        maximumOrderAmount: null,
        shippingCharge: 149,
        freeShippingThreshold: 1999,
        estimatedDeliveryDays: 'Same day',
        isCodAvailable: true,
        isActive: true,
      },
    ],
  },
];

// Non-serviceable test PIN codes
const NON_SERVICEABLE_PINCODES = new Set(['000000', '999999', '111111', '123456']);

export class ShippingRepository {
  /**
   * Checks if a PIN code is serviceable.
   */
  static isPincodeServiceable(pincode?: string | null): boolean {
    if (!pincode) return true;
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) return false;
    return !NON_SERVICEABLE_PINCODES.has(clean);
  }

  /**
   * Finds applicable shipping zones and rules matching state or pincode.
   */
  static async findMatchingZoneAndRules(state?: string | null, pincode?: string | null) {
    try {
      const dbZones = await (prisma as any).shippingZone?.findMany({
        where: { isActive: true },
        include: { rules: { where: { isActive: true } } },
      });

      if (dbZones && dbZones.length > 0) {
        // Find zone by state or pincode match
        const matched = dbZones.find((z: any) => {
          if (pincode && z.pincodes && Array.isArray(z.pincodes) && z.pincodes.includes(pincode)) {
            return true;
          }
          if (state && z.states && Array.isArray(z.states) && z.states.includes(state)) {
            return true;
          }
          return false;
        });

        if (matched) return matched;
        return dbZones[0];
      }
    } catch {
      // Fallback configuration mode
    }

    // Match against FALLBACK_ZONES
    if (state) {
      const stateMatch = FALLBACK_ZONES.find(
        (z) => z.states && z.states.some((s) => s.toLowerCase() === state.toLowerCase()),
      );
      if (stateMatch) return stateMatch;
    }

    return FALLBACK_ZONES[1]; // Rest of India default
  }
}
