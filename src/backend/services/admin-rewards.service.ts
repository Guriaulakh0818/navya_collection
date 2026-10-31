import { prisma } from '@/lib/prisma';
import { LOYALTY_TIERS, REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface AdminRewardsSettings {
  coinToInrRatio: number;
  signupBonusCoins: number;
  reviewBonusCoins: number;
  firstOrderBonusCoins: number;
  referralRefereeDiscountInr: number;
  referralRefereeMinOrderInr: number;
  referralReferrerBonusCoins: number;
}

export interface AdminClaimLedgerItem {
  id: string;
  userName: string;
  userPhoneOrEmail: string;
  type:
    | 'REFERRAL_EARNED'
    | 'REFERRAL_USED'
    | 'MILESTONE_CLAIMED'
    | 'ORDER_CASHBACK'
    | 'SIGNUP_BONUS'
    | 'REDEEMED_CHECKOUT';
  codeOrTier: string;
  coins: number;
  inrValue: number;
  orderNumber?: string;
  orderAmount?: number;
  status: 'COMPLETED' | 'ORDER_PLACED' | 'PENDING' | 'CLAIMED';
  timestamp: string;
}

export interface AdminRewardsOverviewData {
  stats: {
    totalCoinsInCirculation: number;
    totalLiabilityInr: number;
    totalCoinsRedeemed: number;
    totalSavingsGivenInr: number;
    totalReferralClicks: number;
    totalFriendsJoined: number;
    totalReferralOrders: number;
    totalReferralGmvInr: number;
    tierDistribution: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
    };
  };
  settings: AdminRewardsSettings;
  ledger: AdminClaimLedgerItem[];
}

// In-memory runtime settings cache (with defaults from config)
let runtimeSettings: AdminRewardsSettings = {
  coinToInrRatio: REWARDS_CONFIG.coinToInrRatio,
  signupBonusCoins: REWARDS_CONFIG.signupBonusCoins,
  reviewBonusCoins: REWARDS_CONFIG.reviewBonusCoins,
  firstOrderBonusCoins: REWARDS_CONFIG.firstOrderBonusCoins,
  referralRefereeDiscountInr: REWARDS_CONFIG.referralRefereeDiscountInr,
  referralRefereeMinOrderInr: REWARDS_CONFIG.referralRefereeMinOrderInr,
  referralReferrerBonusCoins: REWARDS_CONFIG.referralReferrerBonusCoins,
};

export class AdminRewardsService {
  private static tablesInitialized = false;

  private static applySettingsToConfig(s: AdminRewardsSettings) {
    REWARDS_CONFIG.coinToInrRatio = s.coinToInrRatio;
    REWARDS_CONFIG.signupBonusCoins = s.signupBonusCoins;
    REWARDS_CONFIG.reviewBonusCoins = s.reviewBonusCoins;
    REWARDS_CONFIG.firstOrderBonusCoins = s.firstOrderBonusCoins;
    REWARDS_CONFIG.referralRefereeDiscountInr = s.referralRefereeDiscountInr;
    REWARDS_CONFIG.referralRefereeMinOrderInr = s.referralRefereeMinOrderInr;
    REWARDS_CONFIG.referralReferrerBonusCoins = s.referralReferrerBonusCoins;
  }

  /**
   * Lazily ensure PostgreSQL storage tables exist for persistent cross-lambda tracking
   */
  public static async ensureTables(): Promise<void> {
    if (this.tablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS rewards_settings (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
          coin_to_inr_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.1,
          signup_bonus_coins INTEGER NOT NULL DEFAULT 200,
          review_bonus_coins INTEGER NOT NULL DEFAULT 50,
          first_order_bonus_coins INTEGER NOT NULL DEFAULT 300,
          referral_referee_discount_inr INTEGER NOT NULL DEFAULT 150,
          referral_referee_min_order_inr INTEGER NOT NULL DEFAULT 999,
          referral_referrer_bonus_coins INTEGER NOT NULL DEFAULT 150,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_coins_ledger (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          user_name VARCHAR(255),
          user_email_or_phone VARCHAR(255),
          amount INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          reference VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_user_coins_ledger_user ON user_coins_ledger(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_coins_ledger_type ON user_coins_ledger(type);
      `);

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

      // Seed initial default row if missing
      await prisma.$executeRawUnsafe(`
        INSERT INTO rewards_settings (
          id, coin_to_inr_ratio, signup_bonus_coins, review_bonus_coins,
          first_order_bonus_coins, referral_referee_discount_inr,
          referral_referee_min_order_inr, referral_referrer_bonus_coins
        ) VALUES ('current', 0.1, 200, 50, 300, 150, 999, 150)
        ON CONFLICT (id) DO NOTHING;
      `);

      this.tablesInitialized = true;
    } catch (err) {
      console.warn('[AdminRewardsService] ensureTables fallback:', err);
    }
  }

  /**
   * Get live runtime settings directly from database
   */
  public static async getSettings(): Promise<AdminRewardsSettings> {
    try {
      await this.ensureTables();
      const rows: any = await prisma
        .$queryRawUnsafe(
          `SELECT coin_to_inr_ratio as "coinToInrRatio",
                  signup_bonus_coins as "signupBonusCoins",
                  review_bonus_coins as "reviewBonusCoins",
                  first_order_bonus_coins as "firstOrderBonusCoins",
                  referral_referee_discount_inr as "referralRefereeDiscountInr",
                  referral_referee_min_order_inr as "referralRefereeMinOrderInr",
                  referral_referrer_bonus_coins as "referralReferrerBonusCoins"
           FROM rewards_settings
           WHERE id = 'current'
           LIMIT 1`,
        )
        .catch(() => []);

      if (Array.isArray(rows) && rows.length > 0) {
        const db = rows[0];
        runtimeSettings = {
          coinToInrRatio: Number(db.coinToInrRatio) || 0.1,
          signupBonusCoins: Number(db.signupBonusCoins) || 200,
          reviewBonusCoins: Number(db.reviewBonusCoins) || 50,
          firstOrderBonusCoins: Number(db.firstOrderBonusCoins) || 300,
          referralRefereeDiscountInr: Number(db.referralRefereeDiscountInr) || 150,
          referralRefereeMinOrderInr: Number(db.referralRefereeMinOrderInr) || 999,
          referralReferrerBonusCoins: Number(db.referralReferrerBonusCoins) || 150,
        };
        this.applySettingsToConfig(runtimeSettings);
      }
    } catch (err) {
      console.warn('[AdminRewardsService] getSettings DB query fallback:', err);
    }
    return { ...runtimeSettings };
  }

  /**
   * Fast synchronous getter
   */
  public static getSettingsSync(): AdminRewardsSettings {
    return { ...runtimeSettings };
  }

  /**
   * Update settings in database and runtime cache
   */
  public static async updateSettings(
    newSettings: Partial<AdminRewardsSettings>,
  ): Promise<AdminRewardsSettings> {
    runtimeSettings = {
      ...runtimeSettings,
      ...newSettings,
    };
    this.applySettingsToConfig(runtimeSettings);

    try {
      await this.ensureTables();
      await prisma.$executeRawUnsafe(
        `INSERT INTO rewards_settings (
           id,
           coin_to_inr_ratio,
           signup_bonus_coins,
           review_bonus_coins,
           first_order_bonus_coins,
           referral_referee_discount_inr,
           referral_referee_min_order_inr,
           referral_referrer_bonus_coins,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           coin_to_inr_ratio = EXCLUDED.coin_to_inr_ratio,
           signup_bonus_coins = EXCLUDED.signup_bonus_coins,
           review_bonus_coins = EXCLUDED.review_bonus_coins,
           first_order_bonus_coins = EXCLUDED.first_order_bonus_coins,
           referral_referee_discount_inr = EXCLUDED.referral_referee_discount_inr,
           referral_referee_min_order_inr = EXCLUDED.referral_referee_min_order_inr,
           referral_referrer_bonus_coins = EXCLUDED.referral_referrer_bonus_coins,
           updated_at = CURRENT_TIMESTAMP`,
        'current',
        runtimeSettings.coinToInrRatio,
        runtimeSettings.signupBonusCoins,
        runtimeSettings.reviewBonusCoins,
        runtimeSettings.firstOrderBonusCoins,
        runtimeSettings.referralRefereeDiscountInr,
        runtimeSettings.referralRefereeMinOrderInr,
        runtimeSettings.referralReferrerBonusCoins,
      );
    } catch (err) {
      console.error('[AdminRewardsService] updateSettings DB write error:', err);
    }

    return { ...runtimeSettings };
  }

  /**
   * Record coin transaction in user_coins_ledger
   */
  public static async recordCoinTransaction(entry: {
    id?: string;
    userId: string;
    userName?: string;
    userEmailOrPhone?: string;
    amount: number;
    type: AdminClaimLedgerItem['type'];
    reference?: string;
    description?: string;
  }): Promise<void> {
    try {
      await this.ensureTables();
      const id = entry.id || `coin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO user_coins_ledger (
           id, user_id, user_name, user_email_or_phone, amount, type, reference, description, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        id,
        entry.userId,
        entry.userName || 'Customer',
        entry.userEmailOrPhone || '',
        entry.amount,
        entry.type,
        entry.reference || '',
        entry.description || '',
      );
    } catch (err) {
      console.warn('[AdminRewardsService] recordCoinTransaction error:', err);
    }
  }

  /**
   * Get complete admin overview: 100% real database metrics and live ledger
   */
  public static async getOverview(): Promise<AdminRewardsOverviewData> {
    const settings = await this.getSettings();

    // 1. Fetch real active shoppers (customers who have actually placed orders)
    let bronzeCount = 0;
    let silverCount = 0;
    let goldCount = 0;
    let platinumCount = 0;

    try {
      const shopperOrders: any = await prisma.order
        .groupBy({
          by: ['userId'],
          _count: { id: true },
          where: {
            orderStatus: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING'] },
          },
        })
        .catch(() => []);

      if (Array.isArray(shopperOrders) && shopperOrders.length > 0) {
        for (const s of shopperOrders) {
          const count = Number(s._count?.id || 0);
          if (count >= 30) {
            platinumCount++;
          } else if (count >= 15) {
            goldCount++;
          } else if (count >= 5) {
            silverCount++;
          } else if (count >= 1) {
            bronzeCount++;
          }
        }
      }
    } catch (err) {
      console.warn('[AdminRewardsService] tier distribution query warning:', err);
    }

    const tierDistribution = {
      bronze: bronzeCount,
      silver: silverCount,
      gold: goldCount,
      platinum: platinumCount,
    };

    // 2. Fetch real referral clicks & events from PostgreSQL
    let totalReferralClicks = 0;
    let totalFriendsJoined = 0;
    let totalReferralOrders = 0;
    let totalReferralGmvInr = 0;
    const ledger: AdminClaimLedgerItem[] = [];

    try {
      // Query clicks sum
      const clicksSum: any = await prisma
        .$queryRawUnsafe(`SELECT COALESCE(SUM(clicks), 0) as total FROM referral_clicks`)
        .catch(() => []);
      if (Array.isArray(clicksSum) && clicksSum.length > 0) {
        totalReferralClicks = Number(clicksSum[0].total) || 0;
      }

      // Query friends joined count
      const eventsCount: any = await prisma
        .$queryRawUnsafe(`SELECT count(*) as count FROM referral_events`)
        .catch(() => []);
      if (Array.isArray(eventsCount) && eventsCount.length > 0) {
        totalFriendsJoined = Number(eventsCount[0].count) || 0;
      }

      // Query referral orders count
      const refOrdersCount: any = await prisma
        .$queryRawUnsafe(
          `SELECT count(*) as count FROM referral_events WHERE status IN ('ORDER_PLACED', 'DELIVERED_REWARDED')`,
        )
        .catch(() => []);
      if (Array.isArray(refOrdersCount) && refOrdersCount.length > 0) {
        totalReferralOrders = Number(refOrdersCount[0].count) || 0;
      }

      // Query real referral events for ledger
      const realEvents: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, referrer_code as "code", friend_name as "friendName", status, coins_awarded as "coins", date_label as "date", created_at as "createdAt"
           FROM referral_events
           ORDER BY created_at DESC
           LIMIT 50`,
        )
        .catch(() => []);

      if (Array.isArray(realEvents) && realEvents.length > 0) {
        for (const ev of realEvents) {
          const isDelivered = ev.status === 'DELIVERED_REWARDED';
          const isPlaced = ev.status === 'ORDER_PLACED';
          const timeFormatted = ev.createdAt
            ? new Date(ev.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Recently';

          ledger.push({
            id: String(ev.id),
            userName: String(ev.friendName || 'Friend via Link'),
            userPhoneOrEmail: `Invite Code: ${ev.code}`,
            type: isDelivered ? 'REFERRAL_EARNED' : 'REFERRAL_USED',
            codeOrTier: String(ev.code),
            coins: isDelivered ? Number(ev.coins) || settings.referralReferrerBonusCoins : 0,
            inrValue: settings.referralRefereeDiscountInr,
            status: isDelivered ? 'COMPLETED' : isPlaced ? 'ORDER_PLACED' : 'CLAIMED',
            timestamp: timeFormatted,
          });
        }
      }

      // Query real coin ledger entries if any
      const coinLedgerRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, user_name as "userName", user_email_or_phone as "userPhoneOrEmail", amount, type, reference as "codeOrTier", created_at as "createdAt"
           FROM user_coins_ledger
           ORDER BY created_at DESC
           LIMIT 50`,
        )
        .catch(() => []);

      if (Array.isArray(coinLedgerRows) && coinLedgerRows.length > 0) {
        for (const cl of coinLedgerRows) {
          const timeFormatted = cl.createdAt
            ? new Date(cl.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Recently';

          ledger.push({
            id: String(cl.id),
            userName: String(cl.userName || 'Customer'),
            userPhoneOrEmail: String(cl.userPhoneOrEmail || 'Loyalty Member'),
            type: cl.type as any,
            codeOrTier: String(cl.codeOrTier || 'VIP Club'),
            coins: Number(cl.amount) || 0,
            inrValue: Math.round(Math.abs(Number(cl.amount) || 0) * settings.coinToInrRatio),
            status: 'COMPLETED',
            timestamp: timeFormatted,
          });
        }
      }

      // Query real orders that used coupons or referral codes
      const couponOrders: any = await prisma.order
        .findMany({
          where: {
            OR: [{ couponCode: { not: null } }, { discountAmount: { gt: 0 } }],
          },
          select: {
            id: true,
            orderNumber: true,
            couponCode: true,
            totalAmount: true,
            discountAmount: true,
            orderStatus: true,
            createdAt: true,
            user: { select: { name: true, mobile: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
        .catch(() => []);

      if (Array.isArray(couponOrders) && couponOrders.length > 0) {
        for (const ord of couponOrders) {
          const isRef = (ord.couponCode || '').toUpperCase().startsWith('JIIVAA-');
          if (isRef) {
            totalReferralGmvInr += Number(ord.totalAmount) || 0;
          }
          ledger.push({
            id: `ord-${ord.id}`,
            userName: ord.user?.name || 'Customer',
            userPhoneOrEmail: ord.user?.mobile || ord.user?.email || 'Registered Customer',
            type: isRef ? 'REFERRAL_USED' : 'ORDER_CASHBACK',
            codeOrTier: ord.couponCode || 'PROMO',
            coins: isRef ? 0 : Math.round(Number(ord.totalAmount) * 0.1),
            inrValue:
              Number(ord.discountAmount) || (isRef ? settings.referralRefereeDiscountInr : 0),
            orderNumber: ord.orderNumber,
            orderAmount: Number(ord.totalAmount),
            status: ord.orderStatus === 'DELIVERED' ? 'COMPLETED' : 'ORDER_PLACED',
            timestamp: ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently',
          });
        }
      }
    } catch (err) {
      console.warn('[AdminRewardsService] events / orders query error:', err);
    }

    // 3. Real Coins Calculation:
    // Strictly sum real active coins from user_coins_ledger + delivered referral rewards
    let totalCoinsInCirculation = 0;
    try {
      const circRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT COALESCE(SUM(amount), 0) as total FROM user_coins_ledger WHERE amount > 0`,
        )
        .catch(() => []);
      if (Array.isArray(circRows) && circRows.length > 0) {
        totalCoinsInCirculation += Number(circRows[0].total) || 0;
      }

      // Add coins awarded for delivered referrals
      const refCoinsRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT COALESCE(SUM(coins_awarded), 0) as total FROM referral_events WHERE status = 'DELIVERED_REWARDED'`,
        )
        .catch(() => []);
      if (Array.isArray(refCoinsRows) && refCoinsRows.length > 0) {
        totalCoinsInCirculation += Number(refCoinsRows[0].total) || 0;
      }
    } catch {
      // 0 if empty
    }

    let totalCoinsRedeemed = 0;
    try {
      const redRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT COALESCE(ABS(SUM(amount)), 0) as total FROM user_coins_ledger WHERE amount < 0`,
        )
        .catch(() => []);
      if (Array.isArray(redRows) && redRows.length > 0) {
        totalCoinsRedeemed = Number(redRows[0].total) || 0;
      }
    } catch {
      // 0 if empty
    }

    const totalLiabilityInr = Math.round(totalCoinsInCirculation * settings.coinToInrRatio);
    const totalSavingsGivenInr = Math.round(totalCoinsRedeemed * settings.coinToInrRatio);

    return {
      stats: {
        totalCoinsInCirculation,
        totalLiabilityInr,
        totalCoinsRedeemed,
        totalSavingsGivenInr,
        totalReferralClicks,
        totalFriendsJoined,
        totalReferralOrders,
        totalReferralGmvInr,
        tierDistribution,
      },
      settings,
      ledger,
    };
  }
}
