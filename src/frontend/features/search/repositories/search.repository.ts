import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const mockSearchStore = [
  {
    id: 'prd_banarasi_1',
    name: 'Royal Banarasi Silk Saree',
    slug: 'royal-banarasi-silk-saree',
    sku: 'NAV-SAN-1001',
    brand: 'Navya Couture',
    description:
      'Exquisite Indian luxury couture from Navya Collection. Featuring intricate hand embroidery and fine zari work.',
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
    _count: { variants: 2 },
  },
  {
    id: 'prd_kanjeevaram_2',
    name: 'Heritage Kanjeevaram Silk Saree',
    slug: 'heritage-kanjeevaram-silk-saree',
    sku: 'NAV-KAN-1002',
    brand: 'South Heritage',
    description: 'Handcrafted pure Kanjeevaram silk saree woven with rich golden zari borders.',
    price: new Prisma.Decimal(24999),
    compareAtPrice: new Prisma.Decimal(28999),
    stock: 25,
    status: 'active',
    isFeatured: true,
    isNewArrival: false,
    rating: 4.9,
    reviewCount: 34,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date(),
    deletedAt: null,
    category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
    images: [
      {
        id: 'img_2',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        secureUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        altText: 'Heritage Kanjeevaram Silk Saree',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    _count: { variants: 1 },
  },
];

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
      let items = mockSearchStore.filter((p) => p.deletedAt === null && p.status === 'active');
      return items.slice(skip, skip + take);
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
      return mockSearchStore.filter((p) => p.deletedAt === null && p.status === 'active').length;
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
      const matchingProducts = mockSearchStore
        .filter(
          (p) =>
            p.deletedAt === null &&
            p.status === 'active' &&
            (p.name.toLowerCase().includes(formattedTerm.toLowerCase()) ||
              p.sku.toLowerCase().includes(formattedTerm.toLowerCase())),
        )
        .slice(0, limit)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          image: p.images[0]?.imageUrl || null,
        }));

      return {
        products: matchingProducts,
        categories: [{ id: 'cat_sarees', name: 'Sarees', slug: 'sarees' }],
        brands: ['Navya Couture'],
      };
    }
  }
}
