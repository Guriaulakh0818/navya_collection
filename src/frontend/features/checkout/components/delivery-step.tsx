'use client';

import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCheckout } from '@/features/checkout/context/checkout-context';

import type { DeliveryMethod } from '../types';

export function DeliveryStep() {
  const { items, deliveryMethod, setDeliveryMethod, nextStep, prevStep } = useCheckout();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isBaseFree = subtotal >= 999;
  const isSameDayFree = subtotal >= 1999;

  const methodsToRender: (DeliveryMethod & { originalPrice: number })[] = [
    {
      id: 'express',
      name: 'Express Delivery',
      description: 'Delivered within 2-3 business days',
      originalPrice: 99,
      price: isBaseFree ? 0 : 99,
      estimatedDays: '2-3 business days',
    },
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Delivered within 5-7 business days',
      originalPrice: 49,
      price: isBaseFree ? 0 : 49,
      estimatedDays: '5-7 business days',
    },
    {
      id: 'same-day',
      name: 'Same Day Delivery',
      description: 'Order before 2 PM for same day delivery',
      originalPrice: 149,
      price: isSameDayFree ? 0 : 149,
      estimatedDays: 'Same day',
    },
  ];

  const defaultMethod = methodsToRender[0]; // Express Delivery by default

  const [selectedId, setSelectedId] = useState<string>(deliveryMethod?.id || defaultMethod.id);

  // Auto-select Express Delivery on mount if none selected, so "Continue to Payment" is immediately active!
  useEffect(() => {
    if (!deliveryMethod) {
      setDeliveryMethod(defaultMethod);
      setSelectedId(defaultMethod.id);
    } else {
      // Re-sync price if threshold changed
      const current = methodsToRender.find((m) => m.id === deliveryMethod.id) || defaultMethod;
      setDeliveryMethod(current);
      setSelectedId(current.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const handleSelect = (method: DeliveryMethod) => {
    setSelectedId(method.id);
    setDeliveryMethod(method);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-navy">Delivery Method</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select your preferred shipping option for this order
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {methodsToRender.map((method) => {
          const isSelected = selectedId === method.id;
          const isFree = method.price === 0;

          return (
            <label
              key={method.id}
              onClick={() => handleSelect(method)}
              className={`flex items-start gap-4 rounded-2xl border-2 p-4 md:p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-navy bg-navy/5 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                checked={isSelected}
                onChange={() => handleSelect(method)}
                className="mt-1 h-4 w-4 text-navy focus:ring-navy cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-navy text-base flex items-center gap-2">
                      <Truck className="h-4.5 w-4.5 text-navy" />
                      <span>{method.name}</span>
                    </p>

                    {/* ONLY display FREE SHIPPING badge when method is actually FREE */}
                    {isFree ? (
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        FREE SHIPPING
                      </span>
                    ) : method.id === 'same-day' ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Free on orders above ₹1,999
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Free on orders above ₹999
                      </span>
                    )}
                  </div>

                  {/* PRICE DISPLAY: Show strikethrough original price + ₹0 when free */}
                  <div className="text-right">
                    {isFree ? (
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-slate-400 font-bold text-xs">
                          ₹{method.originalPrice}
                        </span>
                        <span className="text-base font-black text-emerald-600">₹0</span>
                      </div>
                    ) : (
                      <span className="text-base font-black text-navy">₹{method.price}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-600 mt-1">{method.description}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Estimated: {method.estimatedDays}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-full font-bold text-xs px-6 py-2.5 border-slate-300"
          onClick={prevStep}
        >
          Back
        </Button>
        <button
          className="rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs px-8 py-3.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={nextStep}
          disabled={!deliveryMethod}
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}
