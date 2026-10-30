'use client';

import { Check, Gift, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function RefereePromoRibbon() {
  const [code, setCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState('Friend');
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('jiivaa_referee_ribbon_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const urlRef = searchParams.get('ref');
    let cookieRef = '';
    const match = document.cookie.match(/jiivaa_referral_code=([^;]+)/);
    if (match && match[1]) {
      cookieRef = decodeURIComponent(match[1]);
    }

    const activeCode = (urlRef || cookieRef || '').trim().toUpperCase();

    if (activeCode && activeCode.startsWith('JIIVAA-')) {
      setCode(activeCode);

      fetch(`/api/v1/referral/resolve?code=${encodeURIComponent(activeCode)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setReferrerName(res.data.referrerName || 'Friend');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jiivaa_referee_ribbon_dismissed', 'true');
    }
  };

  if (!mounted || isDismissed || !code) return null;

  return (
    <aside
      aria-label="Welcome referral discount offer"
      className="bg-gradient-to-r from-navy via-[#112d54] to-navy text-white text-[11px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-4 border-b border-navy/40 relative z-40 overflow-hidden transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-2 relative">
        {/* Continuous Scrolling Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee flex items-center whitespace-nowrap will-change-transform py-0.5">
            <div className="flex items-center gap-2 pr-12">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange/20 text-orange flex items-center justify-center shrink-0">
                <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange" />
              </span>
              <span>
                <strong className="text-orange font-black">₹150 OFF Welcome Gift:</strong> Invited
                by <span className="font-bold underline decoration-orange/60">{referrerName}</span>{' '}
                with code{' '}
                <strong className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-black">
                  {code}
                </strong>{' '}
                (Auto-applies in Bag on orders ₹999+) • Claim your boutique fashion perks today!
              </span>
            </div>

            {/* Duplicate for seamless infinite loop */}
            <div className="flex items-center gap-2 pr-12" aria-hidden="true">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange/20 text-orange flex items-center justify-center shrink-0">
                <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange" />
              </span>
              <span>
                <strong className="text-orange font-black">₹150 OFF Welcome Gift:</strong> Invited
                by <span className="font-bold underline decoration-orange/60">{referrerName}</span>{' '}
                with code{' '}
                <strong className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-black">
                  {code}
                </strong>{' '}
                (Auto-applies in Bag on orders ₹999+) • Claim your boutique fashion perks today!
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Right-Side Controls: CTA Button + Dismiss Button */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 pl-3 bg-gradient-to-l from-[#112d54] via-[#112d54] to-transparent z-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 font-black text-white bg-orange hover:bg-orange-600 active:scale-95 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Use ₹150</span>
            <span>&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
