import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class FilterRepository {
  /**
   * Retrieves active products filtered, sorted, and paginated by Prisma.
   */
  static async filterProducts(
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
          status: 'active', // Security enforcement: active products only
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
          gender: true,
          ageGroup: true,
          fabric: true,
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
          variants: {
            where: { deletedAt: null, status: 'active' },
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              stock: true,
              availableStock: true,
              stockStatus: true,
              attributes: true,
            },
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
   * Counts total products matching filter query.
   */
  static async countFilterProducts(where: Prisma.ProductWhereInput): Promise<number> {
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
   * Fetches dynamic filter options metadata across active products for frontend PLP sidebar.
   */
  static async getFilterOptions() {
    try {
      const shopApprovedFilter = { status: 'APPROVED' as const, deletedAt: null };

      const [
        categories,
        brands,
        genders,
        ageGroups,
        fabrics,
        sizes,
        colors,
        priceAggregate,
        inStockCount,
        outOfStockCount,
        featuredCount,
        newArrivalsCount,
      ] = await Promise.all([
        // 1. Categories with product counts
        prisma.category.findMany({
          where: { deletedAt: null, status: 'active' },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                products: {
                  where: { deletedAt: null, status: 'active', shop: shopApprovedFilter },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        }),

        // 2. Distinct Brands
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            brand: { not: null },
            shop: shopApprovedFilter,
          },
          select: { brand: true },
          distinct: ['brand'],
        }),

        // 3. Distinct Genders
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            gender: { not: null },
            shop: shopApprovedFilter,
          },
          select: { gender: true },
          distinct: ['gender'],
        }),

        // 4. Distinct Age Groups
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            ageGroup: { not: null },
            shop: shopApprovedFilter,
          },
          select: { ageGroup: true },
          distinct: ['ageGroup'],
        }),

        // 5. Distinct Fabrics
        prisma.product.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            fabric: { not: null },
            shop: shopApprovedFilter,
          },
          select: { fabric: true },
          distinct: ['fabric'],
        }),

        // 6. Distinct Sizes from variants
        prisma.productVariant.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            size: { not: null },
            product: { shop: shopApprovedFilter },
          },
          select: { size: true },
          distinct: ['size'],
        }),

        // 7. Distinct Colors from variants
        prisma.productVariant.findMany({
          where: {
            deletedAt: null,
            status: 'active',
            color: { not: null },
            product: { shop: shopApprovedFilter },
          },
          select: { color: true },
          distinct: ['color'],
        }),

        // 8. Min and Max Price aggregate
        prisma.product.aggregate({
          where: { deletedAt: null, status: 'active', shop: shopApprovedFilter },
          _min: { price: true },
          _max: { price: true },
        }),

        // 9. In Stock count
        prisma.product.count({
          where: {
            deletedAt: null,
            status: 'active',
            stock: { gt: 0 },
            shop: shopApprovedFilter,
          },
        }),

        // 10. Out of stock count
        prisma.product.count({
          where: {
            deletedAt: null,
            status: 'active',
            stock: { lte: 0 },
            shop: shopApprovedFilter,
          },
        }),

        // 11. Featured Count
        prisma.product.count({
          where: {
            deletedAt: null,
            status: 'active',
            isFeatured: true,
            shop: shopApprovedFilter,
          },
        }),

        // 12. New Arrivals Count
        prisma.product.count({
          where: {
            deletedAt: null,
            status: 'active',
            isNewArrival: true,
            shop: shopApprovedFilter,
          },
        }),
      ]);

      return {
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.products,
        })),
        brands: Array.from(
          new Set(brands.map((b) => b.brand).filter((b): b is string => Boolean(b))),
        ),
        genders: Array.from(
          new Set(genders.map((g) => g.gender).filter((g): g is string => Boolean(g))),
        ),
        ageGroups: Array.from(
          new Set(ageGroups.map((a) => a.ageGroup).filter((a): a is string => Boolean(a))),
        ),
        fabrics: Array.from(
          new Set(fabrics.map((f) => f.fabric).filter((f): f is string => Boolean(f))),
        ),
        sizes: Array.from(new Set(sizes.map((s) => s.size).filter((s): s is string => Boolean(s)))),
        colors: Array.from(
          new Set(colors.map((c) => c.color).filter((c): c is string => Boolean(c))),
        ),
        patterns: ['Solid', 'Printed', 'Embroidery', 'Zari', 'Floral', 'Striped', 'Chequered'],
        occasions: ['Bridal', 'Festive', 'Party', 'Casual', 'Wedding', 'Formal'],
        seasons: ['All Season', 'Summer', 'Winter', 'Festive Season'],
        priceRange: {
          minPrice: Number(priceAggregate._min.price || 0),
          maxPrice: Number(priceAggregate._max.price || 50000),
        },
        ratings: [4, 3, 2, 1],
        availability: {
          inStockCount,
          outOfStockCount,
        },
        featuredCount,
        newArrivalsCount,
      };
    } catch {
      return {
        categories: [],
        brands: [],
        genders: [],
        ageGroups: [],
        fabrics: [],
        sizes: [],
        colors: [],
        patterns: [],
        occasions: [],
        seasons: [],
        priceRange: { minPrice: 0, maxPrice: 0 },
        ratings: [],
        availability: { inStockCount: 0, outOfStockCount: 0 },
        featuredCount: 0,
        newArrivalsCount: 0,
      };
    }
  }
}
