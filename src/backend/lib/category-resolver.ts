import { prisma } from '@/backend/lib/prisma';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';

/**
 * Intelligently resolves any incoming category identifier (DB ID, slug, static taxonomy ID, or name)
 * to a guaranteed valid `Category.id` in the database.
 * Prevents Prisma Foreign Key constraint errors (products_categoryId_fkey).
 */
export async function resolveValidCategoryId(categoryId?: string | null): Promise<string> {
  // If no categoryId provided, fallback to default category search
  if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
    return await getFallbackCategoryId();
  }

  const cleanId = categoryId.trim();

  // 1. Direct Primary Key Lookup in DB
  try {
    const dbCatById = await prisma.category.findFirst({
      where: { id: cleanId, deletedAt: null },
    });
    if (dbCatById) {
      return dbCatById.id;
    }
  } catch (err) {
    console.warn('[CATEGORY_RESOLVER] DB lookup by ID error:', err);
  }

  // 2. Direct Slug Lookup in DB
  try {
    const dbCatBySlug = await prisma.category.findFirst({
      where: { slug: cleanId.toLowerCase(), deletedAt: null },
    });
    if (dbCatBySlug) {
      return dbCatBySlug.id;
    }
  } catch (err) {
    console.warn('[CATEGORY_RESOLVER] DB lookup by slug error:', err);
  }

  // 3. Static Taxonomy ID to Slug Mapping
  let taxonomySlug: string | null = null;
  for (const main of CATEGORY_TAXONOMY) {
    if (main.id === cleanId) {
      taxonomySlug = main.slug;
      break;
    }
    for (const sub of main.subCategories) {
      if (sub.id === cleanId) {
        taxonomySlug = sub.slug;
        break;
      }
    }
    if (taxonomySlug) break;
  }

  if (taxonomySlug) {
    try {
      const dbCatByTaxonomySlug = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: taxonomySlug.toLowerCase() },
            { slug: { contains: taxonomySlug.toLowerCase() } },
          ],
          deletedAt: null,
        },
      });
      if (dbCatByTaxonomySlug) {
        return dbCatByTaxonomySlug.id;
      }
    } catch (err) {
      console.warn('[CATEGORY_RESOLVER] DB lookup by taxonomy slug error:', err);
    }
  }

  // 4. Keyword / Partial Match in DB Name or Slug
  const keyword = cleanId.replace(/^cat_/, '').replace(/_/g, '-').toLowerCase();
  try {
    const dbCatByKeyword = await prisma.category.findFirst({
      where: {
        OR: [{ slug: { contains: keyword } }, { name: { contains: keyword, mode: 'insensitive' } }],
        deletedAt: null,
      },
    });
    if (dbCatByKeyword) {
      return dbCatByKeyword.id;
    }
  } catch (err) {
    console.warn('[CATEGORY_RESOLVER] DB lookup by keyword error:', err);
  }

  // 5. Fallback to First Active Category in Database
  return await getFallbackCategoryId();
}

async function getFallbackCategoryId(): Promise<string> {
  const firstCat = await prisma.category.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  if (firstCat) {
    return firstCat.id;
  }

  // If database has 0 categories, auto-seed a default General category
  const createdGeneral = await prisma.category.create({
    data: {
      name: 'General',
      slug: 'general',
      description: 'General product category',
    },
  });

  return createdGeneral.id;
}
