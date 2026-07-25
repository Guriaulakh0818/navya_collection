'use client';

import { CreditCard, Wallet } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import type { PaymentMethod } from '@/features/checkout/types/checkout.types';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
  },
  {
    id: 'online',
    name: 'Pay Online',
    description: 'UPI, Cards, Wallets',
  },
];

export function PaymentStep() {
  const { paymentMethod, setPaymentMethod, nextStep, prevStep } = useCheckout();
  const [selectedId, setSelectedId] = useState<string>(paymentMethod?.id || 'cod');

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id);
    setPaymentMethod(method);
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h2 className="font-heading text-xl text-navy mb-4">Payment Method</h2>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
              selectedId === method.id ? 'border-navy bg-navy/5' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={selectedId === method.id}
              onChange={() => handleSelect(method)}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {method.id === 'cod' ? (
                  <Wallet className="h-4 w-4 text-navy" />
                ) : (
                  <CreditCard className="h-4 w-4 text-navy" />
                )}
                <p className="font-semibold text-navy">{method.name}</p>
              </div>
              <p className="text-sm text-slate-600 mt-1">{method.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="rounded-full" onClick={prevStep}>
          Back
        </Button>
        <Button className="rounded-full" onClick={nextStep} disabled={!paymentMethod}>
          Review Order
        </Button>
      </div>
    </div>
  );
}
