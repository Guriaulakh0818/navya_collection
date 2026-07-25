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
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setAddress: (address: Address | null) => void;
  setDeliveryMethod: (method: DeliveryMethod | null) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
}
