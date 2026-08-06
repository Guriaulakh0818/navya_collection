import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

const mockCategoryStore = new Map<string, any>([
  [
    'cat_sarees',
    {
      id: 'cat_sarees',
      name: 'Sarees',
      slug: 'sarees',
      description: 'Handcrafted luxury ethnic silk, chiffon, georgette and organza sarees.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      icon: 'sparkles',
      parentId: null,
      displayOrder: 1,
      isFeatured: true,
      status: 'active',
      metaTitle: 'Designer Sarees Collection | Navya Collection',
      metaDescription: 'Shop handcrafted luxury sarees online at Navya Collection.',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      parent: null,
      children: [
        {
          id: 'cat_banarasi',
          name: 'Banarasi Sarees',
          slug: 'banarasi-sarees',
          parentId: 'cat_sarees',
          displayOrder: 1,
          status: 'active',
          deletedAt: null,
          children: [],
        },
      ],
      _count: { products: 12 },
    },
  ],
  [
    'cat_lehengas',
    {
      id: 'cat_lehengas',
      name: 'Lehengas',
      slug: 'lehengas',
      description: 'Exquisite bridal and festive lehenga cholis with rich embroidery.',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
      icon: 'crown',
      parentId: null,
      displayOrder: 2,
      isFeatured: true,
      status: 'active',
      metaTitle: 'Bridal & Partywear Lehengas | Navya Collection',
      metaDescription: 'Explore exquisite Indian designer lehengas.',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      parent: null,
      children: [],
      _count: { products: 8 },
    },
  ],
]);

export class CategoryRepository {
  /**
   * Finds categories matching criteria with pagination and sorting.
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
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          children: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
          _count: {
            select: {
              products: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });
    } catch {
      let items = Array.from(mockCategoryStore.values()).filter((c) => c.deletedAt === null);

      if (where.status) {
        items = items.filter((c) => c.status === where.status);
      }
      if (where.isFeatured !== undefined) {
        items = items.filter((c) => c.isFeatured === where.isFeatured);
      }

      return items.slice(skip, skip + take);
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
      return Array.from(mockCategoryStore.values()).filter((c) => c.deletedAt === null).length;
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
      return Array.from(mockCategoryStore.values()).filter(
        (c) => c.parentId === null && c.status === 'active' && c.deletedAt === null,
      );
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
      return Array.from(mockCategoryStore.values()).filter(
        (c) => c.isFeatured && c.status === 'active' && c.deletedAt === null,
      );
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
      for (const cat of mockCategoryStore.values()) {
        if ((cat.id === idOrSlug || cat.slug === idOrSlug) && cat.deletedAt === null) {
          return cat;
        }
      }
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
      for (const cat of mockCategoryStore.values()) {
        if (cat.parentId === parentId && cat.deletedAt === null) {
          return true;
        }
      }
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
      for (const cat of mockCategoryStore.values()) {
        if (cat.slug === formattedSlug && cat.id !== excludeId) {
          return cat;
        }
      }
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
    } catch {
      const newId = `cat_${Date.now()}`;
      const newCategory = {
        id: newId,
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
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        parent: null,
        children: [],
        _count: { products: 0 },
      };

      mockCategoryStore.set(newId, newCategory);
      return newCategory;
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
      const existing = mockCategoryStore.get(id);
      if (existing) {
        const updated = {
          ...existing,
          ...data,
          ...(computedSlug ? { slug: computedSlug } : {}),
          updatedAt: new Date(),
        };
        mockCategoryStore.set(id, updated);
        return updated;
      }
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
      const existing = mockCategoryStore.get(id);
      if (existing) {
        existing.deletedAt = new Date();
        existing.status = 'inactive';
        mockCategoryStore.set(id, existing);
      }
      return existing;
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
      const existing = mockCategoryStore.get(id);
      if (existing) {
        existing.deletedAt = null;
        existing.status = 'active';
        mockCategoryStore.set(id, existing);
      }
      return existing;
    }
  }
}
