import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryBanner } from '@/features/categories/components/CategoryBanner';
import { CATEGORIES, DEFAULT_PAGE_SIZE } from '@/features/categories/constants/category.constants';
import type { Category } from '@/features/categories/types/category.types';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import type { Product } from '@/features/products/types/product.types';

import { CategoryPagination } from './CategoryPagination';

const MOCK_PRODUCTS_PER_CATEGORY = 35;

function generateMockProducts(category: Category): Product[] {
  return Array.from({ length: MOCK_PRODUCTS_PER_CATEGORY }).map((_, i): Product => ({
    id: `${category.slug}-${i + 1}`,
    name: `${category.name} Product ${i + 1}`,
    slug: `${category.slug}-product-${i + 1}`,
    description: `Premium ${category.name.toLowerCase()} product with excellent craftsmanship.`,
    price: 599 + (i % 10) * 120,
    compareAtPrice: [1199, 1499, 1799, 1999][i % 4] as number | undefined,
    images: [],
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
    },
    categoryId: category.id,
    status: 'active',
    stock: 10,
    rating: 4 + (i % 2) * 0.5,
    reviewCount: 20 + i * 5,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found | Navya Collection',
      description: 'This category does not exist.',
    };
  }

  return {
    title: `${category.name} | Navya Collection`,
    description: category.description || `Shop ${category.name} online at Navya Collection.`,
    keywords: [category.name, 'fashion', 'clothing', 'Navya Collection'],
    openGraph: {
      title: `${category.name} | Navya Collection`,
      description: category.description || `Shop ${category.name} online at Navya Collection.`,
      type: 'website',
      url: `https://navyacollection.com/category/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const allProducts = generateMockProducts(category);
  const totalPages = Math.max(1, Math.ceil(allProducts.length / DEFAULT_PAGE_SIZE));

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/category' },
          { label: category.name },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <CategoryBanner category={category} />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {allProducts.length} products in{' '}
            <span className="font-semibold text-navy">{category.name}</span>
          </p>
          <div className="hidden md:flex items-center gap-2">
            <a
              href="/category"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Back to Categories
            </a>
          </div>
        </div>

        <ProductGrid products={allProducts} />

        {totalPages > 1 && <CategoryPagination page={1} totalPages={totalPages} />}
      </div>
    </div>
  );
}
