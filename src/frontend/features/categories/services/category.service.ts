import { Prisma } from '@prisma/client';

import { slugify } from '@/features/products/services/product.service';
import { prisma } from '@/lib/prisma';

import { CategoryRepository } from '../repositories/category.repository';
import {
  CreateCategoryInput,
  GetCategoryQueryParams,
  UpdateCategoryInput,
} from '../schemas/category.schema';

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

export class CategoryService {
  /**
   * Creates a new category with Slug uniqueness check and Parent verification.
   */
  static async createCategory(input: CreateCategoryInput): Promise<ServiceResponse> {
    try {
      // 1. Parent Category Existence Check
      if (input.parentId) {
        const parent = await CategoryRepository.findByIdOrSlug(input.parentId);
        if (!parent) {
          return {
            success: false,
            message: `Parent category with ID '${input.parentId}' does not exist.`,
            statusCode: 400,
          };
        }
      }

      // 2. Compute and Check Slug Uniqueness
      let computedSlug = input.slug ? slugify(input.slug) : slugify(input.name);
      const existingSlug = await CategoryRepository.findBySlug(computedSlug);
      if (existingSlug) {
        computedSlug = `${computedSlug}-${Date.now().toString(36)}`;
      }

      // 3. Create Category via Repository
      const category = await CategoryRepository.create(input, computedSlug);

      return {
        success: true,
        message: 'Category created successfully.',
        statusCode: 201,
        data: category,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to create category.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches paginated, sorted, and filtered categories list.
   */
  static async getCategories(params: GetCategoryQueryParams): Promise<ServiceResponse> {
    try {
      const { page, limit, search, status, parentId, isFeatured, sortBy, sortOrder } = params;

      const skip = (page - 1) * limit;
      const where: Prisma.CategoryWhereInput = {};

      if (status) where.status = status;
      if (isFeatured !== undefined) where.isFeatured = isFeatured;
      if (parentId !== undefined) where.parentId = parentId === 'null' ? null : parentId;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: Prisma.CategoryOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [categories, total] = await Promise.all([
        CategoryRepository.findMany(where, skip, limit, orderBy),
        CategoryRepository.count(where),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        success: true,
        message: 'Categories retrieved successfully.',
        statusCode: 200,
        data: categories,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve categories.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches hierarchical tree structure of root and child categories.
   */
  static async getCategoryTree(): Promise<ServiceResponse> {
    try {
      const tree = await CategoryRepository.findTree();

      return {
        success: true,
        message: 'Category tree retrieved successfully.',
        statusCode: 200,
        data: tree,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_GET_TREE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve category tree.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches featured categories for home page display.
   */
  static async getFeaturedCategories(): Promise<ServiceResponse> {
    try {
      const featured = await CategoryRepository.findFeatured();

      return {
        success: true,
        message: 'Featured categories retrieved successfully.',
        statusCode: 200,
        data: featured,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_GET_FEATURED_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve featured categories.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches single category details by ID or Slug.
   */
  static async getCategoryByIdOrSlug(idOrSlug: string): Promise<ServiceResponse> {
    try {
      const category = await CategoryRepository.findByIdOrSlug(idOrSlug);

      if (!category) {
        return {
          success: false,
          message: `Category '${idOrSlug}' not found.`,
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Category retrieved successfully.',
        statusCode: 200,
        data: category,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_GET_BY_ID_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve category details.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing category with Circular Reference checks and Slug uniqueness.
   */
  static async updateCategory(id: string, input: UpdateCategoryInput): Promise<ServiceResponse> {
    try {
      const existingCategory = await CategoryRepository.findByIdOrSlug(id);

      if (!existingCategory) {
        return {
          success: false,
          message: `Category with ID '${id}' not found.`,
          statusCode: 404,
        };
      }

      // 1. Circular Reference & Self-Parent Prevention Check
      if (input.parentId !== undefined && input.parentId !== null) {
        if (input.parentId === id) {
          return {
            success: false,
            message: 'A category cannot be its own parent.',
            statusCode: 400,
          };
        }

        const parentCategory = await CategoryRepository.findByIdOrSlug(input.parentId);
        if (!parentCategory) {
          return {
            success: false,
            message: `Parent category with ID '${input.parentId}' does not exist.`,
            statusCode: 400,
          };
        }

        // Circular loop check (Ensure parent isn't a child of this category)
        if (parentCategory.parentId === id) {
          return {
            success: false,
            message: 'Circular parent relationship detected. Cannot set child category as parent.',
            statusCode: 400,
          };
        }
      }

      // 2. Compute and Check Slug Uniqueness if name/slug updated
      let computedSlug: string | undefined = undefined;
      if (input.slug || input.name) {
        computedSlug = input.slug ? slugify(input.slug) : slugify(input.name!);
        if (computedSlug !== existingCategory.slug) {
          const slugConflict = await CategoryRepository.findBySlug(computedSlug, id);
          if (slugConflict) {
            computedSlug = `${computedSlug}-${Date.now().toString(36)}`;
          }
        }
      }

      const updatedCategory = await CategoryRepository.update(id, input, computedSlug);

      return {
        success: true,
        message: 'Category updated successfully.',
        statusCode: 200,
        data: updatedCategory,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update category.',
        statusCode: 500,
      };
    }
  }

  /**
   * Soft deletes a category after ensuring it has no active child categories.
   */
  static async deleteCategory(id: string): Promise<ServiceResponse> {
    try {
      const existingCategory = await CategoryRepository.findByIdOrSlug(id);

      if (!existingCategory) {
        return {
          success: false,
          message: `Category with ID '${id}' not found.`,
          statusCode: 404,
        };
      }

      // Child category safety check
      const hasChildren = await CategoryRepository.hasActiveChildren(id);
      if (hasChildren) {
        return {
          success: false,
          message:
            'Cannot delete category that still has active child categories. Please reassign or delete child categories first.',
          statusCode: 400,
        };
      }

      await CategoryRepository.softDelete(id);

      return {
        success: true,
        message: 'Category deleted successfully (soft delete).',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[CATEGORY_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete category.',
        statusCode: 500,
      };
    }
  }
}
