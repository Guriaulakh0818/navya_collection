import { CommissionService } from '../commission.service';

export type ShippingMethodCode = 'STANDARD' | 'EXPRESS' | 'SAME-DAY' | 'SAME_DAY';

export type FreeShippingSource =
  | 'STANDARD_THRESHOLD'
  | 'COD_THRESHOLD'
  | 'FIRST_ORDER'
  | 'NAVYA_PROMOTION'
  | 'SELLER_FUNDED'
  | 'SPECIAL_PRODUCT_RULE'
  | 'NONE';

export type ShippingCostBearer = 'NAVYA' | 'SELLER' | 'CUSTOMER' | 'NONE';

export type SpecialShippingMode =
  'STANDARD' | 'SPECIAL' | 'FREE' | 'SELLER_FUNDED' | 'NAVYA_FUNDED' | 'EXCLUDED';

export interface ShippingPromotionConfig {
  id?: string;
  title?: string;
  name?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | string;
  eligibleSellers?: string[];
  eligibleCategories?: string[];
  eligibleProducts?: string[];
  minSellerSubtotal?: number;
  maxSellerSubtotal?: number;
  paymentMethodEligibility?: 'ALL' | 'PREPAID' | 'COD' | string;
  pincodeEligibility?: string[];
  shippingMode?: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'SAME-DAY' | 'ALL' | string;
  applicableShippingModes?: string[];
  costBearer?: 'NAVYA' | 'SELLER';
  priority?: number;
  maxShippingSubsidy?: number;
}

export interface CustomerShippingItemInput {
  productId: string;
  variantId?: string | null;
  shopId?: string | null;
  price: number | string;
  quantity?: number;
  name?: string;
  sku?: string;
  weight?: number | string | null;
  weightUnit?: 'g' | 'kg' | string | null;
  specialShippingMode?: SpecialShippingMode | null;
  specialShippingRate?: number | string | null;
  categoryId?: string | null;
}

export interface SellerShippingBreakdown {
  shopId: string;
  sellerId: string;
  itemCount: number;
  sellerSubtotal: number;
  subtotal: number;
  threshold: number;
  thresholdUsed: number;
  isFreeShipping: boolean;
  freeShipping: boolean;
  baseShippingCharge: number;
  shippingCharge: number;
  freeShippingRemaining: number;
  taxRate: number;
  taxAmount: number;
  totalShippingAmount: number;
  reason?: string;
  freeShippingSource: FreeShippingSource;
  costBearer: ShippingCostBearer;
  isSellerFunded?: boolean;
  sellerFundedShippingCost?: number;
  promotionId?: string;
}

export interface CustomerShippingResult {
  totalCustomerShipping: number;
  totalShippingTax: number;
  finalShippingAmount: number;
  sellers: SellerShippingBreakdown[];
  sellerBreakdown: SellerShippingBreakdown[];
  isAllFreeShipping: boolean;
  isFreeShippingAcrossAllSellers: boolean;
  savedShippingAmount: number;
  totalSellerShipments: number;
  freeShipmentCount: number;
  paidShipmentCount: number;
  shippingMethodCode: 'STANDARD' | 'EXPRESS' | 'SAME-DAY';
  shippingMethodName: string;
  estimatedDeliveryDays: string;
  isFirstOrderFreeDelivery: boolean;
  promotionalDiscount: number;
  paymentMethod: 'PREPAID' | 'COD';
  totalSellerFundedShippingCost: number;
}

export interface WeightNormalizationResult {
  isValid: boolean;
  weightGrams: number;
  weightKg: number;
  error?: string;
}

export interface RtoSplitResult {
  totalCost: number;
  totalRtoCost: number;
  navyaShare: number;
  sellerShare: number;
}

export interface ShippingGstResult {
  shippingAmount: number;
  taxableAmount: number;
  taxableShippingAmount: number;
  taxRate: number;
  gstRate: number;
  taxAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  totalShippingWithTax: number;
}

export class CustomerShippingService {
  /**
   * Authoritative Business Thresholds (BM-05):
   * Prepaid: ₹999 per seller shipment
   * COD: ₹1,999 per seller shipment
   */
  public static readonly PREPAID_FREE_SHIPPING_THRESHOLD = 999.0;
  public static readonly COD_FREE_SHIPPING_THRESHOLD = 1999.0;
  public static readonly SELLER_FREE_SHIPPING_THRESHOLD = 999.0; // Backwards compatible alias

  /**
   * Authoritative Base Shipping Charges per method (BM-04 & BM-05)
   */
  public static readonly STANDARD_SHIPPING_CHARGE = 49.0;
  public static readonly EXPRESS_SHIPPING_CHARGE = 99.0;
  public static readonly SAME_DAY_SHIPPING_CHARGE = 149.0;
  public static readonly SAME_DAY_FREE_THRESHOLD = 1999.0; // Legacy constant reference

  /**
   * Default package parameters
   */
  public static readonly DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;
  public static readonly MAX_REASONABLE_WEIGHT_GRAMS = 50000; // 50 kg max for e-commerce apparel

  /**
   * Normalizes any input weight into canonical grams and Shiprocket kilograms.
   * Eliminates the bug where 500g is mistakenly treated as 500kg.
   *
   * Examples:
   * 500 g -> 500 grams, 0.5 kg
   * 1 kg -> 1000 grams, 1.0 kg
   * 1500 g -> 1500 grams, 1.5 kg
   * 2.5 kg -> 2500 grams, 2.5 kg
   */
  public static normalizeWeight(
    weightInput: number | string | null | undefined,
    explicitUnit?: string | null,
  ): WeightNormalizationResult {
    if (weightInput === undefined || weightInput === null || weightInput === '') {
      return {
        isValid: true,
        weightGrams: this.DEFAULT_PRODUCT_WEIGHT_GRAMS,
        weightKg: this.DEFAULT_PRODUCT_WEIGHT_GRAMS / 1000,
      };
    }

    let rawVal: number;
    let unit = (explicitUnit || '').trim().toLowerCase();

    if (typeof weightInput === 'string') {
      const trimmed = weightInput.trim().toLowerCase();
      if (trimmed.endsWith('kg')) {
        unit = 'kg';
        rawVal = parseFloat(trimmed.replace('kg', '').trim());
      } else if (trimmed.endsWith('g') || trimmed.endsWith('gm') || trimmed.endsWith('grams')) {
        unit = 'g';
        rawVal = parseFloat(trimmed.replace(/(g|gm|grams)/g, '').trim());
      } else {
        rawVal = parseFloat(trimmed);
      }
    } else {
      rawVal = Number(weightInput);
    }

    if (isNaN(rawVal) || rawVal <= 0) {
      return {
        isValid: false,
        weightGrams: this.DEFAULT_PRODUCT_WEIGHT_GRAMS,
        weightKg: this.DEFAULT_PRODUCT_WEIGHT_GRAMS / 1000,
        error: 'Product weight must be greater than zero.',
      };
    }

    let grams: number;
    if (unit === 'kg') {
      grams = Math.round(rawVal * 1000);
    } else if (unit === 'g') {
      grams = Math.round(rawVal);
    } else {
      // Heuristic unit inference when no unit specified:
      // If <= 20, the input was entered as kilograms (e.g. 0.5, 1, 2.5)
      // If > 20, the input was entered as grams (e.g. 250, 500, 1200)
      if (rawVal <= 20) {
        grams = Math.round(rawVal * 1000);
      } else {
        grams = Math.round(rawVal);
      }
    }

    if (grams > this.MAX_REASONABLE_WEIGHT_GRAMS) {
      return {
        isValid: false,
        weightGrams: grams,
        weightKg: grams / 1000,
        error: `Package weight exceeds maximum allowed limit (${this.MAX_REASONABLE_WEIGHT_GRAMS / 1000} kg).`,
      };
    }

    const weightKg = Math.max(0.1, Number((grams / 1000).toFixed(3)));

    return {
      isValid: true,
      weightGrams: grams,
      weightKg,
    };
  }

  /**
   * Calculates the 50/50 RTO loss allocation between Navya and Seller.
   *
   * RTO loss = 50% Navya + 50% Seller
   *
   * Examples:
   * ₹200 -> Navya ₹100, Seller ₹100
   * ₹501 -> Navya ₹250.50, Seller ₹250.50
   */
  public static calculateRtoSplit(eligibleRtoCost: number | string): RtoSplitResult {
    const rawCost =
      typeof eligibleRtoCost === 'string' ? parseFloat(eligibleRtoCost) : eligibleRtoCost;
    const cleanCost = CommissionService.roundMoney(Math.max(0, isNaN(rawCost) ? 0 : rawCost));

    if (cleanCost <= 0) {
      throw new Error(
        'Authoritative positive eligible RTO cost is required. Cannot guess financial amount.',
      );
    }

    const sellerShare = CommissionService.roundMoney(cleanCost * 0.5);
    const navyaShare = CommissionService.roundMoney(cleanCost - sellerShare);

    return {
      totalCost: cleanCost,
      totalRtoCost: cleanCost,
      navyaShare,
      sellerShare,
    };
  }

  /**
   * Calculates GST on customer shipping following configurable tax law.
   * Supports both object-based input and positional parameter overload.
   */
  public static calculateShippingGst(
    input:
      | {
          shippingAmount: number;
          gstRate?: number;
          isIntraState?: boolean;
          isGstApplicable?: boolean;
        }
      | number,
    isGstApplicableParam?: boolean,
    taxRateParam?: number,
  ): ShippingGstResult {
    let shippingAmount: number;
    let gstRate = 0;
    let isIntraState = false;
    let isGstApplicable = false;

    if (typeof input === 'object' && input !== null) {
      shippingAmount = input.shippingAmount;
      gstRate = input.gstRate ?? 0;
      isIntraState = Boolean(input.isIntraState);
      isGstApplicable = input.isGstApplicable !== undefined ? input.isGstApplicable : gstRate > 0;
    } else {
      shippingAmount = input;
      isGstApplicable = Boolean(isGstApplicableParam);
      gstRate = taxRateParam ?? 0;
    }

    const cleanShipping = CommissionService.roundMoney(Math.max(0, shippingAmount));
    if (!isGstApplicable || gstRate <= 0 || cleanShipping === 0) {
      return {
        shippingAmount: cleanShipping,
        taxableAmount: cleanShipping,
        taxableShippingAmount: cleanShipping,
        gstRate: 0,
        taxRate: 0,
        gstAmount: 0,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: cleanShipping,
        totalShippingWithTax: cleanShipping,
      };
    }

    const gstAmount = CommissionService.roundMoney((cleanShipping * gstRate) / 100);
    const totalAmount = CommissionService.roundMoney(cleanShipping + gstAmount);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstAmount = CommissionService.roundMoney(gstAmount / 2);
      sgstAmount = CommissionService.roundMoney(gstAmount - cgstAmount);
    } else {
      igstAmount = gstAmount;
    }

    return {
      shippingAmount: cleanShipping,
      taxableAmount: cleanShipping,
      taxableShippingAmount: cleanShipping,
      gstRate,
      taxRate: gstRate,
      gstAmount,
      taxAmount: gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      totalShippingWithTax: totalAmount,
    };
  }

  /**
   * ONE AUTHORITATIVE FREE SHIPPING DECISION ENGINE (BM-05).
   *
   * Final Business Rules:
   * 1. Free shipping is calculated PER SELLER, not on overall cart.
   * 2. Threshold is based on the seller's selling-price subtotal BEFORE coupon deduction.
   * 3. PREPAID STANDARD: Seller subtotal >= ₹999 -> FREE Standard shipping. (Threshold is inclusive).
   * 4. COD STANDARD: Seller subtotal >= ₹1,999 -> FREE Standard shipping. (Threshold is inclusive).
   * 5. MULTI-SELLER CART: Calculated independently for each seller.
   * 6. COUPON: Does NOT reduce free-shipping eligibility (pre-coupon subtotal is used).
   *    Coupon does NOT create free shipping for subtotal below threshold.
   *    One coupon maximum per order.
   * 7. FIRST ORDER: Standard shipping is FREE across all sellers, regardless of subtotal.
   *    Express and Same-Day remain PAID.
   * 8. EXPRESS & SAME-DAY: Always PAID unless an explicit promotion specifically covers them.
   * 9. SELLER-FUNDED SHIPPING: Seller can opt into sponsoring free shipping.
   *    Customer gets ₹0 shipping; seller bears applicable shipping charge.
   * 10. NAVYA PROMOTIONS: Configurable campaigns with explicit cost bearer (NAVYA/SELLER).
   * 11. SPECIAL PRODUCTS: Heavy/bulky/special products support configurable shipping modes:
   *     STANDARD, SPECIAL, FREE, SELLER_FUNDED, NAVYA_FUNDED, EXCLUDED.
   * 12. DETERMINISTIC PRIORITY HIERARCHY:
   *     Priority 1: Special product overrides (EXCLUDED paid override, SPECIAL rate, explicit FREE)
   *     Priority 2: First-order benefit (Free Standard shipping)
   *     Priority 3: Seller-funded free shipping (Sponsored by seller)
   *     Priority 4: Navya promotional campaigns
   *     Priority 5: Normal threshold (Prepaid >= ₹999, COD >= ₹1,999)
   *     Priority 6: Default paid standard shipping (₹49)
   * 13. AUDITABLE REASON & COST BEARER:
   *     Persists source: STANDARD_THRESHOLD, COD_THRESHOLD, FIRST_ORDER, NAVYA_PROMOTION,
   *     SELLER_FUNDED, SPECIAL_PRODUCT_RULE, NONE.
   *     Cost Bearer: NAVYA, SELLER, CUSTOMER, NONE.
   */
  public static async calculateMultiSellerShipping(
    userId: string,
    items: CustomerShippingItemInput[],
    options?: {
      customerAddressId?: string | null;
      shippingMethodCode?: string | null;
      paymentMethod?: string | null;
      isFirstOrder?: boolean;
    },
  ): Promise<CustomerShippingResult & { isServiceable?: boolean }> {
    const res = this.calculateCustomerShipping({
      items,
      shippingMethodCode: options?.shippingMethodCode || undefined,
      paymentMethod: options?.paymentMethod || undefined,
      isFirstOrder: options?.isFirstOrder,
    });
    return {
      ...res,
      isServiceable: true,
    };
  }

  public static calculateCustomerShipping(params: {
    items: CustomerShippingItemInput[];
    shippingMethodCode?: string;
    paymentMethod?: string;
    isFirstOrder?: boolean;
    isPromotionalFreeShipping?: boolean;
    promotions?: ShippingPromotionConfig[];
    sellerFundedShops?: string[] | Set<string>;
    sellerFundedFlags?: Record<string, boolean>;
    sellerFundedThresholds?: Record<string, number>;
    productSpecialShippingRules?: Record<
      string,
      { mode: SpecialShippingMode; specialRate?: number }
    >;
    destinationPincode?: string | null;
    isGstApplicable?: boolean;
    shippingGstRate?: number;
    couponCode?: string;
    couponDiscount?: number;
    allowSameDayThreshold?: boolean;
  }): CustomerShippingResult {
    const {
      items = [],
      shippingMethodCode = 'STANDARD',
      paymentMethod = 'PREPAID',
      isFirstOrder = false,
      isPromotionalFreeShipping = false,
      promotions = [],
      sellerFundedShops,
      sellerFundedFlags,
      sellerFundedThresholds,
      productSpecialShippingRules,
      destinationPincode = null,
      isGstApplicable = false,
      shippingGstRate = 0,
      allowSameDayThreshold = false,
    } = params;

    const normalizedPaymentMethod = (paymentMethod || 'PREPAID').toUpperCase().trim();
    const isCod = normalizedPaymentMethod === 'COD';
    const defaultThreshold = isCod
      ? this.COD_FREE_SHIPPING_THRESHOLD
      : this.PREPAID_FREE_SHIPPING_THRESHOLD;

    const normalizedMethod = (shippingMethodCode || 'STANDARD')
      .toUpperCase()
      .trim()
      .replace('_', '-');
    const isSameDay = normalizedMethod === 'SAME-DAY' || normalizedMethod === 'SAMEDAY';
    const isExpress = normalizedMethod === 'EXPRESS';
    const isStandard = !isSameDay && !isExpress;

    const methodCode: 'STANDARD' | 'EXPRESS' | 'SAME-DAY' = isSameDay
      ? 'SAME-DAY'
      : isExpress
        ? 'EXPRESS'
        : 'STANDARD';

    const methodName = isSameDay
      ? 'Same Day Delivery'
      : isExpress
        ? 'Express Delivery'
        : 'Standard Delivery';

    const estimatedDeliveryDays = isSameDay
      ? 'Same day'
      : isExpress
        ? '2-3 business days'
        : '3-5 business days';

    const baseCharge = isSameDay
      ? this.SAME_DAY_SHIPPING_CHARGE
      : isExpress
        ? this.EXPRESS_SHIPPING_CHARGE
        : this.STANDARD_SHIPPING_CHARGE;

    // Convert sellerFundedShops to Set for O(1) lookups
    const sellerFundedSet = new Set<string>();
    if (sellerFundedShops) {
      if (sellerFundedShops instanceof Set) {
        sellerFundedShops.forEach((s) => sellerFundedSet.add(s));
      } else if (Array.isArray(sellerFundedShops)) {
        sellerFundedShops.forEach((s) => sellerFundedSet.add(s));
      }
    }

    if (items.length === 0) {
      return {
        totalCustomerShipping: 0,
        totalShippingTax: 0,
        finalShippingAmount: 0,
        sellers: [],
        sellerBreakdown: [],
        isAllFreeShipping: true,
        isFreeShippingAcrossAllSellers: true,
        savedShippingAmount: 0,
        totalSellerShipments: 0,
        freeShipmentCount: 0,
        paidShipmentCount: 0,
        shippingMethodCode: methodCode,
        shippingMethodName: methodName,
        estimatedDeliveryDays,
        isFirstOrderFreeDelivery: false,
        promotionalDiscount: 0,
        paymentMethod: isCod ? 'COD' : 'PREPAID',
        totalSellerFundedShippingCost: 0,
      };
    }

    // 1. Group items strictly by seller (shopId)
    const shopItemsMap = new Map<string, CustomerShippingItemInput[]>();

    for (const item of items) {
      const sId = item.shopId || 'default-shop';
      if (!shopItemsMap.has(sId)) {
        shopItemsMap.set(sId, []);
      }
      shopItemsMap.get(sId)!.push(item);
    }

    // 2. Evaluate Each Seller Shipment Independently
    const sellers: SellerShippingBreakdown[] = [];
    let totalCustomerShipping = 0;
    let totalShippingTax = 0;
    let freeShipmentCount = 0;
    let paidShipmentCount = 0;
    let totalSavedShippingAmount = 0;
    let totalSellerFundedShippingCost = 0;

    const now = new Date();

    for (const [shopId, sItems] of Array.from(shopItemsMap.entries())) {
      if (productSpecialShippingRules) {
        for (const itm of sItems) {
          const rule = productSpecialShippingRules[itm.productId];
          if (rule) {
            itm.specialShippingMode = rule.mode;
            if (rule.specialRate !== undefined) {
              itm.specialShippingRate = rule.specialRate;
            }
          }
        }
      }

      // Selling-price subtotal BEFORE coupon deduction (Section 2, 7, 8, 10)
      const sellerSubtotal = CommissionService.roundMoney(
        sItems.reduce((sum, itm) => {
          const price = typeof itm.price === 'string' ? parseFloat(itm.price) : itm.price;
          const cleanPrice = isNaN(price) || price < 0 ? 0 : price;
          const qty = Math.max(1, Math.floor(itm.quantity || 1));
          return sum + cleanPrice * qty;
        }, 0),
      );

      const itemCount = sItems.reduce(
        (sum, itm) => sum + Math.max(1, Math.floor(itm.quantity || 1)),
        0,
      );

      let isFreeShipping = false;
      let effectiveShippingCharge = baseCharge;
      let freeShippingSource: FreeShippingSource = 'NONE';
      let costBearer: ShippingCostBearer = 'CUSTOMER';
      let isSellerFunded = false;
      let sellerFundedShippingCost = 0;
      let reason = '';
      let promotionId: string | undefined = undefined;

      // PREMIUM SHIPPING MODES: Express & Same-Day (BM-05 Section 20, 21)
      if (isExpress || isSameDay) {
        // Find explicit promotion covering Express / Same-Day
        const matchingPremiumPromo = promotions.find((p) => {
          const promoIsActive =
            p.isActive !== false && (p.status === undefined || p.status === 'ACTIVE');
          if (!promoIsActive) return false;
          if (p.startDate && new Date(p.startDate) > now) return false;
          if (p.endDate && new Date(p.endDate) < now) return false;
          const modes =
            p.applicableShippingModes?.map((m) => m.toUpperCase().replace('_', '-')) ||
            (p.shippingMode ? [p.shippingMode.toUpperCase().replace('_', '-')] : ['STANDARD']);
          if (!modes.includes('ALL') && !modes.includes(methodCode)) return false;
          if (
            p.eligibleSellers &&
            p.eligibleSellers.length > 0 &&
            !p.eligibleSellers.includes(shopId)
          )
            return false;
          if (
            p.minSellerSubtotal !== undefined &&
            p.minSellerSubtotal !== null &&
            sellerSubtotal < p.minSellerSubtotal
          )
            return false;
          if (
            p.maxSellerSubtotal !== undefined &&
            p.maxSellerSubtotal !== null &&
            sellerSubtotal > p.maxSellerSubtotal
          )
            return false;
          if (
            p.paymentMethodEligibility &&
            p.paymentMethodEligibility !== 'ALL' &&
            p.paymentMethodEligibility !== normalizedPaymentMethod
          )
            return false;
          return true;
        });

        if (matchingPremiumPromo) {
          isFreeShipping = true;
          effectiveShippingCharge = 0;
          freeShippingSource = 'NAVYA_PROMOTION';
          costBearer = matchingPremiumPromo.costBearer || 'NAVYA';
          promotionId = matchingPremiumPromo.id;
          reason =
            matchingPremiumPromo.title ||
            matchingPremiumPromo.name ||
            `Promotional free ${methodName} waiver`;
        } else if (allowSameDayThreshold && isSameDay && sellerSubtotal >= 1999.0) {
          // Legacy option compatibility if explicitly enabled
          isFreeShipping = true;
          effectiveShippingCharge = 0;
          freeShippingSource = 'STANDARD_THRESHOLD';
          costBearer = 'NAVYA';
          reason = 'Same-Day threshold waiver';
        } else {
          isFreeShipping = false;
          effectiveShippingCharge = baseCharge;
          freeShippingSource = 'NONE';
          costBearer = 'CUSTOMER';
          reason = `${methodName} is a paid service (₹${baseCharge})`;
        }
      } else {
        // STANDARD SHIPPING MODE — Deterministic Priority Hierarchy (BM-05 Section 18, 19)

        // PRIORITY 1: Special / High-Shipping-Cost Products
        const hasExcludedProduct = sItems.some((itm) => itm.specialShippingMode === 'EXCLUDED');
        const specialProduct = sItems.find((itm) => itm.specialShippingMode === 'SPECIAL');
        const allProductsSpecialFree =
          sItems.length > 0 &&
          sItems.every(
            (itm) =>
              itm.specialShippingMode === 'FREE' ||
              itm.specialShippingMode === 'SELLER_FUNDED' ||
              itm.specialShippingMode === 'NAVYA_FUNDED',
          );

        const isSellerFundedActive =
          sellerFundedSet.has(shopId) || Boolean(sellerFundedFlags?.[shopId]);
        const minSellerFundedThreshold = sellerFundedThresholds?.[shopId] ?? 0;

        if (hasExcludedProduct) {
          // Excluded product overrides free shipping benefits
          isFreeShipping = false;
          effectiveShippingCharge = baseCharge;
          freeShippingSource = 'SPECIAL_PRODUCT_RULE';
          costBearer = 'CUSTOMER';
          reason = 'Product is excluded from free shipping promotions';
        } else if (specialProduct) {
          // Special product shipping rate applies
          const customRate = Number(specialProduct.specialShippingRate ?? baseCharge);
          isFreeShipping = customRate === 0;
          effectiveShippingCharge = CommissionService.roundMoney(Math.max(0, customRate));
          freeShippingSource = 'SPECIAL_PRODUCT_RULE';
          costBearer = isFreeShipping ? 'NAVYA' : 'CUSTOMER';
          reason = `Special product shipping charge applied (₹${effectiveShippingCharge})`;
        } else if (allProductsSpecialFree) {
          isFreeShipping = true;
          effectiveShippingCharge = 0;
          freeShippingSource = 'SPECIAL_PRODUCT_RULE';
          const hasSellerFundedProd = sItems.some(
            (itm) => itm.specialShippingMode === 'SELLER_FUNDED',
          );
          costBearer = hasSellerFundedProd ? 'SELLER' : 'NAVYA';
          if (costBearer === 'SELLER') {
            isSellerFunded = true;
            sellerFundedShippingCost = baseCharge;
          }
          reason = 'Special product free shipping rule applied';
        }
        // PRIORITY 2: First-Order Free Shipping (Section 11, 12)
        else if (isFirstOrder) {
          isFreeShipping = true;
          effectiveShippingCharge = 0;
          freeShippingSource = 'FIRST_ORDER';
          costBearer = 'NAVYA';
          reason = 'First order benefit: Free Standard delivery 🎉';
        }
        // PRIORITY 3: Seller-Funded Free Shipping (Section 16, 37)
        else if (isSellerFundedActive && sellerSubtotal >= minSellerFundedThreshold) {
          if (sellerSubtotal < defaultThreshold) {
            isFreeShipping = true;
            effectiveShippingCharge = 0;
            freeShippingSource = 'SELLER_FUNDED';
            costBearer = 'SELLER';
            isSellerFunded = true;
            sellerFundedShippingCost = baseCharge;
            reason = 'Seller-funded free shipping sponsored by seller';
          } else {
            // Already meets platform free threshold, so Navya bears cost
            isFreeShipping = true;
            effectiveShippingCharge = 0;
            freeShippingSource = isCod ? 'COD_THRESHOLD' : 'STANDARD_THRESHOLD';
            costBearer = 'NAVYA';
            reason = isCod
              ? `Seller shipment >= ₹${defaultThreshold} (COD)`
              : `Seller shipment >= ₹${defaultThreshold} (Prepaid)`;
          }
        }
        // PRIORITY 4: Navya Promotional Free Shipping (Section 13, 14, 15)
        else {
          const matchingPromo = promotions.find((p) => {
            const promoIsActive =
              p.isActive !== false && (p.status === undefined || p.status === 'ACTIVE');
            if (!promoIsActive) return false;
            if (p.startDate && new Date(p.startDate) > now) return false;
            if (p.endDate && new Date(p.endDate) < now) return false;
            const modes =
              p.applicableShippingModes?.map((m) => m.toUpperCase().replace('_', '-')) ||
              (p.shippingMode ? [p.shippingMode.toUpperCase().replace('_', '-')] : ['STANDARD']);
            if (!modes.includes('ALL') && !modes.includes('STANDARD')) return false;
            if (
              p.eligibleSellers &&
              p.eligibleSellers.length > 0 &&
              !p.eligibleSellers.includes(shopId)
            )
              return false;
            if (
              p.minSellerSubtotal !== undefined &&
              p.minSellerSubtotal !== null &&
              sellerSubtotal < p.minSellerSubtotal
            )
              return false;
            if (
              p.maxSellerSubtotal !== undefined &&
              p.maxSellerSubtotal !== null &&
              sellerSubtotal > p.maxSellerSubtotal
            )
              return false;
            if (
              p.paymentMethodEligibility &&
              p.paymentMethodEligibility !== 'ALL' &&
              p.paymentMethodEligibility !== normalizedPaymentMethod
            )
              return false;
            return true;
          });

          if (matchingPromo) {
            isFreeShipping = true;
            effectiveShippingCharge = 0;
            freeShippingSource = 'NAVYA_PROMOTION';
            costBearer = matchingPromo.costBearer || 'NAVYA';
            promotionId = matchingPromo.id;
            reason =
              matchingPromo.title || matchingPromo.name || 'Promotional free shipping waiver';
          } else if (isPromotionalFreeShipping) {
            isFreeShipping = true;
            effectiveShippingCharge = 0;
            freeShippingSource = 'NAVYA_PROMOTION';
            costBearer = 'NAVYA';
            reason = 'Promotional free shipping waiver';
          }
          // PRIORITY 5: Normal Payment Method Threshold (Section 3, 4)
          else if (sellerSubtotal >= defaultThreshold) {
            isFreeShipping = true;
            effectiveShippingCharge = 0;
            freeShippingSource = isCod ? 'COD_THRESHOLD' : 'STANDARD_THRESHOLD';
            costBearer = 'NAVYA';
            reason = isCod
              ? `Seller shipment >= ₹${defaultThreshold} (COD)`
              : `Seller shipment >= ₹${defaultThreshold} (Prepaid)`;
          }
          // PRIORITY 6: Standard Paid Shipping
          else {
            isFreeShipping = false;
            effectiveShippingCharge = baseCharge;
            freeShippingSource = 'NONE';
            costBearer = 'CUSTOMER';
            reason = isCod
              ? `Seller shipment < ₹${defaultThreshold} (COD)`
              : `Seller shipment < ₹${defaultThreshold} (Prepaid)`;
          }
        }
      }

      const freeShippingRemaining = isFreeShipping
        ? 0
        : Math.max(0, CommissionService.roundMoney(defaultThreshold - sellerSubtotal));

      // Calculate optional GST on this seller's shipping charge
      const gst = this.calculateShippingGst(
        effectiveShippingCharge,
        isGstApplicable,
        shippingGstRate,
      );

      if (isFreeShipping) {
        freeShipmentCount++;
        totalSavedShippingAmount = CommissionService.roundMoney(
          totalSavedShippingAmount + baseCharge,
        );
      } else {
        paidShipmentCount++;
      }

      if (isSellerFunded) {
        totalSellerFundedShippingCost = CommissionService.roundMoney(
          totalSellerFundedShippingCost + sellerFundedShippingCost,
        );
      }

      totalCustomerShipping = CommissionService.roundMoney(
        totalCustomerShipping + effectiveShippingCharge,
      );
      totalShippingTax = CommissionService.roundMoney(totalShippingTax + gst.taxAmount);

      sellers.push({
        shopId,
        sellerId: shopId,
        itemCount,
        sellerSubtotal,
        subtotal: sellerSubtotal,
        threshold: defaultThreshold,
        thresholdUsed: defaultThreshold,
        isFreeShipping,
        freeShipping: isFreeShipping,
        baseShippingCharge: baseCharge,
        shippingCharge: effectiveShippingCharge,
        freeShippingRemaining,
        taxRate: gst.taxRate,
        taxAmount: gst.taxAmount,
        totalShippingAmount: gst.totalAmount,
        reason,
        freeShippingSource,
        costBearer,
        isSellerFunded,
        sellerFundedShippingCost,
        promotionId,
      });
    }

    const finalShippingAmount = CommissionService.roundMoney(
      totalCustomerShipping + totalShippingTax,
    );
    const isAllFreeShipping = finalShippingAmount === 0;

    return {
      totalCustomerShipping,
      totalShippingTax,
      finalShippingAmount,
      sellers,
      sellerBreakdown: sellers,
      isAllFreeShipping,
      isFreeShippingAcrossAllSellers: isAllFreeShipping,
      savedShippingAmount: totalSavedShippingAmount,
      totalSellerShipments: sellers.length,
      freeShipmentCount,
      paidShipmentCount,
      shippingMethodCode: methodCode,
      shippingMethodName: methodName,
      estimatedDeliveryDays,
      isFirstOrderFreeDelivery: isFirstOrder && isAllFreeShipping,
      promotionalDiscount: totalSavedShippingAmount,
      paymentMethod: isCod ? 'COD' : 'PREPAID',
      totalSellerFundedShippingCost,
    };
  }
}
