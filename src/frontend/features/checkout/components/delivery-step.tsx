'use client';

import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCheckout } from '@/features/checkout/context/checkout-context';

import type { DeliveryMethod } from '../types';

export function DeliveryStep() {
  const { items, deliveryMethod, shippingData, setDeliveryMethod, nextStep, prevStep } =
    useCheckout();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isFirstOrderFree = Boolean(shippingData?.isFirstOrderFreeDelivery);
  const isBaseFree = subtotal >= 999;
  const isSameDayFree = subtotal >= 1999;

  const methodsToRender: (DeliveryMethod & { originalPrice: number })[] = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Delivered within 5-7 business days',
      originalPrice: 49,
      price: isFirstOrderFree || isBaseFree ? 0 : 49,
      estimatedDays: '5-7 business days',
    },
    {
      id: 'express',
      name: 'Express Delivery',
      description: 'Delivered within 2-3 business days',
      originalPrice: 99,
      price: isFirstOrderFree || isBaseFree ? 0 : 99,
      estimatedDays: '2-3 business days',
    },
    {
      id: 'same-day',
      name: 'Same Day Delivery',
      description: 'Order before 2 PM for same day delivery',
      originalPrice: 149,
      price: isFirstOrderFree || isSameDayFree ? 0 : 149,
      estimatedDays: 'Same day',
    },
  ];

  const defaultMethod = methodsToRender[0];

  const [selectedId, setSelectedId] = useState<string>(deliveryMethod?.id || defaultMethod.id);

  useEffect(() => {
    if (!deliveryMethod) {
      setDeliveryMethod(defaultMethod);
      setSelectedId(defaultMethod.id);
    } else {
      const current = methodsToRender.find((m) => m.id === deliveryMethod.id) || defaultMethod;
      if (current.price !== deliveryMethod.price || current.name !== deliveryMethod.name) {
        setDeliveryMethod(current);
      }
      setSelectedId(current.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, deliveryMethod?.id, isFirstOrderFree]);

  const handleSelect = (method: DeliveryMethod) => {
    setSelectedId(method.id);
    setDeliveryMethod(method);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-card space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">
          Select Delivery Method
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Choose standard, express, or same day delivery speed for your order.
        </p>
      </div>

      {/* Guest Login Prompt for First Order Free Delivery */}
      {shippingData?.guestOfferPrompt && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span>{shippingData.guestOfferPrompt}</span>
          </div>
          <a
            href="/login?callbackUrl=/checkout"
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-full font-bold shrink-0 transition"
          >
            Log In
          </a>
        </div>
      )}

      {/* First Order Free Delivery Active Banner */}
      {isFirstOrderFree && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-extrabold flex items-center gap-2.5 shadow-xs">
          <span className="text-base">🎉</span>
          <span>
            {shippingData?.offerTitle ||
              'First order — Free delivery applied on all delivery options!'}
          </span>
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5">
        {methodsToRender.map((method) => {
          const isSelected = selectedId === method.id;
          const isThisMethodFree =
            isFirstOrderFree || (method.id === 'same-day' ? isSameDayFree : isBaseFree);

          return (
            <label
              key={method.id}
              onClick={() => handleSelect(method)}
              className={`flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 p-3.5 sm:p-5 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-orange bg-orange/5 shadow-md'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                checked={isSelected}
                onChange={() => handleSelect(method)}
                className="mt-1 h-4 w-4 sm:h-4.5 sm:w-4.5 accent-orange cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-navy/10 flex items-center justify-center text-navy shrink-0">
                      <Truck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-navy text-xs sm:text-base block leading-tight">
                        {method.name}
                      </span>
                      {isFirstOrderFree ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 inline-block mt-0.5">
                          ⭐ First Order — Free Delivery
                        </span>
                      ) : isThisMethodFree ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-0.5">
                          ✓ Free Shipping Unlocked!
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isThisMethodFree ? (
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-slate-400 font-bold text-xs">
                          ₹{method.originalPrice}
                        </span>
                        <span className="text-sm sm:text-base font-black text-emerald-600">₹0</span>
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base font-black text-navy">
                        ₹{method.price}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-1">
                  {method.description}
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5">
                  Estimated: {method.estimatedDays}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5 sm:gap-4">
        <Button
          variant="outline"
          className="rounded-full font-bold text-xs sm:text-sm px-4 sm:px-6 h-11 border-slate-300 shrink-0 cursor-pointer"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <button
          className="flex-1 sm:flex-initial rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-8 h-11 sm:h-12 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          onClick={nextStep}
          disabled={!deliveryMethod}
        >
          <span>Continue to Payment</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
