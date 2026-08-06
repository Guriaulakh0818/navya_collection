import { AddressRepository } from '@/features/addresses/repositories/address.repository';
import { CartService } from '@/features/cart/services/cart.service';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { ShippingService } from '@/features/shipping/services/shipping.service';

import { TaxRepository } from '../repositories/tax.repository';
import { CalculateTaxInput } from '../schemas/tax.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class TaxService {
  /**
   * Centralized Server-Side Tax Calculation Engine.
   */
  static async calculateTax(userId: string, input: CalculateTaxInput): Promise<ServiceResponse> {
    try {
      // 1. Retrieve Authoritative Cart Subtotal & Items
      let subtotal = typeof input.subtotal === 'number' && input.subtotal > 0 ? input.subtotal : 0;
      if (!subtotal && userId) {
        const cartRes = await CartService.getCart(userId);
        if (cartRes.success && cartRes.data) {
          subtotal = cartRes.data.subtotal;
        }
      }

      // 2. Resolve Applied Discount
      let discount = input.discount || 0;
      if (input.couponCode && userId) {
        const couponRes = await CouponService.validateCoupon(userId, {
          code: input.couponCode,
          cartAmount: subtotal,
        });
        if (couponRes.success && couponRes.data) {
          discount = couponRes.data.discountAmount;
        }
      }

      // 3. Resolve Shipping Charges
      let shipping = input.shipping || 0;
      if (input.addressId || userId) {
        const shipRes = await ShippingService.calculateShipping(userId, {
          addressId: input.addressId,
          cartAmount: Math.max(0, subtotal - discount),
          shippingMethodCode: 'STANDARD',
        });
        if (shipRes.success && shipRes.data) {
          shipping = shipRes.data.shippingCharge;
        }
      }

      // 4. Resolve Customer Destination Address State
      let customerState: string | null = null;
      if (input.addressId) {
        const addr = await AddressRepository.findById(input.addressId);
        if (addr) customerState = addr.state;
      }

      // 5. Fetch Tax Configuration & Determine Intra-state vs Inter-state
      const taxConfig = await TaxRepository.getDefaultTaxConfig();
      const storeState = TaxRepository.getStoreHomeState();
      const taxPercentage = taxConfig.taxPercentage || 18;

      const isIntraState =
        Boolean(customerState) &&
        customerState!.trim().toLowerCase() === storeState.trim().toLowerCase();

      // Net Taxable Amount (Discounts applied before tax)
      const netTaxableAmount = Math.max(0, subtotal - discount);

      // Exclusive 18% GST Calculation (GST is added on top of subtotal)
      const rawTax = (netTaxableAmount * taxPercentage) / 100;
      const tax = Math.round(rawTax * 100) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let taxType = 'IGST';

      if (isIntraState) {
        taxType = 'CGST_SGST';
        cgst = Math.round((tax / 2) * 100) / 100;
        sgst = Math.round((tax - cgst) * 100) / 100;
      } else {
        igst = tax;
      }

      // Grand Total = Net Taxable Subtotal + Shipping + GST
      const grandTotal = Math.round((netTaxableAmount + shipping + tax) * 100) / 100;

      return {
        success: true,
        message: 'Tax calculated successfully.',
        statusCode: 200,
        data: {
          subtotal,
          discount,
          netTaxableAmount,
          shipping,
          tax,
          grandTotal,
          taxBreakdown: {
            gst: taxPercentage,
            cgst,
            sgst,
            igst,
            taxType,
            storeState,
            customerState,
          },
        },
      };
    } catch (error: any) {
      console.error('[TAX_SERVICE_CALCULATE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to calculate tax.',
        statusCode: 500,
      };
    }
  }
}
