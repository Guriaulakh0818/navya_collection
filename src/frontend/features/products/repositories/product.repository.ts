import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

export class ProductRepository {
  /**
   * Finds products matching filter criteria with pagination and sorting.
   */
  static async findMany(
    where: Prisma.ProductWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProductOrderByWithRelationInput,
  ) {
    try {
      return await prisma.product.findMany({
        where: {
          status: 'active',
          ...where,
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        skip,
        take,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              logo: true,
              banner: true,
              verificationBadge: true,
            },
          },
          images: {
            take: 2,
            orderBy: {
              sortOrder: 'asc',
            },
          },
          variants: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Counts total products matching filter criteria for pagination metadata.
   */
  static async count(where: Prisma.ProductWhereInput): Promise<number> {
    try {
      return await prisma.product.count({
        where: {
          status: 'active',
          ...where,
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Finds a single product by ID or Slug.
   */
  static async findByIdOrSlug(idOrSlug: string, allowPending = false) {
    try {
      return await prisma.product.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          ...(allowPending ? {} : { status: 'active' }),
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        include: {
          category: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              isClosed: true,
              closedReason: true,
              closedUntil: true,
              vacationMessage: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          variants: {
            where: {
              deletedAt: null,
            },
          },
          reviews: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Finds product by SKU to verify uniqueness.
   */
  static async findBySku(sku: string, excludeId?: string) {
    const formattedSku = sku.toUpperCase();
    try {
      return await prisma.product.findFirst({
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
   * Finds product by Slug to verify uniqueness.
   */
  static async findBySlug(slug: string, excludeId?: string) {
    const formattedSlug = slug.toLowerCase();
    try {
      return await prisma.product.findFirst({
        where: {
          slug: formattedSlug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Creates a new product with images and variants in Prisma PostgreSQL.
   */
  static async create(data: CreateProductInput, computedSlug: string) {
    const { images = [], variants = [], ...productData } = data;

    try {
      return await prisma.product.create({
        data: {
          name: productData.name,
          slug: computedSlug,
          sku: productData.sku.toUpperCase(),
          description: productData.description,
          price: new Prisma.Decimal(productData.price),
          compareAtPrice: productData.compareAtPrice
            ? new Prisma.Decimal(productData.compareAtPrice)
            : null,
          costPrice: productData.costPrice ? new Prisma.Decimal(productData.costPrice) : null,
          stock: productData.stock,
          lowStockThreshold: productData.lowStockThreshold ?? 5,
          status: productData.status ?? 'active',
          isFeatured: productData.isFeatured ?? false,
          isNewArrival: productData.isNewArrival ?? true,
          category: { connect: { id: productData.categoryId } },
          images: {
            create: images.map((img, index) => ({
              imageUrl: img.url,
              altText: img.alt || `Product Image ${index + 1}`,
              isPrimary: img.isPrimary || index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          },
          variants: {
            create: variants.map((v) => ({
              name: v.name,
              sku: v.sku.toUpperCase(),
              price: new Prisma.Decimal(v.price),
              stock: v.stock,
              size: v.size || null,
              color: v.color || null,
            })),
          },
        },
        include: {
          category: true,
          shop: true,
          images: true,
          variants: true,
        },
      });
    } catch (err: any) {
      throw new Error(`Failed to create product: ${err.message}`);
    }
  }

  /**
   * Updates an existing product.
   */
  static async update(id: string, data: UpdateProductInput, computedSlug?: string) {
    const { images, variants, ...productData } = data;

    try {
      const updatePayload: Prisma.ProductUpdateInput = {};

      if (productData.name !== undefined) updatePayload.name = productData.name;
      if (computedSlug !== undefined) updatePayload.slug = computedSlug;
      if (productData.sku !== undefined) updatePayload.sku = productData.sku.toUpperCase();
      if (productData.description !== undefined)
        updatePayload.description = productData.description;
      if (productData.price !== undefined)
        updatePayload.price = new Prisma.Decimal(productData.price);
      if (productData.compareAtPrice !== undefined)
        updatePayload.compareAtPrice = productData.compareAtPrice
          ? new Prisma.Decimal(productData.compareAtPrice)
          : null;
      if (productData.costPrice !== undefined)
        updatePayload.costPrice = productData.costPrice
          ? new Prisma.Decimal(productData.costPrice)
          : null;
      if (productData.stock !== undefined) updatePayload.stock = productData.stock;
      if (productData.lowStockThreshold !== undefined)
        updatePayload.lowStockThreshold = productData.lowStockThreshold;
      if (productData.status !== undefined) updatePayload.status = productData.status;
      if (productData.isFeatured !== undefined) updatePayload.isFeatured = productData.isFeatured;
      if (productData.isNewArrival !== undefined)
        updatePayload.isNewArrival = productData.isNewArrival;
      if (productData.categoryId !== undefined) {
        updatePayload.category = { connect: { id: productData.categoryId } };
      }

      if (images !== undefined) {
        updatePayload.images = {
          deleteMany: {},
          create: images.map((img, index) => ({
            imageUrl: img.url,
            altText: img.alt || `Product Image ${index + 1}`,
            isPrimary: img.isPrimary || index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        };
      }

      if (variants !== undefined) {
        updatePayload.variants = {
          deleteMany: {},
          create: variants.map((v) => ({
            name: v.name,
            sku: v.sku.toUpperCase(),
            price: new Prisma.Decimal(v.price),
            stock: v.stock,
            size: v.size || null,
            color: v.color || null,
          })),
        };
      }

      return await prisma.product.update({
        where: { id },
        data: updatePayload,
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });
    } catch {
      throw new Error(`Product ${id} not found.`);
    }
  }

  /**
   * Performs soft deletion of a product by setting deletedAt timestamp.
   */
  static async softDelete(id: string) {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'archived',
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Restores a soft-deleted product.
   */
  static async restore(id: string) {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          deletedAt: null,
          status: 'active',
        },
      });
    } catch {
      return null;
    }
  }
}
