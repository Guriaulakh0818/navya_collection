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

      // 3. Resolve Items for Seller-Level Grouping
      let resolvedItems: any[] = [];
      if (input.items && Array.isArray(input.items) && input.items.length > 0) {
        resolvedItems = input.items;
      } else if (userId) {
        const cartRes = await CartService.getCart(userId);
        if (cartRes.success && cartRes.data?.items) {
          resolvedItems = cartRes.data.items;
        }
      }

      // Fallback if no item list available but cartAmount was provided
      if (resolvedItems.length === 0) {
        const amount =
          typeof input.cartAmount === 'number' && input.cartAmount > 0 ? input.cartAmount : 0;
        resolvedItems = [
          { productId: 'generic-item', shopId: 'default-shop', price: amount, quantity: 1 },
        ];
      }

      const totalCartSubtotal = resolvedItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
        0,
      );

      // 4. Resolve Matching Shipping Zone & Rules
      const matchedZone = await ShippingRepository.findMatchingZoneAndRules(state, pincode);
      const rules = matchedZone.rules || [];
      const selectedPaymentMethod = (input.paymentMethod || 'PREPAID').toUpperCase().trim();
      const isCod = selectedPaymentMethod === 'COD';
      const selectedMethodCode = (input.shippingMethodCode || 'STANDARD').toUpperCase().trim();

      // 5. Evaluate First-Order / Promotional Free Delivery Offer
      const { CustomerShippingService } =
        await import('@/backend/services/shipping/customer-shipping.service');
      const { OfferService } = await import('@/backend/services/offer.service');
      const offerEvaluation = await OfferService.evaluateShippingOffer(
        userId,
        totalCartSubtotal,
        CustomerShippingService.STANDARD_SHIPPING_CHARGE,
      );

      // 6. Calculate Authoritative Seller-Level Shipping via CustomerShippingService (BM-05 Engine)
      const shippingCalc = CustomerShippingService.calculateCustomerShipping({
        items: resolvedItems,
        shippingMethodCode: selectedMethodCode,
        paymentMethod: selectedPaymentMethod,
        isFirstOrder: offerEvaluation.isFreeDelivery,
        destinationPincode: pincode,
      });

      // 7. Build Available Shipping Methods Array for UI Selection
      const availableMethods = rules.map((r: any) => {
        const altCalc = CustomerShippingService.calculateCustomerShipping({
          items: resolvedItems,
          shippingMethodCode: r.methodCode,
          paymentMethod: selectedPaymentMethod,
          isFirstOrder: offerEvaluation.isFreeDelivery,
          destinationPincode: pincode,
        });

        return {
          id: r.id || r.methodCode.toLowerCase(),
          code: r.methodCode,
          name: r.methodName,
          description: `Delivery in ${r.estimatedDeliveryDays}`,
          price: altCalc.finalShippingAmount,
          originalPrice: altCalc.sellers.reduce((sum, s) => sum + s.baseShippingCharge, 0),
          isFree: altCalc.isAllFreeShipping,
          estimatedDays: r.estimatedDeliveryDays,
          isCodAvailable: r.isCodAvailable ?? true,
        };
      });

      const threshold = isCod
        ? CustomerShippingService.COD_FREE_SHIPPING_THRESHOLD
        : CustomerShippingService.PREPAID_FREE_SHIPPING_THRESHOLD;
      const savedShipping = shippingCalc.savedShippingAmount;

      return {
        success: true,
        message: 'Shipping calculated successfully.',
        statusCode: 200,
        data: {
          isServiceable: true,
          pincode,
          state,
          shippingCharge: shippingCalc.finalShippingAmount,
          totalCustomerShipping: shippingCalc.totalCustomerShipping,
          totalShippingTax: shippingCalc.totalShippingTax,
          finalShippingAmount: shippingCalc.finalShippingAmount,
          deliveryDays: shippingCalc.estimatedDeliveryDays,
          isFreeShipping: shippingCalc.isAllFreeShipping,
          freeShippingThreshold: threshold,
          freeShippingRemaining: shippingCalc.sellers.reduce(
            (maxRem, s) => Math.max(maxRem, s.freeShippingRemaining),
            0,
          ),
          savedShippingAmount: savedShipping,
          shippingMethod: shippingCalc.shippingMethodName,
          shippingMethodCode: shippingCalc.shippingMethodCode,
          paymentMethod: isCod ? 'COD' : 'PREPAID',
          isCodAvailable: true,
          isFirstOrderFreeDelivery:
            offerEvaluation.isFreeDelivery && selectedMethodCode === 'STANDARD',
          offerTitle: offerEvaluation.message || null,
          guestOfferPrompt: offerEvaluation.guestPrompt || null,
          availableMethods,
          sellers: shippingCalc.sellers,
          sellerBreakdown: shippingCalc.sellers,
          totalSellerShipments: shippingCalc.totalSellerShipments,
          freeShipmentCount: shippingCalc.freeShipmentCount,
          paidShipmentCount: shippingCalc.paidShipmentCount,
          totalSellerFundedShippingCost: shippingCalc.totalSellerFundedShippingCost,
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
