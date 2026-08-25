import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { UpdateInventoryInput } from '../schemas/inventory.schema';

export function calculateStockStatus(
  availableStock: number,
  minimumStockLevel: number = 5,
): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (availableStock <= 0) return 'OUT_OF_STOCK';
  if (availableStock <= minimumStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export class InventoryRepository {
  /**
   * Queries inventory variants with pagination, product details, search, and stock status filters.
   */
  static async findMany(
    where: Prisma.ProductVariantWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProductVariantOrderByWithRelationInput,
  ) {
    try {
      return await prisma.productVariant.findMany({
        where: {
          ...where,
          deletedAt: null,
        },
        skip,
        take,
        orderBy,
        select: {
          id: true,
          productId: true,
          name: true,
          sku: true,
          barcode: true,
          availableStock: true,
          reservedStock: true,
          soldStock: true,
          minimumStockLevel: true,
          maximumStockLevel: true,
          stockStatus: true,
          lastRestockedAt: true,
          status: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Counts total inventory items matching criteria for pagination.
   */
  static async count(where: Prisma.ProductVariantWhereInput): Promise<number> {
    try {
      return await prisma.productVariant.count({
        where: {
          ...where,
          deletedAt: null,
        },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Finds a single variant's inventory details by variantId.
   */
  static async findByVariantId(variantId: string) {
    try {
      return await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          deletedAt: null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Updates variant inventory metrics and automatically syncs legacy stock & stockStatus.
   */
  static async update(
    variantId: string,
    data: {
      availableStock?: number;
      reservedStock?: number;
      soldStock?: number;
      minimumStockLevel?: number;
      maximumStockLevel?: number | null;
      lastRestockedAt?: Date | null;
    },
  ) {
    const current = await this.findByVariantId(variantId);
    if (!current) throw new Error(`Variant ${variantId} not found.`);

    const newAvailable =
      data.availableStock !== undefined ? data.availableStock : current.availableStock;
    const newMinLevel =
      data.minimumStockLevel !== undefined ? data.minimumStockLevel : current.minimumStockLevel;
    const newStatus = calculateStockStatus(newAvailable, newMinLevel);

    try {
      return await prisma.productVariant.update({
        where: { id: variantId },
        data: {
          availableStock: newAvailable,
          stock: newAvailable, // Sync legacy stock field
          ...(data.reservedStock !== undefined ? { reservedStock: data.reservedStock } : {}),
          ...(data.soldStock !== undefined ? { soldStock: data.soldStock } : {}),
          ...(data.minimumStockLevel !== undefined
            ? { minimumStockLevel: data.minimumStockLevel }
            : {}),
          ...(data.maximumStockLevel !== undefined
            ? { maximumStockLevel: data.maximumStockLevel }
            : {}),
          ...(data.lastRestockedAt !== undefined ? { lastRestockedAt: data.lastRestockedAt } : {}),
          stockStatus: newStatus,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      });
    } catch {
      throw new Error(`Failed to update variant ${variantId}.`);
    }
  }

  /**
   * Bulk updates multiple inventory records in a transaction.
   */
  static async bulkUpdate(
    items: Array<{ variantId: string; availableStock: number; minimumStockLevel?: number }>,
  ) {
    try {
      return await prisma.$transaction(
        items.map((item) => {
          const minLevel = item.minimumStockLevel ?? 5;
          const status = calculateStockStatus(item.availableStock, minLevel);

          return prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              availableStock: item.availableStock,
              stock: item.availableStock,
              ...(item.minimumStockLevel !== undefined
                ? { minimumStockLevel: item.minimumStockLevel }
                : {}),
              stockStatus: status,
              lastRestockedAt: new Date(),
            },
          });
        }),
      );
    } catch {
      throw new Error(`Failed to bulk update variants.`);
    }
  }
}
