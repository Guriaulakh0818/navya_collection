export type CouponFundingType = 'NAVYA' | 'SELLER';

export interface AppliedCoupon {
  id?: string;
  code: string;
  title: string;
  fundingType: CouponFundingType;
  discountType: 'PERCENTAGE' | 'FIXED' | string;
  discountValue: number;
  discountAmount: number;
  shopId?: string | null;
  sellerAllocations?: Array<{
    sellerId: string;
    sellerAllocatedCoupon: number;
    fundingType: CouponFundingType;
  }>;
  itemAllocations?: Array<{
    productId: string;
    shopId?: string | null;
    allocatedCoupon: number;
    fundingType: CouponFundingType;
  }>;
}

export interface ActiveCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  fundingType: CouponFundingType;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  validUntil?: string | null;
  startDate?: string | null;
  shopId?: string | null;
  usageLimit?: number | null;
  usedCount?: number;
}
