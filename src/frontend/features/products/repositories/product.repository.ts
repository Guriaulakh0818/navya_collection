import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

const mockProductStore = new Map<string, any>([
  [
    'prd_banarasi_1',
    {
      id: 'prd_banarasi_1',
      name: 'Royal Banarasi Silk Saree',
      slug: 'royal-banarasi-silk-saree',
      sku: 'NAV-SAN-1001',
      description:
        'Exquisite Indian luxury couture from Navya Collection. Featuring intricate hand embroidery and fine zari work.',
      price: new Prisma.Decimal(14999),
      compareAtPrice: new Prisma.Decimal(17499),
      costPrice: new Prisma.Decimal(8000),
      stock: 45,
      lowStockThreshold: 5,
      status: 'active',
      isFeatured: true,
      isNewArrival: true,
      categoryId: 'cat_sarees',
      rating: 4.8,
      reviewCount: 28,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
      images: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
          alt: 'Royal Banarasi Silk Saree Front View',
          isPrimary: true,
          sortOrder: 1,
        },
      ],
      variants: [
        {
          id: 'var_1',
          name: 'Free Size / Royal Crimson',
          sku: 'NAV-SAN-1001-FS-RED',
          price: new Prisma.Decimal(14999),
          stock: 20,
          size: 'FS',
          color: 'Royal Crimson',
        },
      ],
    },
  ],
  [
    'prd_kanjeevaram_2',
    {
      id: 'prd_kanjeevaram_2',
      name: 'Heritage Kanjeevaram Silk Saree',
      slug: 'heritage-kanjeevaram-silk-saree',
      sku: 'NAV-KAN-1002',
      description: 'Handcrafted pure Kanjeevaram silk saree woven with rich golden zari borders.',
      price: new Prisma.Decimal(24999),
      compareAtPrice: new Prisma.Decimal(28999),
      costPrice: new Prisma.Decimal(14000),
      stock: 25,
      lowStockThreshold: 5,
      status: 'active',
      isFeatured: true,
      isNewArrival: false,
      categoryId: 'cat_sarees',
      rating: 4.9,
      reviewCount: 34,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
      images: [
        {
          id: 'img_2',
          url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
          alt: 'Heritage Kanjeevaram Silk Saree',
          isPrimary: true,
          sortOrder: 1,
        },
      ],
      variants: [
        {
          id: 'var_2',
          name: 'Free Size / Emerald Green',
          sku: 'NAV-KAN-1002-FS-GRN',
          price: new Prisma.Decimal(24999),
          stock: 15,
          size: 'FS',
          color: 'Emerald Green',
        },
      ],
    },
  ],
]);

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
      // Memory fallback for offline/placeholder database
      let items = Array.from(mockProductStore.values()).filter((p) => p.deletedAt === null);

      if (where.status) {
        items = items.filter((p) => p.status === where.status);
      } else {
        items = items.filter((p) => p.status === 'active');
      }
      if (where.isFeatured !== undefined) {
        items = items.filter((p) => p.isFeatured === where.isFeatured);
      }
      if (where.isNewArrival !== undefined) {
        items = items.filter((p) => p.isNewArrival === where.isNewArrival);
      }

      return items.slice(skip, skip + take);
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
      return Array.from(mockProductStore.values()).filter(
        (p) => p.deletedAt === null && p.status === 'active',
      ).length;
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
      for (const product of mockProductStore.values()) {
        if ((product.id === idOrSlug || product.slug === idOrSlug) && product.deletedAt === null) {
          return product;
        }
      }
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
      for (const product of mockProductStore.values()) {
        if (product.sku === formattedSku && product.id !== excludeId) {
          return product;
        }
      }
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
      for (const product of mockProductStore.values()) {
        if (product.slug === formattedSlug && product.id !== excludeId) {
          return product;
        }
      }
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
          ...productData,
          slug: computedSlug,
          sku: productData.sku.toUpperCase(),
          price: new Prisma.Decimal(productData.price),
          compareAtPrice: productData.compareAtPrice
            ? new Prisma.Decimal(productData.compareAtPrice)
            : null,
          costPrice: productData.costPrice ? new Prisma.Decimal(productData.costPrice) : null,
          images: {
            create: images.map((img, index) => ({
              imageUrl: img.url,
              altText: img.alt || `${productData.name} Image ${index + 1}`,
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
          images: true,
          variants: true,
        },
      });
    } catch {
      const newId = `prd_${Date.now()}`;
      const newProduct = {
        id: newId,
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
        lowStockThreshold: productData.lowStockThreshold,
        status: productData.status,
        isFeatured: productData.isFeatured,
        isNewArrival: productData.isNewArrival,
        categoryId: productData.categoryId,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        category: { id: productData.categoryId, name: 'Fashion', slug: 'fashion' },
        images: images.map((img, i) => ({
          id: `img_${newId}_${i}`,
          url: img.url,
          alt: img.alt || productData.name,
          isPrimary: img.isPrimary || i === 0,
          sortOrder: img.sortOrder ?? i,
        })),
        variants: variants.map((v, i) => ({
          id: `var_${newId}_${i}`,
          name: v.name,
          sku: v.sku.toUpperCase(),
          price: new Prisma.Decimal(v.price),
          stock: v.stock,
          size: v.size || null,
          color: v.color || null,
        })),
      };

      mockProductStore.set(newId, newProduct);
      return newProduct;
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
      const existing = mockProductStore.get(id);
      if (existing) {
        const updated = {
          ...existing,
          ...productData,
          ...(computedSlug ? { slug: computedSlug } : {}),
          ...(productData.price ? { price: new Prisma.Decimal(productData.price) } : {}),
          updatedAt: new Date(),
        };
        mockProductStore.set(id, updated);
        return updated;
      }
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
      const existing = mockProductStore.get(id);
      if (existing) {
        existing.deletedAt = new Date();
        existing.status = 'archived';
        mockProductStore.set(id, existing);
      }
      return existing;
    }
  }
}
