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

    for (const cat of dbCategories) {
      dbCategoryCounts[cat.slug] = cat._count?.products ?? 0;
    }

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
