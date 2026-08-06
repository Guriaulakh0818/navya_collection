import { Prisma } from '@prisma/client';

import { SearchRepository } from '../repositories/search.repository';
import { ProductSearchQueryParams, SearchSuggestionsQueryParams } from '../schemas/search.schema';

export interface SearchResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class SearchService {
  /**
   * Performs full-text keyword search, filtering, sorting, and pagination across active catalog.
   */
  static async searchProducts(params: ProductSearchQueryParams): Promise<SearchResponse> {
    try {
      const { q, page, limit, sort, category, brand, status, featured, minPrice, maxPrice } =
        params;

      const skip = (page - 1) * limit;
      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
        status: 'active', // Public security rule: strictly active only
      };

      // 1. Keyword search (partial, case-insensitive across Name, SKU, Brand, Slug, Description, Category Name)
      if (q && q.trim().length > 0) {
        const searchTerm = q.trim();
        const keywordConditions: Prisma.ProductWhereInput[] = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ];

        where.OR = keywordConditions;
      }

      // 2. Category Filter (by ID or Slug)
      if (category) {
        const categoryFilter: Prisma.ProductWhereInput = {
          OR: [{ categoryId: category }, { category: { slug: category } }],
        };

        if (where.OR) {
          where.AND = [{ OR: where.OR }, categoryFilter];
          delete where.OR;
        } else {
          where.OR = categoryFilter.OR;
        }
      }

      // 3. Brand Filter
      if (brand) {
        where.brand = { equals: brand, mode: 'insensitive' };
      }

      // 4. Featured Filter
      if (featured !== undefined) {
        where.isFeatured = featured;
      }

      // 5. Price Range Filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {
          ...(minPrice !== undefined ? { gte: new Prisma.Decimal(minPrice) } : {}),
          ...(maxPrice !== undefined ? { lte: new Prisma.Decimal(maxPrice) } : {}),
        };
      }

      // 6. Mapping Sorting Options
      const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];

      switch (sort) {
        case 'oldest':
          orderBy.push({ createdAt: 'asc' });
          break;
        case 'price_asc':
          orderBy.push({ price: 'asc' });
          break;
        case 'price_desc':
          orderBy.push({ price: 'desc' });
          break;
        case 'name_asc':
          orderBy.push({ name: 'asc' });
          break;
        case 'name_desc':
          orderBy.push({ name: 'desc' });
          break;
        case 'rating_desc':
        case 'best_selling':
          orderBy.push({ rating: 'desc' }, { reviewCount: 'desc' });
          break;
        case 'newest':
        default:
          orderBy.push({ createdAt: 'desc' });
          break;
      }

      const [products, total] = await Promise.all([
        SearchRepository.searchProducts(where, skip, limit, orderBy),
        SearchRepository.countSearchResults(where),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        success: true,
        message:
          total > 0
            ? 'Search results retrieved successfully.'
            : 'No products found matching query.',
        statusCode: 200,
        data: products,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error: any) {
      console.error('[SEARCH_SERVICE_QUERY_ERROR]', error);
      return {
        success: false,
        message: 'Failed to perform product search.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches search suggestions for product names, categories, and brands.
   */
  static async getSuggestions(params: SearchSuggestionsQueryParams): Promise<SearchResponse> {
    try {
      const suggestions = await SearchRepository.getSuggestions(params.q, params.limit);

      return {
        success: true,
        message: 'Suggestions retrieved successfully.',
        statusCode: 200,
        data: suggestions,
      };
    } catch (error: any) {
      console.error('[SEARCH_SERVICE_SUGGESTIONS_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve search suggestions.',
        statusCode: 500,
      };
    }
  }
}
