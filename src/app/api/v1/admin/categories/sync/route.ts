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

    let createdCount = 0;
    let updatedCount = 0;

    // Cache slug -> id map for fast hierarchy linking
    const slugToIdMap = new Map<string, string>();

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
      slugToIdMap.set(group.slug, mainCat.id);
      createdCount++;

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
          slugToIdMap.set(sub.slug, subCat.id);
          createdCount++;

          // 3. Process Leaf Items (Level 3) if present
          if (sub.items && sub.items.length > 0) {
            for (const item of sub.items) {
              const leafCat = await prisma.category.upsert({
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
              slugToIdMap.set(item.slug, leafCat.id);
              createdCount++;
            }
          }
        }
      }
    }

    // 4. Process Legacy Compatibility Categories
    for (const legacy of LEGACY_CATEGORY_COMPATIBILITY) {
      const parentId = slugToIdMap.get(legacy.parentSlug) || null;
      await prisma.category.upsert({
        where: { slug: legacy.slug },
        create: {
          id: legacy.id,
          name: legacy.name,
          slug: legacy.slug,
          parentId,
          description: `${legacy.name} collection (Legacy compatibility).`,
        },
        update: {
          name: legacy.name,
          parentId: parentId || undefined,
        },
      });
      createdCount++;
    }

    const totalDbCategories = await prisma.category.count({ where: { deletedAt: null } });

    return NextResponse.json({
      success: true,
      message: `Taxonomy synced successfully! Total DB categories: ${totalDbCategories}`,
      totalDbCategories,
      syncedCount: createdCount,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Categories Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
