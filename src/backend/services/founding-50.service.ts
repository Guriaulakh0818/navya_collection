/**
 * JIIVAAKART FOUNDING 50 — OFFICIAL SELLER SERVICE (VERSION 1.0)
 *
 * Implements the official seller offer policy:
 * - Limited to first 50 approved boutiques.
 * - Delivered Orders 1–10: 5.0% commission
 * - Delivered Orders 11–20: 7.5% commission
 * - Delivered Orders 21+ and standard sellers: 10.0% commission
 * - Only successfully delivered orders qualify. Cancelled/RTO/refunded do not consume slots.
 */

import { prisma } from '@/lib/prisma';

export interface FoundingRateResult {
  rate: number;
  tierLabel: 'TIER_1_5_PERCENT' | 'TIER_2_7_5_PERCENT' | 'STANDARD_10_PERCENT';
  orderIndex: number;
  isPromotional: boolean;
  remainingInTier: number;
}

export interface FoundingSellerProgress {
  isFoundingSeller: boolean;
  slotNumber: number | null;
  status: string;
  joinedAt: Date | null;
  deliveredOrdersCount: number;
  currentRate: number;
  currentTierLabel: string;
  promoOrdersRemaining: number;
  estimatedCommissionSaved: number;
}

export class Founding50Service {
  public static readonly MAX_SLOTS = 50;
  public static readonly TIER_1_MAX = 10;
  public static readonly TIER_2_MAX = 20;

  public static readonly RATE_TIER_1 = 5.0; // 5%
  public static readonly RATE_TIER_2 = 7.5; // 7.5%
  public static readonly RATE_STANDARD = 10.0; // 10%

  /**
   * Deterministically resolves the commission rate for the next order based on delivered order history.
   */
  public static resolveCommissionRate(
    isFoundingSeller: boolean,
    completedDeliveredOrders: number = 0,
  ): FoundingRateResult {
    if (!isFoundingSeller) {
      return {
        rate: this.RATE_STANDARD,
        tierLabel: 'STANDARD_10_PERCENT',
        orderIndex: completedDeliveredOrders + 1,
        isPromotional: false,
        remainingInTier: 0,
      };
    }

    const orderIndex = completedDeliveredOrders + 1;

    if (orderIndex <= this.TIER_1_MAX) {
      return {
        rate: this.RATE_TIER_1,
        tierLabel: 'TIER_1_5_PERCENT',
        orderIndex,
        isPromotional: true,
        remainingInTier: this.TIER_1_MAX - completedDeliveredOrders,
      };
    }

    if (orderIndex <= this.TIER_2_MAX) {
      return {
        rate: this.RATE_TIER_2,
        tierLabel: 'TIER_2_7_5_PERCENT',
        orderIndex,
        isPromotional: true,
        remainingInTier: this.TIER_2_MAX - completedDeliveredOrders,
      };
    }

    return {
      rate: this.RATE_STANDARD,
      tierLabel: 'STANDARD_10_PERCENT',
      orderIndex,
      isPromotional: false,
      remainingInTier: 0,
    };
  }

  /**
   * Evaluates and allocates a Founding 50 slot during boutique verification approval.
   */
  public static async allocateSlot(
    shopId: string,
    txClient?: any,
  ): Promise<{
    allocated: boolean;
    slotNumber: number | null;
    status: string;
    initialRate: number;
  }> {
    const db = txClient || prisma;

    // Check if shop is already allocated
    const existing = await db.shop.findUnique({
      where: { id: shopId },
      select: { isFoundingSeller: true, foundingSlotNumber: true, foundingStatus: true },
    });

    if (existing?.isFoundingSeller && existing.foundingSlotNumber) {
      return {
        allocated: true,
        slotNumber: existing.foundingSlotNumber,
        status: existing.foundingStatus || 'ACTIVE',
        initialRate: this.RATE_TIER_1,
      };
    }

    // Count how many founding slots have been granted
    const activeFoundingCount = await db.shop.count({
      where: { isFoundingSeller: true },
    });

    if (activeFoundingCount < this.MAX_SLOTS) {
      const newSlot = activeFoundingCount + 1;
      await db.shop.update({
        where: { id: shopId },
        data: {
          isFoundingSeller: true,
          foundingSlotNumber: newSlot,
          foundingJoinedAt: new Date(),
          foundingStatus: 'ACTIVE',
          commissionRate: this.RATE_TIER_1,
        },
      });

      return {
        allocated: true,
        slotNumber: newSlot,
        status: 'ACTIVE',
        initialRate: this.RATE_TIER_1,
      };
    }

    // Slots filled; standard seller onboarding
    await db.shop.update({
      where: { id: shopId },
      data: {
        isFoundingSeller: false,
        foundingSlotNumber: null,
        foundingStatus: 'INELIGIBLE',
        commissionRate: this.RATE_STANDARD,
      },
    });

    return {
      allocated: false,
      slotNumber: null,
      status: 'INELIGIBLE',
      initialRate: this.RATE_STANDARD,
    };
  }

  /**
   * Retrieves comprehensive Founding 50 progress and fee savings for a seller.
   */
  public static async getSellerProgress(shopId: string): Promise<FoundingSellerProgress> {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        isFoundingSeller: true,
        foundingSlotNumber: true,
        foundingStatus: true,
        foundingJoinedAt: true,
        foundingOrderCount: true,
      },
    });

    if (!shop || !shop.isFoundingSeller) {
      return {
        isFoundingSeller: false,
        slotNumber: null,
        status: 'INELIGIBLE',
        joinedAt: null,
        deliveredOrdersCount: 0,
        currentRate: this.RATE_STANDARD,
        currentTierLabel: 'STANDARD_10_PERCENT',
        promoOrdersRemaining: 0,
        estimatedCommissionSaved: 0,
      };
    }

    const deliveredCount = shop.foundingOrderCount || 0;
    const tierInfo = this.resolveCommissionRate(true, deliveredCount);
    const promoRemaining = Math.max(0, this.TIER_2_MAX - deliveredCount);

    // Calculate actual total commission saved to date from vendor_orders
    let estimatedCommissionSaved = 0;
    try {
      const promoOrders = await prisma.vendorOrder.findMany({
        where: {
          shopId: shop.id,
          isFoundingOrder: true,
          status: 'DELIVERED',
        },
        select: {
          totalAmount: true,
          totalMrp: true,
          commissionAmount: true,
          appliedCommissionRate: true,
        },
      });

      promoOrders.forEach((vo) => {
        const baseMrp = Number(vo.totalMrp || vo.totalAmount || 0);
        const actualComm = Number(vo.commissionAmount || 0);
        const standardComm = (baseMrp * this.RATE_STANDARD) / 100;
        const saved = Math.max(0, standardComm - actualComm);
        estimatedCommissionSaved += saved;
      });
    } catch {
      // Fallback
      estimatedCommissionSaved = 0;
    }

    return {
      isFoundingSeller: true,
      slotNumber: shop.foundingSlotNumber,
      status: shop.foundingStatus || 'ACTIVE',
      joinedAt: shop.foundingJoinedAt,
      deliveredOrdersCount: deliveredCount,
      currentRate: tierInfo.rate,
      currentTierLabel: tierInfo.tierLabel,
      promoOrdersRemaining: promoRemaining,
      estimatedCommissionSaved: Math.round(estimatedCommissionSaved * 100) / 100,
    };
  }

  /**
   * Increments delivered order counter when a Founding order reaches DELIVERED status.
   */
  /**
   * Processes all founding vendor orders when a master order is marked DELIVERED.
   */
  public static async processMasterOrderDelivered(
    masterOrderId: string,
    txClient?: any,
  ): Promise<void> {
    const db = txClient || prisma;
    const vendorOrders = await db.vendorOrder.findMany({
      where: {
        masterOrderId,
        isFoundingOrder: true,
      },
      select: { id: true },
    });

    for (const vo of vendorOrders) {
      await this.recordOrderDelivered(vo.id, db);
    }
  }

  public static async recordOrderDelivered(vendorOrderId: string, txClient?: any): Promise<void> {
    const db = txClient || prisma;
    const vo = await db.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      select: {
        id: true,
        shopId: true,
        isFoundingOrder: true,
        shop: { select: { isFoundingSeller: true, foundingOrderCount: true } },
      },
    });

    if (!vo || !vo.isFoundingOrder || !vo.shop?.isFoundingSeller) return;

    const newCount = (vo.shop.foundingOrderCount || 0) + 1;
    const newStatus = newCount >= this.TIER_2_MAX ? 'COMPLETED' : 'ACTIVE';

    // Update shop rate dynamically to next tier if reached milestone
    const nextTier = this.resolveCommissionRate(true, newCount);

    await db.shop.update({
      where: { id: vo.shopId },
      data: {
        foundingOrderCount: newCount,
        foundingStatus: newStatus,
        commissionRate: nextTier.rate,
      },
    });
  }

  /**
   * Reverts delivered order counter if an order is returned or delivery cancelled.
   */
  public static async revertOrderDelivered(vendorOrderId: string, txClient?: any): Promise<void> {
    const db = txClient || prisma;
    const vo = await db.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      select: {
        id: true,
        shopId: true,
        isFoundingOrder: true,
        shop: { select: { isFoundingSeller: true, foundingOrderCount: true } },
      },
    });

    if (!vo || !vo.isFoundingOrder || !vo.shop?.isFoundingSeller) return;

    const newCount = Math.max(0, (vo.shop.foundingOrderCount || 0) - 1);
    const nextTier = this.resolveCommissionRate(true, newCount);

    await db.shop.update({
      where: { id: vo.shopId },
      data: {
        foundingOrderCount: newCount,
        foundingStatus: 'ACTIVE',
        commissionRate: nextTier.rate,
      },
    });
  }

  /**
   * Returns complete overview of Founding 50 acquisition and member list for Admin.
   */
  public static async getAdminOverview() {
    const [totalAllocated, members] = await Promise.all([
      prisma.shop.count({
        where: { isFoundingSeller: true },
      }),
      prisma.shop.findMany({
        where: { isFoundingSeller: true },
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          status: true,
          commissionRate: true,
          foundingSlotNumber: true,
          foundingJoinedAt: true,
          foundingOrderCount: true,
          foundingStatus: true,
          owner: {
            select: { id: true, name: true, mobile: true, email: true },
          },
        },
        orderBy: { foundingSlotNumber: 'asc' },
      }),
    ]);

    const remainingSlots = Math.max(0, this.MAX_SLOTS - totalAllocated);

    return {
      totalSlots: this.MAX_SLOTS,
      slotsAllocated: totalAllocated,
      slotsRemaining: remainingSlots,
      isProgramOpen: remainingSlots > 0,
      members: members.map((m) => {
        const delivered = m.foundingOrderCount || 0;
        const tier = this.resolveCommissionRate(true, delivered);
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          city: m.city,
          state: m.state,
          slotNumber: m.foundingSlotNumber,
          joinedAt: m.foundingJoinedAt,
          deliveredOrders: delivered,
          currentRate: Number(m.commissionRate || tier.rate),
          tierLabel: tier.tierLabel,
          status: m.foundingStatus || 'ACTIVE',
          ownerName: m.owner?.name || 'Owner',
          ownerContact: m.owner?.mobile || m.phone,
        };
      }),
    };
  }
}
