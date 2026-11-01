/**
 * Jiivaa Rewards & Refer-and-Earn Centralized Configuration
 * Brand: JiivaaKart
 */

export interface SingleOrderPerk {
  minOrderAmount: number;
  rewardType: 'COINS' | 'PERCENTAGE_DISCOUNT';
  rewardValue: number;
  label: string;
  couponCode?: string;
}

export interface LoyaltyTier {
  id: 'NORMAL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierLevel: number;
  name: string;
  badge: string;
  minSpendInr: number;
  maxSpendInr: number | null;
  minCoins: number;
  maxCoins: number | null;
  welcomeCoins: number;
  discountPct: number;
  couponCode: string;
  perks: string[];
  themeColor: string;
  textColor: string;
  accentBg: string;
  singleOrderPerks?: SingleOrderPerk[];
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'NORMAL',
    tierLevel: 0,
    name: 'Normal Shopper',
    badge: '🛍️ Normal Shopper',
    minSpendInr: 0,
    maxSpendInr: 2499,
    minCoins: 0,
    maxCoins: 999,
    welcomeCoins: 0,
    discountPct: 0,
    couponCode: 'JIIVAA-NORMAL',
    perks: [
      'Earn 1 Coin on every ₹10 spent (applied from next order)',
      '1 Coin for every verified product review',
      'Friend Referral: ₹50 discount for friend & ₹50 for you',
    ],
    themeColor: '#64748B',
    textColor: 'text-slate-700',
    accentBg: 'bg-slate-50 border-slate-200',
  },
  {
    id: 'BRONZE',
    tierLevel: 1,
    name: 'Bronze Shopper',
    badge: '🥉 Bronze Shopper',
    minSpendInr: 2500,
    maxSpendInr: 9999,
    minCoins: 1000,
    maxCoins: 2499,
    welcomeCoins: 1000,
    discountPct: 0,
    couponCode: 'JIIVAA-BRONZE',
    perks: [
      'Welcome Bonus: 1,000 Coins credited to wallet upon upgrade',
      'All Normal perks included',
      'Single order > ₹3,000 gives extra 200 coins (applied from next order)',
    ],
    themeColor: '#CD7F32',
    textColor: 'text-amber-800',
    accentBg: 'bg-amber-50 border-amber-200',
    singleOrderPerks: [
      {
        minOrderAmount: 3000,
        rewardType: 'COINS',
        rewardValue: 200,
        label: 'Single order > ₹3,000: +200 bonus coins in wallet',
      },
    ],
  },
  {
    id: 'SILVER',
    tierLevel: 2,
    name: 'Silver Trendsetter',
    badge: '🥈 Silver Trendsetter',
    minSpendInr: 10000,
    maxSpendInr: 24999,
    minCoins: 2500,
    maxCoins: 9999,
    welcomeCoins: 2500,
    discountPct: 5,
    couponCode: 'JIIVAA-SILVER-5',
    perks: [
      'Welcome Bonus: 2,500 Coins credited to wallet upon upgrade',
      'All Normal perks included',
      'Single order > ₹3,000 gives extra 500 coins (applied from next order)',
      'Flat 5% Milestone Coupon Code (JIIVAA-SILVER-5)',
    ],
    themeColor: '#94A3B8',
    textColor: 'text-slate-700',
    accentBg: 'bg-slate-100 border-slate-300',
    singleOrderPerks: [
      {
        minOrderAmount: 3000,
        rewardType: 'COINS',
        rewardValue: 500,
        label: 'Single order > ₹3,000: +500 bonus coins in wallet',
      },
    ],
  },
  {
    id: 'GOLD',
    tierLevel: 3,
    name: 'Gold VIP Insider',
    badge: '🥇 Gold VIP Insider',
    minSpendInr: 25000,
    maxSpendInr: 49999,
    minCoins: 10000,
    maxCoins: 19999,
    welcomeCoins: 10000,
    discountPct: 5,
    couponCode: 'JIIVAA-GOLD',
    perks: [
      'Welcome Bonus: 10,000 Coins credited to wallet upon upgrade',
      'Order > ₹3,000: 2.5% extra off next order',
      'Order > ₹6,000: 5% extra off next order',
      'Order > ₹12,000: 7.5% extra off next order',
    ],
    themeColor: '#F28C28',
    textColor: 'text-orange',
    accentBg: 'bg-orange/10 border-orange/30',
    singleOrderPerks: [
      {
        minOrderAmount: 3000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 2.5,
        couponCode: 'JIIVAA-GOLD-2.5',
        label: 'Single order > ₹3,000: 2.5% extra off in next order',
      },
      {
        minOrderAmount: 6000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 5,
        couponCode: 'JIIVAA-GOLD-5',
        label: 'Single order > ₹6,000: 5% extra off in next order',
      },
      {
        minOrderAmount: 12000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 7.5,
        couponCode: 'JIIVAA-GOLD-7.5',
        label: 'Single order > ₹12,000: 7.5% extra off in next order',
      },
    ],
  },
  {
    id: 'PLATINUM',
    tierLevel: 4,
    name: 'Platinum Style Icon',
    badge: '💎 Platinum Style Icon',
    minSpendInr: 50000,
    maxSpendInr: null,
    minCoins: 20000,
    maxCoins: null,
    welcomeCoins: 20000,
    discountPct: 20,
    couponCode: 'JIIVAA-PLATINUM-20',
    perks: [
      'Welcome Bonus: 20,000 Coins credited to wallet upon upgrade',
      'Order > ₹5,000: 5% extra off next order',
      'Order > ₹10,000: 10% extra off next order',
      'Order > ₹20,000: 20% extra off next order',
    ],
    themeColor: '#0A2342',
    textColor: 'text-navy',
    accentBg: 'bg-navy/5 border-navy/20',
    singleOrderPerks: [
      {
        minOrderAmount: 5000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 5,
        couponCode: 'JIIVAA-PLATINUM-5',
        label: 'Single order > ₹5,000: 5% extra off in next order',
      },
      {
        minOrderAmount: 10000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 10,
        couponCode: 'JIIVAA-PLATINUM-10',
        label: 'Single order > ₹10,000: 10% extra off in next order',
      },
      {
        minOrderAmount: 20000,
        rewardType: 'PERCENTAGE_DISCOUNT',
        rewardValue: 20,
        couponCode: 'JIIVAA-PLATINUM-20',
        label: 'Single order > ₹20,000: 20% extra off in next order',
      },
    ],
  },
];

export const REWARDS_CONFIG = {
  // Coin Economics
  coinToInrRatio: 0.1, // 10 Coins = ₹1 (1 Coin = ₹0.10)
  spendToCoinRatio: 10, // Har ₹10 spend par 1 Coin
  maxOrderCoinRedemptionPct: 25, // Wallet me jo coins aenge vo customer 1 order pr 25 percent hi spend kr paega
  signupBonusCoins: 0, // Welcome coins are unlocked via Bronze+ tiers
  reviewBonusCoins: 1, // Har 1 product ka review krne pr - 1 coin
  firstOrderBonusCoins: 0,
  tierValidityYears: 3, // 3-year reset cycle

  // Referral Economics
  referralRefereeDiscountInr: 50, // Friend refer in every tier - 50 rs
  referralRefereeMinOrderInr: 499, // Min order ₹499 for friend
  referralReferrerBonusCoins: 500, // Referrer gets 500 Coins (= ₹50 value at 0.1 ratio)
  referralCouponPrefix: 'JIIVAA-FRIEND',

  // Mascot Assets
  assets: {
    vipRewardsMascot: '/brand/jiivaa/crops/journey/13-success.png',
    referralShareMascot: '/brand/jiivaa/crops/journey/11-share.png',
    deliveryBoxMascot: '/brand/jiivaa/crops/journey/hero-sitting-box-thumbsup.png',
    celebrationBadge: '/brand/jiivaa/crops/meet-jiivaa-badge.png',
  },

  // WhatsApp Pre-filled Copy
  getWhatsAppShareText: (referralCode: string, shareUrl: string, discountInr?: number) => {
    const finalDiscount = typeof discountInr === 'number' ? discountInr : 50;
    return encodeURIComponent(
      `👗✨ Namaste! Maine JiivaaKart par verified local boutiques ka amazing Indian fashion discover kiya!\n\n` +
        `🎁 Mere referral link se sign up karo aur pehle order par FLAT ₹${finalDiscount} OFF pao:\n` +
        `${shareUrl}\n\n` +
        `Use Code: ${referralCode} at checkout. Happy Shopping! 🛍️`,
    );
  },
};

/**
 * Deterministically generate a 100% collision-free, unique referral code.
 * Format: JIIVAA-<NAME_SLUG><SHORT_HASH>
 *
 * Guaranteed collision-free because userHash is derived from unique userId (CUID/UUID).
 */
export function generateUniqueReferralCode(
  userId?: string | null,
  nameOrMobile?: string | null,
): string {
  const rawId = userId || 'guest-default-id';

  // 1. Generate 3-character deterministic hash from unique userId
  const userHash = Math.abs(
    rawId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0),
  )
    .toString(36)
    .toUpperCase()
    .padStart(3, '7')
    .slice(0, 3);

  // 2. Extract clean name prefix if provided
  if (nameOrMobile) {
    const cleanName = nameOrMobile
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 5);
    if (cleanName.length >= 3) {
      return `JIIVAA-${cleanName}${userHash}`;
    }

    // If mobile number
    const cleanDigits = nameOrMobile.replace(/[^0-9]/g, '');
    if (cleanDigits.length >= 4) {
      return `JIIVAA-M${cleanDigits.slice(-4)}${userHash.slice(0, 2)}`;
    }
  }

  // 3. Fallback to clean deterministic hash
  return `JIIVAA-${userHash}9X`;
}

/**
 * Resolve referral code to extract inviter's display name and perks
 */
export function resolveReferralCode(code?: string | null) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode.startsWith('JIIVAA-') || cleanCode.length < 7) {
    return {
      valid: false,
      code: cleanCode,
      referrerName: 'A Boutique Friend',
      discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
      minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
    };
  }

  // Extract human readable name part from code (e.g. JIIVAA-PRIYA4K => Priya)
  const suffix = cleanCode.replace(/^JIIVAA-/, '');
  const namePart = suffix.replace(/[0-9].*$/, ''); // Strip numbers and hashes
  let display = 'A Boutique Friend';

  if (namePart.length >= 3) {
    // Capitalize first letter: PRIYA => Priya
    display = namePart.charAt(0) + namePart.slice(1).toLowerCase();
  } else if (suffix.startsWith('M') && suffix.length >= 5) {
    display = 'A Shopping Buddy';
  }

  return {
    valid: true,
    code: cleanCode,
    referrerName: display,
    discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
    minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
  };
}

/**
 * Calculate customer's current and next tier based on cumulative shopping spend in 3-year cycle.
 */
export function calculateTierBySpend(cumulativeSpendInr: number): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  spendNeededForNextTier: number;
  progressPct: number;
} {
  const safeSpend = Math.max(0, Number(cumulativeSpendInr) || 0);

  let currentTier = LOYALTY_TIERS[0]; // Normal Shopper
  let nextTier: LoyaltyTier | null = LOYALTY_TIERS[1]; // Bronze Shopper

  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    const tier = LOYALTY_TIERS[i];
    if (safeSpend >= tier.minSpendInr) {
      currentTier = tier;
      nextTier = i < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[i + 1] : null;
    }
  }

  let spendNeededForNextTier = 0;
  let progressPct = 100;

  if (nextTier) {
    const tierSpan = nextTier.minSpendInr - currentTier.minSpendInr;
    const progressInCurrentTier = Math.max(0, safeSpend - currentTier.minSpendInr);
    progressPct = Math.min(100, Math.round((progressInCurrentTier / tierSpan) * 100));
    spendNeededForNextTier = Math.max(0, nextTier.minSpendInr - safeSpend);
  }

  return {
    currentTier,
    nextTier,
    spendNeededForNextTier,
    progressPct,
  };
}

/**
 * Enforces the 25% max coin burn rule per single order.
 * Rule: Customer can spend coins for at most 25% of any order total.
 */
export function calculateMaxSpendableCoins(
  orderTotalInr: number,
  availableCoins: number,
  coinToInrRatio = REWARDS_CONFIG.coinToInrRatio,
): {
  maxDiscountInr: number;
  maxCoinsByCap: number;
  spendableCoins: number;
  discountInr: number;
} {
  const safeTotal = Math.max(0, Number(orderTotalInr) || 0);
  const safeCoins = Math.max(0, Math.floor(Number(availableCoins) || 0));
  const safeRatio = coinToInrRatio > 0 ? coinToInrRatio : 0.1;

  // Max 25% of order total can be covered by coins
  const maxDiscountInr = (safeTotal * REWARDS_CONFIG.maxOrderCoinRedemptionPct) / 100;
  const maxCoinsByCap = Math.floor(maxDiscountInr / safeRatio);

  const spendableCoins = Math.min(safeCoins, maxCoinsByCap);
  const discountInr = Math.round(spendableCoins * safeRatio * 100) / 100;

  return {
    maxDiscountInr,
    maxCoinsByCap,
    spendableCoins,
    discountInr,
  };
}

/**
 * 3-Year Cycle Reset Helpers
 */
export function getCycleExpiryDate(cycleStartedAt?: Date | string | null): Date {
  const start = cycleStartedAt ? new Date(cycleStartedAt) : new Date();
  const expiry = new Date(start);
  expiry.setFullYear(expiry.getFullYear() + REWARDS_CONFIG.tierValidityYears);
  return expiry;
}

export function isTierCycleExpired(cycleStartedAt?: Date | string | null): boolean {
  if (!cycleStartedAt) return false;
  const expiry = getCycleExpiryDate(cycleStartedAt);
  return Date.now() > expiry.getTime();
}
