/**
 * NAVYA COLLECTION — CENTRALIZED SELLER COMMISSION ENGINE (BM-02)
 *
 * AUTHORITATIVE BUSINESS RULES (BM-02 Specification):
 * - Navya Collection charges a 10% commission on the product MRP.
 * - The commission base is the MRP of each product/item, not the discounted selling price.
 * - Formula:
 *     Navya Commission Base = Product MRP
 *     Navya Commission = Product MRP * 10%
 * - Seller discount does NOT reduce Navya's commission.
 * - Customer shipping does NOT increase Navya's commission.
 * - Navya-funded coupons do NOT reduce Navya's commission.
 * - GST does NOT increase Navya's commission (GST and commission engines remain separate).
 * - GST-registered and unregistered sellers follow the exact same commission base (MRP * 10%).
 * - Safe monetary precision: Uses deterministic integer paise arithmetic.
 * - Commission is calculated and stored immutably at item & seller level.
 */

export interface PricingValidationResult {
  isValid: boolean;
  error?: string;
  code?:
    | 'INVALID_MRP'
    | 'SELLING_EXCEEDS_MRP'
    | 'NEGATIVE_PRICE'
    | 'NEGATIVE_MRP'
    | 'INVALID_COMMISSION_RATE'
    | 'EXCEEDS_MAX_DISCOUNT';
  normalMinimumSellingPrice?: number;
  psychologicalMinimumSellingPrice?: number;
}

export interface DiscountBreakdown {
  mrp: number;
  sellingPrice: number;
  discountAmount: number;
  discountPercentage: number;
  discountPercent: number;
  displayDiscountPercent: number;
}

export interface ItemCommissionInput {
  productId?: string;
  sellerId?: string;
  mrp: number | string;
  sellingPrice?: number | string;
  quantity?: number;
  commissionRate?: number;
  taxRate?: number;
  taxAmount?: number;
  navyaCouponAmount?: number;
  customerShippingAmount?: number;
  sellerGstStatus?: 'REGISTERED' | 'UNREGISTERED' | string;
  sellerGstin?: string | null;
}

export interface ItemCommissionResult {
  productId?: string;
  sellerId?: string;
  mrp: number;
  sellingPrice: number;
  quantity: number;
  sellerDiscountAmount: number;
  sellerDiscountPercentage: number;
  commissionRate: number;
  commissionBaseAmount: number;
  commissionAmount: number;
  taxRate: number;
  taxAmount: number;
  navyaCouponAmount: number;
  customerShippingAmount: number;
  sellerGstStatus: string;
  sellerGstin: string | null;
  commissionCalculationVersion: string;
  // BM-03 Authoritative Payout Breakdown
  sellerBasePayout: number; // Selling Price Subtotal - Commission Amount
  sellerGstAmount: number; // Applicable GST (only added if seller is GST-registered)
  sellerTotalPayout: number; // sellerBasePayout + sellerGstAmount
  applicableGstRate: number;
  netSellerPayout: number; // Authoritative net seller payout (= sellerTotalPayout)
  // Legacy compatibility fields
  itemTotal: number;
  sellerEarnings: number;
}

export interface CommissionCalculationResult {
  grossProductValue: number;
  totalMrp: number;
  commissionRate: number;
  commissionAmount: number;
  netSellerPayout: number;
  sellerBasePayout?: number;
  sellerGstAmount?: number;
  sellerTotalPayout?: number;
  totalCommissionAmount?: number;
  totalSellerBasePayout?: number;
  totalSellerPayout?: number;
  items?: ItemCommissionResult[];
  // Legacy compatibility fields
  grossAmount: number;
  percentageFee: number;
  flatFee: number;
  totalCommission: number;
  sellerBreakdown?: Map<
    string,
    {
      sellerId: string;
      sellerGstStatus: string;
      totalMrp: number;
      sellingSubtotal: number;
      commissionAmount: number;
      sellerBasePayout: number;
      sellerGstAmount: number;
      sellerTotalPayout: number;
      netSellerPayout: number;
    }
  >;
}

export class CommissionService {
  /**
   * Fixed platform seller commission rate: 10%
   */
  public static readonly COMMISSION_RATE_PERCENT = 10.0;
  public static readonly COMMISSION_RATE_DECIMAL = 0.1;

  /**
   * Maximum standard allowed discount percentage from MRP: 70%
   */
  public static readonly MAXIMUM_NORMAL_DISCOUNT_PERCENT = 70.0;

  /**
   * Psychological pricing allowance below the 70% threshold: exactly ₹1.00
   */
  public static readonly PSYCHOLOGICAL_DISCOUNT_ALLOWANCE = 1.0;

  /**
   * Authoritative calculation version snapshot for immutable audit records
   */
  public static readonly COMMISSION_CALCULATION_VERSION = 'BM-02-MRP-V1';

  /**
   * Safely rounds a currency value to 2 decimal places using paise (integer cents).
   * Prevents IEEE 754 floating point arithmetic issues like 0.1 + 0.2 !== 0.3.
   */
  public static roundMoney(amount: number | string): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.round((num + 1e-9) * 100) / 100;
  }

  /**
   * Helper to compute seller base payout: Selling Price - Navya MRP Commission.
   */
  public static calculateSellerPayout(sellingPrice: number, mrp: number): number {
    const commission = this.calculateCommission(mrp);
    return this.roundMoney(Math.max(0, sellingPrice - commission));
  }

  /**
   * Computes authoritative pricing floors per BM-02 Final Discount Policy:
   * - 70% Discount Price (normalMinimumSellingPrice) = MRP * 30%
   * - Psychological Pricing Floor (psychologicalMinimumSellingPrice) = normalMinimumSellingPrice - ₹1
   *
   * Example: MRP ₹1,500
   * - 70% Discount Price = ₹450
   * - Psychological Floor = ₹449
   * - ₹450 -> PASS
   * - ₹449 -> PASS
   * - ₹448 -> FAIL
   */
  public static calculatePricingFloors(mrp: number | string): {
    normalMinimumSellingPrice: number;
    psychologicalMinimumSellingPrice: number;
    maxDiscountPercent: number;
    psychologicalDiscountPercent: number;
  } {
    const cleanMrp = this.roundMoney(Math.max(0, typeof mrp === 'string' ? parseFloat(mrp) : mrp));
    if (cleanMrp <= 0) {
      return {
        normalMinimumSellingPrice: 0,
        psychologicalMinimumSellingPrice: 0,
        maxDiscountPercent: this.MAXIMUM_NORMAL_DISCOUNT_PERCENT,
        psychologicalDiscountPercent: this.MAXIMUM_NORMAL_DISCOUNT_PERCENT,
      };
    }

    // normalMinimumSellingPrice = MRP * 30% (using integer paise precision)
    const mrpPaise = Math.round(cleanMrp * 100);
    const normalMinPaise = Math.round(mrpPaise * 0.3);
    const normalMinimumSellingPrice = normalMinPaise / 100;

    // psychologicalMinimumSellingPrice = normalMinimumSellingPrice - ₹1.00
    const psychologicalMinimumSellingPrice = this.roundMoney(
      Math.max(0, normalMinimumSellingPrice - this.PSYCHOLOGICAL_DISCOUNT_ALLOWANCE),
    );

    const maxDiscountPercent = this.MAXIMUM_NORMAL_DISCOUNT_PERCENT;
    const psychologicalDiscountPercent =
      cleanMrp > 0
        ? this.roundMoney(((cleanMrp - psychologicalMinimumSellingPrice) / cleanMrp) * 100)
        : 70.0;

    return {
      normalMinimumSellingPrice,
      psychologicalMinimumSellingPrice,
      maxDiscountPercent,
      psychologicalDiscountPercent,
    };
  }

  /**
   * Validates product pricing per Section 2, Section 10, and Final Discount Policy of BM-02:
   * - MRP > 0
   * - Selling Price > 0
   * - Selling Price <= MRP
   * - Selling Price >= Psychological Minimum Selling Price (MRP * 30% - ₹1)
   * - Commission Rate between 0 and 100
   */
  public static validatePricing(
    paramsOrMrp:
      | number
      | string
      | {
          mrp: number | string;
          sellingPrice?: number | string;
          commissionRate?: number;
        },
    optionalSellingPrice?: number | string,
  ): PricingValidationResult {
    let params: {
      mrp: number | string;
      sellingPrice?: number | string;
      commissionRate?: number;
    };

    if (typeof paramsOrMrp === 'object' && paramsOrMrp !== null) {
      params = paramsOrMrp;
    } else {
      params = {
        mrp: paramsOrMrp,
        sellingPrice: optionalSellingPrice,
      };
    }
    const rawMrp = typeof params.mrp === 'string' ? parseFloat(params.mrp) : params.mrp;
    if (isNaN(rawMrp) || rawMrp === 0) {
      return {
        isValid: false,
        error: 'MRP must be greater than 0',
        code: 'INVALID_MRP',
      };
    }
    if (rawMrp < 0) {
      return {
        isValid: false,
        error: 'MRP cannot be negative',
        code: 'NEGATIVE_MRP',
      };
    }

    const floors = this.calculatePricingFloors(rawMrp);

    if (params.sellingPrice !== undefined) {
      const rawSelling =
        typeof params.sellingPrice === 'string'
          ? parseFloat(params.sellingPrice)
          : params.sellingPrice;
      if (isNaN(rawSelling) || rawSelling < 0) {
        return {
          isValid: false,
          error: 'Selling price cannot be negative',
          code: 'NEGATIVE_PRICE',
          normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
          psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
        };
      }
      if (rawSelling === 0) {
        return {
          isValid: false,
          error: 'Selling price must be greater than 0',
          code: 'NEGATIVE_PRICE',
          normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
          psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
        };
      }
      if (rawSelling > rawMrp) {
        return {
          isValid: false,
          error: `Selling price (₹${rawSelling}) cannot exceed MRP (₹${rawMrp})`,
          code: 'SELLING_EXCEEDS_MRP',
          normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
          psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
        };
      }

      // Final Discount Policy:
      // Selling price must not fall below psychologicalMinimumSellingPrice (70% discount price - ₹1)
      if (this.roundMoney(rawSelling) < floors.psychologicalMinimumSellingPrice) {
        return {
          isValid: false,
          error: `Selling price (₹${rawSelling}) exceeds maximum allowed discount (70% limit with ₹1 psychological floor is ₹${floors.psychologicalMinimumSellingPrice})`,
          code: 'EXCEEDS_MAX_DISCOUNT',
          normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
          psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
        };
      }
    }

    if (params.commissionRate !== undefined) {
      const rawRate = Number(params.commissionRate);
      if (isNaN(rawRate) || rawRate < 0 || rawRate > 100) {
        return {
          isValid: false,
          error: 'Commission rate must be between 0% and 100%',
          code: 'INVALID_COMMISSION_RATE',
          normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
          psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
        };
      }
    }

    return {
      isValid: true,
      normalMinimumSellingPrice: floors.normalMinimumSellingPrice,
      psychologicalMinimumSellingPrice: floors.psychologicalMinimumSellingPrice,
    };
  }

  /**
   * Computes customer-visible discounting per Section 2 of BM-02:
   * - Discount Amount = MRP − Selling Price
   * - Discount % = ((MRP − Selling Price) / MRP) * 100
   */
  public static calculateDiscount(
    mrp: number | string,
    sellingPrice: number | string,
  ): DiscountBreakdown {
    const numMrp = this.roundMoney(mrp);
    const numSelling = this.roundMoney(sellingPrice);

    if (numMrp <= 0 || numSelling <= 0 || numSelling > numMrp) {
      return {
        mrp: numMrp,
        sellingPrice: numSelling,
        discountAmount: 0,
        discountPercentage: 0,
        discountPercent: 0,
        displayDiscountPercent: 0,
      };
    }

    const discountAmount = this.roundMoney(numMrp - numSelling);
    const rawPct = ((numMrp - numSelling) / numMrp) * 100;
    const discountPercentage = this.roundMoney(rawPct);
    const discountPercent = rawPct;
    const displayDiscountPercent = Math.round(rawPct);

    return {
      mrp: numMrp,
      sellingPrice: numSelling,
      discountAmount,
      discountPercentage,
      discountPercent,
      displayDiscountPercent,
    };
  }

  /**
   * Calculates platform commission on a product MRP (Section 1, 3, 11, 17):
   * Commission = product_mrp * 10%
   *
   * Money-safe integer paise arithmetic with zero IEEE 754 drift.
   *
   * Examples:
   * ₹1,000    -> ₹100.00
   * ₹1,500    -> ₹150.00
   * ₹2,000    -> ₹200.00
   * ₹999.99   -> ₹100.00 (deterministic paise rounding)
   * ₹1,234.56 -> ₹123.46
   * ₹0.01     -> ₹0.00
   * ₹10,000.01-> ₹1,000.00
   *
   * NEVER includes customer shipping, GST, coupons, or seller discounts.
   */
  public static calculateCommission(
    mrp: number | string,
    commissionRate: number = this.COMMISSION_RATE_PERCENT,
  ): number {
    const cleanMrp = typeof mrp === 'string' ? parseFloat(mrp) : mrp;
    if (isNaN(cleanMrp) || cleanMrp <= 0) return 0;

    const rate = commissionRate !== undefined ? commissionRate : this.COMMISSION_RATE_PERCENT;
    if (rate <= 0) return 0;

    // Convert to integer paise, calculate commission with rate decimal, round to nearest paisa
    const paise = Math.round(cleanMrp * 100);
    const rateDecimal = rate / 100;
    const commissionPaise = Math.round(paise * rateDecimal);
    return commissionPaise / 100;
  }

  /**
   * Calculates item-level commission snapshot per Section 12 & Section 18 of BM-02.
   * Preserves all immutable audit fields for order placement and settlement.
   *
   * Overloaded to maintain full backward compatibility with legacy (price, quantity) callers.
   */
  public static calculateItemCommission(
    inputOrPrice: ItemCommissionInput | number | string,
    legacyQuantity?: number,
  ): ItemCommissionResult {
    if (typeof inputOrPrice === 'number' || typeof inputOrPrice === 'string') {
      const price = typeof inputOrPrice === 'string' ? parseFloat(inputOrPrice) : inputOrPrice;
      const qty = Math.max(1, Math.floor(legacyQuantity || 1));
      const mrp = Math.max(0, price);
      const sellingPrice = mrp;
      const commissionBaseAmount = this.roundMoney(mrp * qty);
      const commissionAmount = this.calculateCommission(commissionBaseAmount);
      const netSellerPayout = this.roundMoney(Math.max(0, sellingPrice * qty - commissionAmount));

      return {
        mrp,
        sellingPrice,
        quantity: qty,
        sellerDiscountAmount: 0,
        sellerDiscountPercentage: 0,
        commissionRate: this.COMMISSION_RATE_PERCENT,
        commissionBaseAmount,
        commissionAmount,
        taxRate: 0,
        taxAmount: 0,
        navyaCouponAmount: 0,
        customerShippingAmount: 0,
        sellerGstStatus: 'UNREGISTERED',
        sellerGstin: null,
        commissionCalculationVersion: 'BM-03-MRP-V1',
        sellerBasePayout: netSellerPayout,
        sellerGstAmount: 0,
        sellerTotalPayout: netSellerPayout,
        applicableGstRate: 0,
        netSellerPayout,
        itemTotal: this.roundMoney(sellingPrice * qty),
        sellerEarnings: netSellerPayout,
      };
    }

    const input = inputOrPrice;
    const qty = Math.max(1, Math.floor(input.quantity || 1));
    const mrp = this.roundMoney(
      Math.max(0, typeof input.mrp === 'string' ? parseFloat(input.mrp) : input.mrp),
    );
    const sellingPrice =
      input.sellingPrice !== undefined
        ? this.roundMoney(
            Math.max(
              0,
              typeof input.sellingPrice === 'string'
                ? parseFloat(input.sellingPrice)
                : input.sellingPrice,
            ),
          )
        : mrp;

    const discountInfo = this.calculateDiscount(mrp, sellingPrice);
    const commissionRate =
      input.commissionRate !== undefined ? input.commissionRate : this.COMMISSION_RATE_PERCENT;

    const commissionBaseAmount = this.roundMoney(mrp * qty);
    const commissionAmount = this.calculateCommission(commissionBaseAmount, commissionRate);

    const sellingSubtotal = this.roundMoney(sellingPrice * qty);

    // BM-03: Seller Base Payout = Selling Price Subtotal - Navya Commission (MRP * 10%)
    const sellerBasePayout = this.roundMoney(Math.max(0, sellingSubtotal - commissionAmount));

    const sellerGstStatus =
      input.sellerGstStatus || (input.sellerGstin ? 'REGISTERED' : 'UNREGISTERED');
    const isRegistered = sellerGstStatus === 'REGISTERED';
    const applicableGstRate = input.taxRate !== undefined ? Number(input.taxRate) : 0;
    const applicableGstAmount =
      input.taxAmount !== undefined
        ? this.roundMoney(input.taxAmount)
        : this.roundMoney(sellingSubtotal * (applicableGstRate / 100));

    // BM-03: If seller is GST registered: Seller Total Payout = Seller Base Payout + Applicable GST
    // If seller is UNREGISTERED: Seller Total Payout = Seller Base Payout (No GST added)
    const sellerGstAmount = isRegistered ? applicableGstAmount : 0;
    const sellerTotalPayout = this.roundMoney(sellerBasePayout + sellerGstAmount);

    return {
      productId: input.productId,
      sellerId: input.sellerId,
      mrp,
      sellingPrice,
      quantity: qty,
      sellerDiscountAmount: this.roundMoney(discountInfo.discountAmount * qty),
      sellerDiscountPercentage: discountInfo.discountPercentage,
      commissionRate,
      commissionBaseAmount,
      commissionAmount,
      taxRate: applicableGstRate,
      taxAmount: applicableGstAmount,
      navyaCouponAmount: this.roundMoney(input.navyaCouponAmount || 0),
      customerShippingAmount: this.roundMoney(input.customerShippingAmount || 0),
      sellerGstStatus,
      sellerGstin: input.sellerGstin || null,
      commissionCalculationVersion: 'BM-03-MRP-V1',
      sellerBasePayout,
      sellerGstAmount,
      sellerTotalPayout,
      applicableGstRate,
      netSellerPayout: sellerTotalPayout,
      itemTotal: sellingSubtotal,
      sellerEarnings: sellerTotalPayout,
    };
  }

  /**
   * Computes seller order commission and base payout (Section 1, 11, 12, 13).
   * Supports:
   * - Single number/string input (treated as product MRP).
   * - Complex multi-item and multi-seller orders.
   *
   * Formula:
   *   Commission Base = Sum of item MRPs
   *   Commission Amount = Sum of item commissions
   *   Net Seller Payout = Selling Subtotal - Commission Amount
   */
  public static calculateOrderCommission(
    input:
      | number
      | string
      | {
          items?: ItemCommissionInput[];
          mrp?: number | string;
          sellingPrice?: number | string;
          grossProductValue?: number | string;
          commissionRateOverride?: number;
          categoryId?: string;
          shopId?: string;
        },
    legacyOptions?: { categoryId?: string; shopId?: string; commissionRateOverride?: number },
  ): CommissionCalculationResult {
    // Case 1: Simple numeric / string input (legacy or single benchmark price)
    if (typeof input === 'number' || typeof input === 'string') {
      const mrp = this.roundMoney(
        Math.max(0, typeof input === 'string' ? parseFloat(input) : input),
      );
      const ratePercent =
        legacyOptions?.commissionRateOverride !== undefined
          ? legacyOptions.commissionRateOverride
          : this.COMMISSION_RATE_PERCENT;

      const commissionAmount = this.calculateCommission(mrp, ratePercent);
      const grossProductValue = mrp;
      const netSellerPayout = this.roundMoney(Math.max(0, grossProductValue - commissionAmount));

      return {
        grossProductValue,
        totalMrp: mrp,
        commissionRate: ratePercent,
        commissionAmount,
        netSellerPayout,
        grossAmount: grossProductValue,
        percentageFee: commissionAmount,
        flatFee: 0,
        totalCommission: commissionAmount,
      };
    }

    // Case 2: Object with explicit items array (Multi-item & Multi-seller)
    if (input.items && input.items.length > 0) {
      let totalMrp = 0;
      let totalSellingPrice = 0;
      let totalCommission = 0;
      let totalSellerBasePayout = 0;
      let totalSellerGstAmount = 0;
      let totalSellerTotalPayout = 0;
      const sellerMap = new Map<
        string,
        {
          sellerId: string;
          sellerGstStatus: string;
          totalMrp: number;
          sellingSubtotal: number;
          commissionAmount: number;
          sellerBasePayout: number;
          sellerGstAmount: number;
          sellerTotalPayout: number;
          netSellerPayout: number;
        }
      >();

      const itemResults: ItemCommissionResult[] = [];

      for (const item of input.items) {
        const itemResult = this.calculateItemCommission({
          ...item,
          commissionRate: input.commissionRateOverride ?? item.commissionRate,
        });

        itemResults.push(itemResult);

        totalMrp = this.roundMoney(totalMrp + itemResult.commissionBaseAmount);
        totalSellingPrice = this.roundMoney(
          totalSellingPrice + itemResult.sellingPrice * itemResult.quantity,
        );
        totalCommission = this.roundMoney(totalCommission + itemResult.commissionAmount);
        totalSellerBasePayout = this.roundMoney(
          totalSellerBasePayout + itemResult.sellerBasePayout,
        );
        totalSellerGstAmount = this.roundMoney(totalSellerGstAmount + itemResult.sellerGstAmount);
        totalSellerTotalPayout = this.roundMoney(
          totalSellerTotalPayout + itemResult.sellerTotalPayout,
        );

        const sellerKey = item.sellerId || input.shopId || 'DEFAULT_SELLER';
        const currentSeller = sellerMap.get(sellerKey) || {
          sellerId: sellerKey,
          sellerGstStatus: itemResult.sellerGstStatus,
          totalMrp: 0,
          sellingSubtotal: 0,
          commissionAmount: 0,
          sellerBasePayout: 0,
          sellerGstAmount: 0,
          sellerTotalPayout: 0,
          netSellerPayout: 0,
        };

        currentSeller.sellerGstStatus = itemResult.sellerGstStatus;
        currentSeller.totalMrp = this.roundMoney(
          currentSeller.totalMrp + itemResult.commissionBaseAmount,
        );
        currentSeller.sellingSubtotal = this.roundMoney(
          currentSeller.sellingSubtotal + itemResult.sellingPrice * itemResult.quantity,
        );
        currentSeller.commissionAmount = this.roundMoney(
          currentSeller.commissionAmount + itemResult.commissionAmount,
        );
        currentSeller.sellerBasePayout = this.roundMoney(
          currentSeller.sellerBasePayout + itemResult.sellerBasePayout,
        );
        currentSeller.sellerGstAmount = this.roundMoney(
          currentSeller.sellerGstAmount + itemResult.sellerGstAmount,
        );
        currentSeller.sellerTotalPayout = this.roundMoney(
          currentSeller.sellerTotalPayout + itemResult.sellerTotalPayout,
        );
        currentSeller.netSellerPayout = currentSeller.sellerTotalPayout;
        sellerMap.set(sellerKey, currentSeller);
      }

      sellerMap.forEach((val, key) => {
        (sellerMap as any)[key] = val;
      });

      return {
        grossProductValue: totalSellingPrice,
        totalMrp,
        commissionRate: input.commissionRateOverride ?? this.COMMISSION_RATE_PERCENT,
        commissionAmount: totalCommission,
        sellerBasePayout: totalSellerBasePayout,
        sellerGstAmount: totalSellerGstAmount,
        sellerTotalPayout: totalSellerTotalPayout,
        netSellerPayout: totalSellerTotalPayout,
        totalCommissionAmount: totalCommission,
        totalSellerBasePayout,
        totalSellerPayout: totalSellerTotalPayout,
        grossAmount: totalSellingPrice,
        percentageFee: totalCommission,
        flatFee: 0,
        totalCommission,
        items: itemResults,
        sellerBreakdown: sellerMap,
      };
    }

    // Case 3: Object with mrp and optional sellingPrice
    const mrp = this.roundMoney(Math.max(0, Number(input.mrp ?? input.grossProductValue ?? 0)));
    const sellingPrice =
      input.sellingPrice !== undefined
        ? this.roundMoney(Math.max(0, Number(input.sellingPrice)))
        : mrp;

    const ratePercent =
      input.commissionRateOverride !== undefined
        ? input.commissionRateOverride
        : (legacyOptions?.commissionRateOverride ?? this.COMMISSION_RATE_PERCENT);

    const commissionAmount = this.calculateCommission(mrp, ratePercent);
    const sellerBasePayout = this.roundMoney(Math.max(0, sellingPrice - commissionAmount));
    const netSellerPayout = sellerBasePayout;

    return {
      grossProductValue: sellingPrice,
      totalMrp: mrp,
      commissionRate: ratePercent,
      commissionAmount,
      sellerBasePayout,
      sellerGstAmount: 0,
      sellerTotalPayout: netSellerPayout,
      netSellerPayout,
      totalCommissionAmount: commissionAmount,
      totalSellerBasePayout: sellerBasePayout,
      totalSellerPayout: netSellerPayout,
      grossAmount: sellingPrice,
      percentageFee: commissionAmount,
      flatFee: 0,
      totalCommission: commissionAmount,
      items: [],
      sellerBreakdown: new Map(),
    };
  }

  /**
   * Calculates commission reversal upon full or partial return per Section 14 of BM-02.
   * Full return reverses 100% of original recorded commission (Navya retains ₹0).
   * Partial return reverses only the returned item's commission.
   */
  public static calculateCommissionReversal(params: {
    originalCommission: number;
    returnType: 'FULL' | 'PARTIAL';
    returnedItemCommission?: number;
  }): { commissionReversal: number; retainedCommission: number } {
    const original = this.roundMoney(Math.max(0, params.originalCommission));

    if (params.returnType === 'FULL') {
      return {
        commissionReversal: original,
        retainedCommission: 0.0,
      };
    }

    const reversal = this.roundMoney(
      Math.min(original, Math.max(0, params.returnedItemCommission || 0)),
    );
    const retained = this.roundMoney(Math.max(0, original - reversal));

    return {
      commissionReversal: reversal,
      retainedCommission: retained,
    };
  }

  /**
   * Calculates seller payout reversal upon return per Section 15 of BM-03 and BM-10.
   * - Commission Reversal = original MRP commission for the returned item
   * - Base Payout Reversal = returned item selling price - seller coupon discount - commission reversal
   * - GST Reversal = if seller is GST registered, original GST payout for returned item
   * - Total Payout Reversal = Base Payout Reversal + GST Reversal
   */
  public static calculateReturnPayoutReversal(params: {
    returnedSellingPrice: number;
    returnedMrpCommission: number;
    returnedTaxAmount?: number;
    sellerGstStatus?: 'REGISTERED' | 'UNREGISTERED' | string | null;
    sellerCouponDiscount?: number;
  }): {
    commissionReversal: number;
    basePayoutReversal: number;
    gstPayoutReversal: number;
    totalPayoutReversal: number;
    sellerTotalPayoutReversal: number;
    sellerCouponReversal: number;
  } {
    const commissionReversal = this.roundMoney(Math.max(0, params.returnedMrpCommission));
    const sellingPrice = this.roundMoney(Math.max(0, params.returnedSellingPrice));
    const sellerCoupon = this.roundMoney(Math.max(0, params.sellerCouponDiscount || 0));
    const basePayoutReversal = this.roundMoney(
      Math.max(0, sellingPrice - sellerCoupon - commissionReversal),
    );

    const isRegistered = params.sellerGstStatus === 'REGISTERED';
    const gstPayoutReversal = isRegistered
      ? this.roundMoney(Math.max(0, params.returnedTaxAmount || 0))
      : 0;
    const totalPayoutReversal = this.roundMoney(basePayoutReversal + gstPayoutReversal);

    return {
      commissionReversal,
      basePayoutReversal,
      gstPayoutReversal,
      totalPayoutReversal,
      sellerTotalPayoutReversal: totalPayoutReversal,
      sellerCouponReversal: sellerCoupon,
    };
  }
}
