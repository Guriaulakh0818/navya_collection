import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/categories - List live Prisma DB categories (Fast & Bulk-seeded)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    const whereCondition: any = {
      deletedAt: null,
    };

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    // 1. Fetch live categories directly in ONE fast query
    let categories = await prisma.category.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        image: true,
        description: true,
        parent: { select: { id: true, name: true } },
        _count: {
          select: { products: { where: { deletedAt: null, status: 'active' } } },
        },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    // 2. Fast Bulk Auto-Seed if DB taxonomy is empty or missing
    if (categories.length < 25 && !query) {
      const primaryItems: any[] = [];
      const subItems: any[] = [];

      for (const main of CATEGORY_TAXONOMY) {
        const matchingDefault = CATEGORIES.find((c) => c.slug === main.slug);
        primaryItems.push({
          id: main.id,
          name: main.name,
          slug: main.slug,
          image: matchingDefault?.image || null,
          description: matchingDefault?.description || `${main.name} boutique collection.`,
        });

        for (const sub of main.subCategories) {
          subItems.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: main.id,
            description: `${sub.name} in ${main.name}.`,
          });
        }
      }

      // Execute 2 fast bulk createMany queries instead of 43 slow serial upserts
      await prisma.category.createMany({
        data: primaryItems,
        skipDuplicates: true,
      });

      await prisma.category.createMany({
        data: subItems,
        skipDuplicates: true,
      });

      // Refetch full taxonomy
      categories = await prisma.category.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          image: true,
          description: true,
          parent: { select: { id: true, name: true } },
          _count: {
            select: { products: { where: { deletedAt: null, status: 'active' } } },
          },
        },
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('❌ GET Admin Categories Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/v1/admin/categories - Create new Category in Prisma DB
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Supervisor is in read-only mode.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, slug, parentId, description, imageUrl } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required.' },
        { status: 400 },
      );
    }

    const computedSlug =
      slug && slug.trim()
        ? slug.trim().toLowerCase().replace(/\s+/g, '-')
        : name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: `${computedSlug}-${Date.now().toString(36)}`,
        parentId: parentId || null,
        description: description || '',
        image: imageUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully!',
      data: newCategory,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Category Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
