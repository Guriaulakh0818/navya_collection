export interface Address {
  id: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CheckoutState {
  step: 'address' | 'payment' | 'review';
  selectedAddressId?: string;
  paymentMethod: 'cod' | 'online';
}
