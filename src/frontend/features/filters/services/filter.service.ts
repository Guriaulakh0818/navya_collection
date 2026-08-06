import { Prisma } from '@prisma/client';

import { FilterRepository } from '../repositories/filter.repository';
import { ProductFilterQueryParams } from '../schemas/filter.schema';

export interface FilterResponse<T = any> {
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

export class FilterService {
  /**
   * Filters active product catalog by multiple simultaneous criteria, sorting, and pagination.
   */
  static async filterProducts(params: ProductFilterQueryParams): Promise<FilterResponse> {
    try {
      const {
        q,
        category,
        subcategory,
        brand,
        gender,
        ageGroup,
        size,
        color,
        fabric,
        minPrice,
        maxPrice,
        rating,
        inStock,
        featured,
        newArrivals,
        bestSellers,
        sort,
        page,
        limit,
      } = params;

      const skip = (page - 1) * limit;
      const whereConditions: Prisma.ProductWhereInput[] = [];

      // Security rule: Strictly active products only
      whereConditions.push({ status: 'active', deletedAt: null });

      // 1. Keyword search (Name, SKU, Brand, Slug, Description, Category Name)
      if (q && q.trim().length > 0) {
        const searchTerm = q.trim();
        whereConditions.push({
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        });
      }

      // 2. Category & Subcategory Filter
      const catTarget = subcategory || category;
      if (catTarget) {
        const catList = catTarget
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        whereConditions.push({
          OR: [
            { categoryId: { in: catList } },
            { category: { slug: { in: catList } } },
            { category: { parentId: { in: catList } } },
          ],
        });
      }

      // 3. Brand Filter
      if (brand) {
        const brandList = brand
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean);
        whereConditions.push({
          brand: { in: brandList, mode: 'insensitive' },
        });
      }

      // 4. Gender Filter
      if (gender) {
        const genderList = gender
          .split(',')
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean);
        whereConditions.push({
          gender: { in: genderList, mode: 'insensitive' },
        });
      }

      // 5. Age Group Filter
      if (ageGroup) {
        const ageList = ageGroup
          .split(',')
          .map((a) => a.trim().toLowerCase())
          .filter(Boolean);
        whereConditions.push({
          ageGroup: { in: ageList, mode: 'insensitive' },
        });
      }

      // 6. Fabric Filter
      if (fabric) {
        const fabricList = fabric
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean);
        whereConditions.push({
          fabric: { in: fabricList, mode: 'insensitive' },
        });
      }

      // 7. Size & Color Variant Filter
      const variantConditions: Prisma.ProductVariantWhereInput = {
        deletedAt: null,
        status: 'active',
      };

      let hasVariantFilter = false;

      if (size) {
        const sizeList = size
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        variantConditions.size = { in: sizeList, mode: 'insensitive' };
        hasVariantFilter = true;
      }

      if (color) {
        const colorList = color
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        variantConditions.color = { in: colorList, mode: 'insensitive' };
        hasVariantFilter = true;
      }

      if (hasVariantFilter) {
        whereConditions.push({
          variants: {
            some: variantConditions,
          },
        });
      }

      // 8. Price Range Filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        whereConditions.push({
          price: {
            ...(minPrice !== undefined ? { gte: new Prisma.Decimal(minPrice) } : {}),
            ...(maxPrice !== undefined ? { lte: new Prisma.Decimal(maxPrice) } : {}),
          },
        });
      }

      // 9. Minimum Rating Filter
      if (rating !== undefined) {
        whereConditions.push({
          rating: { gte: rating },
        });
      }

      // 10. Availability Filter
      if (inStock === true) {
        whereConditions.push({
          stock: { gt: 0 },
        });
      }

      // 11. Featured Filter
      if (featured === true) {
        whereConditions.push({
          isFeatured: true,
        });
      }

      // 12. New Arrivals Filter
      if (newArrivals === true) {
        whereConditions.push({
          isNewArrival: true,
        });
      }

      // 13. Best Sellers Filter
      if (bestSellers === true) {
        whereConditions.push({
          rating: { gte: 4.5 },
          reviewCount: { gte: 10 },
        });
      }

      const where: Prisma.ProductWhereInput = { AND: whereConditions };

      // 14. Sort Mapping
      const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];

      switch (sort) {
        case 'oldest':
          orderBy.push({ createdAt: 'asc' });
          break;
        case 'price-asc':
        case 'price_asc':
          orderBy.push({ price: 'asc' });
          break;
        case 'price-desc':
        case 'price_desc':
          orderBy.push({ price: 'desc' });
          break;
        case 'highest-discount':
        case 'discount_desc':
          orderBy.push({ price: 'asc' });
          break;
        case 'highest-rated':
        case 'rating_desc':
          orderBy.push({ rating: 'desc' }, { reviewCount: 'desc' });
          break;
        case 'name-asc':
        case 'name_asc':
          orderBy.push({ name: 'asc' });
          break;
        case 'name-desc':
        case 'name_desc':
          orderBy.push({ name: 'desc' });
          break;
        case 'best-selling':
        case 'best_selling':
          orderBy.push({ reviewCount: 'desc' }, { rating: 'desc' });
          break;
        case 'newest':
        default:
          orderBy.push({ createdAt: 'desc' });
          break;
      }

      const [products, total] = await Promise.all([
        FilterRepository.filterProducts(where, skip, limit, orderBy),
        FilterRepository.countFilterProducts(where),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        success: true,
        message:
          total > 0
            ? 'Filtered products retrieved successfully.'
            : 'No products matched the filter criteria.',
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
      console.error('[FILTER_SERVICE_QUERY_ERROR]', error);
      return {
        success: false,
        message: 'Failed to perform product filter query.',
        statusCode: 500,
      };
    }
  }

  /**
   * Returns dynamic available filter metadata for Product Listing Page (PLP) sidebars.
   */
  static async getFilterOptions(): Promise<FilterResponse> {
    try {
      const options = await FilterRepository.getFilterOptions();

      return {
        success: true,
        message: 'Filter options retrieved successfully.',
        statusCode: 200,
        data: options,
      };
    } catch (error: any) {
      console.error('[FILTER_SERVICE_OPTIONS_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve filter options.',
        statusCode: 500,
      };
    }
  }
}
