/**
 * Navya Collection Multi-Vendor Marketplace Operational & Tax Configurations
 * In accordance with Master Documentation v1.0 & Indian E-Commerce Regulations.
 */

export const MARKETPLACE_CONFIG = {
  // Brand & Legal Details
  BRAND_NAME: 'Navya Collection',
  DOMAIN: 'navyacollection.store',
  SUPPORT_EMAIL: 'support@navyacollection.store',
  SUPPORT_PHONE: '+91 9053883125',

  // Order & Inventory Rules (C6 / M5)
  // Maximum time for a physical boutique to confirm stock availability before auto-safety action
  SELLER_ORDER_CONFIRMATION_TIMEOUT_HOURS: 24,

  // Cash on Delivery (COD) Rules (M1)
  COD: {
    ENABLED: true,
    MAX_ORDER_VALUE: 5000, // Maximum cap for COD to mitigate RTO losses
    MIN_ORDER_VALUE: 199,
    REQUIRES_OTP_VERIFICATION: true,
  },

  // Shipping & Logistics Rules
  SHIPPING: {
    FREE_SHIPPING_THRESHOLD: 999, // Orders >= ₹999 get free shipping
    STANDARD_SHIPPING_FEE: 99,
    RETURN_WINDOW_DAYS: 7,
  },

  // Indian GST & TCS Invoicing Architecture (M2)
  TAX: {
    // Standard GST slab rates for Indian apparel
    GARMENTS_SUB_1000_GST_RATE: 0.05, // 5% GST on apparel <= ₹1,000
    GARMENTS_ABOVE_1000_GST_RATE: 0.12, // 12% GST on apparel > ₹1,000

    // Tax Collected at Source (TCS) under Section 52 of CGST Act (1% on net taxable value)
    ECOMMERCE_TCS_RATE: 0.01,
  },

  // Seller Marketplace Commission Slabs (M4)
  COMMISSION: {
    DEFAULT_COMMISSION_PERCENTAGE: 10.0, // Standard 10% marketplace commission
    SETTLEMENT_CYCLE_DAYS: 7, // T+7 days post-delivery window
  },
} as const;

/**
 * Calculates GST Breakdown for an apparel item based on selling price
 */
export function calculateApparelGst(sellingPrice: number): {
  gstRate: number;
  basePrice: number;
  gstAmount: number;
  tcsAmount: number;
} {
  const gstRate =
    sellingPrice <= 1000
      ? MARKETPLACE_CONFIG.TAX.GARMENTS_SUB_1000_GST_RATE
      : MARKETPLACE_CONFIG.TAX.GARMENTS_ABOVE_1000_GST_RATE;

  // Back-calculate taxable value from inclusive price: Base = Price / (1 + Rate)
  const basePrice = Math.round((sellingPrice / (1 + gstRate)) * 100) / 100;
  const gstAmount = Math.round((sellingPrice - basePrice) * 100) / 100;
  const tcsAmount = Math.round(basePrice * MARKETPLACE_CONFIG.TAX.ECOMMERCE_TCS_RATE * 100) / 100;

  return {
    gstRate,
    basePrice,
    gstAmount,
    tcsAmount,
  };
}
