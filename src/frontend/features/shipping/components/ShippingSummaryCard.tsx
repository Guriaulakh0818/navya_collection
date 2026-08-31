'use client';

import { CheckCircle2, Sparkles, Truck } from 'lucide-react';
import React from 'react';

import type { DeliveryMethod } from '@/features/checkout/types';

import type { ShippingCalculationData } from '../types';

export type { ShippingCalculationData };

interface ShippingSummaryCardProps {
  shippingData?: ShippingCalculationData | null;
  deliveryMethod?: DeliveryMethod | null;
  subtotal?: number;
  isLoading?: boolean;
  className?: string;
}

export const ShippingSummaryCard: React.FC<ShippingSummaryCardProps> = ({
  shippingData,
  deliveryMethod,
  subtotal = 0,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-2xl border border-slate-200 bg-slate-50/60 animate-pulse space-y-2 ${className}`}
      >
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-48 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!shippingData) {
    return (
      <div
        className={`p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 ${className}`}
      >
        Select an address to calculate shipping & delivery estimates.
      </div>
    );
  }

  // Non-serviceable Warning State
  if (!shippingData.isServiceable) {
    return (
      <div
        className={`p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 space-y-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 font-bold text-xs">
          <span>⚠️ Non-Serviceable Pincode</span>
          {shippingData.pincode && <span>({shippingData.pincode})</span>}
        </div>
        <p className="text-xs font-medium">
          Sorry, delivery is currently not available for this pincode. Please select or add an
          alternative delivery address.
        </p>
      </div>
    );
  }

  // Dynamic Delivery Calculation Based on Selected Delivery Method & Subtotal
  const activeMethodId = deliveryMethod?.id || 'express';
  const isSameDay = activeMethodId === 'same-day';
  const isStandard = activeMethodId === 'standard';

  const methodName =
    deliveryMethod?.name ||
    (isSameDay ? 'Same Day Delivery' : isStandard ? 'Standard Delivery' : 'Express Delivery');
  const deliveryDays =
    deliveryMethod?.estimatedDays ||
    (isSameDay ? 'Same day' : isStandard ? '5-7 business days' : '2-3 business days');
  const originalPrice = isSameDay ? 149 : isStandard ? 49 : 99;

  const isFirstOrderFree = Boolean(shippingData?.isFirstOrderFreeDelivery);
  const offerTitle = shippingData?.offerTitle;
  const guestOfferPrompt = shippingData?.guestOfferPrompt;

  const freeThreshold = isSameDay ? 1999 : 999;
  const isBaseFree = isSameDay ? subtotal >= 1999 : subtotal >= 999;
  const isFree =
    isBaseFree || isFirstOrderFree || (shippingData ? shippingData.shippingCharge === 0 : false);
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const savedAmount = isFree ? originalPrice : 0;
  const currentCharge = isFree ? 0 : originalPrice;

  return (
    <div
      className={`p-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-extrabold text-navy text-base flex items-center gap-1.5">
            <Truck className="h-4.5 w-4.5 text-navy shrink-0" />
            {methodName}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">
            Estimated Delivery: <strong className="text-navy font-extrabold">{deliveryDays}</strong>
          </span>
        </div>

        <div className="text-right">
          {isFree ? (
            <div>
              <span className="font-black text-emerald-600 text-base">FREE</span>
              {savedAmount > 0 && (
                <span className="text-[10px] block text-emerald-700 font-extrabold">
                  Saved ₹{savedAmount}
                </span>
              )}
            </div>
          ) : (
            <span className="font-black text-navy text-base">₹{currentCharge}</span>
          )}
        </div>
      </div>

      {/* Free Shipping Callout / Progress Pill / First Order Badge */}
      {isFirstOrderFree ? (
        <div className="text-xs font-black text-indigo-950 bg-indigo-100/90 border border-indigo-300 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{offerTitle || 'First order — Free delivery 🎉'}</span>
        </div>
      ) : isFree ? (
        <div className="text-xs font-black text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {isSameDay
              ? '🎉 You unlocked FREE Same Day Delivery!'
              : '✓ You unlocked FREE Shipping!'}
          </span>
        </div>
      ) : guestOfferPrompt ? (
        <div className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-2xl flex items-center justify-between shadow-xs">
          <span>🎁 {guestOfferPrompt}</span>
        </div>
      ) : remainingForFree > 0 ? (
        <div className="text-xs font-bold text-navy bg-white border border-slate-200 px-3.5 py-2 rounded-2xl flex items-center justify-between shadow-xs">
          <span>
            Add{' '}
            <strong className="text-orange font-black">
              ₹{remainingForFree.toLocaleString('en-IN')}
            </strong>{' '}
            more for FREE {isSameDay ? 'Same Day' : 'Express'} Shipping!
          </span>
        </div>
      ) : null}
    </div>
  );
};
