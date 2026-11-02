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

  private static schemaSynced = false;

  /**
   * Idempotently ensures that Founding 50 program columns exist in the PostgreSQL database.
   * Runs raw DDL queries to auto-heal production and staging databases.
   */
  public static async ensureSchema(): Promise<void> {
    if (this.schemaSynced) return;
    try {
      const ddlStatements = [
        `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "isFoundingSeller" BOOLEAN DEFAULT false`,
        `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "foundingSlotNumber" INTEGER`,
        `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "foundingJoinedAt" TIMESTAMP(3)`,
        `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "foundingOrderCount" INTEGER DEFAULT 0`,
        `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "foundingStatus" TEXT DEFAULT 'INELIGIBLE'`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "shops_foundingSlotNumber_key" ON "shops"("foundingSlotNumber")`,
        `CREATE INDEX IF NOT EXISTS "shops_isFoundingSeller_idx" ON "shops"("isFoundingSeller")`,
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "appliedCommissionRate" DECIMAL(5, 2) DEFAULT 10.00`,
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "isFoundingOrder" BOOLEAN DEFAULT false`,
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "foundingOrderIndex" INTEGER`,
        `CREATE INDEX IF NOT EXISTS "vendor_orders_isFoundingOrder_idx" ON "vendor_orders"("isFoundingOrder")`,
      ];

      for (const sql of ddlStatements) {
        try {
          await prisma.$executeRawUnsafe(sql);
        } catch {
          // Ignore individual statement failure
        }
      }

      this.schemaSynced = true;
    } catch (err) {
      console.warn('⚠️ [Founding50Service] Schema sync warning:', err);
    }
  }

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
   * Evaluates and allocates a Founding 50 slot during boutique verification approval or manual admin enrollment.
   */
  public static async allocateSlot(
    shopId: string,
    txClient?: any,
  ): Promise<{
    allocated: boolean;
    slotNumber: number | null;
    status: string;
    initialRate: number;
    message?: string;
  }> {
    await this.ensureSchema();
    const db = txClient || prisma;

    // Check if shop is already allocated
    const existing = await db.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        isFoundingSeller: true,
        foundingSlotNumber: true,
        foundingStatus: true,
      },
    });

    if (!existing) {
      return {
        allocated: false,
        slotNumber: null,
        status: 'NOT_FOUND',
        initialRate: this.RATE_STANDARD,
        message: 'Shop not found.',
      };
    }

    if (existing.isFoundingSeller && existing.foundingSlotNumber) {
      return {
        allocated: true,
        slotNumber: existing.foundingSlotNumber,
        status: existing.foundingStatus || 'ACTIVE',
        initialRate: this.RATE_TIER_1,
        message: `Boutique "${existing.name}" is already enrolled in Founding 50 as Slot #${existing.foundingSlotNumber}.`,
      };
    }

    // Find the next available gap-free slot between 1 and MAX_SLOTS
    const existingSlots = await db.shop.findMany({
      where: { foundingSlotNumber: { not: null }, isFoundingSeller: true },
      select: { foundingSlotNumber: true },
    });
    const occupiedSlots = new Set<number>(
      existingSlots.map((s: any) => s.foundingSlotNumber).filter((n: any) => typeof n === 'number'),
    );

    let nextSlot = 1;
    while (occupiedSlots.has(nextSlot) && nextSlot <= this.MAX_SLOTS) {
      nextSlot++;
    }

    if (nextSlot <= this.MAX_SLOTS) {
      await db.shop.update({
        where: { id: shopId },
        data: {
          isFoundingSeller: true,
          foundingSlotNumber: nextSlot,
          foundingJoinedAt: new Date(),
          foundingStatus: 'ACTIVE',
          commissionRate: this.RATE_TIER_1,
        },
      });

      return {
        allocated: true,
        slotNumber: nextSlot,
        status: 'ACTIVE',
        initialRate: this.RATE_TIER_1,
        message: `Boutique "${existing.name}" successfully enrolled as Founding Seller #${nextSlot}!`,
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
      message: 'Founding 50 program is at maximum capacity (50/50 slots filled).',
    };
  }

  /**
   * Revokes or removes a boutique from the Founding 50 program (Policy Section 9).
   */
  public static async removeSlot(
    shopId: string,
    txClient?: any,
  ): Promise<{ success: boolean; message: string; vacatedSlot: number | null }> {
    await this.ensureSchema();
    const db = txClient || prisma;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { name: true, foundingSlotNumber: true },
    });

    if (!shop) {
      return { success: false, message: 'Shop not found.', vacatedSlot: null };
    }

    const vacatedSlot = shop.foundingSlotNumber;

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
      success: true,
      message: `Boutique "${shop.name}" removed from Founding 50. Slot #${vacatedSlot || ''} is now open for other sellers.`,
      vacatedSlot,
    };
  }

  /**
   * Updates the founding status of an enrolled boutique (ACTIVE, SUSPENDED, COMPLETED).
   */
  public static async updateStatus(
    shopId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED',
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureSchema();
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, isFoundingSeller: true },
    });

    if (!shop || !shop.isFoundingSeller) {
      return { success: false, message: 'Shop is not enrolled in Founding 50.' };
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        foundingStatus: status,
      },
    });

    return {
      success: true,
      message: `Boutique "${shop.name}" status updated to ${status}.`,
    };
  }

  /**
   * Automatically enrolls all existing approved boutiques that do not yet have a Founding 50 slot,
   * up to the maximum capacity of 50.
   */
  public static async autoEnrollApprovedShops(): Promise<{
    enrolledCount: number;
    enrolledShops: Array<{ id: string; name: string; slot: number }>;
  }> {
    await this.ensureSchema();

    // 1. Get all currently occupied slots
    const occupied = await prisma.shop.findMany({
      where: { foundingSlotNumber: { not: null }, isFoundingSeller: true },
      select: { foundingSlotNumber: true },
    });
    const occupiedSet = new Set<number>(
      occupied.map((s: any) => s.foundingSlotNumber).filter((n: any) => typeof n === 'number'),
    );

    // 2. Find all approved, non-deleted shops that do NOT have a founding slot
    const unenrolledApproved = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        OR: [{ isFoundingSeller: false }, { foundingSlotNumber: null }],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true },
    });

    const enrolledShops: Array<{ id: string; name: string; slot: number }> = [];

    let currentSlot = 1;
    for (const shop of unenrolledApproved) {
      while (occupiedSet.has(currentSlot) && currentSlot <= this.MAX_SLOTS) {
        currentSlot++;
      }

      if (currentSlot > this.MAX_SLOTS) {
        break; // Max cap reached
      }

      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          isFoundingSeller: true,
          foundingSlotNumber: currentSlot,
          foundingJoinedAt: shop.createdAt || new Date(),
          foundingStatus: 'ACTIVE',
          commissionRate: this.RATE_TIER_1,
        },
      });

      occupiedSet.add(currentSlot);
      enrolledShops.push({ id: shop.id, name: shop.name, slot: currentSlot });
      currentSlot++;
    }

    return {
      enrolledCount: enrolledShops.length,
      enrolledShops,
    };
  }

  /**
   * Retrieves comprehensive Founding 50 progress and fee savings for a seller.
   */
  public static async getSellerProgress(shopId: string): Promise<FoundingSellerProgress> {
    await this.ensureSchema();
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
   * Also returns eligible approved shops that can be manually enrolled.
   */
  public static async getAdminOverview() {
    await this.ensureSchema();

    // Auto-enroll any approved shops up to 50 slots
    await this.autoEnrollApprovedShops().catch(() => {});

    const [totalAllocated, members, eligibleShops] = await Promise.all([
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
      prisma.shop.findMany({
        where: {
          status: 'APPROVED',
          deletedAt: null,
          isFoundingSeller: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
          phone: true,
          email: true,
          owner: {
            select: { id: true, name: true, mobile: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const remainingSlots = Math.max(0, this.MAX_SLOTS - totalAllocated);

    return {
      totalSlots: this.MAX_SLOTS,
      slotsAllocated: totalAllocated,
      slotsRemaining: remainingSlots,
      isProgramOpen: remainingSlots > 0,
      eligibleShops: eligibleShops.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        city: s.city,
        state: s.state,
        phone: s.phone || s.owner?.mobile,
        ownerName: s.owner?.name || 'Owner',
      })),
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
