export interface ShippingCalculationData {
  isServiceable: boolean;
  pincode?: string | null;
  state?: string | null;
  shippingCharge: number;
  deliveryDays: string;
  isFreeShipping: boolean;
  freeShippingThreshold?: number;
  freeShippingRemaining?: number;
  savedShippingAmount?: number;
  shippingMethod: string;
  shippingMethodCode?: string;
  paymentMethod?: 'PREPAID' | 'COD' | string;
  isCodAvailable?: boolean;
  isFirstOrderFreeDelivery?: boolean;
  offerTitle?: string | null;
  guestOfferPrompt?: string | null;
  sellerBreakdown?: Array<{
    sellerId?: string;
    shopId?: string;
    subtotal: number;
    shippingCharge: number;
    freeShipping: boolean;
    reason?: string;
  }>;
}
