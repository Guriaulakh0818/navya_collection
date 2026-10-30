import { prisma } from '@/lib/prisma';
import { LOYALTY_TIERS, LoyaltyTier, REWARDS_CONFIG } from '@/shared/config/rewards.config';

export interface CoinTransactionRecord {
  id: string;
  amount: number;
  type: 'SIGNUP_BONUS' | 'ORDER_EARNED' | 'REDEEMED' | 'REFERRAL_BONUS' | 'TIER_BONUS';
  description: string;
  createdAt: string;
}

export interface LoyaltyAccountData {
  userId: string;
  balance: number;
  balanceInr: number;
  lifetimeEarned: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  coinsNeededForNextTier: number;
  progressPct: number;
  unlockedCoupons: Array<{
    tierId: string;
    couponCode: string;
    discountPct: number;
    claimed: boolean;
  }>;
  transactions: CoinTransactionRecord[];
}

export class LoyaltyService {
  /**
   * Determine tier based on lifetime earned coins
   */
  public static calculateTier(lifetimeEarned: number): {
    currentTier: LoyaltyTier;
    nextTier: LoyaltyTier | null;
    coinsNeededForNextTier: number;
    progressPct: number;
  } {
    let currentTier = LOYALTY_TIERS[0];
    let nextTier: LoyaltyTier | null = LOYALTY_TIERS[1];

    for (let i = 0; i < LOYALTY_TIERS.length; i++) {
      const tier = LOYALTY_TIERS[i];
      if (lifetimeEarned >= tier.minCoins) {
        currentTier = tier;
        nextTier = i < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[i + 1] : null;
      }
    }

    let coinsNeededForNextTier = 0;
    let progressPct = 100;

    if (nextTier) {
      const tierRange = nextTier.minCoins - currentTier.minCoins;
      const progressInTier = Math.max(0, lifetimeEarned - currentTier.minCoins);
      progressPct = Math.min(100, Math.round((progressInTier / tierRange) * 100));
      coinsNeededForNextTier = Math.max(0, nextTier.minCoins - lifetimeEarned);
    }

    return { currentTier, nextTier, coinsNeededForNextTier, progressPct };
  }

  /**
   * Get Loyalty Account for a user
   */
  public static async getAccount(userId: string): Promise<LoyaltyAccountData> {
    const isRegistered = Boolean(userId && !userId.startsWith('guest'));
    let balance = isRegistered ? REWARDS_CONFIG.signupBonusCoins : 0;
    let lifetimeEarned = isRegistered ? REWARDS_CONFIG.signupBonusCoins : 0;
    const transactions: CoinTransactionRecord[] = isRegistered
      ? [
          {
            id: 'tx-signup',
            amount: REWARDS_CONFIG.signupBonusCoins,
            type: 'SIGNUP_BONUS',
            description: 'Welcome Bonus: Account registered at JiivaaKart',
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

    try {
      const orders = await (prisma as any).order.findMany({
        where: {
          userId,
          orderStatus: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] },
        },
      });

      if (orders && orders.length > 0) {
        const orderCoins = orders.reduce(
          (sum: number, ord: any) => sum + Math.round(Number(ord.totalAmount || 0)),
          0,
        );
        lifetimeEarned += orderCoins;
        balance += orderCoins;
        transactions.push({
          id: 'tx-orders',
          amount: orderCoins,
          type: 'ORDER_EARNED',
          description: `Boutique shopping orders cashback (${orders.length} orders)`,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Graceful fallback to rich local state
    }

    const { currentTier, nextTier, coinsNeededForNextTier, progressPct } =
      this.calculateTier(lifetimeEarned);

    const unlockedCoupons = LOYALTY_TIERS.filter((t) => t.discountPct > 0).map((tier) => ({
      tierId: tier.id,
      couponCode: tier.couponCode,
      discountPct: tier.discountPct,
      claimed: lifetimeEarned >= tier.minCoins,
    }));

    return {
      userId,
      balance,
      balanceInr: Math.round(balance * REWARDS_CONFIG.coinToInrRatio),
      lifetimeEarned,
      currentTier,
      nextTier,
      coinsNeededForNextTier,
      progressPct,
      unlockedCoupons,
      transactions: transactions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }
}
