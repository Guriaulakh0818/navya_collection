'use client';

import { ArrowRight, ShoppingBag, Sparkles, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores';

export function CheckoutExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    // Only monitor exit-intent if cart has items and user hasn't dismissed yet
    if (!items || items.length === 0) return;

    const hasDismissed = sessionStorage.getItem('jiivaa_checkout_exit_dismissed');
    if (hasDismissed === 'true') return;

    let triggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered) return;
      // Triggers when mouse moves towards browser top / tabs / close button
      if (e.clientY <= 15) {
        triggered = true;
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [items]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('jiivaa_checkout_exit_dismissed', 'true');
  };

  const handleContinue = () => {
    setIsOpen(false);
    sessionStorage.setItem('jiivaa_checkout_exit_dismissed', 'true');
  };

  if (!isOpen || !items || items.length === 0) return null;

  const firstItem = items[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-orange/30 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Urgency Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange">
          <Sparkles className="w-7 h-7" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange/10 text-orange mb-2">
            Cart Reserved for 10 Minutes
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-navy leading-tight">
            Rukiye! Aapki Cart Items Chhut Rahi Hain 🛍️
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Ye handpicked boutique pieces high demand me hain. Abhi order complete karein aur
            paayein <span className="font-extrabold text-orange">50 Bonus Jiivaa Coins</span> apne
            wallet me!
          </p>
        </div>

        {/* Item Preview Card */}
        {firstItem && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
              {firstItem.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstItem.image}
                  alt={firstItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-navy truncate">{firstItem.name}</p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Qty: {firstItem.quantity} • ₹{firstItem.price}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleContinue}
            className="w-full rounded-2xl bg-orange hover:bg-orange/90 text-white font-extrabold text-sm py-3 shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            Complete My Order Now
            <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            onClick={handleDismiss}
            className="w-full text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition"
          >
            I will complete it later
          </button>
        </div>
      </div>
    </div>
  );
}
