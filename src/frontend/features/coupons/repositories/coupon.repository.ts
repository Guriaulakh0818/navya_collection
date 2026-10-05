import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateCouponInput, UpdateCouponInput } from '../schemas/coupon.schema';

export class CouponRepository {
  /**
   * Finds a coupon by unique coupon code.
   */
  static async findByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    try {
      return await prisma.coupon.findFirst({
        where: {
          code: cleanCode,
          deletedAt: null,
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Finds a coupon by ID.
   */
  static async findById(id: string) {
    try {
      return await prisma.coupon.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieves all non-deleted coupons for Admin management panel.
   */
  static async findAll() {
    try {
      return await prisma.coupon.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Retrieves all non-deleted coupons belonging to a specific seller/shop.
   */
  static async findByShopId(shopId: string) {
    try {
      return await prisma.coupon.findMany({
        where: {
          shopId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Retrieves active, non-expired public coupons.
   */
  static async findAllActive(shopId?: string | null) {
    const now = new Date();
    try {
      return await prisma.coupon.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          validUntil: { gte: now },
          ...(shopId ? { OR: [{ shopId }, { shopId: null }] } : {}),
        },
        orderBy: {
          minOrderAmount: 'asc',
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Counts how many times a user has used a specific coupon.
   */
  static async countUserUsages(
    couponId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || prisma;
    try {
      return await client.couponUsage.count({
        where: { couponId, userId },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Atomically records a coupon usage for a customer order with strict limit enforcement.
   * Prevents concurrency race conditions via atomic transaction.
   */
  static async recordUsage(
    couponId: string,
    userId: string,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      // 1. Fetch current coupon status inside transaction
      const coupon = await client.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        return { success: false, message: 'Coupon not found.' };
      }

      if (!coupon.isActive || coupon.deletedAt) {
        return { success: false, message: `Coupon '${coupon.code}' is no longer active.` };
      }

      if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
        return { success: false, message: 'Coupon has expired.' };
      }

      if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
        return { success: false, message: 'Coupon is not yet active.' };
      }

      // 2. Enforce global usage limit
      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return {
          success: false,
          message: `COUPON_USAGE_LIMIT_EXCEEDED: Coupon '${coupon.code}' has reached its maximum global usage limit of ${coupon.usageLimit}.`,
        };
      }

      // 3. Enforce per-user usage limit
      if (userId) {
        const userUsageCount = await client.couponUsage.count({
          where: { couponId, userId },
        });

        const perUserLimit = coupon.usagePerUser || 1;
        if (userUsageCount >= perUserLimit) {
          return {
            success: false,
            message: `COUPON_USER_LIMIT_EXCEEDED: You have already redeemed coupon '${coupon.code}' the maximum allowed number of times (${perUserLimit}).`,
          };
        }
      }

      // 4. Atomically increment usedCount
      const updatedCoupon = await client.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });

      // 5. Create immutable CouponUsage entry
      const usage = await client.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId: orderId || null,
        },
      });

      return { success: true, coupon: updatedCoupon, usage };
    };

    try {
      if (tx) {
        return await execute(tx);
      } else {
        return await prisma.$transaction(async (newTx) => execute(newTx));
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to record usage.' };
    }
  }

  /**
   * Restores a coupon usage upon order cancellation, payment failure, or checkout abandonment.
   */
  static async restoreUsage(
    couponId: string,
    userId?: string,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ success: boolean; message?: string }> {
    const execute = async (client: Prisma.TransactionClient) => {
      const coupon = await client.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) return { success: true, message: 'Coupon not found.' };

      // Decrement usedCount if > 0
      if (coupon.usedCount > 0) {
        await client.coupon.update({
          where: { id: couponId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // Remove specific usage record if orderId exists
      if (orderId) {
        await client.couponUsage.deleteMany({
          where: { couponId, orderId },
        });
      } else if (userId) {
        // Delete newest usage for this user
        const latestUsage = await client.couponUsage.findFirst({
          where: { couponId, userId },
          orderBy: { usedAt: 'desc' },
        });
        if (latestUsage) {
          await client.couponUsage.delete({
            where: { id: latestUsage.id },
          });
        }
      }

      return { success: true, message: 'Coupon usage restored successfully.' };
    };

    try {
      if (tx) {
        return await execute(tx);
      } else {
        return await prisma.$transaction(async (newTx) => execute(newTx));
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to restore usage.' };
    }
  }

  /**
   * Creates a new coupon in database with all BM-10 attributes.
   */
  static async create(data: CreateCouponInput) {
    const validUntilDate = new Date(data.validUntil);
    const startDate = data.startDate ? new Date(data.startDate) : new Date();

    try {
      return await prisma.coupon.create({
        data: {
          code: data.code.trim().toUpperCase(),
          title: data.title?.trim() || null,
          description: data.description?.trim() || null,
          fundingType: data.fundingType || 'NAVYA',
          shopId: data.shopId?.trim() || null,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount || 0,
          maxDiscount: data.maxDiscount || null,
          usageLimit: data.usageLimit || null,
          usagePerUser: data.usagePerUser || 1,
          usedCount: 0,
          startDate,
          validUntil: validUntilDate,
          isActive: data.isActive ?? true,
          applicableCategories: data.applicableCategories || [],
          applicableProducts: data.applicableProducts || [],
          excludedProducts: data.excludedProducts || [],
        },
      });
    } catch (err: any) {
      throw new Error(`Failed to create coupon: ${err.message}`);
    }
  }

  /**
   * Updates an existing coupon.
   */
  static async update(id: string, data: UpdateCouponInput) {
    try {
      return await prisma.coupon.update({
        where: { id },
        data: {
          ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
          ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.fundingType ? { fundingType: data.fundingType } : {}),
          ...(data.shopId !== undefined ? { shopId: data.shopId?.trim() || null } : {}),
          ...(data.discountType ? { discountType: data.discountType } : {}),
          ...(data.discountValue ? { discountValue: data.discountValue } : {}),
          ...(data.minOrderAmount !== undefined ? { minOrderAmount: data.minOrderAmount } : {}),
          ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
          ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit } : {}),
          ...(data.usagePerUser !== undefined ? { usagePerUser: data.usagePerUser } : {}),
          ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
          ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.applicableCategories !== undefined
            ? { applicableCategories: data.applicableCategories || [] }
            : {}),
          ...(data.applicableProducts !== undefined
            ? { applicableProducts: data.applicableProducts || [] }
            : {}),
          ...(data.excludedProducts !== undefined
            ? { excludedProducts: data.excludedProducts || [] }
            : {}),
        },
      });
    } catch {
      throw new Error('Coupon not found');
    }
  }

  /**
   * Soft deletes a coupon.
   */
  static async softDelete(id: string) {
    try {
      return await prisma.coupon.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
    } catch {
      return null;
    }
  }
}
