'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LOYALTY_TIERS, LoyaltyTier, REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface CoinActivity {
  id: string;
  amount: number;
  type: 'SIGNUP_BONUS' | 'ORDER_EARNED' | 'REDEEMED' | 'REFERRAL_BONUS' | 'TIER_BONUS';
  description: string;
  date: string;
}

export interface ClaimedCoupon {
  tierId: string;
  code: string;
  discountPct: number;
  claimedAt: string;
}

interface RewardsStoreState {
  coins: number;
  lifetimeCoins: number;
  claimedCoupons: ClaimedCoupon[];
  referralCode: string;
  totalReferralClicks: number;
  successfulReferrals: number;
  activities: CoinActivity[];
  isWelcomeModalOpen: boolean;

  // Actions
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  addCoins: (amount: number, type: CoinActivity['type'], description: string) => void;
  redeemCoins: (amount: number) => boolean;
  claimTierCoupon: (tierId: string, code: string, discountPct: number) => void;
  setReferralCode: (code: string) => void;
  incrementReferralClick: () => void;
  getCurrentTier: () => LoyaltyTier;
  getNextTier: () => { tier: LoyaltyTier | null; coinsNeeded: number; progressPct: number };
}

export const useRewardsStore = create<RewardsStoreState>()(
  persist(
    (set, get) => ({
      coins: 0,
      lifetimeCoins: 0,
      claimedCoupons: [],
      referralCode: '',
      totalReferralClicks: 0,
      successfulReferrals: 0,
      isWelcomeModalOpen: false,
      openWelcomeModal: () => set({ isWelcomeModalOpen: true }),
      closeWelcomeModal: () => set({ isWelcomeModalOpen: false }),
      activities: [],

      addCoins: (amount, type, description) => {
        set((state) => ({
          coins: state.coins + amount,
          lifetimeCoins: state.lifetimeCoins + (amount > 0 ? amount : 0),
          activities: [
            {
              id: 'act-' + Date.now(),
              amount,
              type,
              description,
              date: 'Just now',
            },
            ...state.activities,
          ],
        }));
      },

      redeemCoins: (amount) => {
        const current = get().coins;
        if (current < amount) return false;
        set((state) => ({
          coins: state.coins - amount,
          activities: [
            {
              id: 'act-' + Date.now(),
              amount: -amount,
              type: 'REDEEMED',
              description: `Redeemed ${amount} Coins at checkout (₹${Math.round(amount * REWARDS_CONFIG.coinToInrRatio)} discount)`,
              date: 'Just now',
            },
            ...state.activities,
          ],
        }));
        return true;
      },

      claimTierCoupon: (tierId, code, discountPct) => {
        const alreadyClaimed = get().claimedCoupons.some((c) => c.tierId === tierId);
        if (alreadyClaimed) return;
        set((state) => ({
          claimedCoupons: [
            ...state.claimedCoupons,
            { tierId, code, discountPct, claimedAt: new Date().toISOString() },
          ],
        }));
      },

      setReferralCode: (code) => set({ referralCode: code }),

      incrementReferralClick: () =>
        set((state) => ({ totalReferralClicks: state.totalReferralClicks + 1 })),

      getCurrentTier: () => {
        const lifetime = get().lifetimeCoins;
        let active = LOYALTY_TIERS[0];
        for (const t of LOYALTY_TIERS) {
          if (lifetime >= t.minCoins) active = t;
        }
        return active;
      },

      getNextTier: () => {
        const lifetime = get().lifetimeCoins;
        const current = get().getCurrentTier();
        const currentIndex = LOYALTY_TIERS.findIndex((t) => t.id === current.id);
        const next =
          currentIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentIndex + 1] : null;

        if (!next) {
          return { tier: null, coinsNeeded: 0, progressPct: 100 };
        }

        const tierSpan = next.minCoins - current.minCoins;
        const progressInTier = Math.max(0, lifetime - current.minCoins);
        const progressPct = Math.min(100, Math.round((progressInTier / tierSpan) * 100));
        const coinsNeeded = Math.max(0, next.minCoins - lifetime);

        return { tier: next, coinsNeeded, progressPct };
      },
    }),
    {
      name: 'jiivaakart-rewards-storage',
      partialize: (state) => ({
        coins: state.coins,
        lifetimeCoins: state.lifetimeCoins,
        claimedCoupons: state.claimedCoupons,
        referralCode: state.referralCode,
        totalReferralClicks: state.totalReferralClicks,
        successfulReferrals: state.successfulReferrals,
        activities: state.activities,
      }),
    },
  ),
);
