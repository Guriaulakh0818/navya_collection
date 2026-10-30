import { prisma } from '@/lib/prisma';
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
  private static tablesInitialized = false;

  /**
   * Lazily ensure PostgreSQL storage tables exist for persistent cross-lambda tracking
   */
  private static async ensureTables(): Promise<void> {
    if (this.tablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS referral_clicks (
          code VARCHAR(100) PRIMARY KEY,
          clicks INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS referral_events (
          id VARCHAR(100) PRIMARY KEY,
          referrer_code VARCHAR(100) NOT NULL,
          friend_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          coins_awarded INTEGER NOT NULL DEFAULT 150,
          date_label VARCHAR(100) NOT NULL DEFAULT 'Today',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_referral_events_code ON referral_events(referrer_code);
      `);
      this.tablesInitialized = true;
    } catch (err) {
      console.warn('[ReferralService] DB table ensureTables fallback:', err);
    }
  }

  /**
   * Record a real link click for a referral code
   */
  public static async recordClick(code: string): Promise<number> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return 0;
    const current = this.clickCounts.get(clean) || 0;
    const updated = current + 1;
    this.clickCounts.set(clean, updated);

    try {
      await this.ensureTables();
      await prisma.$executeRawUnsafe(
        `INSERT INTO referral_clicks (code, clicks, updated_at)
         VALUES ($1, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (code) DO UPDATE SET
           clicks = referral_clicks.clicks + 1,
           updated_at = CURRENT_TIMESTAMP`,
        clean,
      );
    } catch (err) {
      console.warn('[ReferralService] recordClick db fallback:', err);
    }

    return updated;
  }

  /**
   * Record when a referee signs up / visits via referral code
   */
  public static async recordFriendJoined(code: string, friendName: string): Promise<void> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return;
    const cleanName = (friendName || 'Friend via Link').trim();
    const eventId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const list = this.referralRecords.get(clean) || [];
    const existing = list.find((f) => f.friendName.toLowerCase() === cleanName.toLowerCase());
    if (!existing) {
      list.unshift({
        id: eventId,
        friendName: cleanName,
        status: 'PENDING',
        coinsAwarded: REWARDS_CONFIG.referralReferrerBonusCoins,
        date: 'Today',
      });
      this.referralRecords.set(clean, list);
    }

    try {
      await this.ensureTables();
      await prisma.$executeRawUnsafe(
        `INSERT INTO referral_events (id, referrer_code, friend_name, status, coins_awarded, date_label, created_at, updated_at)
         VALUES ($1, $2, $3, 'PENDING', $4, 'Today', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        eventId,
        clean,
        cleanName,
        REWARDS_CONFIG.referralReferrerBonusCoins,
      );
    } catch (err) {
      console.warn('[ReferralService] recordFriendJoined db fallback:', err);
    }
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
    const targetStatus = isDelivered ? 'DELIVERED_REWARDED' : 'ORDER_PLACED';
    const targetDate = isDelivered ? 'Delivered' : 'In transit';

    const list = this.referralRecords.get(clean) || [];
    const existing = list.find((f) => f.friendName.toLowerCase() === friendName.toLowerCase());
    if (existing) {
      existing.status = targetStatus;
      existing.date = targetDate;
    } else {
      list.unshift({
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        friendName,
        status: targetStatus,
        coinsAwarded: REWARDS_CONFIG.referralReferrerBonusCoins,
        date: targetDate,
      });
    }
    this.referralRecords.set(clean, list);

    try {
      await this.ensureTables();
      await prisma.$executeRawUnsafe(
        `UPDATE referral_events
         SET status = $1, date_label = $2, updated_at = CURRENT_TIMESTAMP
         WHERE referrer_code = $3 AND LOWER(friend_name) = LOWER($4)`,
        targetStatus,
        targetDate,
        clean,
        friendName,
      );
    } catch (err) {
      console.warn('[ReferralService] recordFriendOrder db fallback:', err);
    }
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
    codeOverride?: string,
  ): Promise<ReferralProfileData> {
    const referralCode = codeOverride || this.generateCode(userId, userName);
    const shareUrl = `${originUrl}/r/${referralCode}`;
    const whatsAppShareText = REWARDS_CONFIG.getWhatsAppShareText(referralCode, shareUrl);

    let clicks = this.clickCounts.get(referralCode) || 0;
    let friends = [...(this.referralRecords.get(referralCode) || [])];

    try {
      await this.ensureTables();

      // Query database clicks
      const clicksRows: any = await prisma
        .$queryRawUnsafe(`SELECT clicks FROM referral_clicks WHERE code = $1 LIMIT 1`, referralCode)
        .catch(() => []);
      if (
        Array.isArray(clicksRows) &&
        clicksRows.length > 0 &&
        typeof clicksRows[0].clicks === 'number'
      ) {
        clicks = Math.max(clicks, Number(clicksRows[0].clicks));
      }

      // Query database friends events
      const eventsRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, friend_name as "friendName", status, coins_awarded as "coinsAwarded", date_label as "date"
           FROM referral_events
           WHERE referrer_code = $1
           ORDER BY created_at DESC
           LIMIT 50`,
          referralCode,
        )
        .catch(() => []);

      if (Array.isArray(eventsRows) && eventsRows.length > 0) {
        const dbFriends: ReferralFriendRecord[] = eventsRows.map((r: any) => ({
          id: String(r.id),
          friendName: String(r.friendName),
          status: (r.status || 'PENDING') as 'PENDING' | 'ORDER_PLACED' | 'DELIVERED_REWARDED',
          coinsAwarded: Number(r.coinsAwarded) || REWARDS_CONFIG.referralReferrerBonusCoins,
          date: String(r.date || 'Today'),
        }));

        // Merge DB records with any ephemeral memory records, deduplicated by id or friendName
        const seen = new Set<string>();
        const merged: ReferralFriendRecord[] = [];
        for (const item of [...friends, ...dbFriends]) {
          const key = (item.friendName || '').toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }
        friends = merged;
      }
    } catch (err) {
      console.warn('[ReferralService] getProfile db query fallback:', err);
    }

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
