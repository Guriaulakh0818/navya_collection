'use client';

import { Truck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import type { DeliveryMethod } from '@/features/checkout/types/checkout.types';

const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivered within 5-7 business days',
    price: 49,
    estimatedDays: '5-7 business days',
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivered within 2-3 business days',
    price: 99,
    estimatedDays: '2-3 business days',
  },
  {
    id: 'same-day',
    name: 'Same Day Delivery',
    description: 'Order before 2 PM for same day delivery',
    price: 149,
    estimatedDays: 'Same day',
  },
];

export function DeliveryStep() {
  const { deliveryMethod, setDeliveryMethod, nextStep, prevStep } = useCheckout();
  const [selectedId, setSelectedId] = useState<string>(deliveryMethod?.id || 'standard');

  const handleSelect = (method: DeliveryMethod) => {
    setSelectedId(method.id);
    setDeliveryMethod(method);
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h2 className="font-heading text-xl text-navy mb-4">Delivery Method</h2>

      <div className="space-y-3">
        {DELIVERY_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
              selectedId === method.id ? 'border-navy bg-navy/5' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="delivery"
              checked={selectedId === method.id}
              onChange={() => handleSelect(method)}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {method.name}
                </p>
                <p className="text-sm font-semibold text-navy">
                  {method.price === 0 ? 'Free' : `₹${method.price}`}
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-1">{method.description}</p>
              <p className="text-xs text-slate-500 mt-1">Estimated: {method.estimatedDays}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="rounded-full" onClick={prevStep}>
          Back
        </Button>
        <Button className="rounded-full" onClick={nextStep} disabled={!deliveryMethod}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
