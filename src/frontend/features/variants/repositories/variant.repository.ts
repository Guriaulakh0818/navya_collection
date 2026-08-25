import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateVariantInput, UpdateVariantInput } from '../schemas/variant.schema';

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
      return [];
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
      return 0;
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
    } catch (err: any) {
      throw new Error(`Failed to create product variant: ${err.message}`);
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
      throw new Error(`Failed to bulk create product variants.`);
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
      return null;
    }
  }
}
