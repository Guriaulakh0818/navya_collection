'use client';

import { CheckCircle2, ChevronRight, Loader2, Percent, Tag, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { ActiveCoupon, AppliedCoupon } from '../types';

export type { ActiveCoupon, AppliedCoupon };

interface CouponInputCardProps {
  cartAmount: number;
  appliedCoupon?: AppliedCoupon | null;
  onApplySuccess: (coupon: AppliedCoupon) => void;
  onRemoveCoupon: () => void;
  className?: string;
}

interface StoreOffer {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  value: number;
  minCartValue?: number | null;
  firstOrderOnly?: boolean;
}

export const CouponInputCard: React.FC<CouponInputCardProps> = ({
  cartAmount,
  appliedCoupon,
  onApplySuccess,
  onRemoveCoupon,
  className = '',
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<ActiveCoupon[]>([]);
  const [activeOffers, setActiveOffers] = useState<StoreOffer[]>([]);

  useEffect(() => {
    async function fetchPromotionsAndCoupons() {
      try {
        const [couponsRes, offersRes] = await Promise.all([
          fetch('/api/v1/coupons').then((r) => r.json()).catch(() => ({})),
          fetch('/api/v1/offers/active').then((r) => r.json()).catch(() => ({})),
        ]);

        if (couponsRes?.success && Array.isArray(couponsRes.data)) {
          setActiveCoupons(couponsRes.data);
        }
        if (offersRes?.success && Array.isArray(offersRes?.data?.offers)) {
          setActiveOffers(offersRes.data.offers);
        }
      } catch {
        // Clean empty state
      }
    }
    fetchPromotionsAndCoupons();
  }, []);

  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  const executeApplyCode = async (targetCode: string) => {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setApplyingCode(cleanCode);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartAmount }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSuccessMsg(json.message || 'Coupon applied!');
        onApplySuccess(json.data);
        setCode('');
        setShowCouponsModal(false);
      } else {
        setErrorMsg(json.message || 'Failed to apply coupon.');
      }
    } catch {
      setErrorMsg('Network error applying coupon.');
    } finally {
      setIsLoading(false);
      setApplyingCode(null);
    }
  };

  const handleApplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    executeApplyCode(code);
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await fetch('/api/v1/coupons/remove', { method: 'POST' });
      onRemoveCoupon();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* If Coupon Applied: Display Pure Light Emerald High-Contrast Active Coupon Card */}
      {appliedCoupon ? (
        <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3 sm:p-4 flex items-center justify-between gap-2.5 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-600 text-white font-extrabold shadow-xs">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-black text-emerald-950 text-xs sm:text-base tracking-wider truncate">
                  {appliedCoupon.code}
                </span>
                <span className="text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 rounded-full bg-emerald-700 text-white shadow-xs shrink-0">
                  SAVED ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-800 font-extrabold mt-0.5 sm:mt-1 truncate">
                {appliedCoupon.title || `₹${appliedCoupon.discountAmount} Discount Applied`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="text-[11px] sm:text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            Remove
          </button>
        </div>
      ) : (
        /* If No Coupon Applied: Input Form & Available Coupons trigger */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-navy">
              Have a Promo Code?
            </label>
            {(activeCoupons.length > 0 || activeOffers.length > 0) && (
              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-orange hover:text-orange-600 transition-colors bg-orange/10 px-2.5 py-1 rounded-full border border-orange/20 cursor-pointer"
              >
                <Tag className="h-3 w-3" />
                <span>View Offers ({activeCoupons.length + activeOffers.length})</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <form onSubmit={handleApplyForm} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter Code (if you have one)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="uppercase tracking-wider font-extrabold text-xs rounded-xl bg-white border-2 border-slate-300 text-slate-900 focus:border-navy"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !code.trim()}
              className="rounded-xl px-4 text-xs font-extrabold min-w-[80px] bg-orange hover:bg-orange-600 text-white shadow-sm cursor-pointer"
            >
              {isLoading && !applyingCode ? (
                <span className="inline-flex items-center gap-1.5 text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Applying...</span>
                </span>
              ) : (
                'Apply'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Error / Success Messages */}
      {errorMsg && (
        <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl shadow-xs">
          {errorMsg}
        </p>
      )}
      {successMsg && !appliedCoupon && (
        <p className="text-xs font-black text-emerald-900 bg-emerald-50 border-2 border-emerald-400 p-3.5 rounded-2xl shadow-sm flex items-center gap-2.5">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </p>
      )}

      {/* Available Active Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-navy/30 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-orange text-white flex items-center justify-center font-black shadow-md">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-navy">
                    Available Offers & Promotions
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Active store promotions & coupon codes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:text-navy hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close coupons picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {/* Active Configured Store Promotions */}
              {activeOffers.map((off) => {
                const minVal = Number(off.minCartValue || 0);
                const isEligible = cartAmount >= minVal;
                const shortFall = minVal - cartAmount;

                return (
                  <div
                    key={off.id}
                    className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-lg text-xs tracking-wider uppercase">
                          {off.firstOrderOnly ? 'First Order' : 'Store Deal'}
                        </span>
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Auto-Applied</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full">
                            Add ₹{shortFall.toLocaleString('en-IN')} more to unlock
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-extrabold text-navy text-xs pt-1">{off.title}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {off.description ||
                        `Automatic promotion on orders over ₹${minVal.toLocaleString('en-IN')}`}
                    </p>
                  </div>
                );
              })}

              {/* Active Coupons */}
              {activeCoupons.map((c) => {
                const isEligible = cartAmount >= c.minOrderAmount;
                const shortFall = c.minOrderAmount - cartAmount;
                const isThisApplying = applyingCode === c.code;

                return (
                  <div
                    key={c.id || c.code}
                    className={`rounded-2xl border-2 border-dashed p-4 transition-all ${
                      isEligible
                        ? 'border-orange/50 bg-orange-50/40 hover:border-orange shadow-xs'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white bg-navy px-3 py-1 rounded-xl text-xs tracking-widest shadow-xs">
                            {c.code}
                          </span>
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Eligible</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                              Add ₹{shortFall.toLocaleString('en-IN')} more
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-xs pt-1">{c.title}</h4>
                        <p className="text-xs text-slate-600 font-medium">{c.description}</p>
                      </div>

                      <Button
                        size="sm"
                        disabled={isLoading || !isEligible}
                        onClick={() => executeApplyCode(c.code)}
                        className="rounded-full px-4 text-xs font-extrabold bg-orange hover:bg-orange-600 text-white shadow-md shrink-0 cursor-pointer disabled:opacity-40"
                      >
                        {isThisApplying ? (
                          <span className="inline-flex items-center gap-1.5 text-white">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Applying...</span>
                          </span>
                        ) : (
                          'Apply Code'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {activeOffers.length === 0 && activeCoupons.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
                  No coupon codes needed! All current discounts apply automatically at checkout.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCouponsModal(false)}
                className="rounded-full text-xs font-bold px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
