'use client';

import { create } from 'zustand';

type CheckoutStore = {
  step: 'address' | 'payment' | 'review';
  selectedAddressId: string | null;
  paymentMethod: 'cod' | 'online';
  setStep: (step: CheckoutStore['step']) => void;
  setSelectedAddressId: (addressId: string | null) => void;
  setPaymentMethod: (method: CheckoutStore['paymentMethod']) => void;
  reset: () => void;
};

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  step: 'address',
  selectedAddressId: null,
  paymentMethod: 'cod',
  setStep: (step) => set({ step }),
  setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  reset: () => set({ step: 'address', selectedAddressId: null, paymentMethod: 'cod' }),
}));
