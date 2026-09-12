import { prisma } from '@/backend/lib/prisma';
import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';

/**
 * Intelligently resolves any incoming category identifier (DB ID, slug, static taxonomy ID, or name)
 * to a guaranteed valid `Category.id` in the database.
 * If the category does not yet exist in PostgreSQL, it auto-creates it with correct parent relationships.
 * Prevents Prisma Foreign Key constraint errors (products_categoryId_fkey).
 */
export async function resolveValidCategoryId(categoryId?: string | null): Promise<string> {
  // If no categoryId provided, fallback to default category
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

  // 3. Match against Flattened Taxonomy (Leaf, Subcategory, or Parent Group)
  const flattened = getFlattenedCategoryOptions();
  const matchedFlat = flattened.find(
    (item) =>
      item.id.toLowerCase() === cleanId.toLowerCase() ||
      item.slug.toLowerCase() === cleanId.toLowerCase() ||
      item.name.toLowerCase() === cleanId.toLowerCase(),
  );

  if (matchedFlat) {
    try {
      // Check if already in DB by slug
      const existing = await prisma.category.findFirst({
        where: { slug: matchedFlat.slug, deletedAt: null },
      });
      if (existing) return existing.id;

      // Auto-ensure parent category exists if applicable
      let parentDbId: string | null = null;
      if (matchedFlat.mainGroupId) {
        const parentMain = CATEGORY_TAXONOMY.find((m) => m.id === matchedFlat.mainGroupId);
        if (parentMain) {
          const parentInDb = await prisma.category.upsert({
            where: { slug: parentMain.slug },
            create: {
              id: parentMain.id,
              name: parentMain.name,
              slug: parentMain.slug,
              description: `${parentMain.name} collection at Navya Collection.`,
            },
            update: {
              name: parentMain.name,
            },
          });
          parentDbId = parentInDb.id;
        }
      }

      // Auto-create leaf/sub category in DB
      const created = await prisma.category.create({
        data: {
          id: matchedFlat.id,
          name: matchedFlat.name,
          slug: matchedFlat.slug,
          parentId: parentDbId,
          description: `${matchedFlat.breadcrumb} collection at Navya Collection.`,
        },
      });
      return created.id;
    } catch (err) {
      console.warn('[CATEGORY_RESOLVER] DB auto-creation for taxonomy error:', err);
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

  // If database has 0 categories, auto-seed a default Women category
  const createdGeneral = await prisma.category.create({
    data: {
      name: 'Women',
      slug: 'women',
      description: 'Women fashion collection',
    },
  });

  return createdGeneral.id;
}
