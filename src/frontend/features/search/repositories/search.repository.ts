import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class SearchRepository {
  /**
   * Searches active products matching Prisma filters, pagination, and sorting options.
   */
  static async searchProducts(
    where: Prisma.ProductWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProductOrderByWithRelationInput[],
  ) {
    try {
      return await prisma.product.findMany({
        where: {
          ...where,
          deletedAt: null,
          status: 'active',
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          brand: true,
          description: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          status: true,
          isFeatured: true,
          isNewArrival: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
            take: 2,
          },
          _count: {
            select: {
              variants: { where: { deletedAt: null, status: 'active' } },
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Counts total search results matching criteria.
   */
  static async countSearchResults(where: Prisma.ProductWhereInput): Promise<number> {
    try {
      return await prisma.product.count({
        where: {
          ...where,
          deletedAt: null,
          status: 'active',
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
   * Fetches autocomplete suggestions for Product Names, Categories, and Brands.
   */
  static async getSuggestions(queryTerm: string, limit: number = 5) {
    const formattedTerm = queryTerm.trim();

    try {
      const [products, categories, brands] = await Promise.all([
        // 1. Product Name suggestions (Only from Approved Shops)
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
            OR: [
              { name: { contains: formattedTerm, mode: 'insensitive' } },
              { sku: { contains: formattedTerm, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { imageUrl: true },
            },
          },
        }),

        // 2. Category Name suggestions
        prisma.category.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            name: { contains: formattedTerm, mode: 'insensitive' },
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),

        // 3. Distinct Brand suggestions (Only from Approved Shops)
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
            brand: { contains: formattedTerm, mode: 'insensitive' },
          },
          take: limit,
          select: {
            brand: true,
          },
          distinct: ['brand'],
        }),
      ]);

      const brandList = Array.from(
        new Set(brands.map((b) => b.brand).filter((b): b is string => Boolean(b))),
      );

      return {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          image: p.images[0]?.imageUrl || null,
        })),
        categories,
        brands: brandList,
      };
    } catch {
      return {
        products: [],
        categories: [],
        brands: [],
      };
    }
  }
}
