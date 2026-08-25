import { prisma } from '@/lib/prisma';

export interface MarketplaceSearchOptions {
  q?: string;
  type?: 'all' | 'products' | 'shops' | 'categories';
  category?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export class MarketplaceSearchService {
  /**
   * Primary entry point for multi-entity marketplace search.
   * Future-ready abstraction layer for Meilisearch / Algolia / Postgres ILIKE.
   */
  static async search(options: MarketplaceSearchOptions) {
    const driver = process.env.SEARCH_DRIVER || 'postgres';

    if (driver === 'meilisearch') {
      // Future Meilisearch Driver execution
      return this.searchWithMeilisearch(options);
    }

    return this.searchWithPostgres(options);
  }

  /**
   * Postgres Full-Text & Relational ILIKE Search Driver
   */
  private static async searchWithPostgres(options: MarketplaceSearchOptions) {
    const q = (options.q || '').trim().toLowerCase();
    const type = options.type || 'all';
    const page = options.page || 1;
    const limit = options.limit || 12;
    const skip = (page - 1) * limit;
    const minPrice = options.minPrice || 0;
    const maxPrice = options.maxPrice || 1000000;
    const minRating = options.minRating || 0;

    // 1. Build Product Search Where Condition
    const productWhere: any = {
      deletedAt: null,
      status: 'active',
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      shop: {
        status: 'APPROVED',
        deletedAt: null,
      },
    };

    if (minRating > 0) {
      productWhere.rating = { gte: minRating };
    }

    if (options.shopId) {
      productWhere.shopId = options.shopId;
    }

    if (options.category && options.category !== 'all') {
      productWhere.category = {
        OR: [{ id: options.category }, { slug: options.category }],
      };
    }

    if (q) {
      productWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { fabric: { contains: q, mode: 'insensitive' } },
        { occasion: { contains: q, mode: 'insensitive' } },
        { shop: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Sorting Order
    let orderBy: any = { createdAt: 'desc' };
    if (options.sort === 'price_asc') orderBy = { price: 'asc' };
    if (options.sort === 'price_desc') orderBy = { price: 'desc' };
    if (options.sort === 'rating') orderBy = { rating: 'desc' };

    // 2. Build Shop Search Where Condition
    const shopWhere: any = {
      deletedAt: null,
      status: 'APPROVED',
    };

    if (q) {
      shopWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 3. Build Category Search Where Condition
    const categoryWhere: any = {};
    if (q) {
      categoryWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Execute Queries
    const [products, productCount, shops, categories] = await Promise.all([
      type === 'all' || type === 'products'
        ? prisma.product.findMany({
            where: productWhere,
            orderBy,
            skip,
            take: limit,
            include: {
              images: { select: { imageUrl: true }, take: 1 },
              shop: { select: { id: true, name: true, slug: true, rating: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          })
        : [],

      type === 'all' || type === 'products' ? prisma.product.count({ where: productWhere }) : 0,

      type === 'all' || type === 'shops'
        ? prisma.shop.findMany({
            where: shopWhere,
            take: 6,
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              banner: true,
              rating: true,
              reviewCount: true,
              verificationBadge: true,
              city: true,
              state: true,
              _count: { select: { products: { where: { deletedAt: null, status: 'active' } } } },
            },
          })
        : [],

      type === 'all' || type === 'categories'
        ? prisma.category.findMany({
            where: categoryWhere,
            take: 6,
            select: {
              id: true,
              name: true,
              slug: true,
              _count: { select: { products: { where: { deletedAt: null, status: 'active' } } } },
            },
          })
        : [],
    ]);

    return {
      query: q,
      products,
      shops,
      categories,
      pagination: {
        total: productCount,
        page,
        limit,
        pages: Math.ceil(productCount / limit),
      },
    };
  }

  /**
   * Fast Autocomplete & Suggestions Generator
   */
  static async getSuggestions(q: string) {
    const keyword = q.trim().toLowerCase();
    if (!keyword || keyword.length < 2) {
      return { products: [], shops: [], categories: [] };
    }

    const [products, shops, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          deletedAt: null,
          status: 'active',
          name: { contains: keyword, mode: 'insensitive' },
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: { select: { imageUrl: true }, take: 1 },
          shop: { select: { name: true } },
        },
      }),

      prisma.shop.findMany({
        where: {
          deletedAt: null,
          status: 'APPROVED',
          name: { contains: keyword, mode: 'insensitive' },
        },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          city: true,
        },
      }),

      prisma.category.findMany({
        where: {
          name: { contains: keyword, mode: 'insensitive' },
        },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ]);

    return { products, shops, categories };
  }

  /**
   * Meilisearch Driver Placeholder
   */
  private static async searchWithMeilisearch(options: MarketplaceSearchOptions) {
    // Fallback to Postgres until Meilisearch URL env is configured
    return this.searchWithPostgres(options);
  }
}
