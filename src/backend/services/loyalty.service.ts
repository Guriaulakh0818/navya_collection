import { prisma } from '@/lib/prisma';
import {
  calculateMaxSpendableCoins,
  calculateTierBySpend,
  getCycleExpiryDate,
  isTierCycleExpired,
  LOYALTY_TIERS,
  LoyaltyTier,
  REWARDS_CONFIG,
} from '@/shared/config/rewards.config';

import { AdminRewardsService } from './admin-rewards.service';
import { ReferralService } from './referral.service';

export interface CoinTransactionRecord {
  id: string;
  amount: number;
  type:
    | 'SIGNUP_BONUS'
    | 'ORDER_EARNED'
    | 'REDEEMED'
    | 'REFERRAL_BONUS'
    | 'TIER_BONUS'
    | 'ORDER_BONUS'
    | 'REVIEW_BONUS';
  description: string;
  reference?: string;
  createdAt: string;
}

export interface NextOrderPerkCoupon {
  id: string;
  code: string;
  discountPct: number;
  status: 'AVAILABLE' | 'USED';
  label: string;
  createdAt: string;
}

export interface LoyaltyAccountData {
  userId: string;
  balance: number;
  balanceInr: number;
  lifetimeEarned: number;
  cumulativeSpendInCycle: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  spendNeededForNextTier: number;
  progressPct: number;
  cycleStartedAt: string;
  cycleExpiresAt: string;
  isCycleActive: boolean;
  unlockedCoupons: Array<{
    tierId: string;
    couponCode: string;
    discountPct: number;
    claimed: boolean;
    name: string;
  }>;
  nextOrderPerks: NextOrderPerkCoupon[];
  transactions: CoinTransactionRecord[];
}

export class LoyaltyService {
  /**
   * Determine tier based on cumulative shopping spend in 3-year cycle
   */
  public static calculateTier(spendInr: number) {
    return calculateTierBySpend(spendInr);
  }

  /**
   * Determine max coins spendable for an order enforcing the 25% order total cap
   */
  public static calculateSpendableCoins(orderTotalInr: number, availableCoins: number) {
    return calculateMaxSpendableCoins(orderTotalInr, availableCoins);
  }

  /**
   * Ensure user's 3-year loyalty cycle record exists and is active
   */
  public static async getOrCreateUserCycle(userId: string): Promise<{
    cycleStartedAt: Date;
    currentTier: string;
    unlockedMilestones: string[];
    cumulativeSpend: number;
  }> {
    await AdminRewardsService.ensureTables();

    const rows: any = await prisma
      .$queryRawUnsafe(
        `SELECT cycle_started_at as "cycleStartedAt",
                current_tier as "currentTier",
                unlocked_milestones as "unlockedMilestones",
                COALESCE(cumulative_spend, 0) as "cumulativeSpend"
         FROM user_loyalty_cycle
         WHERE user_id = $1
         LIMIT 1`,
        userId,
      )
      .catch(() => []);

    if (Array.isArray(rows) && rows.length > 0) {
      const rec = rows[0];
      const cycleStart = new Date(rec.cycleStartedAt || new Date());

      // If 3 years have expired, reset the cycle
      if (isTierCycleExpired(cycleStart)) {
        const now = new Date();
        await prisma
          .$executeRawUnsafe(
            `UPDATE user_loyalty_cycle
             SET cycle_started_at = $1,
                 current_tier = 'NORMAL',
                 unlocked_milestones = '',
                 cumulative_spend = 0,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            now,
            userId,
          )
          .catch(() => {});

        return {
          cycleStartedAt: now,
          currentTier: 'NORMAL',
          unlockedMilestones: [],
          cumulativeSpend: 0,
        };
      }

      const milestones = (rec.unlockedMilestones || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      return {
        cycleStartedAt: cycleStart,
        currentTier: rec.currentTier || 'NORMAL',
        unlockedMilestones: milestones,
        cumulativeSpend: Number(rec.cumulativeSpend) || 0,
      };
    }

    // Initialize new cycle
    const now = new Date();
    await prisma
      .$executeRawUnsafe(
        `INSERT INTO user_loyalty_cycle (user_id, cycle_started_at, current_tier, unlocked_milestones, cumulative_spend, updated_at)
         VALUES ($1, $2, 'NORMAL', '', 0, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO NOTHING`,
        userId,
        now,
      )
      .catch(() => {});

    return {
      cycleStartedAt: now,
      currentTier: 'NORMAL',
      unlockedMilestones: [],
      cumulativeSpend: 0,
    };
  }

  /**
   * Get Loyalty Account for a user with live 3-year cycle, spend progress & coin balances
   */
  public static async getAccount(userId: string): Promise<LoyaltyAccountData> {
    const isRegistered = Boolean(userId && !userId.startsWith('guest'));
    const settings = await AdminRewardsService.getSettings();

    // Default state for guest
    if (!isRegistered) {
      const { currentTier, nextTier, spendNeededForNextTier, progressPct } =
        calculateTierBySpend(0);
      const cycleStart = new Date();
      return {
        userId,
        balance: 0,
        balanceInr: 0,
        lifetimeEarned: 0,
        cumulativeSpendInCycle: 0,
        currentTier,
        nextTier,
        spendNeededForNextTier,
        progressPct,
        cycleStartedAt: cycleStart.toISOString(),
        cycleExpiresAt: getCycleExpiryDate(cycleStart).toISOString(),
        isCycleActive: true,
        unlockedCoupons: [],
        nextOrderPerks: [],
        transactions: [],
      };
    }

    // 1. Get or initialize 3-year cycle
    const cycle = await this.getOrCreateUserCycle(userId);

    // 2. Compute cumulative shopping spend in active 3-year cycle window
    let cumulativeSpend = 0;
    try {
      const orders = await (prisma as any).order.findMany({
        where: {
          userId,
          orderStatus: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] },
          createdAt: { gte: cycle.cycleStartedAt },
        },
        select: { totalAmount: true },
      });

      if (orders && orders.length > 0) {
        cumulativeSpend = orders.reduce(
          (sum: number, ord: any) => sum + (Number(ord.totalAmount) || 0),
          0,
        );
      }
    } catch (err) {
      console.warn('[LoyaltyService] orders query fallback:', err);
    }

    // 3. Determine Tier from Cumulative Spend
    const { currentTier, nextTier, spendNeededForNextTier, progressPct } =
      calculateTierBySpend(cumulativeSpend);

    // Sync updated spend & tier to DB
    prisma
      .$executeRawUnsafe(
        `UPDATE user_loyalty_cycle
         SET cumulative_spend = $1, current_tier = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        cumulativeSpend,
        currentTier.id,
        userId,
      )
      .catch(() => {});

    // 3.5. Retroactive Review Bonus Sync: Check for any submitted product or shop reviews lacking coin credit
    try {
      const isRegistered = Boolean(userId && !userId.startsWith('guest'));
      if (isRegistered) {
        const [productReviews, shopReviews] = await Promise.all([
          prisma.review
            .findMany({
              where: { userId },
              select: { id: true, productId: true },
            })
            .catch(() => []),
          prisma.shopReview
            .findMany({
              where: { userId },
              select: { id: true, shopId: true },
            })
            .catch(() => []),
        ]);

        const reviewBonusCoins = settings.reviewBonusCoins || 1;

        for (const pr of productReviews) {
          const existingLedger: any = await prisma
            .$queryRawUnsafe(
              `SELECT id FROM user_coins_ledger WHERE user_id = $1 AND reference = $2 AND type = 'REVIEW_BONUS' LIMIT 1`,
              userId,
              pr.productId,
            )
            .catch(() => []);

          if (!Array.isArray(existingLedger) || existingLedger.length === 0) {
            const p = await prisma.product
              .findUnique({
                where: { id: pr.productId },
                select: { name: true },
              })
              .catch(() => null);
            const userRec = await prisma.user
              .findUnique({
                where: { id: userId },
                select: { name: true, email: true, mobile: true },
              })
              .catch(() => null);

            await AdminRewardsService.recordCoinTransaction({
              userId,
              userName: userRec?.name || 'Verified Reviewer',
              userEmailOrPhone: userRec?.mobile || userRec?.email || '',
              amount: reviewBonusCoins,
              type: 'REVIEW_BONUS',
              reference: pr.productId,
              description: `Verified Review Reward: +${reviewBonusCoins} Jiivaa Coin for reviewing "${p?.name || 'Boutique Product'}"`,
            });
          }
        }

        for (const sr of shopReviews) {
          const existingLedger: any = await prisma
            .$queryRawUnsafe(
              `SELECT id FROM user_coins_ledger WHERE user_id = $1 AND reference = $2 AND type = 'REVIEW_BONUS' LIMIT 1`,
              userId,
              sr.shopId,
            )
            .catch(() => []);

          if (!Array.isArray(existingLedger) || existingLedger.length === 0) {
            const s = await prisma.shop
              .findUnique({
                where: { id: sr.shopId },
                select: { name: true },
              })
              .catch(() => null);
            const userRec = await prisma.user
              .findUnique({
                where: { id: userId },
                select: { name: true, email: true, mobile: true },
              })
              .catch(() => null);

            await AdminRewardsService.recordCoinTransaction({
              userId,
              userName: userRec?.name || 'Verified Reviewer',
              userEmailOrPhone: userRec?.mobile || userRec?.email || '',
              amount: reviewBonusCoins,
              type: 'REVIEW_BONUS',
              reference: sr.shopId,
              description: `Verified Review Reward: +${reviewBonusCoins} Jiivaa Coin for reviewing boutique "${s?.name || 'Boutique'}"`,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[LoyaltyService] Retroactive review sync error:', err);
    }

    // 4. Calculate live coin balance and fetch transactions
    let balance = 0;
    let lifetimeEarned = 0;
    const transactions: CoinTransactionRecord[] = [];

    try {
      const ledgerRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, amount, type, reference, description, created_at as "createdAt"
           FROM user_coins_ledger
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 100`,
          userId,
        )
        .catch(() => []);

      if (Array.isArray(ledgerRows) && ledgerRows.length > 0) {
        for (const row of ledgerRows) {
          const amt = Number(row.amount) || 0;
          balance += amt;
          if (amt > 0) lifetimeEarned += amt;
          transactions.push({
            id: String(row.id),
            amount: amt,
            type: row.type,
            reference: row.reference,
            description: row.description || 'Jiivaa Rewards Activity',
            createdAt: row.createdAt
              ? new Date(row.createdAt).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[LoyaltyService] ledger query fallback:', err);
    }

    // Balance cannot be negative
    balance = Math.max(0, balance);

    // 5. Unlocked Milestone Coupons
    const unlockedCoupons = LOYALTY_TIERS.filter((t) => t.discountPct > 0).map((tier) => ({
      tierId: tier.id,
      name: tier.name,
      couponCode: tier.couponCode,
      discountPct: tier.discountPct,
      claimed: cumulativeSpend >= tier.minSpendInr,
    }));

    // 6. Fetch Next-Order Perk Coupons earned from single orders
    const nextOrderPerks: NextOrderPerkCoupon[] = [];
    try {
      const perkRows: any = await prisma
        .$queryRawUnsafe(
          `SELECT id, coupon_code as "code", discount_pct as "discountPct", status, created_at as "createdAt"
           FROM user_next_order_perks
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 20`,
          userId,
        )
        .catch(() => []);

      if (Array.isArray(perkRows) && perkRows.length > 0) {
        for (const p of perkRows) {
          nextOrderPerks.push({
            id: String(p.id),
            code: String(p.code),
            discountPct: Number(p.discountPct) || 0,
            status: p.status === 'USED' ? 'USED' : 'AVAILABLE',
            label: `Single Order Reward: ${p.discountPct}% OFF`,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      }
    } catch {
      // Graceful fallback
    }

    const cycleExpiry = getCycleExpiryDate(cycle.cycleStartedAt);

    return {
      userId,
      balance,
      balanceInr: Math.round(balance * settings.coinToInrRatio * 100) / 100,
      lifetimeEarned,
      cumulativeSpendInCycle: cumulativeSpend,
      currentTier,
      nextTier,
      spendNeededForNextTier,
      progressPct,
      cycleStartedAt: cycle.cycleStartedAt.toISOString(),
      cycleExpiresAt: cycleExpiry.toISOString(),
      isCycleActive: true,
      unlockedCoupons,
      nextOrderPerks,
      transactions,
    };
  }

  /**
   * Process order delivery event:
   * 1. Award 1 Coin per ₹10 spent
   * 2. Award single order tier perks (+200 Bronze >₹3k, +500 Silver >₹3k, Gold/Plat next order % coupons)
   * 3. Update cumulative spend and award Welcome Coins on tier upgrade
   * 4. Complete friend referral rewards if applicable
   */
  public static async processOrderDelivered(orderId: string): Promise<void> {
    try {
      await AdminRewardsService.ensureTables();

      const order: any = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order || !order.userId || order.userId.startsWith('guest')) {
        return;
      }

      const userId = order.userId;
      const orderTotal = Math.max(0, Number(order.totalAmount || 0));
      const orderNumber = order.orderNumber || order.id.slice(0, 8);
      const userName = order.user?.name || 'Customer';
      const userContact = order.user?.mobile || order.user?.email || 'Customer';

      const settings = await AdminRewardsService.getSettings();

      // 1. Prevent duplicate cashback for the same order
      const existingTx: any = await prisma
        .$queryRawUnsafe(
          `SELECT id FROM user_coins_ledger WHERE user_id = $1 AND reference = $2 AND type = 'ORDER_EARNED' LIMIT 1`,
          userId,
          orderNumber,
        )
        .catch(() => []);

      if (Array.isArray(existingTx) && existingTx.length > 0) {
        return; // Already processed
      }

      // 2. Normal Shopping Cashback: 1 Coin per ₹10 spent
      const spendRatio = settings.spendToCoinRatio > 0 ? settings.spendToCoinRatio : 10;
      const earnedCoins = Math.floor(orderTotal / spendRatio);

      if (earnedCoins > 0) {
        await AdminRewardsService.recordCoinTransaction({
          userId,
          userName,
          userEmailOrPhone: userContact,
          amount: earnedCoins,
          type: 'ORDER_EARNED',
          reference: orderNumber,
          description: `Jiivaa Cashback: 1 Coin per ₹10 spent on Order #${orderNumber} (applied from next order)`,
        });
      }

      // 3. Get active 3-year cycle
      const cycle = await this.getOrCreateUserCycle(userId);
      const previousSpend = cycle.cumulativeSpend;
      const { currentTier: tierBeforeOrder } = calculateTierBySpend(previousSpend);

      // 4. Single Order Perks based on tier when order was placed
      if (tierBeforeOrder.id === 'BRONZE' && orderTotal > 3000) {
        await AdminRewardsService.recordCoinTransaction({
          userId,
          userName,
          userEmailOrPhone: userContact,
          amount: 200,
          type: 'ORDER_BONUS',
          reference: orderNumber,
          description: `Bronze Shopper Perk: Extra 200 Bonus Coins for order #${orderNumber} > ₹3,000`,
        });
      } else if (tierBeforeOrder.id === 'SILVER' && orderTotal > 3000) {
        await AdminRewardsService.recordCoinTransaction({
          userId,
          userName,
          userEmailOrPhone: userContact,
          amount: 500,
          type: 'ORDER_BONUS',
          reference: orderNumber,
          description: `Silver Trendsetter Perk: Extra 500 Bonus Coins for order #${orderNumber} > ₹3,000`,
        });
      } else if (tierBeforeOrder.id === 'GOLD') {
        let discountPct = 0;
        let couponCode = '';
        if (orderTotal > 12000) {
          discountPct = 7.5;
          couponCode = `JIIVAA-GOLD-7.5`;
        } else if (orderTotal > 6000) {
          discountPct = 5;
          couponCode = `JIIVAA-GOLD-5`;
        } else if (orderTotal > 3000) {
          discountPct = 2.5;
          couponCode = `JIIVAA-GOLD-2.5`;
        }

        if (discountPct > 0) {
          await prisma
            .$executeRawUnsafe(
              `INSERT INTO user_next_order_perks (id, user_id, coupon_code, discount_pct, source_order_id, status)
             VALUES ($1, $2, $3, $4, $5, 'AVAILABLE')`,
              `perk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId,
              couponCode,
              discountPct,
              order.id,
            )
            .catch(() => {});
        }
      } else if (tierBeforeOrder.id === 'PLATINUM') {
        let discountPct = 0;
        let couponCode = '';
        if (orderTotal > 20000) {
          discountPct = 20;
          couponCode = `JIIVAA-PLATINUM-20`;
        } else if (orderTotal > 10000) {
          discountPct = 10;
          couponCode = `JIIVAA-PLATINUM-10`;
        } else if (orderTotal > 5000) {
          discountPct = 5;
          couponCode = `JIIVAA-PLATINUM-5`;
        }

        if (discountPct > 0) {
          await prisma
            .$executeRawUnsafe(
              `INSERT INTO user_next_order_perks (id, user_id, coupon_code, discount_pct, source_order_id, status)
             VALUES ($1, $2, $3, $4, $5, 'AVAILABLE')`,
              `perk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId,
              couponCode,
              discountPct,
              order.id,
            )
            .catch(() => {});
        }
      }

      // 5. Update cumulative 3-year spend and check for tier upgrades
      const newSpend = previousSpend + orderTotal;
      const { currentTier: newTier } = calculateTierBySpend(newSpend);

      const unlockedMilestones = [...cycle.unlockedMilestones];

      // Check if new tiers were reached and award Welcome Coins (once per cycle)
      for (const t of LOYALTY_TIERS) {
        if (newSpend >= t.minSpendInr && t.welcomeCoins > 0 && !unlockedMilestones.includes(t.id)) {
          unlockedMilestones.push(t.id);
          await AdminRewardsService.recordCoinTransaction({
            userId,
            userName,
            userEmailOrPhone: userContact,
            amount: t.welcomeCoins,
            type: 'TIER_BONUS',
            reference: t.id,
            description: `${t.name} Welcome Bonus: ${t.welcomeCoins.toLocaleString('en-IN')} Coins credited upon reaching ₹${t.minSpendInr.toLocaleString('en-IN')} cumulative spend!`,
          });
        }
      }

      // Persist updated cycle state
      await prisma.$executeRawUnsafe(
        `UPDATE user_loyalty_cycle
         SET cumulative_spend = $1,
             current_tier = $2,
             unlocked_milestones = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        newSpend,
        newTier.id,
        unlockedMilestones.join(','),
        userId,
      );

      // 6. Complete Referral if this order used a referral coupon
      if (order.couponCode && order.couponCode.toUpperCase().startsWith('JIIVAA-')) {
        await ReferralService.recordFriendOrder(order.couponCode, userName, true).catch(() => {});
      }
    } catch (error) {
      console.error('[LoyaltyService] processOrderDelivered error:', error);
    }
  }
}
