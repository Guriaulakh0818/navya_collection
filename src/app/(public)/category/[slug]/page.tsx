import { Metadata } from 'next';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryBanner } from '@/features/categories/components/CategoryBanner';
import {
  CATEGORIES,
  DEFAULT_PAGE_SIZE,
  findCategoryBySlug,
} from '@/features/categories/constants/category.constants';
import { ProductGrid } from '@/features/products/components/ProductGrid';

import { CategoryPagination } from './CategoryPagination';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);

  return {
    title: `${category.name} | Navya Collection`,
    description: category.description || `Shop ${category.name} online at Navya Collection.`,
    keywords: [category.name, 'fashion', 'clothing', 'Navya Collection'],
    openGraph: {
      title: `${category.name} | Navya Collection`,
      description: category.description || `Shop ${category.name} online at Navya Collection.`,
      type: 'website',
      url: `https://navyacollection.store/category/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);

  let dbProducts: any[] = [];
  try {
    const { prisma } = await import('@/lib/prisma');

    // Extract search keywords from slug
    const searchKeywords = slug
      .toLowerCase()
      .split('-')
      .filter((w) => w !== 'wear' && w !== 'collection' && w !== 'and' && w.length > 2);

    dbProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        shop: {
          status: 'APPROVED',
          deletedAt: null,
        },
        OR: [
          { categoryId: category.id },
          { category: { slug: category.slug } },
          { category: { parentId: category.id } },
          ...(searchKeywords.length > 0
            ? searchKeywords.map((kw) => ({
                OR: [
                  { name: { contains: kw, mode: 'insensitive' as const } },
                  { description: { contains: kw, mode: 'insensitive' as const } },
                  { category: { name: { contains: kw, mode: 'insensitive' as const } } },
                ],
              }))
            : []),
        ],
      },
      include: {
        images: { select: { imageUrl: true }, take: 1 },
        shop: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Failed to query category products:', err);
  }

  const allProducts = dbProducts;
  const totalPages = Math.max(1, Math.ceil(allProducts.length / DEFAULT_PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/category' },
          { label: category.name },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <CategoryBanner category={category} />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-slate-600 font-medium">
            Showing <span className="font-bold text-navy">{allProducts.length}</span> products in{' '}
            <span className="font-bold text-navy">{category.name}</span>
          </p>
          <a
            href="/category"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-navy hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Explore All Categories
          </a>
        </div>

        <ProductGrid products={allProducts} />

        {totalPages > 1 && <CategoryPagination page={1} totalPages={totalPages} />}
      </div>
    </div>
  );
}
