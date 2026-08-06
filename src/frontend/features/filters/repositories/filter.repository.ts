import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const mockFilterStore = [
  {
    id: 'prd_banarasi_1',
    name: 'Royal Banarasi Silk Saree',
    slug: 'royal-banarasi-silk-saree',
    sku: 'NAV-SAN-1001',
    brand: 'Navya Couture',
    gender: 'women',
    ageGroup: 'adults',
    fabric: 'Silk',
    description: 'Exquisite Indian luxury couture from Navya Collection.',
    price: new Prisma.Decimal(14999),
    compareAtPrice: new Prisma.Decimal(17499),
    stock: 45,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    rating: 4.8,
    reviewCount: 28,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date(),
    deletedAt: null,
    category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
    images: [
      {
        id: 'img_1',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        secureUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        altText: 'Royal Banarasi Silk Saree Front View',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: 'var_1',
        size: 'Free Size',
        color: 'Red',
        price: new Prisma.Decimal(14999),
        stock: 25,
        stockStatus: 'IN_STOCK',
      },
      {
        id: 'var_2',
        size: 'Free Size',
        color: 'Gold',
        price: new Prisma.Decimal(15499),
        stock: 20,
        stockStatus: 'IN_STOCK',
      },
    ],
    _count: { variants: 2 },
  },
  {
    id: 'prd_cotton_shirt_2',
    name: 'Classic Linen Cotton Shirt',
    slug: 'classic-linen-cotton-shirt',
    sku: 'NAV-SHT-2002',
    brand: 'Navya Essentials',
    gender: 'men',
    ageGroup: 'adults',
    fabric: 'Cotton',
    description: 'Breathable premium linen cotton shirt for men.',
    price: new Prisma.Decimal(1299),
    compareAtPrice: new Prisma.Decimal(1999),
    stock: 80,
    status: 'active',
    isFeatured: false,
    isNewArrival: true,
    rating: 4.6,
    reviewCount: 15,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date(),
    deletedAt: null,
    category: { id: 'cat_shirts', name: 'Shirts', slug: 'shirts' },
    images: [
      {
        id: 'img_2',
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        secureUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        altText: 'Classic Linen Cotton Shirt',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: 'var_3',
        size: 'M',
        color: 'Black',
        price: new Prisma.Decimal(1299),
        stock: 40,
        stockStatus: 'IN_STOCK',
      },
      {
        id: 'var_4',
        size: 'L',
        color: 'Black',
        price: new Prisma.Decimal(1299),
        stock: 40,
        stockStatus: 'IN_STOCK',
      },
    ],
    _count: { variants: 2 },
  },
];

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
      let items = mockFilterStore.filter((p) => p.deletedAt === null && p.status === 'active');
      return items.slice(skip, skip + take);
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
        },
      });
    } catch {
      return mockFilterStore.filter((p) => p.deletedAt === null && p.status === 'active').length;
    }
  }

  /**
   * Fetches dynamic filter options metadata across active products for frontend PLP sidebar.
   */
  static async getFilterOptions() {
    try {
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
                products: { where: { deletedAt: null, status: 'active' } },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        }),

        // 2. Distinct Brands
        prisma.product.findMany({
          where: { deletedAt: null, status: 'active', brand: { not: null } },
          select: { brand: true },
          distinct: ['brand'],
        }),

        // 3. Distinct Genders
        prisma.product.findMany({
          where: { deletedAt: null, status: 'active', gender: { not: null } },
          select: { gender: true },
          distinct: ['gender'],
        }),

        // 4. Distinct Age Groups
        prisma.product.findMany({
          where: { deletedAt: null, status: 'active', ageGroup: { not: null } },
          select: { ageGroup: true },
          distinct: ['ageGroup'],
        }),

        // 5. Distinct Fabrics
        prisma.product.findMany({
          where: { deletedAt: null, status: 'active', fabric: { not: null } },
          select: { fabric: true },
          distinct: ['fabric'],
        }),

        // 6. Distinct Sizes from variants
        prisma.productVariant.findMany({
          where: { deletedAt: null, status: 'active', size: { not: null } },
          select: { size: true },
          distinct: ['size'],
        }),

        // 7. Distinct Colors from variants
        prisma.productVariant.findMany({
          where: { deletedAt: null, status: 'active', color: { not: null } },
          select: { color: true },
          distinct: ['color'],
        }),

        // 8. Min and Max Price aggregate
        prisma.product.aggregate({
          where: { deletedAt: null, status: 'active' },
          _min: { price: true },
          _max: { price: true },
        }),

        // 9. In Stock count
        prisma.product.count({
          where: { deletedAt: null, status: 'active', stock: { gt: 0 } },
        }),

        // 10. Out of stock count
        prisma.product.count({
          where: { deletedAt: null, status: 'active', stock: { lte: 0 } },
        }),

        // 11. Featured Count
        prisma.product.count({
          where: { deletedAt: null, status: 'active', isFeatured: true },
        }),

        // 12. New Arrivals Count
        prisma.product.count({
          where: { deletedAt: null, status: 'active', isNewArrival: true },
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
        categories: [{ id: 'cat_sarees', name: 'Sarees', slug: 'sarees', count: 1 }],
        brands: ['Navya Couture', 'Navya Essentials'],
        genders: ['women', 'men'],
        ageGroups: ['adults'],
        fabrics: ['Silk', 'Cotton'],
        sizes: ['Free Size', 'S', 'M', 'L', 'XL'],
        colors: ['Red', 'Gold', 'Black', 'Blue'],
        patterns: ['Solid', 'Embroidery'],
        occasions: ['Bridal', 'Festive', 'Casual'],
        seasons: ['All Season', 'Summer'],
        priceRange: { minPrice: 1299, maxPrice: 24999 },
        ratings: [4, 3, 2, 1],
        availability: { inStockCount: 2, outOfStockCount: 0 },
        featuredCount: 1,
        newArrivalsCount: 2,
      };
    }
  }
}
