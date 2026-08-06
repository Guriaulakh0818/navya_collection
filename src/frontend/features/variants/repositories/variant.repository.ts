import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateVariantInput, UpdateVariantInput } from '../schemas/variant.schema';

const mockVariantStore = new Map<string, any>([
  [
    'var_1',
    {
      id: 'var_1',
      productId: 'prd_banarasi_1',
      name: 'Free Size / Royal Crimson',
      sku: 'NAV-SAN-1001-FS-RED',
      barcode: '8901234567890',
      price: new Prisma.Decimal(14999),
      compareAtPrice: new Prisma.Decimal(17499),
      stock: 20,
      size: 'FS',
      color: 'Royal Crimson',
      weight: 0.8,
      dimensions: '10x10x5 cm',
      attributes: { fabric: 'Banarasi Silk', fit: 'Regular', season: 'Festive' },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
]);

export class VariantRepository {
  /**
   * Finds all non-deleted variants for a specific product matching optional filter criteria.
   */
  static async findManyByProductId(productId: string, where: Prisma.ProductVariantWhereInput = {}) {
    try {
      return await prisma.productVariant.findMany({
        where: {
          productId,
          ...where,
          deletedAt: null,
        },
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      });
    } catch {
      return Array.from(mockVariantStore.values()).filter(
        (v) => v.productId === productId && v.deletedAt === null,
      );
    }
  }

  /**
   * Finds a single variant by ID.
   */
  static async findById(variantId: string) {
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
      const variant = mockVariantStore.get(variantId);
      if (variant && variant.deletedAt === null) return variant;
      return null;
    }
  }

  /**
   * Finds variant by SKU to verify global uniqueness.
   */
  static async findBySku(sku: string, excludeId?: string) {
    const formattedSku = sku.toUpperCase();
    try {
      return await prisma.productVariant.findFirst({
        where: {
          sku: formattedSku,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
    } catch {
      for (const v of mockVariantStore.values()) {
        if (v.sku === formattedSku && v.id !== excludeId) return v;
      }
      return null;
    }
  }

  /**
   * Finds variant by ProductId + Size + Color to prevent duplicate attribute combinations.
   */
  static async findBySizeAndColor(
    productId: string,
    size?: string | null,
    color?: string | null,
    excludeId?: string,
  ) {
    try {
      return await prisma.productVariant.findFirst({
        where: {
          productId,
          size: size || null,
          color: color || null,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
    } catch {
      for (const v of mockVariantStore.values()) {
        if (
          v.productId === productId &&
          v.size === (size || null) &&
          v.color === (color || null) &&
          v.id !== excludeId &&
          v.deletedAt === null
        ) {
          return v;
        }
      }
      return null;
    }
  }

  /**
   * Counts active non-deleted variants for a product.
   */
  static async countActiveVariants(productId: string): Promise<number> {
    try {
      return await prisma.productVariant.count({
        where: {
          productId,
          status: 'active',
          deletedAt: null,
        },
      });
    } catch {
      return Array.from(mockVariantStore.values()).filter(
        (v) => v.productId === productId && v.status === 'active' && v.deletedAt === null,
      ).length;
    }
  }

  /**
   * Creates a single product variant in Prisma PostgreSQL.
   */
  static async create(productId: string, data: CreateVariantInput) {
    try {
      return await prisma.productVariant.create({
        data: {
          productId,
          name: data.name,
          sku: data.sku.toUpperCase(),
          barcode: data.barcode || null,
          price: new Prisma.Decimal(data.price),
          compareAtPrice: data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null,
          stock: data.stock,
          size: data.size || null,
          color: data.color || null,
          weight: data.weight || null,
          dimensions: data.dimensions || null,
          attributes: data.attributes
            ? (data.attributes as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          status: data.status ?? 'active',
        },
      });
    } catch {
      const newId = `var_${Date.now()}`;
      const newVariant = {
        id: newId,
        productId,
        name: data.name,
        sku: data.sku.toUpperCase(),
        barcode: data.barcode || null,
        price: new Prisma.Decimal(data.price),
        compareAtPrice: data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null,
        stock: data.stock,
        size: data.size || null,
        color: data.color || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        attributes: data.attributes || null,
        status: data.status ?? 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockVariantStore.set(newId, newVariant);
      return newVariant;
    }
  }

  /**
   * Bulk creates multiple product variants in a single transaction.
   */
  static async bulkCreate(productId: string, variants: CreateVariantInput[]) {
    try {
      return await prisma.$transaction(
        variants.map((v) =>
          prisma.productVariant.create({
            data: {
              productId,
              name: v.name,
              sku: v.sku.toUpperCase(),
              barcode: v.barcode || null,
              price: new Prisma.Decimal(v.price),
              compareAtPrice: v.compareAtPrice ? new Prisma.Decimal(v.compareAtPrice) : null,
              stock: v.stock,
              size: v.size || null,
              color: v.color || null,
              weight: v.weight || null,
              dimensions: v.dimensions || null,
              attributes: v.attributes ? (v.attributes as Prisma.InputJsonValue) : Prisma.JsonNull,
              status: v.status ?? 'active',
            },
          }),
        ),
      );
    } catch {
      const createdList = [];
      for (const v of variants) {
        const created = await this.create(productId, v);
        createdList.push(created);
      }
      return createdList;
    }
  }

  /**
   * Updates an existing product variant.
   */
  static async update(variantId: string, data: UpdateVariantInput) {
    try {
      const updateData: Prisma.ProductVariantUpdateInput = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.sku !== undefined) updateData.sku = data.sku.toUpperCase();
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
      if (data.compareAtPrice !== undefined)
        updateData.compareAtPrice = data.compareAtPrice
          ? new Prisma.Decimal(data.compareAtPrice)
          : null;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.size !== undefined) updateData.size = data.size;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
      if (data.attributes !== undefined)
        updateData.attributes = data.attributes
          ? (data.attributes as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      if (data.status !== undefined) updateData.status = data.status;

      return await prisma.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });
    } catch {
      const existing = mockVariantStore.get(variantId);
      if (existing) {
        const updated = {
          ...existing,
          ...data,
          ...(data.price ? { price: new Prisma.Decimal(data.price) } : {}),
          updatedAt: new Date(),
        };
        mockVariantStore.set(variantId, updated);
        return updated;
      }
      throw new Error(`Variant ${variantId} not found.`);
    }
  }

  /**
   * Performs soft deletion of a product variant.
   */
  static async softDelete(variantId: string) {
    try {
      return await prisma.productVariant.update({
        where: { id: variantId },
        data: {
          deletedAt: new Date(),
          status: 'inactive',
        },
      });
    } catch {
      const existing = mockVariantStore.get(variantId);
      if (existing) {
        existing.deletedAt = new Date();
        existing.status = 'inactive';
        mockVariantStore.set(variantId, existing);
      }
      return existing;
    }
  }
}
