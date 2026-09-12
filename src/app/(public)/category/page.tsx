import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryExplorer } from '@/features/categories/components/CategoryExplorer';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Incremental Static Revalidation (ISR) every 60 seconds

export const metadata: Metadata = {
  title: 'All Fashion Categories | Navya Collection',
  description:
    'Explore Indian ethnic wear, western wear, sarees, lehengas, kurtis, footwear, jewellery, and essentials with our curated category explorer.',
  keywords: [
    'fashion categories',
    'sarees',
    'suits',
    'kurtis',
    'lehengas',
    'mens clothing',
    'womens fashion',
    'kids wear',
    'jewellery',
    'Navya Collection',
  ],
};

export default async function CategoriesPage() {
  const dbCategoryCounts: Record<string, number> = {};

  try {
    const dbCategories = await prisma.category.findMany({
      where: {
        deletedAt: null,
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
      orderBy: { name: 'asc' },
    });

    for (const cat of dbCategories) {
      dbCategoryCounts[cat.slug] = cat._count?.products ?? 0;
    }
  } catch (err) {
    console.error('Failed to fetch DB categories for /category page:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-white border-b border-slate-200/80">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'All Categories' }]}
          className="mx-auto max-w-7xl px-4 md:px-6 py-2.5"
        />
      </div>

      <CategoryExplorer initialActiveId="group_spotlight" dbCategoryCounts={dbCategoryCounts} />
    </div>
  );
}
