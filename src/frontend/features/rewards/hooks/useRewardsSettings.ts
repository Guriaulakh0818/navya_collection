'use client';

import { useEffect, useState } from 'react';

import { REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface RewardsPolicySettings {
  coinToInrRatio: number;
  spendToCoinRatio: number;
  maxOrderCoinRedemptionPct: number;
  signupBonusCoins: number;
  reviewBonusCoins: number;
  firstOrderBonusCoins: number;
  referralRefereeDiscountInr: number;
  referralRefereeMinOrderInr: number;
  referralReferrerBonusCoins: number;
  referralReferrerBonusInr: number;
  tierValidityYears: number;
}

const DEFAULT_SETTINGS: RewardsPolicySettings = {
  coinToInrRatio: REWARDS_CONFIG.coinToInrRatio,
  spendToCoinRatio: REWARDS_CONFIG.spendToCoinRatio,
  maxOrderCoinRedemptionPct: REWARDS_CONFIG.maxOrderCoinRedemptionPct,
  signupBonusCoins: REWARDS_CONFIG.signupBonusCoins,
  reviewBonusCoins: REWARDS_CONFIG.reviewBonusCoins,
  firstOrderBonusCoins: REWARDS_CONFIG.firstOrderBonusCoins,
  referralRefereeDiscountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
  referralRefereeMinOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
  referralReferrerBonusCoins: REWARDS_CONFIG.referralReferrerBonusCoins,
  referralReferrerBonusInr: Math.round(
    REWARDS_CONFIG.referralReferrerBonusCoins * REWARDS_CONFIG.coinToInrRatio,
  ),
  tierValidityYears: REWARDS_CONFIG.tierValidityYears,
};

// In-memory module cache to prevent flickering across components
let cachedSettings: RewardsPolicySettings = DEFAULT_SETTINGS;
let cacheFetchedAt = 0;

export function useRewardsSettings() {
  const [settings, setSettings] = useState<RewardsPolicySettings>(cachedSettings);
  const [isLoading, setIsLoading] = useState<boolean>(cacheFetchedAt === 0);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/rewards/settings', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const ratio = typeof d.coinToInrRatio === 'number' ? d.coinToInrRatio : 0.1;
        const refCoins =
          typeof d.referralReferrerBonusCoins === 'number' ? d.referralReferrerBonusCoins : 500;
        const computed: RewardsPolicySettings = {
          coinToInrRatio: ratio,
          spendToCoinRatio: typeof d.spendToCoinRatio === 'number' ? d.spendToCoinRatio : 10,
          maxOrderCoinRedemptionPct:
            typeof d.maxOrderCoinRedemptionPct === 'number' ? d.maxOrderCoinRedemptionPct : 25,
          signupBonusCoins: typeof d.signupBonusCoins === 'number' ? d.signupBonusCoins : 0,
          reviewBonusCoins: typeof d.reviewBonusCoins === 'number' ? d.reviewBonusCoins : 1,
          firstOrderBonusCoins:
            typeof d.firstOrderBonusCoins === 'number' ? d.firstOrderBonusCoins : 0,
          referralRefereeDiscountInr:
            typeof d.referralRefereeDiscountInr === 'number' ? d.referralRefereeDiscountInr : 50,
          referralRefereeMinOrderInr:
            typeof d.referralRefereeMinOrderInr === 'number' ? d.referralRefereeMinOrderInr : 499,
          referralReferrerBonusCoins: refCoins,
          referralReferrerBonusInr: Math.round(refCoins * ratio),
          tierValidityYears: typeof d.tierValidityYears === 'number' ? d.tierValidityYears : 3,
        };
        cachedSettings = computed;
        cacheFetchedAt = Date.now();
        setSettings(computed);
      }
    } catch (err) {
      console.warn('Failed to load live rewards settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If cache is older than 15 seconds, re-fetch
    if (Date.now() - cacheFetchedAt > 15000) {
      fetchSettings();
    }
  }, []);

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
  };
}
