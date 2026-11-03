import { prisma } from '@/lib/prisma';
import { generateUniqueReferralCode, REWARDS_CONFIG } from '@/shared/config/rewards.config';

import { AdminRewardsService } from './admin-rewards.service';

export interface ReferralFriendRecord {
  id: string;
  friendName: string;
  friendUserId?: string;
  status: 'JOINED' | 'ORDER_PLACED' | 'DELIVERED_REWARDED' | 'ACTIVE';
  ordersCount: number;
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
  referrerUserId?: string;
  referrerName: string;
  discountInr: number;
  minOrderInr: number;
}

export class ReferralService {
  private static clickCounts = new Map<string, number>();
  private static tablesInitialized = false;

  /**
   * Lazily ensure PostgreSQL storage tables exist for persistent tracking
   */
  public static async ensureTables(): Promise<void> {
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
        CREATE TABLE IF NOT EXISTS user_referral_codes (
          user_id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(100) UNIQUE NOT NULL,
          user_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS referral_events (
          id VARCHAR(100) PRIMARY KEY,
          referrer_code VARCHAR(100) NOT NULL,
          referrer_user_id VARCHAR(100),
          friend_user_id VARCHAR(100),
          friend_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'JOINED',
          coins_awarded INTEGER NOT NULL DEFAULT 100,
          orders_count INTEGER NOT NULL DEFAULT 0,
          date_label VARCHAR(100) NOT NULL DEFAULT 'Today',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Backward-compatible schema evolution for existing DBs (individual statements to avoid prepared statement multi-command error)
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS referrer_user_id VARCHAR(100);`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS friend_user_id VARCHAR(100);`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS orders_count INTEGER NOT NULL DEFAULT 0;`,
        )
        .catch(() => {});

      await prisma
        .$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS idx_referral_events_code ON referral_events(referrer_code);`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS idx_referral_events_friend_user ON referral_events(friend_user_id);`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS idx_referral_events_referrer_user ON referral_events(referrer_user_id);`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(code);`,
        )
        .catch(() => {});

      this.tablesInitialized = true;
    } catch (err) {
      console.warn('[ReferralService] DB table ensureTables fallback:', err);
    }
  }

  /**
   * Deterministically generate unique referral code: <NAME_SLUG><SHORT_HASH>
   */
  public static generateCode(userId: string, nameOrMobile?: string): string {
    return generateUniqueReferralCode(userId, nameOrMobile);
  }

  /**
   * Register or persist user's referral code into user_referral_codes lookup table
   */
  public static async registerUserCode(
    userId: string,
    code: string,
    userName?: string,
  ): Promise<void> {
    if (!userId || !code) return;
    const cleanCode = code
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    try {
      await this.ensureTables();
      await prisma.$executeRawUnsafe(
        `INSERT INTO user_referral_codes (user_id, code, user_name, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           code = EXCLUDED.code,
           user_name = COALESCE(EXCLUDED.user_name, user_referral_codes.user_name)`,
        userId,
        cleanCode,
        userName || 'Jiivaa Shopper',
      );
    } catch (err) {
      console.warn('[ReferralService] registerUserCode db fallback:', err);
    }
  }

  /**
   * Find referrer user by code (supports with or without JIIVAA- prefix)
   */
  public static async findReferrer(code: string): Promise<{
    userId: string;
    userName: string;
    code: string;
  } | null> {
    const raw = (code || '').trim().toUpperCase();
    const clean = raw.replace(/^JIIVAA-/, '');
    if (!clean) return null;

    try {
      await this.ensureTables();
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT user_id as "userId", user_name as "userName", code
         FROM user_referral_codes
         WHERE UPPER(code) = $1 OR UPPER(code) = $2
         LIMIT 1`,
        clean,
        `JIIVAA-${clean}`,
      );

      if (Array.isArray(rows) && rows.length > 0) {
        return {
          userId: String(rows[0].userId),
          userName: String(rows[0].userName || 'A Boutique Friend'),
          code: String(rows[0].code),
        };
      }

      // Check Prisma User records directly
      const dbUsers: any = await (prisma as any).user.findMany({
        take: 30,
        select: { id: true, name: true, mobile: true },
      });
      for (const u of dbUsers) {
        const genCode = generateUniqueReferralCode(u.id, u.name || u.mobile);
        if (genCode.toUpperCase() === clean || genCode.toUpperCase() === `JIIVAA-${clean}`) {
          // Register it so next lookups are fast
          await this.registerUserCode(u.id, clean, u.name || 'Jiivaa Shopper').catch(() => {});
          return {
            userId: u.id,
            userName: u.name || 'A Boutique Friend',
            code: genCode,
          };
        }
      }
    } catch (err) {
      console.warn('[ReferralService] findReferrer fallback:', err);
    }

    return null;
  }

  /**
   * Check if a given code is a valid referral coupon format (<NAME_SLUG><SHORT_HASH> or JIIVAA-*)
   */
  public static isValidReferralCode(code: string): boolean {
    const clean = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    return clean.length >= 5 && /^[A-Z0-9]+$/.test(clean);
  }

  /**
   * Resolve a referral code to find who invited the user and what perks they receive.
   */
  public static async resolveReferrerAsync(code: string): Promise<ResolvedReferralInfo> {
    const clean = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    if (!this.isValidReferralCode(code)) {
      return {
        valid: false,
        code: clean,
        referrerName: 'A Boutique Friend',
        discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
        minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
      };
    }

    const found = await this.findReferrer(clean);
    if (found) {
      return {
        valid: true,
        code: clean,
        referrerUserId: found.userId,
        referrerName: found.userName,
        discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
        minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
      };
    }

    // Fallback: derive friendly display name from slug in code
    const namePart = clean.replace(/[0-9].*$/, '');
    let display = 'A Boutique Friend';
    if (namePart.length >= 3) {
      display = namePart.charAt(0) + namePart.slice(1).toLowerCase();
    } else if (clean.startsWith('M') && clean.length >= 5) {
      display = 'A Shopping Buddy';
    }

    return {
      valid: true,
      code: clean,
      referrerName: display,
      discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
      minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
    };
  }

  /**
   * Synchronous fallback resolver
   */
  public static resolveReferrer(code: string): ResolvedReferralInfo {
    const clean = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    if (!this.isValidReferralCode(code)) {
      return {
        valid: false,
        code: clean,
        referrerName: 'A Boutique Friend',
        discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
        minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
      };
    }

    const namePart = clean.replace(/[0-9].*$/, '');
    let display = 'A Boutique Friend';
    if (namePart.length >= 3) {
      display = namePart.charAt(0) + namePart.slice(1).toLowerCase();
    } else if (clean.startsWith('M') && clean.length >= 5) {
      display = 'A Shopping Buddy';
    }

    return {
      valid: true,
      code: clean,
      referrerName: display,
      discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
      minOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
    };
  }

  /**
   * Record a real link click for a referral code
   */
  public static async recordClick(code: string): Promise<number> {
    const clean = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
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
   * Record when a referee signs up / applies a referral code.
   *
   * Economic Flow:
   * 1. Referee (Friend) gets 500 Coins credited (= ₹50 discount value on orders ₹499+).
   * 2. Referrer gets 100 Coins credited immediately upon friend join.
   * 3. referral_events record created with friend_user_id, status: 'JOINED', coins_awarded: 100, orders_count: 0.
   */
  public static async recordFriendJoined(params: {
    code: string;
    friendName: string;
    friendUserId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    coinsCredited?: number;
    discountInr?: number;
  }> {
    const { code, friendName, friendUserId } = params;
    const clean = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');
    if (!clean) {
      return { success: false, message: 'Please provide a valid referral code.' };
    }

    // Require authenticated user ID: coins can NEVER be credited to guest/unauthenticated calls
    if (!friendUserId) {
      return {
        success: false,
        message: 'Please sign up or log in to claim your referral welcome gift.',
      };
    }

    await this.ensureTables();

    // 1. Resolve Referrer
    const referrer = await this.findReferrer(clean);
    const referrerUserId = referrer?.userId || null;
    const referrerName = referrer?.userName || this.resolveReferrer(clean).referrerName;

    // Self-referral prevention
    if (referrerUserId && friendUserId === referrerUserId) {
      return {
        success: false,
        message: 'Aap apna khud ka referral code use nahi kar sakte.',
      };
    }

    // Check if referee has already claimed a referral bonus in events or coins ledger
    const [existingClaims, existingLedger]: any = await Promise.all([
      prisma
        .$queryRawUnsafe(
          `SELECT id FROM referral_events WHERE friend_user_id = $1 LIMIT 1`,
          friendUserId,
        )
        .catch(() => []),
      prisma
        .$queryRawUnsafe(
          `SELECT id FROM user_coins_ledger WHERE user_id = $1 AND reference = $2 LIMIT 1`,
          friendUserId,
          `ref_welcome_${friendUserId}`,
        )
        .catch(() => []),
    ]);

    if (
      (Array.isArray(existingClaims) && existingClaims.length > 0) ||
      (Array.isArray(existingLedger) && existingLedger.length > 0)
    ) {
      return {
        success: false,
        message: 'Aapne pehle hi referral welcome gift claim kar liya hai.',
      };
    }

    const cleanFriendName = (friendName || 'New Friend').trim();

    // 2. Award Referee: 500 Coins (= ₹50 value) with deterministic idempotent reference
    await AdminRewardsService.recordCoinTransaction({
      userId: friendUserId,
      userName: cleanFriendName,
      amount: REWARDS_CONFIG.referralFriendSignupCoins, // 500
      type: 'REFERRAL_BONUS',
      reference: `ref_welcome_${friendUserId}`,
      description: `Referral Welcome Gift (Used friend code: ${clean})`,
    });

    // 3. Award Referrer: 100 Coins with deterministic idempotent reference ref_join_<friendUserId>
    // Guarantees referrer can NEVER receive multiple bonuses for the same friend
    if (referrerUserId) {
      const referrerJoinRef = `ref_join_${friendUserId}`;
      const alreadyCredited: any = await prisma
        .$queryRawUnsafe(
          `SELECT id FROM user_coins_ledger WHERE user_id = $1 AND reference = $2 LIMIT 1`,
          referrerUserId,
          referrerJoinRef,
        )
        .catch(() => []);

      if (!Array.isArray(alreadyCredited) || alreadyCredited.length === 0) {
        await AdminRewardsService.recordCoinTransaction({
          userId: referrerUserId,
          userName: referrerName,
          amount: REWARDS_CONFIG.referralReferrerSignupCoins, // 100
          type: 'REFERRAL_BONUS',
          reference: referrerJoinRef,
          description: `Referral Bonus: Friend ${cleanFriendName} joined via your code`,
        });
      }
    }

    // 4. Save into referral_events with idempotent primary key
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO referral_events (
           id, referrer_code, referrer_user_id, friend_user_id, friend_name,
           status, coins_awarded, orders_count, date_label, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'JOINED', $6, 0, 'Today', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        `ref_event_${friendUserId}`,
        clean,
        referrerUserId,
        friendUserId,
        cleanFriendName,
        REWARDS_CONFIG.referralReferrerSignupCoins, // 100
      );
    } catch (err) {
      console.warn('[ReferralService] recordFriendJoined db fallback:', err);
    }

    return {
      success: true,
      message: `🎉 Badhaai ho! 500 Jiivaa Coins (Flat ₹50 OFF on ₹499+) aapke wallet me add ho gaye!`,
      coinsCredited: REWARDS_CONFIG.referralFriendSignupCoins,
      discountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
    };
  }

  /**
   * Record when referee's order status changes (Order placed / in-transit / delivered).
   *
   * Economic Flow for Delivered Orders:
   * 1. If friend's 1st delivered order:
   *    Referrer gets ₹50 (500 Coins) credited to wallet.
   *    referral_events: orders_count = 1, coins_awarded = coins_awarded + 500 (e.g. 100 + 500 = 600 Coins).
   * 2. On every subsequent delivered order by that friend:
   *    Referrer gets +10 Coins per order.
   *    referral_events: orders_count = orders_count + 1, coins_awarded = coins_awarded + 10.
   */
  public static async recordFriendDeliveredOrder(
    friendUserId: string,
    orderId: string,
    orderNumber?: string,
  ): Promise<void> {
    if (!friendUserId || !orderId) return;

    try {
      await this.ensureTables();

      // Check idempotency: avoid awarding bonus twice for the same delivered order
      const ledgerCheck: any = await prisma
        .$queryRawUnsafe(
          `SELECT id FROM user_coins_ledger WHERE reference = $1 LIMIT 1`,
          `ref_delivered_${orderId}`,
        )
        .catch(() => []);

      if (Array.isArray(ledgerCheck) && ledgerCheck.length > 0) {
        return; // Already processed
      }

      // Lookup referral event for this friend
      const events: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, referrer_code as "referrerCode", referrer_user_id as "referrerUserId",
                  friend_name as "friendName", coins_awarded as "coinsAwarded",
                  orders_count as "ordersCount"
           FROM referral_events
           WHERE friend_user_id = $1
           ORDER BY created_at ASC
           LIMIT 1`,
          friendUserId,
        )
        .catch(() => []);

      if (!Array.isArray(events) || events.length === 0) {
        return;
      }

      const event = events[0];
      const referrerUserId = event.referrerUserId;
      const currentOrdersCount = Number(event.ordersCount || 0);
      const currentCoinsAwarded = Number(event.coinsAwarded || 100);
      const friendName = event.friendName || 'Friend';
      const orderRef = orderNumber || orderId.slice(0, 8);

      if (currentOrdersCount === 0) {
        // 1st DELIVERED ORDER: Referrer gets 500 Coins (= ₹50 discount credit)!
        if (referrerUserId) {
          await AdminRewardsService.recordCoinTransaction({
            userId: referrerUserId,
            amount: REWARDS_CONFIG.referralReferrerFirstOrderCoins, // 500
            type: 'REFERRAL_BONUS',
            reference: `ref_delivered_${orderId}`,
            description: `Referral Reward: ₹50 bonus for ${friendName}'s 1st delivered order (#${orderRef})!`,
          });
        }

        await prisma.$executeRawUnsafe(
          `UPDATE referral_events
           SET orders_count = 1,
               coins_awarded = $1,
               status = 'DELIVERED_REWARDED',
               date_label = '1st Order Delivered',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          currentCoinsAwarded + REWARDS_CONFIG.referralReferrerFirstOrderCoins,
          event.id,
        );
      } else {
        // SUBSEQUENT DELIVERED ORDER: Referrer gets +10 Coins per order!
        if (referrerUserId) {
          await AdminRewardsService.recordCoinTransaction({
            userId: referrerUserId,
            amount: REWARDS_CONFIG.referralReferrerRepeatOrderCoins, // 10
            type: 'REFERRAL_BONUS',
            reference: `ref_delivered_${orderId}`,
            description: `Referral Perk: +10 coins for ${friendName}'s delivered order (#${orderRef})`,
          });
        }

        await prisma.$executeRawUnsafe(
          `UPDATE referral_events
           SET orders_count = orders_count + 1,
               coins_awarded = $1,
               status = 'ACTIVE',
               date_label = 'Delivered',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          currentCoinsAwarded + REWARDS_CONFIG.referralReferrerRepeatOrderCoins,
          event.id,
        );
      }
    } catch (err) {
      console.warn('[ReferralService] recordFriendDeliveredOrder error:', err);
    }
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
    const referralCode =
      codeOverride || this.generateCode(userId, userName).replace(/^JIIVAA-/, '');
    const shareUrl = `${originUrl}/r/${referralCode}`;
    const whatsAppShareText = REWARDS_CONFIG.getWhatsAppShareText(
      referralCode,
      shareUrl,
      REWARDS_CONFIG.referralRefereeDiscountInr,
    );

    // Register user code in DB
    await this.registerUserCode(userId, referralCode, userName).catch(() => {});

    let clicks = this.clickCounts.get(referralCode) || 0;
    let friends: ReferralFriendRecord[] = [];

    try {
      await this.ensureTables();

      // Query database clicks
      const clicksRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT clicks FROM referral_clicks WHERE code = $1 OR code = $2 LIMIT 1`,
          referralCode,
          `JIIVAA-${referralCode}`,
        )
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
          `SELECT id, friend_name as "friendName", friend_user_id as "friendUserId",
                  status, coins_awarded as "coinsAwarded", orders_count as "ordersCount",
                  date_label as "date"
           FROM referral_events
           WHERE referrer_user_id = $1 OR UPPER(referrer_code) = $2 OR UPPER(referrer_code) = $3
           ORDER BY created_at DESC
           LIMIT 50`,
          userId,
          referralCode,
          `JIIVAA-${referralCode}`,
        )
        .catch(() => []);

      if (Array.isArray(eventsRows) && eventsRows.length > 0) {
        friends = eventsRows.map((r: any) => ({
          id: String(r.id),
          friendName: String(r.friendName || 'Jiivaa Friend'),
          friendUserId: r.friendUserId ? String(r.friendUserId) : undefined,
          status: (r.status || 'JOINED') as ReferralFriendRecord['status'],
          ordersCount: Number(r.ordersCount || 0),
          coinsAwarded: Number(r.coinsAwarded || 100),
          date: String(r.date || 'Today'),
        }));
      }
    } catch (err) {
      console.warn('[ReferralService] getProfile db query fallback:', err);
    }

    const successfulOrders = friends.reduce((sum, f) => sum + (f.ordersCount || 0), 0);
    let totalCoinsEarned = friends.reduce((sum, f) => sum + (f.coinsAwarded || 0), 0);

    // Fallback: If friends list is empty, check authoritative coins ledger for any existing REFERRAL_BONUS
    if (totalCoinsEarned === 0 && userId && !userId.startsWith('guest')) {
      try {
        const ledgerRows: any = await prisma
          .$queryRawUnsafe(
            `SELECT COALESCE(SUM(amount), 0) as total FROM user_coins_ledger WHERE user_id = $1 AND type = 'REFERRAL_BONUS'`,
            userId,
          )
          .catch(() => []);
        if (Array.isArray(ledgerRows) && ledgerRows.length > 0) {
          totalCoinsEarned = Number(ledgerRows[0].total || 0);
        }
      } catch {}
    }

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
        totalEarnedInr: Math.round(totalCoinsEarned * 0.1),
      },
      friends,
    };
  }
}
