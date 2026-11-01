'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LOYALTY_TIERS, LoyaltyTier, REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface CoinActivity {
  id: string;
  amount: number;
  type:
    | 'SIGNUP_BONUS'
    | 'ORDER_EARNED'
    | 'REDEEMED'
    | 'REFERRAL_BONUS'
    | 'TIER_BONUS'
    | 'ORDER_BONUS'
    | 'REVIEW_BONUS';
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
  cumulativeSpendInCycle: number;
  cycleStartedAt: string;
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
  redeemCoins: (amount: number, orderTotal?: number) => boolean;
  claimTierCoupon: (tierId: string, code: string, discountPct: number) => void;
  setReferralCode: (code: string) => void;
  incrementReferralClick: () => void;
  setLoyaltyData: (data: Partial<RewardsStoreState>) => void;
  getCurrentTier: () => LoyaltyTier;
  getNextTier: () => {
    tier: LoyaltyTier | null;
    coinsNeeded: number;
    spendNeeded: number;
    progressPct: number;
  };
}

export const useRewardsStore = create<RewardsStoreState>()(
  persist(
    (set, get) => ({
      coins: 0,
      lifetimeCoins: 0,
      cumulativeSpendInCycle: 0,
      cycleStartedAt: new Date().toISOString(),
      claimedCoupons: [],
      referralCode: '',
      totalReferralClicks: 0,
      successfulReferrals: 0,
      isWelcomeModalOpen: false,
      openWelcomeModal: () => set({ isWelcomeModalOpen: true }),
      closeWelcomeModal: () => set({ isWelcomeModalOpen: false }),
      activities: [],

      setLoyaltyData: (data) => set((state) => ({ ...state, ...data })),

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

      redeemCoins: (amount, orderTotal?: number) => {
        const current = get().coins;
        if (current < amount) return false;

        // If order total provided, enforce 25% max coin burn rule
        if (typeof orderTotal === 'number' && orderTotal > 0) {
          const maxDiscountInr = (orderTotal * REWARDS_CONFIG.maxOrderCoinRedemptionPct) / 100;
          const maxCoins = Math.floor(maxDiscountInr / REWARDS_CONFIG.coinToInrRatio);
          if (amount > maxCoins) {
            return false;
          }
        }

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
        const spend = get().cumulativeSpendInCycle;
        let active = LOYALTY_TIERS[0]; // Normal Shopper
        for (const t of LOYALTY_TIERS) {
          if (spend >= t.minSpendInr) active = t;
        }
        return active;
      },

      getNextTier: () => {
        const spend = get().cumulativeSpendInCycle;
        const current = get().getCurrentTier();
        const currentIndex = LOYALTY_TIERS.findIndex((t) => t.id === current.id);
        const next =
          currentIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentIndex + 1] : null;

        if (!next) {
          return { tier: null, coinsNeeded: 0, spendNeeded: 0, progressPct: 100 };
        }

        const tierSpan = next.minSpendInr - current.minSpendInr;
        const progressInTier = Math.max(0, spend - current.minSpendInr);
        const progressPct = Math.min(100, Math.round((progressInTier / tierSpan) * 100));
        const spendNeeded = Math.max(0, next.minSpendInr - spend);
        const coinsNeeded = Math.max(0, next.minCoins - get().coins);

        return { tier: next, coinsNeeded, spendNeeded, progressPct };
      },
    }),
    {
      name: 'jiivaakart-rewards-storage',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        return {
          ...persistedState,
          activities: (persistedState.activities || []).filter(
            (act: any) =>
              act.id !== 'act-1' &&
              act.id !== 'act-2' &&
              !act.description?.includes('Boutique Haul') &&
              !act.description?.includes('registered at JiivaaKart'),
          ),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activities = (state.activities || []).filter(
            (act: any) =>
              act.id !== 'act-1' &&
              act.id !== 'act-2' &&
              !act.description?.includes('Boutique Haul') &&
              !act.description?.includes('registered at JiivaaKart'),
          );
        }
      },
      partialize: (state) => ({
        coins: state.coins,
        lifetimeCoins: state.lifetimeCoins,
        cumulativeSpendInCycle: state.cumulativeSpendInCycle,
        cycleStartedAt: state.cycleStartedAt,
        claimedCoupons: state.claimedCoupons,
        referralCode: state.referralCode,
        totalReferralClicks: state.totalReferralClicks,
        successfulReferrals: state.successfulReferrals,
        activities: state.activities,
      }),
    },
  ),
);
