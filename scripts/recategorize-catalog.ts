import fs from 'fs';
import { PrismaClient } from '@prisma/client';

import { resolveValidCategoryId } from '../src/backend/lib/category-resolver';
import { autoCategorizeProduct } from '../src/shared/utils/auto-categorizer';

let dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/navya_collection_local';
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) dbUrl = match[1].replace('localhost', '127.0.0.1');
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

export async function recategorizeAll() {
  console.log('🚀 Starting Comprehensive Catalog Re-Categorization...');

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  console.log(`📦 Found ${products.length} products to evaluate.`);

  let updatedCount = 0;
  const counts = { men: 0, women: 0, kids: 0 };

  for (const prod of products) {
    const autoRes = autoCategorizeProduct({
      name: prod.name,
      description: prod.description || undefined,
      price: Number(prod.price || 0),
      compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : undefined,
      fabric: prod.fabric || undefined,
      occasion: prod.occasion || undefined,
    });

    const resolvedGender =
      autoRes.departmentGroup === 'group_kids'
        ? 'kids'
        : autoRes.departmentGroup === 'group_women'
          ? 'women'
          : 'men';

    const validCategoryId = await resolveValidCategoryId(autoRes.primaryCategoryId);

    const catTags = autoRes.categoryIds
      .map((c) => c.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean);
    const existingTags = prod.metaKeywords
      ? prod.metaKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(
            (s) =>
              !s.startsWith('cat_') &&
              !s.startsWith('group_') &&
              !s.startsWith('spot_') &&
              !s.startsWith('sec_') &&
              s.length > 0,
          )
      : [];
    const combinedKeywords = Array.from(new Set([...catTags, ...existingTags])).join(', ');

    await prisma.product.update({
      where: { id: prod.id },
      data: {
        categoryId: validCategoryId,
        gender: resolvedGender,
        metaKeywords: combinedKeywords,
        isNewArrival: true,
        isFeatured: true,
      },
    });

    counts[resolvedGender]++;
    updatedCount++;

    const updatedCat = await prisma.category.findUnique({
      where: { id: validCategoryId },
      select: { name: true, slug: true },
    });

    console.log(
      `✓ "${prod.name}"\n    -> [${resolvedGender.toUpperCase()}] ${updatedCat?.name || validCategoryId} (${updatedCat?.slug})`,
    );
  }

  console.log(`\n🎉 Successfully re-categorized ${updatedCount} products!`);
  console.log(`📊 Breakdown: Men: ${counts.men}, Women: ${counts.women}, Kids: ${counts.kids}`);
}

recategorizeAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
