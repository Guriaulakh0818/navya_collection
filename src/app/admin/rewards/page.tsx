'use client';

import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  DollarSign,
  Download,
  Edit3,
  Gift,
  HelpCircle,
  History,
  Lock,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import type {
  AdminClaimLedgerItem,
  AdminRewardsOverviewData,
  AdminRewardsSettings,
} from '@/backend/services/admin-rewards.service';
import { LOYALTY_TIERS } from '@/shared/config/rewards.config';

export default function AdminRewardsControlCenterPage() {
  const [data, setData] = useState<AdminRewardsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'SETTINGS' | 'TIERS'>('LEDGER');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'REFERRAL' | 'MILESTONE' | 'CASHBACK'>(
    'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Editable settings form state
  const [settingsForm, setSettingsForm] = useState<AdminRewardsSettings>({
    coinToInrRatio: 0.1,
    signupBonusCoins: 200,
    reviewBonusCoins: 50,
    firstOrderBonusCoins: 300,
    referralRefereeDiscountInr: 150,
    referralRefereeMinOrderInr: 999,
    referralReferrerBonusCoins: 150,
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/rewards');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setSettingsForm(json.data.settings);
      }
    } catch (err) {
      console.error('Failed to load admin rewards overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await fetch('/api/v1/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setSaveSuccessMsg(
          'Economics & Policy Configuration successfully updated and applied in realtime!',
        );
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        await fetchOverview();
      } else {
        setSaveErrorMsg(json.message || 'Failed to update settings');
      }
    } catch {
      setSaveErrorMsg('Network error while saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtered Ledger Items
  const filteredLedger = useMemo(() => {
    if (!data?.ledger) return [];
    return data.ledger.filter((item) => {
      // 1. Filter by category
      if (ledgerFilter === 'REFERRAL' && !item.type.startsWith('REFERRAL')) return false;
      if (ledgerFilter === 'MILESTONE' && item.type !== 'MILESTONE_CLAIMED') return false;
      if (
        ledgerFilter === 'CASHBACK' &&
        item.type !== 'ORDER_CASHBACK' &&
        item.type !== 'REDEEMED_CHECKOUT'
      )
        return false;

      // 2. Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = item.userName.toLowerCase().includes(q);
        const matchesPhone = item.userPhoneOrEmail.toLowerCase().includes(q);
        const matchesCode = item.codeOrTier.toLowerCase().includes(q);
        const matchesOrder = item.orderNumber ? item.orderNumber.toLowerCase().includes(q) : false;
        if (!matchesUser && !matchesPhone && !matchesCode && !matchesOrder) return false;
      }
      return true;
    });
  }, [data?.ledger, ledgerFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* HEADER BANNER - Executive Navy & Jiivaa Orange */}
      <div className="relative overflow-hidden bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange/20 border border-orange/40 text-orange text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-orange" />
            <span>Customer Loyalty & Viral Growth Center</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Coins className="w-8 h-8 text-orange" /> Jiivaa VIP Rewards &amp; Referral Control
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Monitor real-time coin distributions, who is claiming what, track viral referral
            acquisition, and configure rewards policy parameters.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={fetchOverview}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Ambient Decorative Mascot Silhouette Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      </div>

      {/* TOP 4 REALTIME METRICS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Coins In Circulation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Coins in Circulation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-navy font-mono">
            {data ? data.stats.totalCoinsInCirculation.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Liability Value:</span>
            <strong className="text-slate-800 font-mono">
              ₹{data ? data.stats.totalLiabilityInr.toLocaleString('en-IN') : '...'}
            </strong>
          </div>
        </div>

        {/* Card 2: Referral GMV Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Referral Sales GMV
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            ₹{data ? data.stats.totalReferralGmvInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Orders Delivered:</span>
            <strong className="text-emerald-800 font-mono">
              {data ? data.stats.totalReferralOrders : '...'} orders
            </strong>
          </div>
        </div>

        {/* Card 3: Viral Friends Joined */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Friends Joined via Links
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange font-mono">
            {data ? data.stats.totalFriendsJoined.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Link Click Tractions:</span>
            <strong className="text-slate-800 font-mono">
              {data ? data.stats.totalReferralClicks : '...'} clicks
            </strong>
          </div>
        </div>

        {/* Card 4: VIP Tier Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              VIP Tier Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold pt-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono">
              🥉 {data?.stats.tierDistribution.bronze || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-mono">
              🥈 {data?.stats.tierDistribution.silver || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange/10 text-orange border border-orange/30 font-mono">
              🥇 {data?.stats.tierDistribution.gold || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-navy/10 text-navy border border-navy/30 font-mono">
              💎 {data?.stats.tierDistribution.platinum || 0}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Active shoppers classified into loyalty tiers
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'LEDGER'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Claims &amp; Referrals Ledger</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
            {filteredLedger.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'SETTINGS'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Economics &amp; Policy Control</span>
        </button>

        <button
          onClick={() => setActiveTab('TIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'TIERS'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>VIP Tiers &amp; Coupons Spec</span>
        </button>
      </div>

      {/* TAB 1: CLAIMS & REFERRALS LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Controls: Search + Filter Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, mobile, referral code, or order..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setLedgerFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ledgerFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => setLedgerFilter('REFERRAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ledgerFilter === 'REFERRAL'
                    ? 'bg-orange text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Referral Invites &amp; Orders
              </button>
              <button
                onClick={() => setLedgerFilter('MILESTONE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ledgerFilter === 'MILESTONE'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                VIP Milestone Unlocks
              </button>
              <button
                onClick={() => setLedgerFilter('CASHBACK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ledgerFilter === 'CASHBACK'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cashback &amp; Redemptions
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Activity Type</th>
                    <th className="py-3.5 px-4">Reference / Code</th>
                    <th className="py-3.5 px-4 text-right">Coins</th>
                    <th className="py-3.5 px-4 text-right">INR Value</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No transactions or claims match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* User Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-navy">{item.userName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.userPhoneOrEmail}
                          </div>
                        </td>

                        {/* Activity Type Badge */}
                        <td className="py-3.5 px-4">
                          {item.type === 'REFERRAL_EARNED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                              🎁 Referral Reward
                            </span>
                          )}
                          {item.type === 'REFERRAL_USED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                              🛍️ Friend Welcome Code
                            </span>
                          )}
                          {item.type === 'MILESTONE_CLAIMED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              🏆 VIP Tier Unlock
                            </span>
                          )}
                          {item.type === 'ORDER_CASHBACK' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[10px]">
                              🪙 Order Cashback
                            </span>
                          )}
                          {item.type === 'REDEEMED_CHECKOUT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px]">
                              🛒 Redeemed in Cart
                            </span>
                          )}
                          {item.type === 'SIGNUP_BONUS' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px]">
                              ✨ Signup Gift
                            </span>
                          )}
                        </td>

                        {/* Reference / Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {item.codeOrTier}
                          {item.orderNumber && (
                            <span className="block text-[10px] text-slate-400 font-sans">
                              {item.orderNumber} (₹{item.orderAmount?.toLocaleString('en-IN')})
                            </span>
                          )}
                        </td>

                        {/* Coins */}
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                          {item.coins > 0 ? (
                            <span className="text-emerald-600">+{item.coins}</span>
                          ) : item.coins < 0 ? (
                            <span className="text-rose-600">{item.coins}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* INR Value */}
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-navy">
                          ₹{item.inrValue}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {item.status === 'COMPLETED' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                              Completed
                            </span>
                          )}
                          {item.status === 'ORDER_PLACED' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200">
                              Order Placed
                            </span>
                          )}
                          {item.status === 'CLAIMED' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200">
                              Coupon Claimed
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                          {item.timestamp}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ECONOMICS & POLICY CONTROL */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Notifications */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
          {saveErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Section 1: Coin Economics */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange" /> Jiivaa Coin Economics &amp; Valuation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure how many rupees 1 coin is worth, and what signup/purchase bonus shoppers
                receive.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Coin to INR Ratio */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center justify-between">
                  <span>Coin to INR Ratio</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    100 Coins = ₹{Math.round(100 * settingsForm.coinToInrRatio)}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={settingsForm.coinToInrRatio}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      coinToInrRatio: parseFloat(e.target.value) || 0.1,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <p className="text-[10px] text-slate-400">
                  Default: 0.10 (meaning 1 coin is worth 10 paise, 100 coins = ₹10).
                </p>
              </div>

              {/* Signup Bonus Coins */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center justify-between">
                  <span>Welcome Signup Coins</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Worth ₹{Math.round(settingsForm.signupBonusCoins * settingsForm.coinToInrRatio)}
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={settingsForm.signupBonusCoins}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      signupBonusCoins: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <p className="text-[10px] text-slate-400">
                  Credited to user wallet immediately upon new account registration.
                </p>
              </div>

              {/* First Order Bonus */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  First Order Haul Bonus Coins
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={settingsForm.firstOrderBonusCoins}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      firstOrderBonusCoins: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <p className="text-[10px] text-slate-400">
                  Bonus coins awarded when customer completes their 1st delivered boutique purchase.
                </p>
              </div>

              {/* Review Bonus Coins */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  Verified Product Review Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settingsForm.reviewBonusCoins}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      reviewBonusCoins: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <p className="text-[10px] text-slate-400">
                  Awarded for every verified boutique review with photo/feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Refer & Earn Scheme Policy */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange" /> Refer &amp; Earn Growth Scheme Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set discounts given to referred friends and reward coins awarded to the inviter.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Referee (Friend) Discount */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Friend Discount (₹ OFF)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={settingsForm.referralRefereeDiscountInr}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        referralRefereeDiscountInr: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Flat ₹ discount applied on friend&apos;s 1st order.
                </p>
              </div>

              {/* Minimum Order Value for Referee */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Friend Min Cart Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="299"
                    max="5000"
                    value={settingsForm.referralRefereeMinOrderInr}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        referralRefereeMinOrderInr: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Minimum order total required for ₹150 coupon to apply.
                </p>
              </div>

              {/* Referrer Bonus Coins */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Inviter Bonus Coins</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={settingsForm.referralReferrerBonusCoins}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      referralReferrerBonusCoins: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <p className="text-[10px] text-slate-400">
                  Coins credited to user when their friend&apos;s order is delivered.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 rounded-2xl bg-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSavingSettings ? 'Saving Settings...' : 'Save & Apply Realtime Policy'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: VIP TIERS SPECIFICATION */}
      {activeTab === 'TIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LOYALTY_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-5 border bg-white shadow-xs space-y-4 ${
                tier.id === 'GOLD' ? 'border-orange/40 ring-2 ring-orange/15' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{tier.badge.split(' ')[0]}</span>
                <span className="font-mono text-xs font-black text-navy px-2 py-0.5 rounded-full bg-slate-100">
                  {tier.minCoins.toLocaleString('en-IN')}+ Coins
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-navy text-base">{tier.name}</h3>
                <span className="text-xs text-orange font-bold font-mono">
                  Coupon: {tier.couponCode} ({tier.discountPct}% OFF)
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Perks &amp; Privileges
                </span>
                <ul className="space-y-1 text-slate-600 text-xs">
                  {tier.perks.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-orange font-bold">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
