import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

export class CategoryRepository {
  /**
   * Queries categories with pagination, search, status, and featured filters.
   */
  static async findMany(
    where: Prisma.CategoryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.CategoryOrderByWithRelationInput,
  ) {
    try {
      return await prisma.category.findMany({
        where: {
          ...where,
          deletedAt: null,
        },
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          icon: true,
          parentId: true,
          displayOrder: true,
          isFeatured: true,
          status: true,
          updatedAt: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              products: { where: { deletedAt: null } },
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Counts total categories matching filter criteria.
   */
  static async count(where: Prisma.CategoryWhereInput): Promise<number> {
    try {
      return await prisma.category.count({
        where: {
          ...where,
          deletedAt: null,
        },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Fetches hierarchical tree structure of parent and child categories.
   */
  static async findTree() {
    try {
      return await prisma.category.findMany({
        where: {
          parentId: null,
          status: 'active',
          deletedAt: null,
        },
        orderBy: {
          displayOrder: 'asc',
        },
        include: {
          children: {
            where: {
              status: 'active',
              deletedAt: null,
            },
            orderBy: {
              displayOrder: 'asc',
            },
            include: {
              children: {
                where: {
                  status: 'active',
                  deletedAt: null,
                },
                orderBy: {
                  displayOrder: 'asc',
                },
              },
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetches active featured categories.
   */
  static async findFeatured() {
    try {
      return await prisma.category.findMany({
        where: {
          isFeatured: true,
          status: 'active',
          deletedAt: null,
        },
        orderBy: {
          displayOrder: 'asc',
        },
        include: {
          _count: {
            select: {
              products: { where: { deletedAt: null } },
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Finds a single category by ID or Slug.
   */
  static async findByIdOrSlug(idOrSlug: string) {
    try {
      return await prisma.category.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          deletedAt: null,
        },
        include: {
          parent: true,
          children: {
            where: { deletedAt: null },
          },
          _count: {
            select: {
              products: { where: { deletedAt: null } },
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Checks if category has any active child categories.
   */
  static async hasActiveChildren(parentId: string): Promise<boolean> {
    try {
      const count = await prisma.category.count({
        where: {
          parentId,
          deletedAt: null,
        },
      });
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Finds category by Slug to verify uniqueness.
   */
  static async findBySlug(slug: string, excludeId?: string) {
    const formattedSlug = slug.toLowerCase();
    try {
      return await prisma.category.findFirst({
        where: {
          slug: formattedSlug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Creates a new category in Prisma PostgreSQL.
   */
  static async create(data: CreateCategoryInput, computedSlug: string) {
    try {
      return await prisma.category.create({
        data: {
          name: data.name,
          slug: computedSlug,
          description: data.description || null,
          image: data.image || null,
          icon: data.icon || null,
          parentId: data.parentId || null,
          displayOrder: data.displayOrder ?? 0,
          isFeatured: data.isFeatured ?? false,
          status: data.status ?? 'active',
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
        include: {
          parent: true,
        },
      });
    } catch (err: any) {
      throw new Error(`Failed to create category: ${err.message}`);
    }
  }

  /**
   * Updates an existing category.
   */
  static async update(id: string, data: UpdateCategoryInput, computedSlug?: string) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(computedSlug !== undefined ? { slug: computedSlug } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.image !== undefined ? { image: data.image } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
          ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
          ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
          ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
        },
        include: {
          parent: true,
          children: true,
        },
      });
    } catch {
      throw new Error(`Category ${id} not found.`);
    }
  }

  /**
   * Soft deletes a category by setting deletedAt timestamp.
   */
  static async softDelete(id: string) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'inactive',
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Restores a soft-deleted category.
   */
  static async restore(id: string) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          deletedAt: null,
          status: 'active',
        },
      });
    } catch {
      return null;
    }
  }
}
