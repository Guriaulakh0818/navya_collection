'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { useCartStore } from '@/stores';

import type {
  Address,
  CartItem,
  CheckoutState,
  CheckoutStep,
  DeliveryMethod,
  PaymentMethod,
} from '../types/checkout.types';

const CheckoutContext = createContext<CheckoutState | null>(null);

type CheckoutProviderProps = {
  children: ReactNode;
};

const STEPS: CheckoutStep[] = ['cart', 'address', 'delivery', 'payment', 'review'];

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const cartItems = useCartStore((s) => s.items);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [items, setItems] = useState<CartItem[]>(cartItems);
  const [address, setAddress] = useState<Address | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  return (
    <CheckoutContext.Provider
      value={{
        step,
        items,
        address,
        deliveryMethod,
        paymentMethod,
        setStep,
        nextStep,
        prevStep,
        updateItemQuantity,
        removeItem,
        setAddress,
        setDeliveryMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
