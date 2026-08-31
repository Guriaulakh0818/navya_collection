import { AddressRepository } from '@/features/addresses/repositories/address.repository';
import { CartService } from '@/features/cart/services/cart.service';

import { ShippingRepository } from '../repositories/shipping.repository';
import { CalculateShippingInput } from '../schemas/shipping.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class ShippingService {
  /**
   * Dynamically calculates shipping charges, estimated delivery dates, and method availability.
   */
  static async calculateShipping(
    userId: string,
    input: CalculateShippingInput,
  ): Promise<ServiceResponse> {
    try {
      let pincode = input.pincode || null;
      let state = input.state || null;

      // 1. Resolve Address Details if addressId provided
      if (input.addressId && userId) {
        const address = await AddressRepository.findById(input.addressId);
        if (address && address.userId === userId) {
          pincode = address.pincode;
          state = address.state;
        }
      }

      // 2. Validate PIN Code Servicability
      if (pincode && !ShippingRepository.isPincodeServiceable(pincode)) {
        return {
          success: true,
          message: `Delivery is currently non-serviceable to Pincode ${pincode}. Please enter an alternative delivery address.`,
          statusCode: 200,
          data: {
            isServiceable: false,
            pincode,
            state,
            shippingCharge: 0,
            deliveryDays: 'Non-serviceable',
            isFreeShipping: false,
            shippingMethod: 'N/A',
            availableMethods: [],
          },
        };
      }

      // 3. Resolve Cart Subtotal (Prioritize passed cartAmount from client state)
      let cartSubtotal =
        typeof input.cartAmount === 'number' && input.cartAmount > 0 ? input.cartAmount : 0;
      if (!cartSubtotal && userId) {
        const cartRes = await CartService.getCart(userId);
        if (cartRes.success && cartRes.data) {
          cartSubtotal = cartRes.data.subtotal;
        }
      }

      // 4. Resolve Matching Shipping Zone & Rules
      const matchedZone = await ShippingRepository.findMatchingZoneAndRules(state, pincode);
      const rules = matchedZone.rules || [];

      const selectedMethodCode = (input.shippingMethodCode || 'STANDARD').toUpperCase();
      const activeRule = rules.find((r: any) => r.methodCode === selectedMethodCode) ||
        rules[0] || {
          methodName:
            selectedMethodCode === 'EXPRESS'
              ? 'Express Delivery'
              : selectedMethodCode === 'SAME-DAY'
                ? 'Same Day Delivery'
                : 'Standard Delivery',
          methodCode: selectedMethodCode,
          shippingCharge:
            selectedMethodCode === 'EXPRESS' ? 99 : selectedMethodCode === 'SAME-DAY' ? 149 : 49,
          freeShippingThreshold: selectedMethodCode === 'SAME-DAY' ? 1999 : 999,
          estimatedDeliveryDays:
            selectedMethodCode === 'EXPRESS'
              ? '2-3 business days'
              : selectedMethodCode === 'SAME-DAY'
                ? 'Same day'
                : '5-7 business days',
          isCodAvailable: true,
        };

      // 5. Evaluate Free Shipping Rules
      const freeThreshold = Number(
        activeRule.freeShippingThreshold || (selectedMethodCode === 'SAME-DAY' ? 1999 : 999),
      );
      const isFree = cartSubtotal >= freeThreshold;
      const baseCharge = Number(
        activeRule.shippingCharge ??
          (selectedMethodCode === 'EXPRESS' ? 99 : selectedMethodCode === 'SAME-DAY' ? 149 : 49),
      );
      const finalShippingCharge = isFree ? 0 : baseCharge;
      const savedShipping = isFree ? baseCharge : 0;
      const freeRemaining = Math.max(0, freeThreshold - cartSubtotal);

      // 6. Build Available Shipping Methods Array for UI selection
      const availableMethods = rules.map((r: any) => {
        const rCharge = Number(r.shippingCharge || 99);
        const rThreshold = Number(r.freeShippingThreshold || 999);
        const rIsFree = cartSubtotal >= rThreshold;
        return {
          id: r.id || r.methodCode.toLowerCase(),
          code: r.methodCode,
          name: r.methodName,
          description: `Delivery in ${r.estimatedDeliveryDays}`,
          price: rIsFree ? 0 : rCharge,
          originalPrice: rCharge,
          isFree: rIsFree,
          estimatedDays: r.estimatedDeliveryDays,
          isCodAvailable: r.isCodAvailable ?? true,
        };
      });

      return {
        success: true,
        message: 'Shipping calculated successfully.',
        statusCode: 200,
        data: {
          isServiceable: true,
          pincode,
          state,
          shippingCharge: finalShippingCharge,
          deliveryDays: activeRule.estimatedDeliveryDays || '3-5 business days',
          isFreeShipping: isFree,
          freeShippingThreshold: freeThreshold,
          freeShippingRemaining: freeRemaining,
          savedShippingAmount: savedShipping,
          shippingMethod: activeRule.methodName || 'Standard Delivery',
          shippingMethodCode: activeRule.methodCode || 'STANDARD',
          isCodAvailable: activeRule.isCodAvailable ?? true,
          availableMethods,
        },
      };
    } catch (error: any) {
      console.error('[SHIPPING_SERVICE_CALCULATE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to calculate shipping charges.',
        statusCode: 500,
      };
    }
  }
}
