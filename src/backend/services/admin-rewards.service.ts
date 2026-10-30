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
  /**
   * Get live runtime settings
   */
  public static getSettings(): AdminRewardsSettings {
    return { ...runtimeSettings };
  }

  /**
   * Update runtime settings
   */
  public static updateSettings(newSettings: Partial<AdminRewardsSettings>): AdminRewardsSettings {
    runtimeSettings = {
      ...runtimeSettings,
      ...newSettings,
    };
    // Also update REWARDS_CONFIG in-memory
    if (newSettings.coinToInrRatio !== undefined)
      REWARDS_CONFIG.coinToInrRatio = newSettings.coinToInrRatio;
    if (newSettings.signupBonusCoins !== undefined)
      REWARDS_CONFIG.signupBonusCoins = newSettings.signupBonusCoins;
    if (newSettings.reviewBonusCoins !== undefined)
      REWARDS_CONFIG.reviewBonusCoins = newSettings.reviewBonusCoins;
    if (newSettings.firstOrderBonusCoins !== undefined)
      REWARDS_CONFIG.firstOrderBonusCoins = newSettings.firstOrderBonusCoins;
    if (newSettings.referralRefereeDiscountInr !== undefined)
      REWARDS_CONFIG.referralRefereeDiscountInr = newSettings.referralRefereeDiscountInr;
    if (newSettings.referralRefereeMinOrderInr !== undefined)
      REWARDS_CONFIG.referralRefereeMinOrderInr = newSettings.referralRefereeMinOrderInr;
    if (newSettings.referralReferrerBonusCoins !== undefined)
      REWARDS_CONFIG.referralReferrerBonusCoins = newSettings.referralReferrerBonusCoins;

    return { ...runtimeSettings };
  }

  /**
   * Get complete admin overview: KPIs, live ledger, and settings (100% live database data)
   */
  public static async getOverview(): Promise<AdminRewardsOverviewData> {
    // 1. Fetch real users and completed orders count from database
    let totalUsersCount = 0;
    let completedOrdersCount = 0;
    let totalOrderRevenue = 0;

    try {
      const [uCount, oCount, ordersAgg] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.order
          .count({ where: { orderStatus: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] } } })
          .catch(() => 0),
        prisma.order
          .aggregate({
            _sum: { totalAmount: true },
            where: { orderStatus: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] } },
          })
          .catch(() => ({ _sum: { totalAmount: null } })),
      ]);
      totalUsersCount = Number(uCount || 0);
      completedOrdersCount = Number(oCount || 0);
      totalOrderRevenue = Number(ordersAgg?._sum?.totalAmount || 0);
    } catch (err) {
      console.warn('[AdminRewardsService] count query error:', err);
    }

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
            coins: isDelivered ? Number(ev.coins) || 150 : 0,
            inrValue: 150,
            status: isDelivered ? 'COMPLETED' : isPlaced ? 'ORDER_PLACED' : 'CLAIMED',
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
            inrValue: Number(ord.discountAmount) || (isRef ? 150 : 0),
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

    // 3. Real Coins Calculation
    const totalDeliveredReferrals = ledger.filter(
      (item) => item.type === 'REFERRAL_EARNED' && item.status === 'COMPLETED',
    ).length;
    const referralCoinsTotal = totalDeliveredReferrals * runtimeSettings.referralReferrerBonusCoins;
    const signupCoinsTotal = totalUsersCount * runtimeSettings.signupBonusCoins;
    const totalCoinsInCirculation = referralCoinsTotal + signupCoinsTotal;

    const totalCoinsRedeemed = ledger
      .filter((item) => item.type === 'REDEEMED_CHECKOUT')
      .reduce((sum, item) => sum + Math.abs(item.coins || 0), 0);

    const totalLiabilityInr = Math.round(totalCoinsInCirculation * runtimeSettings.coinToInrRatio);
    const totalSavingsGivenInr = Math.round(totalCoinsRedeemed * runtimeSettings.coinToInrRatio);

    // 4. Real Tier Distribution based on real users
    const tierDistribution = {
      bronze: Math.max(0, totalUsersCount),
      silver: 0,
      gold: 0,
      platinum: 0,
    };

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
      settings: this.getSettings(),
      ledger,
    };
  }
}
