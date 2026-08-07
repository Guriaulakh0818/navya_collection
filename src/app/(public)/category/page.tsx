import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Incremental Static Revalidation (ISR) every 60 seconds

export const metadata: Metadata = {
  title: 'Categories | Navya Collection',
  description: 'Browse all categories and shop your favorite styles at Navya Collection.',
  keywords: [
    'categories',
    'fashion',
    'clothing',
    'women wear',
    'gents wear',
    'kids wear',
    'Navya Collection',
  ],
};

export default async function CategoriesPage() {
  let dbPrimaryCategories: any[] = [];
  try {
    dbPrimaryCategories = await prisma.category.findMany({
      where: {
        parentId: null,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null, status: 'active' } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('Failed to fetch DB categories for /category page:', err);
  }

  // Combine DB categories with default accents and images
  const finalCategories =
    dbPrimaryCategories.length > 0
      ? dbPrimaryCategories.map((c, i) => {
          const matchingDefault = CATEGORIES.find((d) => d.slug === c.slug);
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || matchingDefault?.description || '',
            image: c.image || matchingDefault?.image || '',
            productCount: c._count?.products || matchingDefault?.productCount || 10,
            accent: matchingDefault?.accent || 'from-navy to-[#234b8f]',
          };
        })
      : CATEGORIES;

  const totalProducts = finalCategories.reduce(
    (sum, category) => sum + (category.productCount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
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
            Browse {finalCategories.length} primary categories with over {totalProducts}+ curated
            couture &amp; garment items across our boutique partner stores.
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
