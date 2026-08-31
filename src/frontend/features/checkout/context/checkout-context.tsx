'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { AppliedCoupon } from '@/features/coupons/components/CouponInputCard';
import { ShippingCalculationData } from '@/features/shipping/components/ShippingSummaryCard';
import { useCartStore } from '@/stores';

import type {
  Address,
  CartItem,
  CheckoutState,
  CheckoutStep,
  DeliveryMethod,
  PaymentMethod,
  TaxCalculationData,
} from '../types/checkout.types';

const CheckoutContext = createContext<CheckoutState | null>(null);

type CheckoutProviderProps = {
  children: ReactNode;
};

const STEPS: CheckoutStep[] = ['cart', 'address', 'delivery', 'payment', 'review'];

const calculateInstantShippingData = (
  cartAmount: number,
  pincode?: string | null,
  deliveryMethodId?: string | null,
): ShippingCalculationData => {
  const isSameDay = deliveryMethodId === 'same-day';
  const isStandard = deliveryMethodId === 'standard';
  const threshold = isSameDay ? 1999 : 999;
  const originalPrice = isSameDay ? 149 : isStandard ? 49 : 99;

  const isFree = cartAmount >= threshold;
  const remaining = isFree ? 0 : Math.max(0, threshold - cartAmount);

  return {
    isServiceable: true,
    pincode: pincode || null,
    shippingCharge: isFree ? 0 : originalPrice,
    deliveryDays: isSameDay ? 'Same day' : isStandard ? '5-7 business days' : '2-3 business days',
    isFreeShipping: isFree,
    freeShippingThreshold: threshold,
    freeShippingRemaining: remaining,
    savedShippingAmount: isFree ? originalPrice : 0,
    shippingMethod: isSameDay
      ? 'Same Day Delivery'
      : isStandard
        ? 'Standard Delivery'
        : 'Express Delivery',
    shippingMethodCode: isSameDay ? 'SAME-DAY' : isStandard ? 'STANDARD' : 'EXPRESS',
  };
};

export const CheckoutProvider: React.FC<{
  children: React.ReactNode;
  initialItems?: CartItem[];
}> = ({ children, initialItems = [] }) => {
  const cartItems = useCartStore((s) => s.items);
  const cartAppliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setCartAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [items, setItems] = useState<CartItem[]>(cartItems);

  useEffect(() => {
    setItems(cartItems);
  }, [cartItems]);

  const [address, setAddress] = useState<Address | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(
    cartAppliedCoupon || null,
  );

  useEffect(() => {
    if (cartAppliedCoupon && (!appliedCoupon || appliedCoupon.code !== cartAppliedCoupon.code)) {
      setAppliedCouponState(cartAppliedCoupon);
    }
  }, [cartAppliedCoupon]);

  const initialSubtotal = (cartItems.length > 0 ? cartItems : initialItems).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const [shippingData, setShippingData] = useState<ShippingCalculationData | null>(() =>
    calculateInstantShippingData(initialSubtotal),
  );
  const [taxData, setTaxData] = useState<TaxCalculationData | null>(null);
  const [isShippingLoading, setIsShippingLoading] = useState<boolean>(false);
  const [isTaxLoading, setIsTaxLoading] = useState<boolean>(false);

  const recalculateShipping = useCallback(
    async (targetAddress?: Address | null) => {
      const activeAddr = targetAddress !== undefined ? targetAddress : address;
      const cartAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Instant 0ms local update so free shipping box appears immediately!
      setShippingData(
        calculateInstantShippingData(cartAmount, activeAddr?.pincode, deliveryMethod?.id),
      );

      setIsShippingLoading(true);
      try {
        const res = await fetch('/api/v1/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: activeAddr?.id || undefined,
            pincode: activeAddr?.pincode || undefined,
            state: activeAddr?.state || undefined,
            cartAmount,
            shippingMethodCode: deliveryMethod?.id ? deliveryMethod.id.toUpperCase() : 'STANDARD',
          }),
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setShippingData(json.data);
        }
      } catch (error) {
        console.error('[RECALCULATE_SHIPPING_ERROR]', error);
      } finally {
        setIsShippingLoading(false);
      }
    },
    [address, items, deliveryMethod],
  );

  const recalculateTax = useCallback(
    async (targetAddress?: Address | null, targetCoupon?: AppliedCoupon | null) => {
      const activeAddr = targetAddress !== undefined ? targetAddress : address;
      const activeCoupon = targetCoupon !== undefined ? targetCoupon : appliedCoupon;
      setIsTaxLoading(true);

      try {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = activeCoupon ? activeCoupon.discountAmount : 0;
        const shipping = shippingData ? shippingData.shippingCharge : subtotal >= 999 ? 0 : 99;

        const res = await fetch('/api/v1/tax/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: activeAddr?.id || undefined,
            subtotal,
            discount,
            shipping,
            couponCode: activeCoupon?.code || undefined,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setTaxData(json.data);
        }
      } catch (error) {
        console.error('[RECALCULATE_TAX_ERROR]', error);
      } finally {
        setIsTaxLoading(false);
      }
    },
    [address, appliedCoupon, items, shippingData],
  );

  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join(',');

  useEffect(() => {
    recalculateShipping();
    recalculateTax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.id, itemsKey, appliedCoupon?.code, deliveryMethod?.id]);

  const handleSetDeliveryMethod = (newMethod: DeliveryMethod | null) => {
    setDeliveryMethod(newMethod);
    const cartAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setShippingData(calculateInstantShippingData(cartAmount, address?.pincode, newMethod?.id));
  };

  const handleSetAddress = (newAddress: Address | null) => {
    setAddress(newAddress);
    recalculateShipping(newAddress);
    recalculateTax(newAddress, appliedCoupon);
  };

  const handleSetAppliedCoupon = (newCoupon: AppliedCoupon | null) => {
    setAppliedCouponState(newCoupon);
    setCartAppliedCoupon(newCoupon);
    recalculateTax(address, newCoupon);
  };

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
        appliedCoupon,
        shippingData,
        taxData,
        isShippingLoading,
        isTaxLoading,
        setStep,
        nextStep,
        prevStep,
        updateItemQuantity,
        removeItem,
        setAddress: handleSetAddress,
        setDeliveryMethod: handleSetDeliveryMethod,
        setPaymentMethod,
        setAppliedCoupon: handleSetAppliedCoupon,
        recalculateShipping,
        recalculateTax,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
