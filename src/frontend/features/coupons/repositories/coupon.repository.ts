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
   * Retrieves active, non-expired public coupons.
   */
  static async findAllActive() {
    const now = new Date();
    try {
      return await prisma.coupon.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          validUntil: { gte: now },
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
  static async countUserUsages(couponId: string, userId: string): Promise<number> {
    try {
      // If CouponUsage model exists in database
      const usages = await (prisma as any).couponUsage?.count({
        where: { couponId, userId },
      });
      return usages || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Records a coupon usage for a customer order.
   */
  static async recordUsage(couponId: string, userId: string, orderId?: string) {
    try {
      await prisma.$transaction(async (tx) => {
        // Increment usedCount
        await (tx as any).coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });

        // Record usage if table exists
        if ((tx as any).couponUsage) {
          await (tx as any).couponUsage.create({
            data: { couponId, userId, orderId },
          });
        }
      });
    } catch (err: any) {
      throw new Error(`Failed to record coupon usage: ${err.message}`);
    }
  }

  /**
   * Creates a new coupon in database.
   */
  static async create(data: CreateCouponInput) {
    const validUntilDate = new Date(data.validUntil);

    try {
      return await prisma.coupon.create({
        data: {
          code: data.code.trim().toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount || 0,
          maxDiscount: data.maxDiscount || null,
          validUntil: validUntilDate,
          isActive: data.isActive ?? true,
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
          ...(data.discountType ? { discountType: data.discountType } : {}),
          ...(data.discountValue ? { discountValue: data.discountValue } : {}),
          ...(data.minOrderAmount !== undefined ? { minOrderAmount: data.minOrderAmount } : {}),
          ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
          ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
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
