import { prisma } from '@/lib/prisma';

import { CreateCouponInput, UpdateCouponInput } from '../schemas/coupon.schema';

const mockCouponStore = new Map<string, any>();
const mockUsageStore = new Map<string, any[]>();

// Pre-seeded demo coupons for offline testing
const DEMO_COUPONS = [
  {
    id: 'c_welcome10',
    code: 'WELCOME10',
    title: 'Welcome 10% OFF',
    description: 'Get 10% OFF on orders over ₹499 (Max discount ₹200)',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 499,
    maxDiscount: 200,
    usageLimit: 1000,
    usagePerUser: 1,
    usedCount: 15,
    startDate: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true,
    applicableCategories: null,
    applicableProducts: null,
    excludedProducts: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'c_navya200',
    code: 'NAVYA200',
    title: 'Flat ₹200 OFF',
    description: 'Get Flat ₹200 OFF on orders over ₹1,499',
    discountType: 'FIXED',
    discountValue: 200,
    minOrderAmount: 1499,
    maxDiscount: 200,
    usageLimit: 500,
    usagePerUser: 2,
    usedCount: 42,
    startDate: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true,
    applicableCategories: null,
    applicableProducts: null,
    excludedProducts: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'c_navya15vip',
    code: 'NAVYA15VIP',
    title: '15% OFF VIP Exclusive',
    description: '15% OFF on Non-Discounted products for order amount > ₹3,000',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderAmount: 3000,
    maxDiscount: null,
    usageLimit: 10000,
    usagePerUser: 10,
    usedCount: 0,
    startDate: new Date('2026-01-01'),
    validUntil: new Date('2028-12-31'),
    isActive: true,
    onlyNonDiscounted: true,
    applicableCategories: null,
    applicableProducts: null,
    excludedProducts: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

DEMO_COUPONS.forEach((c) => mockCouponStore.set(c.code, c));

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
      const found = mockCouponStore.get(cleanCode);
      return found && found.deletedAt === null ? found : null;
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
      for (const c of mockCouponStore.values()) {
        if (c.id === id && c.deletedAt === null) return c;
      }
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
      return Array.from(mockCouponStore.values()).filter((c) => c.deletedAt === null);
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
      return Array.from(mockCouponStore.values()).filter(
        (c) => c.isActive && c.deletedAt === null && new Date(c.validUntil) >= now,
      );
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
      const usages = mockUsageStore.get(userId) || [];
      return usages.filter((u) => u.couponId === couponId).length;
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
    } catch {
      const coupon = await this.findById(couponId);
      if (coupon) coupon.usedCount = (coupon.usedCount || 0) + 1;

      const userUsages = mockUsageStore.get(userId) || [];
      userUsages.push({ couponId, userId, orderId, createdAt: new Date() });
      mockUsageStore.set(userId, userUsages);
    }
  }

  /**
   * Creates a new coupon in database.
   */
  static async create(data: CreateCouponInput) {
    const validUntilDate = new Date(data.validUntil);
    const startDateDate = data.startDate ? new Date(data.startDate) : new Date();

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
    } catch {
      const newCoupon = {
        id: `c_${Date.now()}`,
        code: data.code.trim().toUpperCase(),
        title:
          data.title ||
          `${data.discountValue}${data.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
        description: data.description || '',
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount || 0,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        usagePerUser: data.usagePerUser || 1,
        usedCount: 0,
        startDate: startDateDate,
        validUntil: validUntilDate,
        isActive: data.isActive ?? true,
        applicableCategories: data.applicableCategories || null,
        applicableProducts: data.applicableProducts || null,
        excludedProducts: data.excludedProducts || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockCouponStore.set(newCoupon.code, newCoupon);
      return newCoupon;
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
      for (const [code, coupon] of mockCouponStore.entries()) {
        if (coupon.id === id) {
          const updated = {
            ...coupon,
            ...data,
            code: data.code ? data.code.trim().toUpperCase() : coupon.code,
            validUntil: data.validUntil ? new Date(data.validUntil) : coupon.validUntil,
            updatedAt: new Date(),
          };
          mockCouponStore.delete(code);
          mockCouponStore.set(updated.code, updated);
          return updated;
        }
      }
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
      for (const coupon of mockCouponStore.values()) {
        if (coupon.id === id) {
          coupon.deletedAt = new Date();
          coupon.isActive = false;
          return coupon;
        }
      }
      return { id };
    }
  }
}
