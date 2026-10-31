'use client';

import { useEffect, useState } from 'react';

import { REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface RewardsPolicySettings {
  coinToInrRatio: number;
  signupBonusCoins: number;
  reviewBonusCoins: number;
  firstOrderBonusCoins: number;
  referralRefereeDiscountInr: number;
  referralRefereeMinOrderInr: number;
  referralReferrerBonusCoins: number;
  referralReferrerBonusInr: number;
}

const DEFAULT_SETTINGS: RewardsPolicySettings = {
  coinToInrRatio: REWARDS_CONFIG.coinToInrRatio,
  signupBonusCoins: REWARDS_CONFIG.signupBonusCoins,
  reviewBonusCoins: REWARDS_CONFIG.reviewBonusCoins,
  firstOrderBonusCoins: REWARDS_CONFIG.firstOrderBonusCoins,
  referralRefereeDiscountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
  referralRefereeMinOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
  referralReferrerBonusCoins: REWARDS_CONFIG.referralReferrerBonusCoins,
  referralReferrerBonusInr: Math.round(
    REWARDS_CONFIG.referralReferrerBonusCoins * REWARDS_CONFIG.coinToInrRatio,
  ),
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
          typeof d.referralReferrerBonusCoins === 'number' ? d.referralReferrerBonusCoins : 150;
        const computed: RewardsPolicySettings = {
          coinToInrRatio: ratio,
          signupBonusCoins: typeof d.signupBonusCoins === 'number' ? d.signupBonusCoins : 200,
          reviewBonusCoins: typeof d.reviewBonusCoins === 'number' ? d.reviewBonusCoins : 50,
          firstOrderBonusCoins:
            typeof d.firstOrderBonusCoins === 'number' ? d.firstOrderBonusCoins : 300,
          referralRefereeDiscountInr:
            typeof d.referralRefereeDiscountInr === 'number' ? d.referralRefereeDiscountInr : 150,
          referralRefereeMinOrderInr:
            typeof d.referralRefereeMinOrderInr === 'number' ? d.referralRefereeMinOrderInr : 999,
          referralReferrerBonusCoins: refCoins,
          referralReferrerBonusInr: Math.round(refCoins * ratio),
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
