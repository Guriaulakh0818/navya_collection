import { CommissionService } from '@/backend/services/commission.service';

import { CouponRepository } from '../repositories/coupon.repository';
import {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from '../schemas/coupon.schema';
import { CouponFundingType } from '../types/coupon.types';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export interface CouponAllocationResult {
  totalDiscount: number;
  fundingType: CouponFundingType;
  shopId?: string | null;
  sellerAllocations: Array<{
    sellerId: string;
    sellerSubtotal: number;
    allocatedCoupon: number;
    fundingType: CouponFundingType;
  }>;
  itemAllocations: Array<{
    productId: string;
    shopId: string;
    itemSubtotal: number;
    allocatedCoupon: number;
    navyaCouponAmount: number;
    sellerCouponAmount: number;
    fundingType: CouponFundingType;
  }>;
}

export class CouponService {
  /**
   * Core Discount Engine: Computes exact discount amount for a coupon based on type, limits, and cart amount.
   * Uses CommissionService.roundMoney for exact paise arithmetic.
   */
  public static calculateDiscountAmount(
    discountType: string,
    discountValue: number,
    cartAmount: number,
    maxDiscount?: number | null,
  ): number {
    let discount = 0;
    const typeUpper = (discountType || '').toUpperCase();

    if (typeUpper === 'PERCENTAGE') {
      discount = CommissionService.roundMoney((cartAmount * discountValue) / 100);
      if (maxDiscount && maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
    } else if (typeUpper === 'FIXED' || typeUpper === 'FLAT') {
      discount = CommissionService.roundMoney(discountValue);
    }

    // Discount cannot exceed cart total amount
    return Math.max(0, Math.min(discount, CommissionService.roundMoney(cartAmount)));
  }

  /**
   * Single Authoritative Multi-Seller and Item-Level Coupon Allocation Engine (BM-10 Section 17, 18, 33).
   * Proportional allocation by seller subtotal with deterministic remainder assignment to the final seller/item.
   * Guarantees exact paise reconciliation: Sum(allocatedCoupon) === totalDiscount.
   */
  public static allocateCoupon(couponOrParams: any, maybeItems?: any[]): CouponAllocationResult {
    let coupon: any = null;
    let items: Array<any> = [];
    let discountAmount: number = 0;
    let fundingType: CouponFundingType = 'NAVYA';
    let shopId: string | null = null;
    let applicableCategories: string[] = [];
    let applicableProducts: string[] = [];
    let excludedProducts: string[] = [];

    if (Array.isArray(maybeItems)) {
      // Called as allocateCoupon(coupon, items)
      coupon = couponOrParams;
      items = maybeItems;
      fundingType = coupon.fundingType || 'NAVYA';
      shopId = coupon.shopId || null;
      applicableCategories = coupon.applicableCategories || [];
      applicableProducts = coupon.applicableProducts || [];
      excludedProducts = coupon.excludedProducts || [];
    } else if (couponOrParams && typeof couponOrParams === 'object') {
      if (Array.isArray(couponOrParams.items)) {
        items = couponOrParams.items;
      }
      if (couponOrParams.coupon) {
        coupon = couponOrParams.coupon;
        fundingType = coupon.fundingType || couponOrParams.fundingType || 'NAVYA';
        shopId = coupon.shopId || couponOrParams.shopId || null;
        applicableCategories = coupon.applicableCategories || [];
        applicableProducts = coupon.applicableProducts || [];
        excludedProducts = coupon.excludedProducts || [];
      } else {
        fundingType = couponOrParams.fundingType || 'NAVYA';
        shopId = couponOrParams.shopId || null;
        if (couponOrParams.discountAmount !== undefined) {
          discountAmount = Number(couponOrParams.discountAmount || 0);
        }
      }
    }

    if (!items || items.length === 0) {
      return {
        totalDiscount: 0,
        fundingType,
        shopId,
        sellerAllocations: [],
        itemAllocations: [],
      };
    }

    // Filter items based on coupon restrictions
    const eligibleItems = items.filter((item) => {
      // Shop isolation
      if (shopId && item.shopId && item.shopId !== shopId) {
        return false;
      }

      // Excluded products
      if (excludedProducts.length > 0 && excludedProducts.includes(item.productId)) {
        return false;
      }

      // Applicable products
      if (applicableProducts.length > 0 && !applicableProducts.includes(item.productId)) {
        return false;
      }

      // Applicable categories
      if (
        applicableCategories.length > 0 &&
        item.categoryId &&
        !applicableCategories.includes(item.categoryId)
      ) {
        return false;
      }

      return true;
    });

    const eligibleSubtotal = CommissionService.roundMoney(
      eligibleItems.reduce(
        (sum, i) => sum + Number(i.total || Number(i.price) * Number(i.quantity)),
        0,
      ),
    );

    if (coupon) {
      discountAmount = this.calculateDiscountAmount(
        coupon.discountType,
        coupon.discountValue,
        eligibleSubtotal,
        coupon.maxDiscount,
      );
    }

    const totalDiscount = CommissionService.roundMoney(Math.max(0, discountAmount || 0));

    if (totalDiscount <= 0 || eligibleSubtotal <= 0) {
      return {
        totalDiscount: 0,
        fundingType,
        shopId,
        sellerAllocations: [],
        itemAllocations: items.map((i) => ({
          productId: i.productId,
          shopId: i.shopId || 'default-shop',
          itemSubtotal: Number(i.total || Number(i.price) * Number(i.quantity)),
          allocatedCoupon: 0,
          allocatedDiscount: 0,
          navyaCouponAmount: 0,
          sellerCouponAmount: 0,
          fundingType,
        })),
      };
    }

    // Group eligible items by shopId
    const shopMap = new Map<string, typeof items>();
    for (const itm of eligibleItems) {
      const sId = itm.shopId || 'default-shop';
      const list = shopMap.get(sId) || [];
      list.push(itm);
      shopMap.set(sId, list);
    }

    const eligibleShopEntries = Array.from(shopMap.entries());
    const sellerSubtotals = eligibleShopEntries.map(([sId, sItems]) => {
      const subtotal = CommissionService.roundMoney(
        sItems.reduce((sum, i) => sum + Number(i.total || Number(i.price) * Number(i.quantity)), 0),
      );
      return { sId, sItems, subtotal };
    });

    let cumAllocatedSellerCoupon = 0;
    const sellerAllocations: any[] = [];
    const itemAllocations: any[] = [];

    // Track non-eligible items in itemAllocations
    const nonEligibleItems = items.filter((i) => !eligibleItems.includes(i));
    for (const neItem of nonEligibleItems) {
      itemAllocations.push({
        productId: neItem.productId,
        shopId: neItem.shopId || 'default-shop',
        itemSubtotal: Number(neItem.total || Number(neItem.price) * Number(neItem.quantity)),
        allocatedCoupon: 0,
        allocatedDiscount: 0,
        navyaCouponAmount: 0,
        sellerCouponAmount: 0,
        fundingType,
      });
    }

    for (let sIdx = 0; sIdx < sellerSubtotals.length; sIdx++) {
      const { sId, sItems, subtotal: sSubtotal } = sellerSubtotals[sIdx];
      const isLastSeller = sIdx === sellerSubtotals.length - 1;

      let sellerCoupon = 0;
      if (eligibleSubtotal > 0 && totalDiscount > 0) {
        if (isLastSeller) {
          sellerCoupon = Math.max(
            0,
            CommissionService.roundMoney(totalDiscount - cumAllocatedSellerCoupon),
          );
        } else {
          const ratio = sSubtotal / eligibleSubtotal;
          sellerCoupon = CommissionService.roundMoney(totalDiscount * ratio);
          cumAllocatedSellerCoupon = CommissionService.roundMoney(
            cumAllocatedSellerCoupon + sellerCoupon,
          );
        }
      }

      sellerAllocations.push({
        sellerId: sId,
        sellerSubtotal: sSubtotal,
        allocatedCoupon: sellerCoupon,
        allocatedDiscount: sellerCoupon,
        fundingType,
      });

      let cumAllocatedItemCoupon = 0;
      for (let iIdx = 0; iIdx < sItems.length; iIdx++) {
        const item = sItems[iIdx];
        const isLastItem = iIdx === sItems.length - 1;
        const itemSubtotal = CommissionService.roundMoney(
          Number(item.total || Number(item.price) * Number(item.quantity)),
        );

        let itemCoupon = 0;
        if (sSubtotal > 0 && sellerCoupon > 0) {
          if (isLastItem) {
            itemCoupon = Math.max(
              0,
              CommissionService.roundMoney(sellerCoupon - cumAllocatedItemCoupon),
            );
          } else {
            const itemRatio = itemSubtotal / sSubtotal;
            itemCoupon = CommissionService.roundMoney(sellerCoupon * itemRatio);
            cumAllocatedItemCoupon = CommissionService.roundMoney(
              cumAllocatedItemCoupon + itemCoupon,
            );
          }
        }

        itemAllocations.push({
          productId: item.productId,
          shopId: sId,
          itemSubtotal,
          allocatedCoupon: itemCoupon,
          allocatedDiscount: itemCoupon,
          navyaCouponAmount: fundingType === 'NAVYA' ? itemCoupon : 0,
          sellerCouponAmount: fundingType === 'SELLER' ? itemCoupon : 0,
          fundingType,
        });
      }
    }

    // Account for sellers with 0 eligible items
    const allShopIds = Array.from(new Set(items.map((i) => i.shopId || 'default-shop')));
    for (const shpId of allShopIds) {
      if (!sellerAllocations.some((s) => s.sellerId === shpId)) {
        const sSub = CommissionService.roundMoney(
          items
            .filter((i) => (i.shopId || 'default-shop') === shpId)
            .reduce((sum, i) => sum + Number(i.total || Number(i.price) * Number(i.quantity)), 0),
        );
        sellerAllocations.push({
          sellerId: shpId,
          sellerSubtotal: sSub,
          allocatedCoupon: 0,
          allocatedDiscount: 0,
          fundingType,
        });
      }
    }

    return {
      totalDiscount,
      fundingType,
      shopId: shopId || null,
      sellerAllocations,
      itemAllocations,
    };
  }

  /**
   * Validates a coupon against business rules and calculates discount with seller & item allocations.
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

      // 2. Check Active Status & Deletion
      if (!coupon.isActive || coupon.deletedAt) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' is currently inactive.`,
          statusCode: 400,
        };
      }

      // 3. Check Date Validity Window (Start Date & Expiry)
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

      // 4. Seller / Shop Isolation (Section 27)
      let eligibleItems = items || [];
      if (coupon.shopId && items && items.length > 0) {
        eligibleItems = items.filter((item) => (item.shopId || '') === coupon.shopId);
        if (eligibleItems.length === 0) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' applies only to products from its specific boutique seller.`,
            statusCode: 400,
          };
        }
      }

      // 5. Category and Product Filtering (Section 28)
      if (items && items.length > 0) {
        const appCats = coupon.applicableCategories || [];
        const appProds = coupon.applicableProducts || [];
        const exclProds = coupon.excludedProducts || [];

        if (exclProds.length > 0) {
          eligibleItems = eligibleItems.filter((item) => !exclProds.includes(item.productId));
        }

        if (appCats.length > 0) {
          eligibleItems = eligibleItems.filter(
            (item) => item.categoryId && appCats.includes(item.categoryId),
          );
        }

        if (appProds.length > 0) {
          eligibleItems = eligibleItems.filter((item) => appProds.includes(item.productId));
        }

        if (eligibleItems.length === 0) {
          return {
            success: false,
            message: `Coupon '${cleanCode}' is not applicable to the items in your cart.`,
            statusCode: 400,
          };
        }
      }

      // Calculate eligible subtotal
      const eligibleCartAmount =
        items && items.length > 0
          ? CommissionService.roundMoney(
              eligibleItems.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
            )
          : cartAmount;

      // 6. Check Minimum Order Amount
      const minAmount = Number(coupon.minOrderAmount || 0);
      if (eligibleCartAmount < minAmount) {
        return {
          success: false,
          message: `Minimum order amount of ₹${minAmount.toLocaleString('en-IN')} required to use coupon '${cleanCode}'.`,
          statusCode: 400,
        };
      }

      // 7. Check Global Usage Limit
      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        (coupon.usedCount || 0) >= coupon.usageLimit
      ) {
        return {
          success: false,
          message: `Coupon code '${cleanCode}' has reached its maximum total usage limit.`,
          statusCode: 400,
        };
      }

      // 8. Check Per-User Usage Limit
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

      // 9. Calculate Discount
      const discountValueNum = Number(coupon.discountValue);
      const maxDiscountNum = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
      const discountAmount = this.calculateDiscountAmount(
        coupon.discountType,
        discountValueNum,
        eligibleCartAmount,
        maxDiscountNum,
      );

      const finalAmount = Math.max(0, cartAmount - discountAmount);

      // 10. Multi-Seller and Item Allocations
      const fundingType = (coupon.fundingType as CouponFundingType) || 'NAVYA';
      const allocation = this.allocateCoupon({
        discountAmount,
        fundingType,
        shopId: coupon.shopId,
        items: (items || []).map((i) => ({
          productId: i.productId,
          shopId: i.shopId || coupon.shopId || 'default-shop',
          price: i.price,
          quantity: i.quantity,
        })),
      });

      return {
        success: true,
        message: `Coupon '${cleanCode}' applied successfully! Saved ₹${discountAmount.toLocaleString('en-IN')}.`,
        statusCode: 200,
        data: {
          id: coupon.id,
          code: coupon.code,
          title:
            coupon.title ||
            `${discountValueNum}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
          description: coupon.description || null,
          fundingType,
          shopId: coupon.shopId || null,
          discountType: coupon.discountType,
          discountValue: discountValueNum,
          discountAmount,
          originalCartAmount: cartAmount,
          finalCartAmount: finalAmount,
          maxDiscount: maxDiscountNum,
          minOrderAmount: minAmount,
          sellerAllocations: allocation.sellerAllocations,
          itemAllocations: allocation.itemAllocations,
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
      const formatted = coupons.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title || null,
        description: c.description || null,
        fundingType: c.fundingType,
        shopId: c.shopId || null,
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
        applicableCategories: c.applicableCategories,
        applicableProducts: c.applicableProducts,
        excludedProducts: c.excludedProducts,
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
   * Seller: Retrieves all coupons belonging to a specific seller/shop.
   */
  static async getSellerCoupons(shopId: string): Promise<ServiceResponse> {
    try {
      const coupons = await CouponRepository.findByShopId(shopId);
      const formatted = coupons.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title || null,
        description: c.description || null,
        fundingType: c.fundingType,
        shopId: c.shopId,
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
        message: 'Seller coupons retrieved successfully.',
        statusCode: 200,
        data: formatted,
      };
    } catch (error: any) {
      console.error('[COUPON_SERVICE_SELLER_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve seller coupons.',
        statusCode: 500,
      };
    }
  }

  /**
   * Customer: Retrieves active public coupons.
   */
  static async getActiveCoupons(shopId?: string | null): Promise<ServiceResponse> {
    try {
      const coupons = await CouponRepository.findAllActive(shopId);
      const formatted = coupons.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title || `${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
        description: c.description,
        fundingType: c.fundingType,
        shopId: c.shopId,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderAmount: Number(c.minOrderAmount || 0),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        validUntil: c.validUntil.toISOString(),
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
