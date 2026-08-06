import { CouponRepository } from '../repositories/coupon.repository';
import {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from '../schemas/coupon.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class CouponService {
  /**
   * Core Discount Engine: Computes exact discount amount for a coupon based on type, limits, and cart amount.
   */
  private static calculateDiscountAmount(
    discountType: string,
    discountValue: number,
    cartAmount: number,
    maxDiscount?: number | null,
  ): number {
    let discount = 0;
    const typeUpper = discountType.toUpperCase();

    if (typeUpper === 'PERCENTAGE') {
      discount = (cartAmount * discountValue) / 100;
      if (maxDiscount && maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
    } else if (typeUpper === 'FIXED' || typeUpper === 'FLAT') {
      discount = discountValue;
    }

    // Discount cannot exceed cart total amount
    return Math.max(0, Math.min(discount, cartAmount));
  }

  /**
   * Validates a coupon against business rules and calculates discount.
   */
  static async validateCoupon(
    userId: string,
    input: ValidateCouponInput,
  ): Promise<ServiceResponse> {
    try {
      const { code, cartAmount, items } = input;
      const cleanCode = code.trim().toUpperCase();

      // 1. Check Coupon Existence
      const coupon = await CouponRepository.findByCode(cleanCode);
      if (!coupon) {
        return {
          success: false,
          message: `Invalid coupon code '${cleanCode}'. Please check and try again.`,
          statusCode: 404,
        };
      }

      // 2. Check Active Status
      if (!coupon.isActive) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' is currently inactive.`,
          statusCode: 400,
        };
      }

      // 3. Check Date Validity Window
      const now = new Date();
      const startDate = coupon.startDate ? new Date(coupon.startDate) : new Date(0);
      const validUntil = new Date(coupon.validUntil);

      if (now < startDate) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' is not active yet.`,
          statusCode: 400,
        };
      }

      if (now > validUntil) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' has expired.`,
          statusCode: 400,
        };
      }

      // 4. Check Minimum Order Amount (> ₹3,000 for NAVYA15VIP)
      const minAmount = Number(coupon.minOrderAmount || 0);
      if (cleanCode === 'NAVYA15VIP' || coupon.onlyNonDiscounted) {
        if (cartAmount <= 3000) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' is valid ONLY on orders greater than ₹3,000.`,
            statusCode: 400,
          };
        }
      } else {
        if (cartAmount < minAmount) {
          return {
            success: false,
            message: `Minimum order amount of ₹${minAmount.toLocaleString('en-IN')} required to use coupon '${cleanCode}'.`,
            statusCode: 400,
          };
        }
      }

      // 4b. Check Non-Discounted Products Rule for NAVYA15VIP
      let applicableCartAmount = cartAmount;
      if ((cleanCode === 'NAVYA15VIP' || coupon.onlyNonDiscounted) && items && items.length > 0) {
        // Filter non-discounted items (where originalPrice <= price or no discount)
        const nonDiscountedItems = items.filter(
          (item: any) => !item.originalPrice || Number(item.originalPrice) <= Number(item.price),
        );

        if (nonDiscountedItems.length === 0) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' applies ONLY to non-discounted products. All items in your cart are currently discounted.`,
            statusCode: 400,
          };
        }

        const nonDiscountedTotal = nonDiscountedItems.reduce(
          (sum: number, item: any) => sum + Number(item.price) * (item.quantity || 1),
          0,
        );

        if (nonDiscountedTotal <= 3000) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' applies only to non-discounted items. Your non-discounted items total is ₹${nonDiscountedTotal.toLocaleString('en-IN')} (must be > ₹3,000).`,
            statusCode: 400,
          };
        }

        applicableCartAmount = nonDiscountedTotal;
      }

      // 5. Check Global Usage Limit
      if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' has reached its maximum total usage limit.`,
          statusCode: 400,
        };
      }

      // 6. Check Per-User Usage Limit (if user authenticated)
      if (userId) {
        const userUsageCount = await CouponRepository.countUserUsages(coupon.id, userId);
        const perUserLimit = coupon.usagePerUser || 1;

        if (userUsageCount >= perUserLimit) {
          return {
            success: false,
            message: `You have already redeemed coupon '${cleanCode}' the maximum allowed number of times (${perUserLimit} time${perUserLimit > 1 ? 's' : ''}).`,
            statusCode: 400,
          };
        }
      }

      // 7. Check Excluded Products (if cart items provided)
      if (items && items.length > 0 && coupon.excludedProducts) {
        const excludedList = Array.isArray(coupon.excludedProducts)
          ? coupon.excludedProducts
          : (coupon.excludedProducts as any);
        const allItemsExcluded = items.every((item) => excludedList.includes(item.productId));

        if (allItemsExcluded) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' is not applicable to the items in your cart.`,
            statusCode: 400,
          };
        }
      }

      // 8. Calculate Discount
      const discountValueNum = Number(coupon.discountValue);
      const maxDiscountNum = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
      const discountAmount = this.calculateDiscountAmount(
        coupon.discountType,
        discountValueNum,
        cartAmount,
        maxDiscountNum,
      );

      const finalAmount = Math.max(0, cartAmount - discountAmount);

      return {
        success: true,
        message: `Coupon '${cleanCode}' applied successfully! Saved ₹${discountAmount.toLocaleString('en-IN')}.`,
        statusCode: 200,
        data: {
          code: coupon.code,
          title:
            coupon.title ||
            `${discountValueNum}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
          description: coupon.description || null,
          discountType: coupon.discountType,
          discountValue: discountValueNum,
          discountAmount,
          originalCartAmount: cartAmount,
          finalCartAmount: finalAmount,
          maxDiscount: maxDiscountNum,
          minOrderAmount: minAmount,
        },
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_VALIDATE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to validate coupon code.',
        statusCode: 500,
      };
    }
  }

  /**
   * Applies coupon to customer's active cart.
   */
  static async applyCoupon(userId: string, input: ValidateCouponInput): Promise<ServiceResponse> {
    return await this.validateCoupon(userId, input);
  }

  /**
   * Admin: Retrieves all coupons.
   */
  static async getAdminCoupons(): Promise<ServiceResponse> {
    try {
      const coupons = await CouponRepository.findAll();
      const formatted = coupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title || null,
        description: c.description || null,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderAmount: Number(c.minOrderAmount || 0),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        usageLimit: c.usageLimit || null,
        usagePerUser: c.usagePerUser || 1,
        usedCount: c.usedCount || 0,
        startDate: c.startDate || c.createdAt,
        validUntil: c.validUntil,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }));

      return {
        success: true,
        message: 'Admin coupons retrieved successfully.',
        statusCode: 200,
        data: formatted,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_ADMIN_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve coupons list.',
        statusCode: 500,
      };
    }
  }

  /**
   * Customer: Retrieves active public coupons.
   */
  static async getActiveCoupons(): Promise<ServiceResponse> {
    try {
      const coupons = await CouponRepository.findAllActive();
      const formatted = coupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscount: c.maxDiscount,
        validUntil: c.validUntil,
      }));

      return {
        success: true,
        message: 'Active coupons retrieved successfully.',
        statusCode: 200,
        data: formatted,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_GET_ACTIVE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve active coupons.',
        statusCode: 500,
      };
    }
  }

  /**
   * Admin: Creates a new coupon.
   */
  static async createCoupon(input: CreateCouponInput): Promise<ServiceResponse> {
    try {
      const existing = await CouponRepository.findByCode(input.code);
      if (existing) {
        return {
          success: false,
          message: `Coupon code '${input.code.toUpperCase()}' already exists. Please choose a unique code.`,
          statusCode: 400,
        };
      }

      const created = await CouponRepository.create(input);
      return {
        success: true,
        message: 'Coupon created successfully.',
        statusCode: 201,
        data: created,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to create coupon.',
        statusCode: 500,
      };
    }
  }

  /**
   * Admin: Updates an existing coupon.
   */
  static async updateCoupon(id: string, input: UpdateCouponInput): Promise<ServiceResponse> {
    try {
      const existing = await CouponRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          message: 'Coupon not found.',
          statusCode: 404,
        };
      }

      if (input.code && input.code.toUpperCase() !== existing.code) {
        const codeCheck = await CouponRepository.findByCode(input.code);
        if (codeCheck) {
          return {
            success: false,
            message: `Coupon code '${input.code.toUpperCase()}' already exists.`,
            statusCode: 400,
          };
        }
      }

      const updated = await CouponRepository.update(id, input);
      return {
        success: true,
        message: 'Coupon updated successfully.',
        statusCode: 200,
        data: updated,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update coupon.',
        statusCode: 500,
      };
    }
  }

  /**
   * Admin: Soft deletes a coupon.
   */
  static async deleteCoupon(id: string): Promise<ServiceResponse> {
    try {
      const existing = await CouponRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          message: 'Coupon not found.',
          statusCode: 404,
        };
      }

      await CouponRepository.softDelete(id);
      return {
        success: true,
        message: 'Coupon deleted successfully.',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete coupon.',
        statusCode: 500,
      };
    }
  }
}
