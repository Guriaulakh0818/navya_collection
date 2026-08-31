'use client';

import { ArrowRight, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { useCheckout } from '../context/checkout-context';
import type { PaymentMethod } from '../types';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    description: 'Pay cash when your parcel is delivered to your doorstep.',
  },
  {
    id: 'online',
    name: 'Pay Online (UPI / Cards / NetBanking)',
    description: 'Instant, 100% secure payment via Razorpay, GooglePay, PhonePe, Cards.',
  },
];

export function PaymentStep() {
  const { paymentMethod, setPaymentMethod, nextStep, prevStep } = useCheckout();
  const [selectedId, setSelectedId] = useState<string>(paymentMethod?.id || 'cod');

  // Auto-select COD on mount if no payment method selected yet
  useEffect(() => {
    if (!paymentMethod) {
      setPaymentMethod(PAYMENT_METHODS[0]);
    }
  }, [paymentMethod, setPaymentMethod]);

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id);
    setPaymentMethod(method);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">
          Select Payment Method
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Choose your preferred mode of payment to complete your order safely.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-3.5">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedId === method.id;
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
                name="payment"
                checked={isSelected}
                onChange={() => handleSelect(method)}
                className="mt-1 h-4 w-4 sm:h-4.5 sm:w-4.5 accent-orange cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                  {method.id === 'cod' ? (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-orange/10 flex items-center justify-center text-orange shrink-0">
                      <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-navy/10 flex items-center justify-center text-navy shrink-0">
                      <CreditCard className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-navy text-xs sm:text-base leading-tight">
                      {method.name}
                    </p>
                    {method.id === 'cod' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-0.5">
                        ✓ No extra COD fee
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 sm:mt-2 leading-relaxed">
                  {method.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Trust Badge Callout */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
        <span>Your transaction is encrypted with 256-bit SSL banking grade security.</span>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm px-3.5 sm:px-6 h-11 shrink-0 cursor-pointer"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          disabled={!paymentMethod}
          className="flex-1 sm:flex-initial rounded-full bg-orange hover:bg-orange-hover text-white font-extrabold text-xs sm:text-base px-3.5 sm:px-8 h-11 sm:h-12 shadow-lg shadow-orange/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <span className="truncate">Continue to Final Review</span>
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
