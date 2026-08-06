export interface CommissionConfig {
  defaultPercentage: number; // e.g., 10 for 10%
  flatFeePerOrder: number; // e.g., ₹15 flat fee
}

export interface CommissionCalculationResult {
  grossAmount: number;
  percentageFee: number;
  flatFee: number;
  totalCommission: number;
  netSellerPayout: number;
}

export class CommissionService {
  // Default Configurable Settings
  private static config: CommissionConfig = {
    defaultPercentage: Number(process.env.MARKETPLACE_COMMISSION_PERCENTAGE || 10),
    flatFeePerOrder: Number(process.env.MARKETPLACE_FLAT_FEE_PER_ORDER || 15),
  };

  /**
   * Calculates platform commission and net seller payout amount.
   * Future-ready for category overrides or vendor tier rules.
   */
  static calculateOrderCommission(
    shopSubtotal: number,
    options?: { categoryId?: string; shopId?: string },
  ): CommissionCalculationResult {
    const grossAmount = Math.max(0, shopSubtotal);

    // Percentage Fee
    const percentageRate = this.config.defaultPercentage / 100;
    const percentageFee = grossAmount * percentageRate;

    // Flat Fee
    const flatFee = grossAmount > 0 ? this.config.flatFeePerOrder : 0;

    // Total Commission
    const totalCommission = percentageFee + flatFee;

    // Net Seller Payout
    const netSellerPayout = Math.max(0, grossAmount - totalCommission);

    return {
      grossAmount,
      percentageFee,
      flatFee,
      totalCommission,
      netSellerPayout,
    };
  }
}
