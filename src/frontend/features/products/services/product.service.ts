import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductInput,
  GetProductQueryParams,
  UpdateProductInput,
} from '../schemas/product.schema';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  /**
   * Creates a new product with unique SKU, Slug generation, and Category verification.
   */
  static async createProduct(input: CreateProductInput): Promise<ServiceResponse> {
    try {
      // 1. Verify Category Existence (with graceful fallback for offline/seed mode)
      try {
        const category = await prisma.category.findUnique({
          where: { id: input.categoryId },
        });

        if (!category && process.env.NODE_ENV === 'production') {
          return {
            success: false,
            message: `Category with ID '${input.categoryId}' does not exist.`,
            statusCode: 400,
          };
        }
      } catch {
        // Fallback for offline mode
      }

      // 2. Check SKU Uniqueness
      const existingSku = await ProductRepository.findBySku(input.sku);
      if (existingSku) {
        return {
          success: false,
          message: `Product with SKU '${input.sku.toUpperCase()}' already exists.`,
          statusCode: 409,
        };
      }

      // 3. Compute and Check Slug Uniqueness
      let computedSlug = input.slug ? slugify(input.slug) : slugify(input.name);
      const existingSlug = await ProductRepository.findBySlug(computedSlug);
      if (existingSlug) {
        computedSlug = `${computedSlug}-${Date.now().toString(36)}`;
      }

      // 4. Create Product via Repository
      const product = await ProductRepository.create(input, computedSlug);

      return {
        success: true,
        message: 'Product created successfully.',
        statusCode: 201,
        data: product,
      };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to create product.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches paginated, sorted, and filtered products list.
   */
  static async getProducts(params: GetProductQueryParams): Promise<ServiceResponse> {
    try {
      const {
        page,
        limit,
        search,
        category,
        status,
        isFeatured,
        isNewArrival,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      } = params;

      const skip = (page - 1) * limit;
      const where: Prisma.ProductWhereInput = {};

      // Status filter
      if (status) {
        where.status = status;
      }

      // Featured & New Arrival filters
      if (isFeatured !== undefined) where.isFeatured = isFeatured;
      if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;

      // Category filter (support categoryId or categorySlug)
      if (category) {
        where.OR = [{ categoryId: category }, { category: { slug: category } }];
      }

      // Search filter (by Product Name or SKU)
      if (search) {
        const searchCondition: Prisma.ProductWhereInput = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        };

        if (where.OR) {
          where.AND = [{ OR: where.OR }, searchCondition];
          delete where.OR;
        } else {
          where.OR = searchCondition.OR;
        }
      }

      // Price Range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {
          ...(minPrice !== undefined ? { gte: new Prisma.Decimal(minPrice) } : {}),
          ...(maxPrice !== undefined ? { lte: new Prisma.Decimal(maxPrice) } : {}),
        };
      }

      const orderBy: Prisma.ProductOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [products, total] = await Promise.all([
        ProductRepository.findMany(where, skip, limit, orderBy),
        ProductRepository.count(where),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        success: true,
        message: 'Products retrieved successfully.',
        statusCode: 200,
        data: products,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve products.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches product details by ID or Slug.
   */
  static async getProductByIdOrSlug(idOrSlug: string): Promise<ServiceResponse> {
    try {
      const product = await ProductRepository.findByIdOrSlug(idOrSlug);

      if (!product) {
        return {
          success: false,
          message: `Product '${idOrSlug}' not found.`,
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Product retrieved successfully.',
        statusCode: 200,
        data: product,
      };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE_GET_BY_ID_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve product details.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing product.
   */
  static async updateProduct(id: string, input: UpdateProductInput): Promise<ServiceResponse> {
    try {
      const existingProduct = await ProductRepository.findByIdOrSlug(id);

      if (!existingProduct) {
        return {
          success: false,
          message: `Product with ID '${id}' not found.`,
          statusCode: 404,
        };
      }

      // Check Category if updated
      if (input.categoryId) {
        try {
          const category = await prisma.category.findUnique({
            where: { id: input.categoryId },
          });
          if (!category && process.env.NODE_ENV === 'production') {
            return {
              success: false,
              message: `Category with ID '${input.categoryId}' does not exist.`,
              statusCode: 400,
            };
          }
        } catch {
          // Ignore for offline fallback
        }
      }

      // Check SKU uniqueness if updated
      if (input.sku && input.sku.toUpperCase() !== existingProduct.sku) {
        const skuConflict = await ProductRepository.findBySku(input.sku, id);
        if (skuConflict) {
          return {
            success: false,
            message: `Product with SKU '${input.sku.toUpperCase()}' already exists.`,
            statusCode: 409,
          };
        }
      }

      // Compute and check Slug if name/slug updated
      let computedSlug: string | undefined = undefined;
      if (input.slug || input.name) {
        computedSlug = input.slug ? slugify(input.slug) : slugify(input.name!);
        if (computedSlug !== existingProduct.slug) {
          const slugConflict = await ProductRepository.findBySlug(computedSlug, id);
          if (slugConflict) {
            computedSlug = `${computedSlug}-${Date.now().toString(36)}`;
          }
        }
      }

      const updatedProduct = await ProductRepository.update(id, input, computedSlug);

      return {
        success: true,
        message: 'Product updated successfully.',
        statusCode: 200,
        data: updatedProduct,
      };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update product.',
        statusCode: 500,
      };
    }
  }

  /**
   * Soft deletes a product by setting deletedAt timestamp.
   */
  static async deleteProduct(id: string): Promise<ServiceResponse> {
    try {
      const existingProduct = await ProductRepository.findByIdOrSlug(id);

      if (!existingProduct) {
        return {
          success: false,
          message: `Product with ID '${id}' not found.`,
          statusCode: 404,
        };
      }

      await ProductRepository.softDelete(id);

      return {
        success: true,
        message: 'Product deleted successfully (soft delete).',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete product.',
        statusCode: 500,
      };
    }
  }
}
