'use client';

import {
  Award,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Gift,
  HelpCircle,
  History,
  PartyPopper,
  Share2,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useRewardsSettings } from '@/frontend/features/rewards/hooks/useRewardsSettings';
import { LOYALTY_TIERS, LoyaltyTier, REWARDS_CONFIG } from '@/shared/config/rewards.config';
import { useAuthStore, useRewardsStore } from '@/stores';

export default function RewardsAccountPage() {
  const { settings } = useRewardsSettings();
  const user = useAuthStore((s) => s.user);
  const coins = useRewardsStore((s) => s.coins);
  const lifetimeCoins = useRewardsStore((s) => s.lifetimeCoins);
  const activities = useRewardsStore((s) => s.activities);
  const claimedCoupons = useRewardsStore((s) => s.claimedCoupons);
  const claimTierCoupon = useRewardsStore((s) => s.claimTierCoupon);
  const getCurrentTier = useRewardsStore((s) => s.getCurrentTier);
  const getNextTier = useRewardsStore((s) => s.getNextTier);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<LoyaltyTier | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTier = mounted ? getCurrentTier() : LOYALTY_TIERS[0];
  const {
    tier: nextTier,
    coinsNeeded,
    progressPct,
  } = mounted ? getNextTier() : { tier: LOYALTY_TIERS[1], coinsNeeded: 550, progressPct: 45 };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleClaim = (tier: LoyaltyTier) => {
    claimTierCoupon(tier.id, tier.couponCode, tier.discountPct);
    setSelectedMilestone(tier);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Jiivaa VIP Rewards' },
        ]}
        className="py-1"
      />

      {/* Hero Presentation Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#112d54] to-navy text-white p-6 sm:p-8 shadow-xl border border-navy/40">
        {/* Subtle Decorative Elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Text & Stats Column */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange animate-pulse" />
              <span>Jiivaa VIP Rewards Club</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Namaste, {user?.name?.split(' ')[0] || 'Fashion Insider'}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md font-medium">
                Har purchase par Jiivaa Coins earn karein aur exclusive boutique tiers unlock
                karein.
              </p>
            </div>

            {/* Live Coin Balance Card */}
            <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-4 p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center shadow-md shadow-orange/30">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-300 font-semibold">Available Coins</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                    {mounted ? coins.toLocaleString('en-IN') : '0'}
                    <span className="text-xs text-white/80 font-normal ml-1">Coins</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-white/20" />

              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="text-xs text-slate-300 font-semibold">Discount Worth</div>
                  <div className="text-base sm:text-lg font-bold text-white">
                    ≈ ₹{mounted ? Math.round(coins * settings.coinToInrRatio) : 0}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-white/20" />

              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="text-xs text-slate-300 font-semibold">Current Tier</div>
                  <div className="text-sm sm:text-base font-extrabold text-orange">
                    {currentTier.badge}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <Button
                asChild
                className="rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs px-6 shadow-md shadow-orange/25"
              >
                <Link href="/shop">Shop &amp; Earn Coins &rarr;</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10 text-xs font-bold"
              >
                <Link href="/referral">
                  Refer a Friend (Get ₹{settings.referralReferrerBonusInr})
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Mascot Column */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* Backlight Ambient Glow */}
              <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-2xl pointer-events-none scale-90" />
              <Image
                src={REWARDS_CONFIG.assets.vipRewardsMascot}
                alt="Jiivaa Celebration Mascot"
                width={200}
                height={210}
                priority
                className="relative z-10 w-auto h-full max-h-[175px] sm:max-h-[200px] object-contain drop-shadow-xl select-none transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progress Milestone Journey */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-orange" />
              <span>Jiivaa VIP Tier Journey</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Unlock higher discount codes, free shipping &amp; exclusive boutique perks as your
              lifetime coins grow.
            </p>
          </div>

          {nextTier && (
            <div className="px-3.5 py-1.5 rounded-full bg-orange/10 border border-orange/20 text-orange text-xs font-extrabold">
              {coinsNeeded} Coins to {nextTier.badge}
            </div>
          )}
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>
              Current: {currentTier.name} ({mounted ? lifetimeCoins : 450} Lifetime Coins)
            </span>
            <span>
              {nextTier
                ? `Next: ${nextTier.name} (${nextTier.minCoins} Coins)`
                : 'Highest Tier Reached 🎉'}
            </span>
          </div>
          <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-orange to-amber-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 4 Tier Milestone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {LOYALTY_TIERS.map((tier) => {
            const isUnlocked = (mounted ? lifetimeCoins : 450) >= tier.minCoins;
            const isCurrent = currentTier.id === tier.id;
            const isClaimed = claimedCoupons.some((c) => c.tierId === tier.id);

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-orange shadow-md bg-orange/5 ring-2 ring-orange/20'
                    : isUnlocked
                      ? 'border-slate-200 bg-white shadow-xs'
                      : 'border-slate-200/60 bg-slate-50/50 opacity-75'
                }`}
              >
                {/* Current Badge */}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-4 bg-orange text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                    Active Tier
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{tier.badge.split(' ')[0]}</span>
                    <span className="text-xs font-extrabold text-slate-500">
                      {tier.minCoins}+ Coins
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-navy">{tier.name}</h3>
                    {tier.discountPct > 0 && (
                      <div className="text-xs font-black text-orange mt-0.5">
                        Flat {tier.discountPct}% Milestone Coupon
                      </div>
                    )}
                  </div>

                  {/* Perks list */}
                  <ul className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestone Coupon Action */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  {tier.discountPct === 0 ? (
                    <div className="text-center text-[11px] font-bold text-slate-400 py-1.5">
                      Starter Member
                    </div>
                  ) : isUnlocked ? (
                    isClaimed ? (
                      <div className="flex items-center justify-between bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
                        <span className="font-mono text-xs font-extrabold text-navy">
                          {tier.couponCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(tier.couponCode)}
                          className="text-xs text-orange hover:text-orange-600 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode === tier.couponCode ? (
                            <span className="text-emerald-600 text-[10px]">Copied!</span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(tier)}
                        className="w-full rounded-xl bg-orange hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                      >
                        Claim {tier.discountPct}% Coupon 🎉
                      </Button>
                    )
                  ) : (
                    <div className="text-center text-[11px] font-bold text-slate-400 py-1.5 flex items-center justify-center gap-1">
                      <span>Unlock at {tier.minCoins} Coins</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ways to Earn Coins Grid */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>How to Earn More Jiivaa Coins</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect coins effortlessly as you shop, review, and invite friends to JiivaaKart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">
              🛍️
            </div>
            <h3 className="font-extrabold text-sm text-navy">Shop Boutique Styles</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Har ₹1 spent par automatic 1 Coin aapke wallet me add hoga delivery ke baad.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              📲
            </div>
            <h3 className="font-extrabold text-sm text-navy">Refer a Friend</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Friend ko Flat ₹{settings.referralRefereeDiscountInr} OFF milega, aur unke order
              deliver hote hi aapko {settings.referralReferrerBonusCoins} Coins (₹
              {settings.referralReferrerBonusInr}) milenge.
            </p>
            <Link
              href="/referral"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline pt-1"
            >
              Share link &rarr;
            </Link>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ⭐
            </div>
            <h3 className="font-extrabold text-sm text-navy">Verified Photo Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apne outfit ki styling photo aur review post karein aur paayein +
              {settings.reviewBonusCoins} Coins bonus.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              🎂
            </div>
            <h3 className="font-extrabold text-sm text-navy">Birthday Treat</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apne birthday month me direct 500 Coins aur special 20% discount coupon paayein.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Log / Passbook */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <span>Coins Passbook &amp; History</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {mounted ? activities.length : 0} Transactions
          </span>
        </div>

        {mounted && activities.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">
              Abhi tak koi coin transactions nahi hain
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Verified boutiques se shopping karein ya apne dosto ko invite karein — har delivery
              par coins automatically add honge!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(mounted ? activities : []).map((act) => (
              <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      act.amount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {act.amount > 0 ? '+' : '-'}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-navy">
                      {act.description}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">{act.date}</div>
                  </div>
                </div>

                <div
                  className={`text-sm sm:text-base font-black shrink-0 ${
                    act.amount > 0 ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {act.amount > 0 ? `+${act.amount}` : act.amount} Coins
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Modal when Tier is claimed */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Mascot modal element */}
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <Image
                src={REWARDS_CONFIG.assets.vipRewardsMascot}
                alt="Jiivaa Celebration"
                width={120}
                height={130}
                className="relative z-10 w-auto h-full object-contain drop-shadow-md select-none"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange/10 text-orange text-[10px] font-black uppercase">
                <PartyPopper className="w-3.5 h-3.5 text-orange" />
                <span>Tier Milestone Unlocked!</span>
              </div>
              <h3 className="text-xl font-extrabold text-navy tracking-tight">
                Badhai Ho! {selectedMilestone.name}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jiivaa ne aapka exclusive <strong>{selectedMilestone.discountPct}% OFF</strong>{' '}
                coupon code unlock kar diya hai:
              </p>
            </div>

            {/* Code Copy Box */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-2 border-dashed border-orange">
              <span className="font-mono text-base font-black text-navy tracking-wider">
                {selectedMilestone.couponCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(selectedMilestone.couponCode)}
                className="px-3 py-1.5 rounded-xl bg-orange hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === selectedMilestone.couponCode ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                asChild
                className="rounded-full bg-navy hover:bg-navy/90 text-white font-extrabold text-xs py-2.5"
                onClick={() => setSelectedMilestone(null)}
              >
                <Link href="/shop">Start Shopping with Discount &rarr;</Link>
              </Button>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="text-xs text-slate-500 hover:text-navy font-bold py-1 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
