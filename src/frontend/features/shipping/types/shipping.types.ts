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
  isCodAvailable?: boolean;
}
