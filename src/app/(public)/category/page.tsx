import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryExplorer } from '@/features/categories/components/CategoryExplorer';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import {
  generateCategoryDirectoryJsonLd,
  generateCategoryDirectoryMetadata,
  JsonLd,
} from '@/frontend/features/seo';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Incremental Static Revalidation (ISR) every 60 seconds

export const metadata: Metadata = generateCategoryDirectoryMetadata();

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ group?: string; tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const groupParam = resolvedParams.group || resolvedParams.tab;
  const initialActiveId = groupParam
    ? groupParam.startsWith('group_')
      ? groupParam
      : `group_${groupParam}`
    : 'group_spotlight';

  const dbCategoryCounts: Record<string, number> = {};
  let structuredCategories: Array<{ name: string; slug: string; image?: string }> = [];

  try {
    const dbCategories = await prisma.category.findMany({
      where: {
        deletedAt: null,
        status: 'active',
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
                status: 'active',
                shop: { status: 'APPROVED', deletedAt: null },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const catMap = new Map<
      string,
      { id: string; slug: string; parentId: string | null; count: number }
    >();
    for (const cat of dbCategories) {
      catMap.set(cat.id, {
        id: cat.id,
        slug: cat.slug,
        parentId: cat.parentId,
        count: cat._count?.products ?? 0,
      });
    }

    // Propagate child counts up to parents and grandparents
    const aggregatedCounts: Record<string, number> = {};
    for (const [, cat] of catMap.entries()) {
      aggregatedCounts[cat.slug] = (aggregatedCounts[cat.slug] || 0) + cat.count;

      let currParentId = cat.parentId;
      while (currParentId && catMap.has(currParentId)) {
        const parent = catMap.get(currParentId)!;
        aggregatedCounts[parent.slug] = (aggregatedCounts[parent.slug] || 0) + cat.count;
        currParentId = parent.parentId;
      }
    }

    // Also populate spotlights & umbrella slugs
    const totalApproved = Object.values(catMap).reduce((sum, c) => sum + c.count, 0);
    aggregatedCounts['spotlight'] = totalApproved;
    aggregatedCounts['new-season'] = totalApproved;
    aggregatedCounts['trending'] = totalApproved;
    aggregatedCounts['best-sellers'] = totalApproved;
    aggregatedCounts['top-rated'] = totalApproved;

    // Women kurta sets count to women-kurtas
    if (aggregatedCounts['women-kurta-sets']) {
      aggregatedCounts['women-kurtas'] =
        (aggregatedCounts['women-kurtas'] || 0) + aggregatedCounts['women-kurta-sets'];
    }
    // Boys ethnic count to kids-ethnic-wear
    if (aggregatedCounts['boys-ethnic-wear']) {
      aggregatedCounts['kids-ethnic-wear'] =
        (aggregatedCounts['kids-ethnic-wear'] || 0) + aggregatedCounts['boys-ethnic-wear'];
    }
    // All kids fashion gets kids total
    if (aggregatedCounts['kids']) {
      aggregatedCounts['all-kids-fashion'] = aggregatedCounts['kids'];
    }
    // All men clothing gets men total
    if (aggregatedCounts['men']) {
      aggregatedCounts['all-men-clothing'] = aggregatedCounts['men'];
      aggregatedCounts['men-clothing'] = aggregatedCounts['men'];
    }
    // All women clothing gets women total
    if (aggregatedCounts['women']) {
      aggregatedCounts['all-women-clothing'] = aggregatedCounts['women'];
      aggregatedCounts['women-clothing'] = aggregatedCounts['women'];
    }

    Object.assign(dbCategoryCounts, aggregatedCounts);

    if (dbCategories.length > 0) {
      structuredCategories = dbCategories.map((c) => ({
        name: c.name,
        slug: c.slug,
        image: c.image || undefined,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch DB categories for /category page:', err);
  }

  // Fallback structured data if DB is empty during revalidation
  if (structuredCategories.length === 0) {
    structuredCategories = CATEGORIES.slice(0, 12).map((c) => ({
      name: c.name,
      slug: c.slug,
      image: c.image || undefined,
    }));
  }

  const directoryJsonLd = generateCategoryDirectoryJsonLd(structuredCategories);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Category Directory Schema.org Structured Data */}
      <JsonLd data={directoryJsonLd} />

      <div className="bg-white border-b border-slate-200/80">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'All Categories' }]}
          className="mx-auto max-w-7xl px-4 md:px-6 py-2.5"
        />
      </div>

      <CategoryExplorer initialActiveId={initialActiveId} dbCategoryCounts={dbCategoryCounts} />
    </div>
  );
}
