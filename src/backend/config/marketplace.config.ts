/**
 * NAVYA COLLECTION — India Launch Operational, Tax & Compliance Configurations
 * Verified against Indian E-Commerce Regulations, CGST Notification 15/2024 (TCS 0.5%),
 * Section 194-O Income Tax TDS (0.1%), and Dual-Invoicing Marketplace Accounting Standards.
 */

export const MARKETPLACE_CONFIG = {
  // Brand & Legal Entity Details
  BRAND_NAME: 'Navya Collection',
  DOMAIN: 'navyacollection.store',
  SUPPORT_EMAIL: 'support@navyacollection.store',
  SUPPORT_PHONE: '+91 9053883125',
  GRIEVANCE_EMAIL: 'grievance@navyacollection.store',
  HEADQUARTERS: 'Karnal, Haryana - 132001, India',

  // Order & Inventory Oversell Protection Rules
  SELLER_ORDER_CONFIRMATION_TIMEOUT_HOURS: 24,

  // Cash on Delivery (COD) Rules (India Launch Checklist)
  COD: {
    ENABLED: true,
    MAX_ORDER_VALUE: 3000, // Capped at ₹3,000 to mitigate courier RTO fraud/losses
    MIN_ORDER_VALUE: 199,
    REQUIRES_OTP_VERIFICATION: true,
    RECONCILIATION_CYCLE_DAYS: 7, // Shiprocket COD remittance cycle
  },

  // Shipping & Logistics Rules
  SHIPPING: {
    FREE_SHIPPING_THRESHOLD: 999, // Free shipping for orders >= ₹999
    STANDARD_SHIPPING_FEE: 99,
    RETURN_WINDOW_DAYS: 7,
    COURIER_PARTNER: 'Shiprocket',
  },

  // Indian Tax & Withholding Architecture (CA-Confirmed Rates)
  TAX: {
    // 1. Product GST on Apparel (Seller -> Customer Invoice)
    APPAREL_SUB_1000_GST_RATE: 0.05, // 5% GST on apparel < ₹1,000/piece
    APPAREL_AT_OR_ABOVE_1000_GST_RATE: 0.12, // 12% GST on apparel >= ₹1,000/piece

    // 2. GST TCS under Section 52 of CGST Act (Revised via CGST Notif 15/2024, 10 Jul 2024)
    // 0.5% on net taxable value (Intra-state: 0.25% CGST + 0.25% SGST; Inter-state: 0.5% IGST)
    GST_TCS_RATE: 0.005, // 0.5%
    GST_TCS_CGST_RATE: 0.0025, // 0.25%
    GST_TCS_SGST_RATE: 0.0025, // 0.25%
    GST_TCS_IGST_RATE: 0.005, // 0.50%

    // 3. Income Tax TDS under Section 194-O (Deducted on gross sale amount at seller payout)
    TDS_194O_RATE: 0.001, // 0.1%
    TDS_194O_ANNUAL_EXEMPTION_THRESHOLD: 500000, // ₹5 Lakh annual gross sales for PAN-provided individual sellers

    // 4. Commission GST on Marketplace Services (Navya -> Seller Commission Invoice)
    COMMISSION_SERVICE_GST_RATE: 0.18, // 18% GST (Service Output Liability)
  },

  // Seller Marketplace Commission Slabs
  COMMISSION: {
    DEFAULT_COMMISSION_PERCENTAGE: 10.0, // Standard 10% marketplace fee
    SETTLEMENT_CYCLE_DAYS: 7, // T+7 days post-delivery window
  },
} as const;

/**
 * 1. Product GST Breakdown (For Seller -> Customer Tax Invoice)
 */
export function calculateApparelProductTax(itemPriceInclusive: number): {
  gstRate: number;
  taxableValue: number;
  gstAmount: number;
} {
  const gstRate =
    itemPriceInclusive < 1000
      ? MARKETPLACE_CONFIG.TAX.APPAREL_SUB_1000_GST_RATE
      : MARKETPLACE_CONFIG.TAX.APPAREL_AT_OR_ABOVE_1000_GST_RATE;

  const taxableValue = Math.round((itemPriceInclusive / (1 + gstRate)) * 100) / 100;
  const gstAmount = Math.round((itemPriceInclusive - taxableValue) * 100) / 100;

  return {
    gstRate,
    taxableValue,
    gstAmount,
  };
}

/**
 * 2. Navya Collection Marketplace Commission Invoice (Navya -> Seller Invoice)
 */
export function calculateMarketplaceCommissionInvoice(
  grossSaleAmount: number,
  customCommissionPercentage?: number,
): {
  commissionRate: number;
  baseCommission: number;
  commissionGstRate: number;
  commissionGstAmount: number;
  totalCommissionWithGst: number;
} {
  const commissionRate =
    (customCommissionPercentage ?? MARKETPLACE_CONFIG.COMMISSION.DEFAULT_COMMISSION_PERCENTAGE) /
    100;
  const baseCommission = Math.round(grossSaleAmount * commissionRate * 100) / 100;
  const commissionGstRate = MARKETPLACE_CONFIG.TAX.COMMISSION_SERVICE_GST_RATE;
  const commissionGstAmount = Math.round(baseCommission * commissionGstRate * 100) / 100;
  const totalCommissionWithGst = Math.round((baseCommission + commissionGstAmount) * 100) / 100;

  return {
    commissionRate,
    baseCommission,
    commissionGstRate,
    commissionGstAmount,
    totalCommissionWithGst,
  };
}

/**
 * 3. Withholding Tax (TCS Sec 52 + TDS Sec 194-O) at Seller Payout
 */
export function calculateSellerWithholding(params: {
  taxableValue: number;
  grossSaleAmount: number;
  isInterState?: boolean;
  sellerHasPan?: boolean;
  sellerIsIndividual?: boolean;
  sellerAnnualGrossSales?: number;
}): {
  tcsRate: number;
  tcsAmount: number;
  tcsType: 'IGST' | 'CGST_SGST';
  tdsRate: number;
  tdsAmount: number;
  isTdsExempt: boolean;
  totalWithholding: number;
} {
  const {
    taxableValue,
    grossSaleAmount,
    isInterState = true,
    sellerHasPan = true,
    sellerIsIndividual = true,
    sellerAnnualGrossSales = 0,
  } = params;

  // 1. GST TCS Calculation (0.5% on net taxable value)
  const tcsRate = MARKETPLACE_CONFIG.TAX.GST_TCS_RATE;
  const tcsAmount = Math.round(taxableValue * tcsRate * 100) / 100;
  const tcsType = isInterState ? 'IGST' : 'CGST_SGST';

  // 2. TDS Section 194-O (0.1% on gross sale amount unless exempt)
  const isTdsExempt =
    sellerIsIndividual &&
    sellerHasPan &&
    sellerAnnualGrossSales < MARKETPLACE_CONFIG.TAX.TDS_194O_ANNUAL_EXEMPTION_THRESHOLD;

  const tdsRate = isTdsExempt ? 0 : MARKETPLACE_CONFIG.TAX.TDS_194O_RATE;
  const tdsAmount = isTdsExempt ? 0 : Math.round(grossSaleAmount * tdsRate * 100) / 100;

  const totalWithholding = Math.round((tcsAmount + tdsAmount) * 100) / 100;

  return {
    tcsRate,
    tcsAmount,
    tcsType,
    tdsRate,
    tdsAmount,
    isTdsExempt,
    totalWithholding,
  };
}

/**
 * 4. COD 4-Way Reconciliation Ledger Entry
 * (Cash Collected vs Courier Fee vs Navya Commission vs Net Seller Payout)
 */
export function calculateCodReconciliationLedger(params: {
  codAmountCollected: number;
  courierFeeCharged: number;
  commissionPercentage?: number;
  isInterState?: boolean;
  sellerAnnualGrossSales?: number;
  sellerHasPan?: boolean;
}) {
  const {
    codAmountCollected,
    courierFeeCharged,
    commissionPercentage,
    isInterState,
    sellerAnnualGrossSales,
    sellerHasPan,
  } = params;

  const productTax = calculateApparelProductTax(codAmountCollected);
  const commission = calculateMarketplaceCommissionInvoice(
    codAmountCollected,
    commissionPercentage,
  );
  const withholding = calculateSellerWithholding({
    taxableValue: productTax.taxableValue,
    grossSaleAmount: codAmountCollected,
    isInterState,
    sellerAnnualGrossSales,
    sellerHasPan,
  });

  // Net Seller Payout = Gross Sale - Total Commission (with 18% GST) - TCS - TDS
  const netSellerPayout =
    Math.round(
      (codAmountCollected - commission.totalCommissionWithGst - withholding.totalWithholding) * 100,
    ) / 100;

  // Marketplace Net Earnings = Commission with GST - Courier Fee (if marketplace subsidizes)
  const marketplaceNetRetained =
    Math.round((commission.totalCommissionWithGst - courierFeeCharged) * 100) / 100;

  return {
    grossCollected: codAmountCollected,
    productTax,
    commission,
    withholding,
    courierFee: courierFeeCharged,
    netSellerPayout,
    marketplaceNetRetained,
  };
}

/**
 * 5. Return / Refund TCS & TDS Reversal Adjustment Calculator
 */
export function calculateReturnTaxReversal(refundAmount: number): {
  reversalTaxableValue: number;
  reversalGstAmount: number;
  reversalTcsAmount: number;
  reversalTdsAmount: number;
} {
  const tax = calculateApparelProductTax(refundAmount);
  const reversalTcsAmount =
    Math.round(tax.taxableValue * MARKETPLACE_CONFIG.TAX.GST_TCS_RATE * 100) / 100;
  const reversalTdsAmount =
    Math.round(refundAmount * MARKETPLACE_CONFIG.TAX.TDS_194O_RATE * 100) / 100;

  return {
    reversalTaxableValue: tax.taxableValue,
    reversalGstAmount: tax.gstAmount,
    reversalTcsAmount,
    reversalTdsAmount,
  };
}
