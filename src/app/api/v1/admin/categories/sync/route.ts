import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/v1/admin/categories/sync - Bulk Synchronize all categories into Prisma DB
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 1. Process Main Groups (Level 1)
    for (const group of CATEGORY_TAXONOMY) {
      const mainCat = await prisma.category.upsert({
        where: { slug: group.slug },
        create: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: `${group.name} category collection.`,
        },
        update: {
          name: group.name,
        },
      });

      // 2. Process Sections & SubCategories (Level 2)
      for (const section of group.sections) {
        for (const sub of section.subCategories) {
          const subCat = await prisma.category.upsert({
            where: { slug: sub.slug },
            create: {
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              parentId: mainCat.id,
              description: `${sub.name} in ${group.name} > ${section.title}.`,
            },
            update: {
              name: sub.name,
              parentId: mainCat.id,
            },
          });
          createdCount++;

          // 3. Process Leaf Items (Level 3) if present
          if (sub.items && sub.items.length > 0) {
            for (const item of sub.items) {
              await prisma.category.upsert({
                where: { slug: item.slug },
                create: {
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  parentId: subCat.id,
                  description: `${item.name} in ${group.name} > ${section.title} > ${sub.name}.`,
                },
                update: {
                  name: item.name,
                  parentId: subCat.id,
                },
              });
              createdCount++;
            }
          }
        }
      }
    }

    const totalDbCategories = await prisma.category.count({ where: { deletedAt: null } });

    return NextResponse.json({
      success: true,
      message: `Taxonomy synced successfully! Total DB categories: ${totalDbCategories}`,
      totalDbCategories,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Categories Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
