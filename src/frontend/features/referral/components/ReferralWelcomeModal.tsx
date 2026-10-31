'use client';

import {
  Check,
  Coins,
  Copy,
  Gift,
  Link as LinkIcon,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useRewardsSettings } from '@/frontend/features/rewards/hooks/useRewardsSettings';
import { generateUniqueReferralCode, REWARDS_CONFIG } from '@/shared/config/rewards.config';
import { useAuthStore, useRewardsStore } from '@/stores';

interface ReferralWelcomeModalProps {
  /** If provided, overrides internal open state */
  isOpen?: boolean;
  onClose?: () => void;
  /** Delay in milliseconds before automatically showing on initial page load (default 1800ms) */
  autoShowDelayMs?: number;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function ReferralWelcomeModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  autoShowDelayMs = 1800,
}: ReferralWelcomeModalProps) {
  const { settings } = useRewardsSettings();
  const user = useAuthStore((s) => s.user);
  const referralCode = useRewardsStore((s) => s.referralCode);
  const isStoreModalOpen = useRewardsStore((s) => s.isWelcomeModalOpen);
  const closeStoreModal = useRewardsStore((s) => s.closeWelcomeModal);

  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);
  const [originUrl, setOriginUrl] = useState('http://localhost:3000');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);

      // Check URL query param ?ref_popup=1 or ?referral_modal=1
      const params = new URLSearchParams(window.location.search);
      const forcePopup = params.get('ref_popup') === '1' || params.get('referral_modal') === '1';

      if (forcePopup) {
        setIsOpen(true);
        return;
      }

      // Check session storage to show once per session on arrival
      const hasSeen = sessionStorage.getItem('jiivaa_referral_popup_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, autoShowDelayMs);
        return () => clearTimeout(timer);
      }
    }
  }, [autoShowDelayMs]);

  // Sync with prop or store state if controlled externally
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    } else if (isStoreModalOpen) {
      setIsOpen(true);
    }
  }, [propIsOpen, isStoreModalOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jiivaa_referral_popup_seen', 'true');
    }
    closeStoreModal();
    if (propOnClose) propOnClose();
  }, [closeStoreModal, propOnClose]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const shareCode = user
    ? generateUniqueReferralCode(user.id, user.name || user.mobile)
    : referralCode || 'JIIVAA-STYLE';
  const shareUrl = `${originUrl}/r/${shareCode}`;
  const whatsAppText = REWARDS_CONFIG.getWhatsAppShareText(
    shareCode,
    shareUrl,
    settings.referralRefereeDiscountInr,
  );
  const whatsAppLink = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleInstagramShare = () => {
    const instaMessage = `👗✨ Style that speaks! Shop verified local Indian boutiques on JiivaaKart.\nUse my code ${shareCode} for FLAT ₹${settings.referralRefereeDiscountInr} OFF on your first order: ${shareUrl}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(instaMessage);
      setCopiedInstagram(true);
      setTimeout(() => setCopiedInstagram(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'JiivaaKart - Refer & Earn ₹150',
          text: `Use my invite code ${shareCode} to get ₹150 OFF on JiivaaKart boutique fashion!`,
          url: shareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (!mounted) return null;

  // When modal is closed, show a neat floating pill launcher in the corner
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-40 hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-orange/25 shadow-lg shadow-orange/15 hover:shadow-orange/25 text-xs font-black text-navy hover:text-orange transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Open Refer & Earn"
        aria-label="Open Refer and Earn rewards popup"
      >
        <Gift className="w-3.5 h-3.5 text-orange animate-pulse" />
        <span>Refer & Earn (₹{settings.referralRefereeDiscountInr})</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-[440px] md:max-w-[760px] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6EB] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-orange/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
          aria-label="Close referral popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col md:flex-row items-stretch">
          {/* LEFT SIDE: Content, Value Props & Actions */}
          <div className="flex-1 p-5 sm:p-7 md:p-8 flex flex-col justify-between space-y-4 sm:space-y-5">
            {/* Header: Pill & Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 border border-orange/25 text-orange text-[11px] font-black uppercase tracking-wider shadow-2xs">
                <Gift className="w-3.5 h-3.5 text-orange shrink-0" />
                <span>Refer & Earn</span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight leading-[1.15] text-navy">
                Invite Friends <br />
                <span className="text-orange">Earn Rewards</span>
              </h2>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium">
                Share JiivaaKart with your friends and get exciting rewards on every successful
                order!
              </p>
            </div>

            {/* DUAL VALUE PROPOSITION CARDS */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Left Card: Friend Benefit */}
              <div className="rounded-2xl bg-white border border-orange/20 shadow-xs p-3 text-center space-y-1 relative overflow-hidden transition-all hover:border-orange/40">
                <div className="w-8 h-8 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Your Friend Gets
                </div>
                <div className="text-lg sm:text-xl font-black text-orange leading-tight font-mono">
                  ₹{settings.referralRefereeDiscountInr} OFF
                </div>
                <div className="text-[10px] text-slate-500 font-medium">on their first order</div>
              </div>

              {/* Right Card: User Benefit */}
              <div className="rounded-2xl bg-white border border-amber-200 shadow-xs p-3 text-center space-y-1 relative overflow-hidden transition-all hover:border-amber-400">
                <div className="w-8 h-8 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  You Earn
                </div>
                <div className="text-lg sm:text-xl font-black text-navy leading-tight font-mono">
                  {settings.referralReferrerBonusCoins} Coins
                </div>
                <div className="text-[10px] text-slate-500 font-medium">after their delivery</div>
              </div>
            </div>

            {/* PRIMARY CTA: Sleek WhatsApp Button */}
            <div className="space-y-2">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#0A2342] hover:bg-[#112d54] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-navy/20 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span>Share on WhatsApp &rarr;</span>
              </a>

              {/* SECONDARY SHARING ICONS ROW */}
              <div className="flex items-center justify-around pt-1 px-1">
                {/* 1. Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Copy Invite Link"
                >
                  <div className="w-10 h-10 rounded-full border border-slate-200 bg-white group-hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs transition-transform group-hover:scale-105">
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-navy">
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>

                {/* 2. Direct WhatsApp */}
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Share via WhatsApp"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 group-hover:bg-[#25D366]/20 flex items-center justify-center text-[#25D366] shadow-xs transition-transform group-hover:scale-105">
                    <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700">
                    WhatsApp
                  </span>
                </a>

                {/* 3. Instagram Share */}
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Copy caption for Instagram"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] p-[1.5px] shadow-xs transition-transform group-hover:scale-105">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <InstagramIcon className="w-4 h-4 text-[#FD1D1D]" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-pink-600">
                    {copiedInstagram ? 'Copied!' : 'Instagram'}
                  </span>
                </button>

                {/* 4. More Options / Native Share */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="More sharing channels"
                >
                  <div className="w-10 h-10 rounded-full border border-slate-200 bg-white group-hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs transition-transform group-hover:scale-105">
                    <Share2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-navy">
                    More
                  </span>
                </button>
              </div>
            </div>

            {/* BOTTOM 3 TRUST HIGHLIGHTS */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-200/80 text-center">
              <div className="space-y-0.5">
                <div className="text-[11px] font-extrabold text-navy flex items-center justify-center gap-1">
                  <span className="text-orange text-xs">🎯</span> No Limits
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">Refer more, earn more</div>
              </div>

              <div className="space-y-0.5 border-x border-slate-200/80 px-1">
                <div className="text-[11px] font-extrabold text-navy flex items-center justify-center gap-1">
                  <span className="text-amber-500 text-xs">🪙</span> Real Cashback
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">After order delivery</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-extrabold text-navy flex items-center justify-center gap-1">
                  <span className="text-emerald-500 text-xs">⚡</span> Easy to Share
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">In 1 click</div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Mascot Illustration & Celebratory Atmosphere (Desktop + Tablet) */}
          <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-orange/10 via-amber-50/70 to-orange/5 p-6 flex-col items-center justify-center relative overflow-hidden border-l border-orange/10">
            {/* Floating Gold Coins Atmosphere */}
            <div className="absolute top-6 left-6 text-xl animate-bounce duration-1000 select-none">
              🪙
            </div>
            <div className="absolute top-12 right-8 text-sm select-none opacity-80">🪙</div>
            <div className="absolute bottom-16 left-8 text-base select-none opacity-90">🪙</div>
            <div className="absolute top-1/2 -right-2 text-2xl select-none opacity-75">🪙</div>

            {/* "Zyada Dost, Zyada Rewards!" Speech / Slogan Badge */}
            <div className="relative z-20 mb-2 self-end mr-2 bg-white/95 backdrop-blur-xs border border-orange/30 px-3 py-1.5 rounded-2xl rounded-br-xs shadow-md transform rotate-2">
              <p className="font-heading font-black text-xs text-orange tracking-tight flex items-center gap-1">
                <span>✨</span> Zyada Dost, Zyada Rewards!
              </p>
            </div>

            {/* Jiivaa Mascot Image */}
            <div className="relative z-10 w-full flex items-center justify-center">
              {/* Radial Glow behind Mascot */}
              <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-2xl pointer-events-none scale-110" />

              <Image
                src="/brand/jiivaa/crops/journey/11-share.png"
                alt="Jiivaa - Refer & Earn"
                width={260}
                height={290}
                className="relative z-10 w-auto h-56 lg:h-64 object-contain drop-shadow-xl select-none transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>

            {/* Gift Box Props Accent at bottom */}
            <div className="relative z-20 -mt-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-full px-3 py-1 shadow-xs text-[11px] font-bold text-navy">
              <span className="text-orange">🎁</span> Code:{' '}
              <span className="font-mono text-orange font-extrabold">{shareCode}</span>
            </div>
          </div>

          {/* MOBILE HEADER ACCENT (Shows on screens < md so mobile gets the mascot too!) */}
          <div className="md:hidden order-first bg-gradient-to-r from-orange/15 via-amber-50 to-orange/10 px-4 pt-4 pb-2 flex items-center justify-between border-b border-orange/10 relative">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/jiivaa/crops/journey/11-share.png"
                alt="Jiivaa Mascot"
                width={65}
                height={75}
                className="w-14 h-auto object-contain drop-shadow-sm select-none"
              />
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-orange block">
                  ✨ Zyada Dost, Zyada Rewards!
                </span>
                <span className="text-[10px] text-slate-600 block">
                  Invite code: <strong className="font-mono text-navy">{shareCode}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
