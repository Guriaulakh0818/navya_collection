export interface AppliedCoupon {
  code: string;
  title: string;
  discountType: 'PERCENTAGE' | 'FIXED' | string;
  discountValue: number;
  discountAmount: number;
}

export interface ActiveCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  validUntil?: string | null;
}
