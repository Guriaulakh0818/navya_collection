'use client';

import { Check, Coins, Copy, Gift, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { REWARDS_CONFIG } from '@/shared/config/rewards.config';
import { useAuthStore, useRewardsStore } from '@/stores';

interface RefereeWelcomeModalProps {
  /** Optional override for referral code */
  referralCode?: string;
}

export function RefereeWelcomeModal({ referralCode: propCode }: RefereeWelcomeModalProps) {
  const user = useAuthStore((s) => s.user);
  const addCoins = useRewardsStore((s) => s.addCoins);

  const [isOpen, setIsOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [referrerName, setReferrerName] = useState('A Boutique Friend');
  const [discountInr, setDiscountInr] = useState(50);
  const [minOrderInr, setMinOrderInr] = useState(499);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessClaim, setIsSuccessClaim] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const p1 = new window.Image();
      p1.src = '/brand/jiivaa/crops/journey/01-welcome.png';
      const p2 = new window.Image();
      p2.src = '/brand/jiivaa/crops/journey/13-success.png';
    }
    if (typeof window === 'undefined') return;

    // 1. Check if user just signed up or should see referral popup
    const justSignedUpSession = sessionStorage.getItem('jiivaa_just_signed_up') === 'true';
    const justSignedUpLocal = localStorage.getItem('jiivaa_show_referral_prompt') === 'true';
    const cookiePromptMatch = document.cookie.match(/jiivaa_just_signed_up=true/);
    const isSignupPrompt = justSignedUpSession || justSignedUpLocal || Boolean(cookiePromptMatch);

    // 2. Extract active code from URL, cookie, or prop
    const searchParams = new URLSearchParams(window.location.search);
    const urlRef = searchParams.get('ref') || propCode;
    let cookieRef = '';
    const match = document.cookie.match(/jiivaa_referral_code=([^;]+)/);
    if (match && match[1]) {
      cookieRef = decodeURIComponent(match[1]);
    }

    const rawCode = (urlRef || cookieRef || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    if (rawCode) {
      setInputCode(rawCode);
    }

    // 3. Determine whether to show modal
    const alreadyGreeted = sessionStorage.getItem(
      `jiivaa_referee_welcomed_${rawCode || 'generic'}`,
    );

    if (isSignupPrompt || (rawCode && (!alreadyGreeted || urlRef))) {
      // Fetch live info if code already present
      if (rawCode) {
        fetch(`/api/v1/referral/resolve?code=${encodeURIComponent(rawCode)}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) {
              setReferrerName(res.data.referrerName || 'A Boutique Friend');
              if (res.data.discountInr) setDiscountInr(Number(res.data.discountInr));
              if (res.data.minOrderInr) setMinOrderInr(Number(res.data.minOrderInr));
            }
          })
          .catch(() => {});
      }

      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [propCode]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jiivaa_just_signed_up');
      localStorage.removeItem('jiivaa_show_referral_prompt');
      document.cookie = 'jiivaa_just_signed_up=; max-age=0; path=/';
      sessionStorage.setItem(`jiivaa_referee_welcomed_${inputCode || 'generic'}`, 'true');
    }
  };

  const handleApplyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCode
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    if (!clean) {
      setErrorMessage('Please enter a referral code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clean,
          friendName: user?.name || user?.email || 'New Friend',
          userId: user?.id,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        // If guest user applied code, celebrate code applied and prompt login
        if (json.isGuest || !user?.id) {
          setIsSuccessClaim(true);
          if (json.data?.referrerName) setReferrerName(json.data.referrerName);
          if (json.data?.discountInr) setDiscountInr(json.data.discountInr);
          return;
        }

        // Authenticated user: synchronize authoritative loyalty balance from server
        // NEVER blindly add +500 locally to prevent 500 + 500 = 1,000 double counting
        try {
          const loyaltyRes = await fetch('/api/v1/rewards/loyalty');
          const loyaltyJson = await loyaltyRes.json();
          if (loyaltyJson?.success && loyaltyJson?.data) {
            useRewardsStore.getState().setLoyaltyData({
              coins: loyaltyJson.data.balance,
              lifetimeCoins: loyaltyJson.data.lifetimeEarned,
              activities: Array.isArray(loyaltyJson.data.transactions)
                ? loyaltyJson.data.transactions.map((tx: any) => ({
                    id: String(tx.id),
                    amount: Number(tx.amount) || 0,
                    type: tx.type,
                    description: tx.description || 'Jiivaa Coin Activity',
                    date: tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently',
                  }))
                : [],
            });
          } else {
            useRewardsStore.getState().setLoyaltyData({
              coins: json.data?.coinsCredited || 500,
            });
          }
        } catch {
          useRewardsStore.getState().setLoyaltyData({
            coins: json.data?.coinsCredited || 500,
          });
        }

        if (json.data?.referrerName) {
          setReferrerName(json.data.referrerName);
        }
        if (json.data?.discountInr) {
          setDiscountInr(json.data.discountInr);
        }

        setIsSuccessClaim(true);

        // Clear prompt flags
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('jiivaa_just_signed_up');
          localStorage.removeItem('jiivaa_show_referral_prompt');
          document.cookie = 'jiivaa_just_signed_up=; max-age=0; path=/';
          sessionStorage.setItem(`jiivaa_referee_welcomed_${clean}`, 'true');
        }
      } else {
        setErrorMessage(json.message || 'Invalid referral code. Please check and try again.');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inputCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy/65 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[420px] sm:max-w-[460px] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6EB] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-orange/20 overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Radial Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 p-5 sm:p-7 text-center space-y-4">
          {/* Mascot Art */}
          <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
            <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-2xl pointer-events-none scale-110" />

            <Image
              src={
                isSuccessClaim
                  ? '/brand/jiivaa/crops/journey/13-success.png'
                  : '/brand/jiivaa/crops/journey/01-welcome.png'
              }
              alt="Jiivaa Rewards Welcome"
              width={160}
              height={170}
              className="relative z-10 w-auto h-full max-h-[130px] sm:max-h-[145px] object-contain drop-shadow-lg select-none transition-transform duration-300 hover:scale-105"
              unoptimized
              priority
              loading="eager"
            />

            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-md animate-bounce duration-1000">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Success View */}
          {isSuccessClaim ? (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bonus Claimed Successfully!</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-navy tracking-tight leading-tight">
                🎉 +500 Jiivaa Coins Credited!
              </h2>

              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Aapke wallet me <strong>500 Jiivaa Coins (₹{discountInr} discount value)</strong>{' '}
                add ho gaye hain! Aap ise kisi bhi <strong>₹{minOrderInr}+</strong> ki shopping par
                use kar sakte hain.
              </p>

              {/* Highlight Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">
                    🪙
                  </div>
                  <div>
                    <div className="font-black text-navy text-sm">500 Jiivaa Coins</div>
                    <div className="text-[11px] text-slate-500">
                      ₹{discountInr} Shopping Credit Ready
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  Available in Wallet
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-orange hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <span>Shop Now & Use Coins &rarr;</span>
              </button>
            </div>
          ) : (
            /* Input / Prompt View */
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-[11px] font-black uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-orange" />
                <span>Special Welcome Gift</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-navy tracking-tight leading-tight">
                Have a Referral Code? 🎁
              </h2>

              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Apne friend ka referral code enter karein aur paayein{' '}
                <strong className="text-orange font-black">500 Jiivaa Coins</strong> (Flat ₹
                {discountInr} OFF on ₹{minOrderInr}+ order)!
              </p>

              {/* Input Form */}
              <form onSubmit={handleApplyCode} className="space-y-3 text-left">
                <div>
                  <label
                    htmlFor="referral-input-code"
                    className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Referral Code
                  </label>
                  <div className="relative">
                    <input
                      id="referral-input-code"
                      type="text"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setErrorMessage(null);
                      }}
                      placeholder="e.g. GURVI3FA"
                      maxLength={15}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange focus:ring-2 focus:ring-orange/20 font-mono font-black text-navy uppercase text-sm tracking-widest placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 bg-white transition-all shadow-inner"
                      autoFocus={!inputCode}
                    />
                    {inputCode && (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-navy rounded bg-slate-100 cursor-pointer"
                        title="Copy code"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  {errorMessage && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 pl-1">
                      ⚠️ {errorMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inputCode.trim()}
                  className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Applying Code...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Apply & Claim 500 Coins 🪙</span>
                    </>
                  )}
                </button>
              </form>

              {/* Skip Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  I don&apos;t have a code &bull; Skip for now
                </button>
              </div>

              {/* 3 Value Badges */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] text-slate-600 pt-2 border-t border-slate-100">
                <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-extrabold text-navy">🪙 500 Coins</div>
                  <div className="text-[9px] text-slate-500">₹50 Wallet Value</div>
                </div>
                <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-extrabold text-navy">🛍️ ₹499+ Order</div>
                  <div className="text-[9px] text-slate-500">Applicable Cart</div>
                </div>
                <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-extrabold text-navy">✨ Instant</div>
                  <div className="text-[9px] text-slate-500">Auto in Wallet</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
