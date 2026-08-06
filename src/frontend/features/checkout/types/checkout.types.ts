import type { AppliedCoupon } from '@/features/coupons/types';
import type { ShippingCalculationData } from '@/features/shipping/types';

export interface TaxCalculationData {
  subtotal: number;
  discount: number;
  netTaxableAmount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  taxBreakdown: {
    gst: number;
    cgst: number;
    sgst: number;
    igst: number;
    taxType: string;
    storeState?: string;
    customerState?: string | null;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
}

export type CheckoutStep = 'cart' | 'address' | 'delivery' | 'payment' | 'review';

export interface CheckoutState {
  step: CheckoutStep;
  items: CartItem[];
  address: Address | null;
  deliveryMethod: DeliveryMethod | null;
  paymentMethod: PaymentMethod | null;
  appliedCoupon: AppliedCoupon | null;
  shippingData: ShippingCalculationData | null;
  taxData: TaxCalculationData | null;
  isShippingLoading: boolean;
  isTaxLoading: boolean;
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setAddress: (address: Address | null) => void;
  setDeliveryMethod: (method: DeliveryMethod | null) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  recalculateShipping: (selectedAddress?: Address | null) => Promise<void>;
  recalculateTax: (
    selectedAddress?: Address | null,
    selectedCoupon?: AppliedCoupon | null,
  ) => Promise<void>;
}
