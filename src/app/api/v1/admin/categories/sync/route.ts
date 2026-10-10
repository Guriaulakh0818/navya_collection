import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow maximum available runtime on Vercel

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

interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
}

// POST /api/v1/admin/categories/sync - Hierarchically synchronized categories in 3 safe passes
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

    // 1. Fetch all existing categories once
    const existingCategories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const existingById = new Set(existingCategories.map((c) => c.id));
    const existingBySlug = new Set(existingCategories.map((c) => c.slug));

    // Helper to safely upsert a single category
    const syncItem = async (item: FlatCategory) => {
      try {
        if (existingById.has(item.id)) {
          await prisma.category.update({
            where: { id: item.id },
            data: {
              name: item.name,
              slug: item.slug,
              parentId: item.parentId || undefined,
              deletedAt: null,
            },
          });
        } else if (existingBySlug.has(item.slug)) {
          await prisma.category.update({
            where: { slug: item.slug },
            data: {
              name: item.name,
              parentId: item.parentId || undefined,
              deletedAt: null,
            },
          });
        } else {
          await prisma.category.create({
            data: {
              id: item.id,
              name: item.name,
              slug: item.slug,
              parentId: item.parentId || null,
              description: item.description,
              status: 'active',
            },
          });
          existingById.add(item.id);
          existingBySlug.add(item.slug);
        }
      } catch (err: any) {
        console.warn(`Category sync warning for ${item.slug}:`, err.message);
      }
    };

    // PASS 1: Main Groups (Level 1 - parentId: null)
    const level1: FlatCategory[] = [];
    const slugToIdMap = new Map<string, string>();

    for (const group of CATEGORY_TAXONOMY) {
      level1.push({
        id: group.id,
        name: group.name,
        slug: group.slug,
        parentId: null,
        description: `${group.name} category collection.`,
      });
      slugToIdMap.set(group.slug, group.id);
      slugToIdMap.set(group.id, group.id);
    }
    await Promise.all(level1.map(syncItem));

    // PASS 2: SubCategories (Level 2 - parentId: mainGroup.id)
    const level2: FlatCategory[] = [];
    for (const group of CATEGORY_TAXONOMY) {
      for (const section of group.sections) {
        for (const sub of section.subCategories) {
          level2.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: group.id,
            description: `${sub.name} in ${group.name} > ${section.title}.`,
          });
          slugToIdMap.set(sub.slug, sub.id);
          slugToIdMap.set(sub.id, sub.id);
        }
      }
    }
    // Run Level 2 in concurrent chunks of 15
    for (let i = 0; i < level2.length; i += 15) {
      await Promise.all(level2.slice(i, i + 15).map(syncItem));
    }

    // PASS 3: Leaf Items (Level 3 - parentId: subCategory.id)
    const level3: FlatCategory[] = [];
    for (const group of CATEGORY_TAXONOMY) {
      for (const section of group.sections) {
        for (const sub of section.subCategories) {
          if (sub.items && sub.items.length > 0) {
            for (const item of sub.items) {
              level3.push({
                id: item.id,
                name: item.name,
                slug: item.slug,
                parentId: sub.id,
                description: `${item.name} in ${group.name} > ${section.title} > ${sub.name}.`,
              });
              slugToIdMap.set(item.slug, item.id);
              slugToIdMap.set(item.id, item.id);
            }
          }
        }
      }
    }
    for (let i = 0; i < level3.length; i += 15) {
      await Promise.all(level3.slice(i, i + 15).map(syncItem));
    }

    // PASS 4: Legacy Compatibility
    const level4: FlatCategory[] = [];
    for (const legacy of LEGACY_CATEGORY_COMPATIBILITY) {
      const parentId = slugToIdMap.get(legacy.parentSlug) || null;
      level4.push({
        id: legacy.id,
        name: legacy.name,
        slug: legacy.slug,
        parentId,
        description: `${legacy.name} collection (Legacy compatibility).`,
      });
    }
    await Promise.all(level4.map(syncItem));

    const totalDbCategories = await prisma.category.count({ where: { deletedAt: null } });

    return NextResponse.json({
      success: true,
      message: `Taxonomy synced successfully! Total DB categories: ${totalDbCategories}`,
      totalDbCategories,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      legacyCount: level4.length,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Categories Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
