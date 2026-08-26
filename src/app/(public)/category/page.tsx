import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Incremental Static Revalidation (ISR) every 60 seconds

export const metadata: Metadata = {
  title: 'Explore All Categories | Navya Collection',
  description:
    'Browse all categories, sarees, suits, kurtis, gents wear, and kids collection at Navya Collection.',
  keywords: [
    'categories',
    'sarees',
    'suits',
    'kurtis',
    'lehengas',
    'gents wear',
    'kids wear',
    'Navya Collection',
  ],
};

export default async function CategoriesPage() {
  let dbCategories: any[] = [];
  try {
    dbCategories = await prisma.category.findMany({
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
  } catch (err) {
    console.error('Failed to fetch DB categories for /category page:', err);
  }

  // Map real product counts to static categories list
  const finalCategories = CATEGORIES.map((cat) => {
    const matchedDb = dbCategories.find(
      (c) => c.slug === cat.slug || c.name.toLowerCase() === cat.name.toLowerCase(),
    );
    const count = matchedDb?._count?.products ?? 0;
    return {
      ...cat,
      productCount: count,
    };
  });

  const totalApprovedProducts = finalCategories.reduce(
    (sum, category) => sum + (category.productCount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <section className="mx-auto max-w-[1440px] px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-navy font-bold">
            Explore All Categories
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-600 font-medium">
            Browse {finalCategories.length} curated categories across boutique partner stores.
            Select any category to view available products.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {finalCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
