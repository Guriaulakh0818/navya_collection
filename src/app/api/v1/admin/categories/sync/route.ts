import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

// Canonical legacy mappings to ensure backward compatibility and total 218 categories
const LEGACY_CATEGORY_COMPATIBILITY = [
  { id: 'cmui9v6rb000ycuzefxurww7l', slug: 'sarees', name: 'Sarees', parentSlug: 'women-sarees' },
  { id: 'cmui9v6rr0010cuzehhs49xw6', slug: 'lehengas', name: 'Lehengas', parentSlug: 'women-lehengas' },
  { id: 'cmui9v6s30014cuzewda7d129', slug: 'dupattas-stoles', name: 'Dupattas & Stoles', parentSlug: 'women-scarves-stoles' },
  { id: 'cmui9v6sv0018cuzexk2rge1t', slug: 'bridal-lehengas', name: 'Bridal Lehengas', parentSlug: 'women-lehengas' },
  { id: 'cmui9v6ti001ccuzenx2ctp3q', slug: 'phulkari-dupattas', name: 'Phulkari Dupattas', parentSlug: 'women-scarves-stoles' },
  { id: 'cmui9v6ro000zcuzeqqzzm9dz', slug: 'anarkalis-suits', name: 'Anarkalis & Suits', parentSlug: 'women-kurta-sets' },
  { id: 'cmui9v6t6001acuzevi24pb7e', slug: 'silk-anarkali-sets', name: 'Silk Anarkali Sets', parentSlug: 'women-kurta-sets' },
  { id: 'cmui9v6te001bcuze09wypy1i', slug: 'designer-kurta-pajamas', name: 'Designer Kurta Pajamas', parentSlug: 'men-kurta-sets' },
  { id: 'cmui9v6t10019cuze2n9z572b', slug: 'partywear-lehengas', name: 'Partywear Lehengas', parentSlug: 'women-lehengas' },
  { id: 'cmui9v6s00013cuze41kxj2qn', slug: 'gents-mens-couture', name: 'Gents & Mens Couture', parentSlug: 'men' },
  { id: 'cmui9v6sn0017cuze685jkn0s', slug: 'chanderi-sarees', name: 'Chanderi Sarees', parentSlug: 'women-sarees' },
  { id: 'cmui9v6sg0016cuzenbff4el8', slug: 'kanjeevaram-silk-sarees', name: 'Kanjeevaram Silk Sarees', parentSlug: 'women-sarees' },
  { id: 'cmui9v6rt0011cuzeuiveopab', slug: 'kurtis-tunics', name: 'Kurtis & Tunics', parentSlug: 'women-kurtis' },
  { id: 'cmui9v6rx0012cuzeihshxn9d', slug: 'indo-western-fusion', name: 'Indo-Western & Fusion', parentSlug: 'women-ethnic-dresses' },
  { id: 'cmui9v6s60015cuzeelhvrghm', slug: 'banarasi-sarees', name: 'Banarasi Sarees', parentSlug: 'women-sarees' },
];

/**
 * Resilient upsert helper that prevents unique constraint conflicts on either id or slug
 */
async function resilientCategoryUpsert(data: {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string;
}): Promise<string> {
  const existingById = await prisma.category.findUnique({
    where: { id: data.id },
  });

  if (existingById) {
    const updated = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId || undefined,
        description: data.description || existingById.description,
        deletedAt: null,
      },
    });
    return updated.id;
  }

  const existingBySlug = await prisma.category.findUnique({
    where: { slug: data.slug },
  });

  if (existingBySlug) {
    const updated = await prisma.category.update({
      where: { id: existingBySlug.id },
      data: {
        name: data.name,
        parentId: data.parentId || undefined,
        description: data.description || existingBySlug.description,
        deletedAt: null,
      },
    });
    return updated.id;
  }

  const created = await prisma.category.create({
    data: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      description: data.description || `${data.name} collection.`,
      status: 'active',
    },
  });
  return created.id;
}

// POST /api/v1/admin/categories/sync - Bulk Synchronize all categories into Prisma DB
export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get('authorization') || request.headers.get('x-sync-secret');
    const isSecretAuthorized =
      authHeader &&
      (authHeader === INTERNAL_SYNC_SECRET || authHeader === `Bearer ${INTERNAL_SYNC_SECRET}`);

    const admin = await getAdminUser();
    const isAdminAuthorized =
      admin && ['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase());

    if (!isAdminAuthorized && !isSecretAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access or valid sync secret required.' },
        { status: 403 },
      );
    }

    let syncedCount = 0;
    const slugToIdMap = new Map<string, string>();

    // 1. Process Main Groups (Level 1)
    for (const group of CATEGORY_TAXONOMY) {
      const mainCatId = await resilientCategoryUpsert({
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: `${group.name} category collection.`,
      });
      slugToIdMap.set(group.slug, mainCatId);
      slugToIdMap.set(group.id, mainCatId);
      syncedCount++;

      // 2. Process Sections & SubCategories (Level 2)
      for (const section of group.sections) {
        for (const sub of section.subCategories) {
          const subCatId = await resilientCategoryUpsert({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: mainCatId,
            description: `${sub.name} in ${group.name} > ${section.title}.`,
          });
          slugToIdMap.set(sub.slug, subCatId);
          slugToIdMap.set(sub.id, subCatId);
          syncedCount++;

          // 3. Process Leaf Items (Level 3) if present
          if (sub.items && sub.items.length > 0) {
            for (const item of sub.items) {
              const leafCatId = await resilientCategoryUpsert({
                id: item.id,
                name: item.name,
                slug: item.slug,
                parentId: subCatId,
                description: `${item.name} in ${group.name} > ${section.title} > ${sub.name}.`,
              });
              slugToIdMap.set(item.slug, leafCatId);
              slugToIdMap.set(item.id, leafCatId);
              syncedCount++;
            }
          }
        }
      }
    }

    // 4. Process Legacy Compatibility Categories
    for (const legacy of LEGACY_CATEGORY_COMPATIBILITY) {
      const parentId = slugToIdMap.get(legacy.parentSlug) || null;
      await resilientCategoryUpsert({
        id: legacy.id,
        name: legacy.name,
        slug: legacy.slug,
        parentId,
        description: `${legacy.name} collection (Legacy compatibility).`,
      });
      syncedCount++;
    }

    const totalDbCategories = await prisma.category.count({ where: { deletedAt: null } });

    return NextResponse.json({
      success: true,
      message: `Taxonomy synced successfully! Total DB categories: ${totalDbCategories}`,
      totalDbCategories,
      syncedCount,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Categories Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
