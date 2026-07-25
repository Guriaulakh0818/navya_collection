import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { CATEGORIES } from '@/features/categories/constants/category.constants';

export const metadata: Metadata = {
  title: 'Categories | Navya Collection',
  description: 'Browse all categories and shop your favorite styles at Navya Collection.',
  keywords: ['categories', 'fashion', 'clothing', 'gents', 'kids', 'Navya Collection'],
};

const totalProducts = CATEGORIES.reduce((sum, category) => sum + (category.productCount || 0), 0);

export default function CategoriesPage() {
  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <section className="mx-auto max-w-[1440px] px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-navy">All Categories</h1>
          <p className="mt-2 text-sm text-slate-600">
            Explore {CATEGORIES.length} categories with {totalProducts} products.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
