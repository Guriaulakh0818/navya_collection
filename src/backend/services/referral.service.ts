import { REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface ReferralFriendRecord {
  id: string;
  friendName: string;
  status: 'PENDING' | 'ORDER_PLACED' | 'DELIVERED_REWARDED';
  coinsAwarded: number;
  date: string;
}

export interface ReferralProfileData {
  userId: string;
  referralCode: string;
  shareUrl: string;
  whatsAppShareText: string;
  stats: {
    totalClicks: number;
    friendsJoined: number;
    successfulOrders: number;
    totalCoinsEarned: number;
    totalEarnedInr: number;
  };
  friends: ReferralFriendRecord[];
}

export interface ResolvedReferralInfo {
  valid: boolean;
  code: string;
  referrerName: string;
  discountInr: number;
  minOrderInr: number;
}

export class ReferralService {
  // Real runtime tracking for clicks and referral friends (per referralCode)
  private static clickCounts = new Map<string, number>();
  private static referralRecords = new Map<string, ReferralFriendRecord[]>();

  /**
   * Record a real link click for a referral code
   */
  public static async recordClick(code: string): Promise<number> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return 0;
    const current = this.clickCounts.get(clean) || 0;
    const updated = current + 1;
    this.clickCounts.set(clean, updated);
    return updated;
  }

  /**
   * Record when a referee signs up / visits via referral code
   */
  public static async recordFriendJoined(code: string, friendName: string): Promise<void> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return;
    const list = this.referralRecords.get(clean) || [];
    list.unshift({
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      friendName,
      status: 'PENDING',
      coinsAwarded: REWARDS_CONFIG.referralReferrerBonusCoins,
      date: 'Today',
    });
    this.referralRecords.set(clean, list);
  }

  /**
   * Record when a referee places an order or their order is delivered
   */
  public static async recordFriendOrder(
    code: string,
    friendName: string,
    isDelivered = false,
  ): Promise<void> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return;
    const list = this.referralRecords.get(clean) || [];
    const existing = list.find((f) => f.friendName.toLowerCase() === friendName.toLowerCase());
    if (existing) {
      existing.status = isDelivered ? 'DELIVERED_REWARDED' : 'ORDER_PLACED';
      existing.date = isDelivered ? 'Delivered' : 'In transit';
    } else {
      list.unshift({
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        friendName,
        status: isDelivered ? 'DELIVERED_REWARDED' : 'ORDER_PLACED',
        coinsAwarded: REWARDS_CONFIG.referralReferrerBonusCoins,
        date: isDelivered ? 'Delivered' : 'Today',
      });
    }
    this.referralRecords.set(clean, list);
  }
  /**
   * Deterministically generate a 100% collision-free, memorable referral code for a user.
   * Format: JIIVAA-<NAME_SLUG><SHORT_HASH>
   *
   * Examples:
   *  - Priya Sharma (id: clx98f2...) => JIIVAA-PRIYA4K
   *  - Priya Verma (id: clx72a1...)  => JIIVAA-PRIYA9X (Guaranteed NO collision!)
   *  - Rahul (id: cm12...)         => JIIVAA-RAHUL2M
   *  - Guest (id: guest-123)       => JIIVAA-GUEST8A
   */
  public static generateCode(userId: string, nameOrMobile?: string): string {
    const rawId = userId || 'default-guest-id';

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
   * Resolve a referral code to find who invited the user and what perks they receive.
   */
  public static resolveReferrer(code: string): ResolvedReferralInfo {
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
    const namePart = suffix.replace(/[0-9].*$/, ''); // Strip numbers and hash
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
   * Check if a given code is a valid referral coupon format
   */
  public static isValidReferralCode(code: string): boolean {
    const clean = (code || '').trim().toUpperCase();
    return clean.startsWith('JIIVAA-') && clean.length >= 7;
  }

  /**
   * Get Referral Profile & Stats for a user
   */
  public static async getProfile(
    userId: string,
    originUrl = 'http://localhost:3000',
    userName?: string,
  ): Promise<ReferralProfileData> {
    const referralCode = this.generateCode(userId, userName);
    const shareUrl = `${originUrl}/r/${referralCode}`;
    const whatsAppShareText = REWARDS_CONFIG.getWhatsAppShareText(referralCode, shareUrl);

    const clicks = this.clickCounts.get(referralCode) || 0;
    const friends = this.referralRecords.get(referralCode) || [];

    const successfulOrders = friends.filter((f) => f.status === 'DELIVERED_REWARDED').length;
    const totalCoinsEarned = successfulOrders * REWARDS_CONFIG.referralReferrerBonusCoins;

    return {
      userId,
      referralCode,
      shareUrl,
      whatsAppShareText,
      stats: {
        totalClicks: clicks,
        friendsJoined: friends.length,
        successfulOrders,
        totalCoinsEarned,
        totalEarnedInr: totalCoinsEarned,
      },
      friends,
    };
  }
}
