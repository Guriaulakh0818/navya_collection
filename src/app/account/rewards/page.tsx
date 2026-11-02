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
import { useAuthStore, useRewardsStore, type CoinActivity } from '@/stores';

export default function RewardsAccountPage() {
  const { settings } = useRewardsSettings();
  const user = useAuthStore((s) => s.user);
  const coins = useRewardsStore((s) => s.coins);
  const lifetimeCoins = useRewardsStore((s) => s.lifetimeCoins);
  const cumulativeSpendInCycle = useRewardsStore((s) => s.cumulativeSpendInCycle);
  const activities = useRewardsStore((s) => s.activities);
  const claimedCoupons = useRewardsStore((s) => s.claimedCoupons);
  const claimTierCoupon = useRewardsStore((s) => s.claimTierCoupon);
  const getCurrentTier = useRewardsStore((s) => s.getCurrentTier);
  const getNextTier = useRewardsStore((s) => s.getNextTier);
  const setLoyaltyData = useRewardsStore((s) => s.setLoyaltyData);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<LoyaltyTier | null>(null);
  const [nextOrderPerks, setNextOrderPerks] = useState<any[]>([]);
  const [cycleExpiryStr, setCycleExpiryStr] = useState<string>('');
  const [liveActivities, setLiveActivities] = useState<CoinActivity[] | null>(null);
  const [liveCoins, setLiveCoins] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/v1/rewards/loyalty')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;

          const liveTxs: CoinActivity[] = Array.isArray(d.transactions)
            ? d.transactions.map((tx: any) => ({
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
            : [];

          setLiveActivities(liveTxs);
          setLiveCoins(typeof d.balance === 'number' ? d.balance : 0);
          setLoyaltyData({
            coins: d.balance,
            lifetimeCoins: d.lifetimeEarned,
            cumulativeSpendInCycle: d.cumulativeSpendInCycle,
            cycleStartedAt: d.cycleStartedAt,
            activities: liveTxs,
          });
          if (Array.isArray(d.nextOrderPerks)) {
            setNextOrderPerks(d.nextOrderPerks);
          }
          if (d.cycleExpiresAt) {
            const exp = new Date(d.cycleExpiresAt);
            setCycleExpiryStr(
              exp.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
            );
          }
        }
      })
      .catch(() => {});
  }, [setLoyaltyData]);

  const currentTier = mounted ? getCurrentTier() : LOYALTY_TIERS[0];
  const {
    tier: nextTier,
    spendNeeded,
    progressPct,
  } = mounted ? getNextTier() : { tier: LOYALTY_TIERS[1], spendNeeded: 2500, progressPct: 0 };

  // Source activities from live API, falling back to store, with any legacy dummy items purged
  const rawActivities = liveActivities !== null ? liveActivities : activities;
  const cleanActivities = (mounted ? rawActivities : []).filter(
    (act) =>
      act.id !== 'act-1' &&
      act.id !== 'act-2' &&
      !act.description?.includes('Boutique Haul') &&
      !act.description?.includes('registered at JiivaaKart'),
  );

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#112d54] to-navy text-white p-5 sm:p-8 shadow-xl border border-navy/40">
        {/* Subtle Decorative Elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Main Content Column */}
          <div className="w-full flex-1 space-y-4">
            {/* Mobile Top Header: Greeting + Mascot Avatar */}
            <div className="flex items-center justify-between gap-3 md:hidden">
              <div className="space-y-1.5 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-orange text-[10px] font-black tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-orange animate-pulse" />
                  <span>Jiivaa VIP Club</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  Namaste, {user?.name?.split(' ')[0] || 'Fashion Insider'}!
                </h1>
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Har purchase par coins earn karein &amp; tiers unlock karein.
                </p>
              </div>

              {/* Mobile Mascot Badge with Warm Halo */}
              <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-end justify-center">
                <div className="absolute inset-0 bg-radial from-orange/35 via-orange/15 to-transparent rounded-full blur-lg pointer-events-none" />
                <Image
                  src={REWARDS_CONFIG.assets.vipRewardsMascot}
                  alt="Jiivaa Celebration Mascot"
                  width={96}
                  height={96}
                  unoptimized
                  priority
                  loading="eager"
                  className="relative z-10 w-auto h-full max-h-[85px] sm:max-h-[96px] object-contain drop-shadow-md select-none"
                />
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-orange animate-pulse" />
                <span>Jiivaa VIP Rewards Club</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                Namaste, {user?.name?.split(' ')[0] || 'Fashion Insider'}!
              </h1>
              <p className="text-slate-300 text-sm max-w-lg font-medium leading-relaxed">
                Har purchase par Jiivaa Coins earn karein aur exclusive boutique tiers unlock
                karein.
              </p>
            </div>

            {/* Live Coin Balance Card: 2x2 Grid with full text visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
              {/* Tile 1: Available Coins */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange flex items-center justify-center shrink-0 shadow-md shadow-orange/30">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap">
                    Available Coins
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-300 tracking-tight leading-tight flex items-baseline gap-1 mt-0.5">
                    {mounted
                      ? (liveCoins !== null ? liveCoins : coins).toLocaleString('en-IN')
                      : '0'}
                    <span className="text-[11px] text-white/70 font-normal">Coins</span>
                  </div>
                </div>
              </div>

              {/* Tile 2: Discount Worth */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300 font-black text-sm">
                  ₹
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap">
                    Discount Worth
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-300 tracking-tight leading-tight mt-0.5">
                    ≈ ₹
                    {mounted
                      ? Math.round(
                          (liveCoins !== null ? liveCoins : coins) * settings.coinToInrRatio,
                        )
                      : 0}
                  </div>
                </div>
              </div>

              {/* Tile 3: Current Tier */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-lg">
                  {currentTier.badge.split(' ')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap">
                    Current Tier
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-orange tracking-tight leading-tight whitespace-nowrap mt-0.5">
                    {currentTier.name}
                  </div>
                </div>
              </div>

              {/* Tile 4: 3-Yr Shopping Spend */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap">
                    3-Yr Shopping Spend
                  </div>
                  <div className="text-base sm:text-lg font-black text-white font-mono tracking-tight leading-tight mt-0.5">
                    ₹{mounted ? cumulativeSpendInCycle.toLocaleString('en-IN') : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <Button
                asChild
                className="w-full sm:w-auto rounded-xl sm:rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs py-2.5 sm:px-6 shadow-md shadow-orange/25"
              >
                <Link href="/shop" className="flex items-center justify-center gap-1.5">
                  <span>Shop &amp; Earn</span>
                  <span>&rarr;</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto rounded-xl sm:rounded-full bg-white/10 hover:bg-white/15 border-white/25 text-white text-xs font-bold py-2.5 sm:px-5"
              >
                <Link href="/referral" className="flex items-center justify-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  <span>Refer (Get ₹{settings.referralRefereeDiscountInr})</span>
                </Link>
              </Button>

              {cycleExpiryStr && (
                <div className="col-span-2 sm:col-span-1 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                    🔄 3-Yr Cycle Active (Till {cycleExpiryStr})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Mascot Column */}
          <div className="hidden md:flex shrink-0 items-center justify-center">
            <div className="relative w-44 h-44 lg:w-52 lg:h-52 flex items-center justify-center">
              {/* Backlight Ambient Glow */}
              <div className="absolute inset-0 bg-radial from-orange/30 via-orange/10 to-transparent rounded-full blur-2xl pointer-events-none scale-90" />
              <Image
                src={REWARDS_CONFIG.assets.vipRewardsMascot}
                alt="Jiivaa Celebration Mascot"
                width={200}
                height={210}
                unoptimized
                priority
                loading="eager"
                className="relative z-10 w-auto h-full max-h-[175px] lg:max-h-[200px] object-contain drop-shadow-xl select-none transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progress Milestone Journey */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Header Row */}
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange/10 flex items-center justify-center text-orange shrink-0">
              <Award className="w-4 h-4 text-orange" />
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-navy tracking-tight">
              Jiivaa VIP Tier Journey
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl font-medium leading-relaxed">
            Accumulate boutique purchases over 3 years to unlock welcome bonuses &amp; next-order
            discount perks.
          </p>
        </div>

        {/* Compact Spend Progress Showcase Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-orange/5 border border-slate-200/80 space-y-2.5">
          {/* Top Row: Current Tier & Target Breakdown */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{currentTier.badge.split(' ')[0]}</span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-navy truncate">
                  {currentTier.name}{' '}
                  <span className="text-slate-400 font-medium font-mono text-[11px]">
                    (₹{mounted ? cumulativeSpendInCycle.toLocaleString('en-IN') : 0} spend)
                  </span>
                </div>
              </div>
            </div>

            {nextTier ? (
              <div className="text-right shrink-0">
                <div className="text-[10px] font-extrabold text-orange uppercase tracking-wider">
                  Target: {nextTier.name}
                </div>
                <div className="text-xs font-black text-orange font-mono">
                  ₹{spendNeeded.toLocaleString('en-IN')} needed
                </div>
              </div>
            ) : (
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                🎉 Highest Tier
              </span>
            )}
          </div>

          {/* Progress Bar with Percentage and Target Milestones */}
          <div className="space-y-1">
            <div className="relative h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange to-amber-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium font-mono">
              <span>{Math.round(progressPct)}% achieved</span>
              <span>
                Target: ₹{nextTier ? nextTier.minSpendInr.toLocaleString('en-IN') : '50,000+'}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Tier Milestone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-2">
          {LOYALTY_TIERS.map((tier) => {
            const isUnlocked = (mounted ? cumulativeSpendInCycle : 0) >= tier.minSpendInr;
            const isCurrent = currentTier.id === tier.id;
            const isClaimed = claimedCoupons.some((c) => c.tierId === tier.id);

            const spendBadge =
              tier.minSpendInr === 0
                ? '₹0 – ₹2.5k'
                : tier.maxSpendInr
                  ? `₹${Math.round(tier.minSpendInr / 1000)}k – ₹${Math.round((tier.maxSpendInr + 1) / 1000)}k`
                  : '₹50k+';

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-orange shadow-md bg-orange/[0.04] ring-2 ring-orange/20'
                    : isUnlocked
                      ? 'border-slate-200 bg-white shadow-2xs'
                      : 'border-slate-200/70 bg-slate-50/60 opacity-80'
                }`}
              >
                {/* Current Badge */}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 bg-orange text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                    Active Tier
                  </span>
                )}

                <div className="space-y-2">
                  {/* Top: Icon + Spend range */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {tier.badge.split(' ')[0]}
                    </div>
                    <span
                      className="text-xs font-black text-slate-500 font-mono text-right whitespace-nowrap shrink-0"
                      title={`₹${tier.minSpendInr.toLocaleString('en-IN')}${tier.maxSpendInr ? ' – ₹' + tier.maxSpendInr.toLocaleString('en-IN') : '+'}`}
                    >
                      {spendBadge}
                    </span>
                  </div>

                  {/* Title & Tag with aligned fixed container */}
                  <div>
                    <div className="min-h-[36px] flex flex-col justify-center">
                      <h3 className="font-extrabold text-xs sm:text-[13px] text-navy leading-tight line-clamp-2">
                        {tier.name}
                      </h3>
                    </div>
                    <div className="h-6 flex items-center mt-0.5">
                      {tier.welcomeCoins > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200/80 whitespace-nowrap">
                          🎁 +{tier.welcomeCoins.toLocaleString('en-IN')} Coins
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-100 whitespace-nowrap">
                          Starter Tier
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Perks list */}
                  <ul className="space-y-1.5 text-[11px] text-slate-600 font-medium pt-2 border-t border-slate-100">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestone Coupon Action */}
                <div className="pt-2.5 border-t border-slate-100 mt-2.5">
                  {tier.discountPct === 0 ? (
                    <div
                      className={`text-center text-[11px] font-bold py-1 ${
                        isCurrent
                          ? 'text-orange font-black'
                          : isUnlocked
                            ? 'text-emerald-600 font-extrabold'
                            : 'text-slate-400'
                      }`}
                    >
                      {isCurrent
                        ? 'Current Tier'
                        : isUnlocked
                          ? '✓ Unlocked'
                          : `Spend ₹${tier.minSpendInr.toLocaleString('en-IN')}`}
                    </div>
                  ) : isUnlocked ? (
                    isClaimed ? (
                      <div className="flex items-center justify-between bg-slate-100 rounded-xl px-2 py-1 border border-slate-200">
                        <span className="font-mono text-xs font-extrabold text-navy truncate">
                          {tier.couponCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(tier.couponCode)}
                          className="text-xs text-orange hover:text-orange-600 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-1"
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
                        className="w-full rounded-xl bg-orange hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm cursor-pointer py-1.5 h-auto"
                      >
                        Claim {tier.discountPct}% Coupon 🎉
                      </Button>
                    )
                  ) : (
                    <div className="text-center text-[11px] font-bold text-slate-400 py-1 flex items-center justify-center gap-1">
                      <span>Unlock at ₹{tier.minSpendInr.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Full Perks & Next-Order Slabs Comparison */}
        <details className="group border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden text-xs">
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer font-extrabold text-navy hover:bg-slate-100/70 transition-colors select-none">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange" />
              <span>View Detailed Order Bonus &amp; Discount Slabs</span>
            </span>
            <span className="text-[11px] font-bold text-orange group-open:rotate-90 transition-transform">
              &rarr;
            </span>
          </summary>
          <div className="p-4 pt-2 border-t border-slate-200/60 overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">3-Yr Spend</th>
                  <th className="py-2 pr-4">Welcome Bonus</th>
                  <th className="py-2 pr-4">Milestone Code</th>
                  <th className="py-2">Single-Order Perk Slabs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2 pr-4 font-bold text-navy">🛍️ Normal</td>
                  <td className="py-2 pr-4 font-mono">₹0 – ₹2,499</td>
                  <td className="py-2 pr-4 text-slate-400">—</td>
                  <td className="py-2 pr-4 text-slate-400">—</td>
                  <td className="py-2">Base 1 Coin per ₹10 spent</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-navy">🥉 Bronze</td>
                  <td className="py-2 pr-4 font-mono">₹2,500 – ₹9,999</td>
                  <td className="py-2 pr-4 font-bold text-amber-700">1,000 Coins</td>
                  <td className="py-2 pr-4 text-slate-400">—</td>
                  <td className="py-2">Order &gt; ₹3,000 gives +200 bonus coins</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-navy">🥈 Silver</td>
                  <td className="py-2 pr-4 font-mono">₹10,000 – ₹24,999</td>
                  <td className="py-2 pr-4 font-bold text-amber-700">2,500 Coins</td>
                  <td className="py-2 pr-4 font-mono font-bold text-navy">
                    5% OFF (JIIVAA-SILVER-5)
                  </td>
                  <td className="py-2">Order &gt; ₹3,000 gives +500 bonus coins</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-navy">🥇 Gold VIP</td>
                  <td className="py-2 pr-4 font-mono">₹25,000 – ₹49,999</td>
                  <td className="py-2 pr-4 font-bold text-amber-700">10,000 Coins</td>
                  <td className="py-2 pr-4 font-mono font-bold text-navy">5% OFF (JIIVAA-GOLD)</td>
                  <td className="py-2">
                    &gt;₹3,000: 2.5% OFF | &gt;₹6,000: 5% OFF | &gt;₹12,000: 7.5% OFF next order
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-navy">💎 Platinum</td>
                  <td className="py-2 pr-4 font-mono">₹50,000+</td>
                  <td className="py-2 pr-4 font-bold text-amber-700">20,000 Coins</td>
                  <td className="py-2 pr-4 font-mono font-bold text-navy">
                    20% OFF (JIIVAA-PLATINUM-20)
                  </td>
                  <td className="py-2">
                    &gt;₹5,000: 5% OFF | &gt;₹10,000: 10% OFF | &gt;₹20,000: 20% OFF next order
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Unlocked Next-Order Perks Coupons (if any) */}
      {nextOrderPerks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-navy text-base">
              Your Unlocked Next-Order Perks ({nextOrderPerks.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nextOrderPerks.map((perk) => (
              <div
                key={perk.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono font-black text-navy text-sm block">{perk.code}</span>
                  <span className="text-[11px] text-emerald-700 font-extrabold">
                    {perk.discountPct}% Extra OFF on Next Order
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(perk.code)}
                  className="px-3 py-1.5 rounded-xl bg-orange text-white text-xs font-bold shadow-xs hover:bg-orange-600 cursor-pointer shrink-0"
                >
                  {copiedCode === perk.code ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ways to Earn Coins Grid */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>How to Earn &amp; Spend Jiivaa Coins</span>
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
              Har ₹{settings.spendToCoinRatio || 10} spent par automatic 1 Coin aapke wallet me add
              hoga delivery ke baad (next order par apply karein).
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              📲
            </div>
            <h3 className="font-extrabold text-sm text-navy">Refer a Friend</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Friend ko Flat ₹{settings.referralRefereeDiscountInr} OFF milega, aur unke order
              deliver hote hi aapko ₹{settings.referralRefereeDiscountInr} (
              {settings.referralReferrerBonusCoins} Coins) milenge.
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
              {settings.reviewBonusCoins || 1} Coin bonus.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              🪙
            </div>
            <h3 className="font-extrabold text-sm text-navy">Spend Coins Rule</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Customer apne wallet me stored coins se 1 order par{' '}
              <strong>maximum {settings.maxOrderCoinRedemptionPct || 25}%</strong> order value hi
              spend kar sakta hai.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Log / Passbook */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <History className="w-4 h-4 text-slate-700" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy tracking-tight">
              Coins Passbook &amp; History
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {cleanActivities.length} Transactions
          </span>
        </div>

        {cleanActivities.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-xl">
              🪙
            </div>
            <div className="text-sm font-bold text-slate-700">
              Abhi tak koi coin transactions nahi hain
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Boutique styles shopping karein, review submit karein ya dosto ko invite karein — har
              coin earn aur spend hone par yahan live ledger record hoga!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cleanActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      act.amount > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {act.amount > 0 ? '+' : '–'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-navy truncate">
                      {act.description}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">{act.date}</div>
                  </div>
                </div>

                <div
                  className={`text-xs sm:text-sm font-black shrink-0 font-mono ${
                    act.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
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
