import { MARKETPLACE_CONFIG } from '@/backend/config/marketplace.config';
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

export interface ItemTaxDetail {
  productId: string;
  variantId?: string | null;
  name?: string;
  shopId?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  taxRate: number; // Percentage, e.g. 0, 5, 12, 18
  taxAmount: number;
  sellerGstStatus: 'REGISTERED' | 'UNREGISTERED';
  sellerGstAmount: number;
  taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  cgst: number;
  sgst: number;
  igst: number;
}

export interface SellerTaxDetail {
  shopId: string;
  shopName?: string;
  sellerState?: string;
  sellerGstStatus: 'REGISTERED' | 'UNREGISTERED';
  sellerGstin: string | null;
  subtotal: number;
  taxAmount: number;
  taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  cgst: number;
  sgst: number;
  igst: number;
}

export class TaxService {
  /**
   * Safe financial rounding to 2 decimal places.
   */
  static roundMoney(amount: number): number {
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Pure calculation helper for item-level dynamic GST under BM-06.
   * - If seller is UNREGISTERED: Tax = ₹0, Rate = 0%.
   * - If seller is REGISTERED:
   *     - Explicit product taxRate takes precedence if provided.
   *     - Sub-₹1,000 apparel = 5% GST.
   *     - At-or-above ₹1,000 apparel = 12% GST.
   *     - Standard/configurable rate (e.g. 18%) supported.
   * - Intra-state vs Inter-state split:
   *     - Intra-state (sellerState === customerState): CGST (half) + SGST (half)
   *     - Inter-state (sellerState !== customerState): IGST (full)
   */
  static calculateItemDynamicTax(params: {
    price: number;
    quantity?: number;
    sellerGstStatus?: string | null;
    explicitTaxRate?: number | null;
    sellerState?: string | null;
    customerState?: string | null;
    isTaxInclusive?: boolean;
  }): {
    taxRate: number;
    taxAmount: number;
    sellerGstAmount: number;
    taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
    cgst: number;
    sgst: number;
    igst: number;
    sellerGstStatus: 'REGISTERED' | 'UNREGISTERED';
  } {
    const {
      price,
      quantity = 1,
      sellerGstStatus,
      explicitTaxRate,
      sellerState,
      customerState,
    } = params;

    const qty = Math.max(1, Number(quantity) || 1);
    const itemSubtotal = this.roundMoney(Number(price) * qty);

    // Rule: Unregistered seller -> GST is not applicable (₹0)
    const isRegistered = sellerGstStatus
      ? sellerGstStatus.toUpperCase().trim() === 'REGISTERED'
      : true; // Default to registered if unspecified unless explicitly unregistered

    if (!isRegistered) {
      return {
        taxRate: 0,
        taxAmount: 0,
        sellerGstAmount: 0,
        taxType: 'EXEMPT',
        cgst: 0,
        sgst: 0,
        igst: 0,
        sellerGstStatus: 'UNREGISTERED',
      };
    }

    // Determine applicable GST rate dynamically
    let rate = 0;
    if (
      explicitTaxRate !== undefined &&
      explicitTaxRate !== null &&
      !isNaN(Number(explicitTaxRate)) &&
      Number(explicitTaxRate) >= 0
    ) {
      rate = Number(explicitTaxRate);
    } else {
      // Dynamic statutory apparel GST rules from authoritative MARKETPLACE_CONFIG.TAX
      const sub1000Rate = Math.round(MARKETPLACE_CONFIG.TAX.APPAREL_SUB_1000_GST_RATE * 100);
      const atOrAbove1000Rate = Math.round(
        MARKETPLACE_CONFIG.TAX.APPAREL_AT_OR_ABOVE_1000_GST_RATE * 100,
      );
      rate = price < 1000 ? sub1000Rate : atOrAbove1000Rate;
    }

    // Dynamic tax calculation: Applicable GST added on top of selling price
    const rawTax = (itemSubtotal * rate) / 100;
    const taxAmount = this.roundMoney(rawTax);

    // Determine Intra-state vs Inter-state
    const sState = (sellerState || 'Haryana').trim().toLowerCase();
    const cState = (customerState || '').trim().toLowerCase();
    const isIntraState = Boolean(cState) && sState === cState;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let taxType: 'CGST_SGST' | 'IGST' = 'IGST';

    if (isIntraState) {
      taxType = 'CGST_SGST';
      cgst = this.roundMoney(taxAmount / 2);
      sgst = this.roundMoney(taxAmount - cgst);
    } else {
      igst = taxAmount;
    }

    return {
      taxRate: rate,
      taxAmount,
      sellerGstAmount: taxAmount,
      taxType,
      cgst,
      sgst,
      igst,
      sellerGstStatus: 'REGISTERED',
    };
  }

  /**
   * Centralized Server-Side Authoritative Tax Calculation Engine.
   */
  static async calculateTax(userId: string, input: CalculateTaxInput): Promise<ServiceResponse> {
    try {
      // 1. Resolve Customer Delivery Address State
      let customerState: string | null = null;
      if (input.addressId) {
        const addr = await AddressRepository.findById(input.addressId);
        if (addr) customerState = addr.state;
      }

      // 2. Resolve Items
      let items: any[] = [];
      let subtotal = 0;

      if (input.items && Array.isArray(input.items) && input.items.length > 0) {
        items = input.items;
        subtotal = items.reduce((sum, item) => {
          const itemPrice = Number(item.price || 0);
          const itemQty = Math.max(1, Number(item.quantity || 1));
          return sum + itemPrice * itemQty;
        }, 0);
      } else {
        const cartRes = await CartService.getCart(userId);
        if (cartRes.success && cartRes.data?.items) {
          items = cartRes.data.items;
          subtotal = cartRes.data.subtotal;
        }
      }

      subtotal = this.roundMoney(subtotal);

      // 3. Resolve Applied Discount
      let discount = input.discount || 0;
      if (input.couponCode && userId && !discount) {
        const couponRes = await CouponService.validateCoupon(userId, {
          code: input.couponCode,
          cartAmount: subtotal,
        });
        if (couponRes.success && couponRes.data) {
          discount = couponRes.data.discountAmount;
        }
      }
      discount = this.roundMoney(discount);

      // 4. Resolve Shipping Charges
      let shipping = input.shipping || 0;
      if (input.addressId || userId) {
        const shipRes = await ShippingService.calculateShipping(userId, {
          addressId: input.addressId,
          cartAmount: Math.max(0, subtotal - discount),
          shippingMethodCode: 'STANDARD',
          items,
        });
        if (shipRes.success && shipRes.data) {
          shipping = shipRes.data.shippingCharge;
        }
      }
      shipping = this.roundMoney(shipping);

      // 5. Resolve Seller Profiles for Multi-Seller dynamic GST
      const shopIds = Array.from(new Set(items.map((i) => i.shopId).filter(Boolean))) as string[];
      const sellerProfileMap = await TaxRepository.getSellerTaxProfiles(shopIds);

      // 6. Calculate Per-Item Dynamic GST
      const itemTaxDetails: ItemTaxDetail[] = [];
      const sellerAggregates = new Map<string, SellerTaxDetail>();

      let totalTax = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      for (const item of items) {
        const shopId = item.shopId || null;
        const sellerProfile = shopId ? sellerProfileMap.get(shopId) : null;
        const sellerGstStatus = item.sellerGstStatus || sellerProfile?.gstStatus || 'REGISTERED';
        const sellerState = sellerProfile?.state || TaxRepository.getStoreHomeState();
        const price = Number(item.price || 0);
        const quantity = Math.max(1, Number(item.quantity || 1));
        const itemSubtotal = this.roundMoney(price * quantity);

        const calc = this.calculateItemDynamicTax({
          price,
          quantity,
          sellerGstStatus,
          explicitTaxRate: item.taxRate,
          sellerState,
          customerState,
        });

        const detail: ItemTaxDetail = {
          productId: item.productId || item.id,
          variantId: item.variantId || null,
          name: item.name || item.productName,
          shopId,
          price,
          quantity,
          subtotal: itemSubtotal,
          taxRate: calc.taxRate,
          taxAmount: calc.taxAmount,
          sellerGstStatus: calc.sellerGstStatus,
          sellerGstAmount: calc.sellerGstAmount,
          taxType: calc.taxType,
          cgst: calc.cgst,
          sgst: calc.sgst,
          igst: calc.igst,
        };

        itemTaxDetails.push(detail);

        totalTax += calc.taxAmount;
        totalCgst += calc.cgst;
        totalSgst += calc.sgst;
        totalIgst += calc.igst;

        // Aggregate by Seller
        const key = shopId || 'marketplace_direct';
        const existing = sellerAggregates.get(key) || {
          shopId: key,
          shopName: sellerProfile?.shopName || 'Boutique Seller',
          sellerState,
          sellerGstStatus: calc.sellerGstStatus,
          sellerGstin: sellerProfile?.gstin || null,
          subtotal: 0,
          taxAmount: 0,
          taxType: calc.taxType,
          cgst: 0,
          sgst: 0,
          igst: 0,
        };

        existing.subtotal = this.roundMoney(existing.subtotal + itemSubtotal);
        existing.taxAmount = this.roundMoney(existing.taxAmount + calc.taxAmount);
        existing.cgst = this.roundMoney(existing.cgst + calc.cgst);
        existing.sgst = this.roundMoney(existing.sgst + calc.sgst);
        existing.igst = this.roundMoney(existing.igst + calc.igst);
        sellerAggregates.set(key, existing);
      }

      totalTax = this.roundMoney(totalTax);
      totalCgst = this.roundMoney(totalCgst);
      totalSgst = this.roundMoney(totalSgst);
      totalIgst = this.roundMoney(totalIgst);

      const netTaxableAmount = Math.max(0, this.roundMoney(subtotal - discount));
      const grandTotal = this.roundMoney(netTaxableAmount + shipping + totalTax);

      const sellers = Array.from(sellerAggregates.values());
      const primaryTaxType = totalIgst > 0 ? 'IGST' : totalCgst > 0 ? 'CGST_SGST' : 'EXEMPT';

      return {
        success: true,
        message: 'Dynamic tax calculated successfully.',
        statusCode: 200,
        data: {
          subtotal,
          discount,
          netTaxableAmount,
          shipping,
          tax: totalTax,
          grandTotal,
          items: itemTaxDetails,
          sellers,
          taxBreakdown: {
            gst: totalTax,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            taxType: primaryTaxType,
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

  /**
   * Wrapper for calculateTax supporting object arguments.
   */
  static async calculateDynamicTax(params: {
    items: any[];
    addressId?: string | null;
    shippingAmount?: number;
    discountAmount?: number;
    userId?: string;
  }): Promise<ServiceResponse> {
    return this.calculateTax(params.userId || 'guest', {
      items: params.items,
      addressId: params.addressId || undefined,
      shipping: params.shippingAmount || 0,
      discount: params.discountAmount || 0,
    });
  }

  /**
   * BM-07 COD Fee Tax Calculation Engine.
   * If tax configuration is active, calculates dynamic applicable rate.
   * If not applicable or exempt, returns ₹0.
   */
  static async calculateCodFeeTax(params: {
    codFee: number;
    customerState?: string | null;
  }): Promise<{
    taxRate: number;
    taxAmount: number;
    taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
    cgst: number;
    sgst: number;
    igst: number;
    taxBreakdown: {
      gst: number;
      cgst: number;
      sgst: number;
      igst: number;
      taxType: string;
    };
  }> {
    const { codFee, customerState } = params;
    if (!codFee || codFee <= 0) {
      return {
        taxRate: 0,
        taxAmount: 0,
        taxType: 'EXEMPT',
        cgst: 0,
        sgst: 0,
        igst: 0,
        taxBreakdown: { gst: 0, cgst: 0, sgst: 0, igst: 0, taxType: 'EXEMPT' },
      };
    }

    try {
      let rate = 0;
      const config = await TaxRepository.getDefaultTaxConfig();
      if (config && config.isActive && config.taxPercentage > 0) {
        rate = Number(config.taxPercentage);
      } else {
        rate = Number(MARKETPLACE_CONFIG.TAX?.COMMISSION_SERVICE_GST_RATE || 0.18) * 100;
      }

      if (rate <= 0) {
        return {
          taxRate: 0,
          taxAmount: 0,
          taxType: 'EXEMPT',
          cgst: 0,
          sgst: 0,
          igst: 0,
          taxBreakdown: { gst: 0, cgst: 0, sgst: 0, igst: 0, taxType: 'EXEMPT' },
        };
      }

      const taxAmount = this.roundMoney((codFee * rate) / 100);

      const homeState = TaxRepository.getStoreHomeState().trim().toLowerCase();
      const cState = (customerState || '').trim().toLowerCase();
      const isIntraState = Boolean(cState) && homeState === cState;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let taxType: 'CGST_SGST' | 'IGST' = 'IGST';

      if (isIntraState) {
        taxType = 'CGST_SGST';
        cgst = this.roundMoney(taxAmount / 2);
        sgst = this.roundMoney(taxAmount - cgst);
      } else {
        igst = taxAmount;
      }

      return {
        taxRate: rate,
        taxAmount,
        taxType,
        cgst,
        sgst,
        igst,
        taxBreakdown: {
          gst: taxAmount,
          cgst,
          sgst,
          igst,
          taxType,
        },
      };
    } catch {
      return {
        taxRate: 0,
        taxAmount: 0,
        taxType: 'EXEMPT',
        cgst: 0,
        sgst: 0,
        igst: 0,
        taxBreakdown: { gst: 0, cgst: 0, sgst: 0, igst: 0, taxType: 'EXEMPT' },
      };
    }
  }
}
