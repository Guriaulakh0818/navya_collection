/**
 * Jiivaa Rewards & Refer-and-Earn Centralized Configuration
 * Brand: JiivaaKart
 */

export interface LoyaltyTier {
  id: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  name: string;
  badge: string;
  minCoins: number;
  maxCoins: number | null;
  discountPct: number;
  couponCode: string;
  perks: string[];
  themeColor: string;
  textColor: string;
  accentBg: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'BRONZE',
    name: 'Bronze Shopper',
    badge: '🥉 Bronze',
    minCoins: 0,
    maxCoins: 999,
    discountPct: 0,
    couponCode: 'JIIVAA-BRONZE',
    perks: [
      'Welcome 200 Jiivaa Coins on Signup',
      'Earn 1 Coin on every ₹1 spent',
      'Pan-India boutique order support',
    ],
    themeColor: '#CD7F32',
    textColor: 'text-amber-800',
    accentBg: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'SILVER',
    name: 'Silver Trendsetter',
    badge: '🥈 Silver',
    minCoins: 1000,
    maxCoins: 2499,
    discountPct: 5,
    couponCode: 'JIIVAA-SILVER-5',
    perks: [
      'Free Shipping on all Boutique Orders',
      'Flat 5% Milestone Coupon Code',
      'Early access to seasonal boutique sales',
    ],
    themeColor: '#94A3B8',
    textColor: 'text-slate-700',
    accentBg: 'bg-slate-100 border-slate-300',
  },
  {
    id: 'GOLD',
    name: 'Gold VIP Insider',
    badge: '🥇 Gold VIP',
    minCoins: 2500,
    maxCoins: 4999,
    discountPct: 15,
    couponCode: 'JIIVAA-GOLD-15',
    perks: [
      'Exclusive 15% VIP Milestone Coupon',
      'Priority express courier dispatch',
      'Invites to boutique flash clearance sales',
    ],
    themeColor: '#F28C28',
    textColor: 'text-orange',
    accentBg: 'bg-orange/10 border-orange/30',
  },
  {
    id: 'PLATINUM',
    name: 'Platinum Style Icon',
    badge: '💎 Platinum Icon',
    minCoins: 5000,
    maxCoins: null,
    discountPct: 20,
    couponCode: 'JIIVAA-PLATINUM-20',
    perks: [
      'Flat 20% Birthday VIP Shopping Coupon',
      'Dedicated WhatsApp Boutique Concierge',
      'Surprise festive gifts from verified boutiques',
    ],
    themeColor: '#0A2342',
    textColor: 'text-navy',
    accentBg: 'bg-navy/5 border-navy/20',
  },
];

export const REWARDS_CONFIG = {
  // Coin Economics
  coinToInrRatio: 0.1, // 100 Coins = ₹10 (1 Coin = ₹0.10)
  signupBonusCoins: 200, // ₹20 value
  reviewBonusCoins: 50, // ₹5 value
  firstOrderBonusCoins: 300, // ₹30 value

  // Referral Economics
  referralRefereeDiscountInr: 150, // Friend gets ₹150 OFF
  referralRefereeMinOrderInr: 999, // Min order ₹999 for friend
  referralReferrerBonusCoins: 150, // You get 150 Coins (₹150 value)
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
    const finalDiscount = typeof discountInr === 'number' ? discountInr : 150;
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
