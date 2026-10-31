'use client';

import { Check, Copy, Gift, ShoppingBag, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { REWARDS_CONFIG } from '@/shared/config/rewards.config';

interface RefereeWelcomeModalProps {
  /** Optional override for referral code */
  referralCode?: string;
}

export function RefereeWelcomeModal({ referralCode: propCode }: RefereeWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [referrerName, setReferrerName] = useState('A Boutique Friend');
  const [discountInr, setDiscountInr] = useState(150);
  const [minOrderInr, setMinOrderInr] = useState(999);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // 1. Get referral code from prop, search param, or cookie
    const searchParams = new URLSearchParams(window.location.search);
    const urlRef = searchParams.get('ref') || propCode;
    let cookieRef = '';
    const match = document.cookie.match(/jiivaa_referral_code=([^;]+)/);
    if (match && match[1]) {
      cookieRef = decodeURIComponent(match[1]);
    }

    const activeCode = (urlRef || cookieRef || '').trim().toUpperCase();

    if (activeCode && activeCode.startsWith('JIIVAA-')) {
      setCode(activeCode);

      // Check if already greeted for this specific code in this session
      const storageKey = `jiivaa_referee_welcomed_${activeCode}`;
      const alreadyGreeted = sessionStorage.getItem(storageKey);

      // If user came via link or hasn't seen greeting in this session
      if (!alreadyGreeted || urlRef) {
        // Record claim event immediately so referrer's dashboard updates in real-time
        fetch('/api/v1/referral/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: activeCode, friendName: 'Friend via Link' }),
        }).catch(() => {});

        // Fetch or resolve referrer name and live discount parameters
        fetch(`/api/v1/referral/resolve?code=${encodeURIComponent(activeCode)}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) {
              setReferrerName(res.data.referrerName || 'A Boutique Friend');
              if (res.data.discountInr) setDiscountInr(Number(res.data.discountInr));
              if (res.data.minOrderInr) setMinOrderInr(Number(res.data.minOrderInr));
            }
          })
          .catch(() => {
            // Friendly fallback
            setReferrerName('A Boutique Friend');
          })
          .finally(() => {
            // Delay slightly for smooth page entrance
            setTimeout(() => {
              setIsOpen(true);
            }, 600);
          });
      }
    }
  }, [propCode]);

  const handleClose = () => {
    setIsOpen(false);
    if (code && typeof window !== 'undefined') {
      sessionStorage.setItem(`jiivaa_referee_welcomed_${code}`, 'true');
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!mounted || !isOpen || !code) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy/65 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[420px] sm:max-w-[480px] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6EB] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-orange/20 overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Ambient Radial Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
          aria-label="Close welcome modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 p-5 sm:p-7 text-center space-y-4">
          {/* Jiivaa Mascot Welcome Art */}
          <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
            {/* Mascot Backlight */}
            <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-2xl pointer-events-none scale-110" />

            <Image
              src="/brand/jiivaa/crops/journey/01-welcome.png"
              alt="Jiivaa - Welcome Friend"
              width={160}
              height={170}
              className="relative z-10 w-auto h-full max-h-[140px] sm:max-h-[160px] object-contain drop-shadow-lg select-none transition-transform duration-300 hover:scale-105"
              priority
            />

            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-md animate-bounce duration-1000">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Header & Personalization */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-[11px] font-black uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 text-orange" />
              <span>Special Friend Invite</span>
            </div>

            <h2 className="font-heading text-xl sm:text-2xl font-black text-navy tracking-tight leading-tight">
              {referrerName} Ne Aapko <br />
              <span className="text-orange">₹{discountInr} OFF</span> Gift Kiya Hai! 🎉
            </h2>

            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              Welcome to <strong>JiivaaKart</strong>! Discover real designer fashion from verified
              local boutiques across India.
            </p>
          </div>

          {/* Highlighted Coupon Card */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange/5 to-amber-50/50 border border-amber-200/90 p-3.5 text-left space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-navy flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange" />
                Welcome Referral Coupon
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] tracking-wide">
                Auto-Applies in Bag
              </span>
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl border border-dashed border-amber-300 p-2.5">
              <div>
                <span className="font-mono font-black text-sm text-navy tracking-wider block">
                  {code}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Flat ₹{discountInr} OFF on orders above ₹{minOrderInr}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 font-bold" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Quick Value Bullets */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] text-slate-600 pt-1">
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-extrabold text-navy">👗 Local Stores</div>
              <div className="text-[9px] text-slate-500">Real Boutique Styles</div>
            </div>
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-extrabold text-navy">🚚 Express Ship</div>
              <div className="text-[9px] text-slate-500">Pan-India Delivery</div>
            </div>
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-extrabold text-navy">🪙 Jiivaa Coins</div>
              <div className="text-[9px] text-slate-500">Earn on every order</div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-orange hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Claim ₹{discountInr} & Explore Boutique Stores &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
