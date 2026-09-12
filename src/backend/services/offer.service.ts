import { prisma } from '@/lib/prisma';

export interface OfferData {
  id: string;
  title: string;
  description?: string | null;
  type: string; // 'FREE_DELIVERY' | 'PERCENT_DISCOUNT' | 'FLAT_DISCOUNT'
  value: number;
  minCartValue?: number | null;
  firstOrderOnly: boolean;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateOfferInput {
  title: string;
  description?: string;
  type: 'FREE_DELIVERY' | 'PERCENT_DISCOUNT' | 'FLAT_DISCOUNT';
  value?: number;
  minCartValue?: number;
  firstOrderOnly?: boolean;
  isActive?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface UpdateOfferInput extends Partial<CreateOfferInput> {}

// Default fallback offer if database is bootstrapping
const DEFAULT_FIRST_ORDER_OFFER: OfferData = {
  id: 'default-first-order-free-delivery',
  title: 'Free Delivery on First Order',
  description: 'Get free delivery across India on your very first order at Navya Collection!',
  type: 'FREE_DELIVERY',
  value: 0,
  minCartValue: 0,
  firstOrderOnly: true,
  isActive: true,
};

export class OfferService {
  private static isTableInitialized = false;

  /**
   * Automatically ensure the 'offers' table and indexes exist in the PostgreSQL database.
   */
  private static async ensureTableExists(): Promise<void> {
    if (this.isTableInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "offers" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "type" TEXT NOT NULL DEFAULT 'FREE_DELIVERY',
          "value" DECIMAL(10,2) NOT NULL DEFAULT 0,
          "minCartValue" DECIMAL(10,2) DEFAULT 0,
          "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "startDate" TIMESTAMP(3),
          "endDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
        );
      `);
      try {
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "offers_type_idx" ON "offers"("type");`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "offers_isActive_idx" ON "offers"("isActive");`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "offers_firstOrderOnly_idx" ON "offers"("firstOrderOnly");`,
        );
      } catch {}
      this.isTableInitialized = true;
    } catch (err) {
      console.warn('[OFFER_SERVICE] Auto-migration check or table initialization warning:', err);
    }
  }

  /**
   * List all offers (Admin).
   */
  static async listOffers(): Promise<OfferData[]> {
    await this.ensureTableExists();
    try {
      const dbOffers = await (prisma as any).offer?.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (dbOffers && dbOffers.length > 0) {
        return dbOffers.map((o: any) => ({
          ...o,
          value: Number(o.value || 0),
          minCartValue: Number(o.minCartValue || 0),
        }));
      }

      // Auto-seed default offer if database is empty
      try {
        const seeded = await (prisma as any).offer?.create({
          data: {
            title: DEFAULT_FIRST_ORDER_OFFER.title,
            description: DEFAULT_FIRST_ORDER_OFFER.description,
            type: DEFAULT_FIRST_ORDER_OFFER.type,
            value: DEFAULT_FIRST_ORDER_OFFER.value,
            minCartValue: DEFAULT_FIRST_ORDER_OFFER.minCartValue,
            firstOrderOnly: DEFAULT_FIRST_ORDER_OFFER.firstOrderOnly,
            isActive: DEFAULT_FIRST_ORDER_OFFER.isActive,
          },
        });
        if (seeded) {
          return [
            {
              ...seeded,
              value: Number(seeded.value || 0),
              minCartValue: Number(seeded.minCartValue || 0),
            },
          ];
        }
      } catch {}

      return [DEFAULT_FIRST_ORDER_OFFER];
    } catch (error) {
      console.error('[OFFER_SERVICE_LIST_ERROR]', error);
      return [DEFAULT_FIRST_ORDER_OFFER];
    }
  }

  /**
   * Create a new offer (Admin).
   */
  static async createOffer(input: CreateOfferInput): Promise<OfferData> {
    await this.ensureTableExists();

    const data: any = {
      title: input.title,
      description: input.description || null,
      type: input.type || 'FREE_DELIVERY',
      value: input.value ?? 0,
      minCartValue: input.minCartValue ?? 0,
      firstOrderOnly: Boolean(input.firstOrderOnly),
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    };

    try {
      const created = await (prisma as any).offer.create({ data });
      return {
        ...created,
        value: Number(created.value || 0),
        minCartValue: Number(created.minCartValue || 0),
      };
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === 'P2021') {
        this.isTableInitialized = false;
        await this.ensureTableExists();
        const created = await (prisma as any).offer.create({ data });
        return {
          ...created,
          value: Number(created.value || 0),
          minCartValue: Number(created.minCartValue || 0),
        };
      }
      throw error;
    }
  }

  /**
   * Update / Toggle an offer (Admin).
   */
  static async updateOffer(id: string, input: UpdateOfferInput): Promise<OfferData> {
    await this.ensureTableExists();
    const data: any = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = input.value;
    if (input.minCartValue !== undefined) data.minCartValue = input.minCartValue;
    if (input.firstOrderOnly !== undefined) data.firstOrderOnly = Boolean(input.firstOrderOnly);
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    if (input.startDate !== undefined) {
      data.startDate = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    try {
      const updated = await (prisma as any).offer.update({
        where: { id },
        data,
      });

      return {
        ...updated,
        value: Number(updated.value || 0),
        minCartValue: Number(updated.minCartValue || 0),
      };
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === 'P2021') {
        this.isTableInitialized = false;
        await this.ensureTableExists();
        const updated = await (prisma as any).offer.update({
          where: { id },
          data,
        });
        return {
          ...updated,
          value: Number(updated.value || 0),
          minCartValue: Number(updated.minCartValue || 0),
        };
      }
      throw error;
    }
  }

  /**
   * Delete an offer (Admin).
   */
  static async deleteOffer(id: string): Promise<boolean> {
    await this.ensureTableExists();
    try {
      await (prisma as any).offer.delete({
        where: { id },
      });
      return true;
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === 'P2021') {
        return true;
      }
      throw error;
    }
  }

  /**
   * Fetch active, currently valid offers.
   */
  static async getActiveOffers(): Promise<OfferData[]> {
    await this.ensureTableExists();
    try {
      const now = new Date();
      const offers = await (prisma as any).offer?.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (offers && offers.length > 0) {
        return offers.map((o: any) => ({
          ...o,
          value: Number(o.value || 0),
          minCartValue: Number(o.minCartValue || 0),
        }));
      }

      return [];
    } catch (error) {
      console.error('[GET_ACTIVE_OFFERS_ERROR]', error);
      return [DEFAULT_FIRST_ORDER_OFFER];
    }
  }

  /**
   * Determines if a user is eligible for first-order promotion (authenticated & 0 completed orders).
   */
  static async isUserFirstOrder(userId?: string | null): Promise<{
    isEligible: boolean;
    isGuest: boolean;
    orderCount: number;
  }> {
    if (!userId || userId.startsWith('guest_') || userId === 'guest_customer_session') {
      return { isEligible: false, isGuest: true, orderCount: 0 };
    }

    try {
      const orderCount = await prisma.order.count({
        where: {
          userId,
          orderStatus: { notIn: ['CANCELLED'] },
          deletedAt: null,
        },
      });

      return {
        isEligible: orderCount === 0,
        isGuest: false,
        orderCount,
      };
    } catch (error) {
      console.error('[IS_USER_FIRST_ORDER_CHECK_ERROR]', error);
      return { isEligible: false, isGuest: false, orderCount: 0 };
    }
  }

  /**
   * Evaluates active delivery offers against the user and cart.
   */
  static async evaluateShippingOffer(
    userId?: string | null,
    cartAmount: number = 0,
    baseShippingCharge: number = 49,
  ): Promise<{
    isFreeDelivery: boolean;
    finalShippingCharge: number;
    appliedOffer: OfferData | null;
    message?: string;
    guestPrompt?: string;
  }> {
    const activeOffers = await this.getActiveOffers();
    const deliveryOffer = activeOffers.find((o) => o.type === 'FREE_DELIVERY');

    if (!deliveryOffer) {
      return {
        isFreeDelivery: false,
        finalShippingCharge: baseShippingCharge,
        appliedOffer: null,
      };
    }

    // Check minCartValue threshold
    if (deliveryOffer.minCartValue && cartAmount < deliveryOffer.minCartValue) {
      return {
        isFreeDelivery: false,
        finalShippingCharge: baseShippingCharge,
        appliedOffer: null,
      };
    }

    // Check firstOrderOnly condition
    if (deliveryOffer.firstOrderOnly) {
      const firstOrderCheck = await this.isUserFirstOrder(userId);

      if (firstOrderCheck.isGuest) {
        return {
          isFreeDelivery: false,
          finalShippingCharge: baseShippingCharge,
          appliedOffer: null,
          guestPrompt: 'Log in to claim Free Delivery on your first order! 🎉',
        };
      }

      if (firstOrderCheck.isEligible) {
        return {
          isFreeDelivery: true,
          finalShippingCharge: 0,
          appliedOffer: deliveryOffer,
          message: 'First order — Free delivery 🎉',
        };
      }

      return {
        isFreeDelivery: false,
        finalShippingCharge: baseShippingCharge,
        appliedOffer: null,
      };
    }

    // Unconditional Free Delivery Offer
    return {
      isFreeDelivery: true,
      finalShippingCharge: 0,
      appliedOffer: deliveryOffer,
      message: deliveryOffer.title || 'Free Delivery Promotion 🎉',
    };
  }
}
