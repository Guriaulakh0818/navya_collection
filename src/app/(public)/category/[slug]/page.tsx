import { Metadata } from 'next';
import Link from 'next/link';

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

    // Determine gender filters if applicable
    const normalized = slug.toLowerCase().trim();
    const isMen = normalized === 'men' || normalized.startsWith('men-');
    const isWomen = normalized === 'women' || normalized.startsWith('women-');
    const isKids =
      normalized === 'kids' ||
      normalized.startsWith('kids-') ||
      normalized.startsWith('baby-') ||
      normalized.startsWith('boys-') ||
      normalized.startsWith('girls-');

    // Build targeted OR conditions
    const orConditions: any[] = [
      { categoryId: category.id },
      { category: { slug: category.slug } },
      { category: { slug: normalized } },
      { category: { parentId: category.id } },
      { metaKeywords: { contains: category.id, mode: 'insensitive' as const } },
      { metaKeywords: { contains: category.slug, mode: 'insensitive' as const } },
      { metaKeywords: { contains: normalized, mode: 'insensitive' as const } },
    ];

    if (isMen && normalized === 'men') {
      orConditions.push({ gender: { equals: 'men', mode: 'insensitive' as const } });
    } else if (isWomen && normalized === 'women') {
      orConditions.push({ gender: { equals: 'women', mode: 'insensitive' as const } });
    } else if (isKids && normalized === 'kids') {
      orConditions.push({ gender: { equals: 'kids', mode: 'insensitive' as const } });
    }

    // Specific category keyword extraction
    const cleanKeywords = normalized
      .replace(/^(men-|women-|kids-)/, '')
      .split('-')
      .filter((w) => w !== 'wear' && w !== 'collection' && w !== 'and' && w.length > 2);

    if (cleanKeywords.length > 0) {
      orConditions.push(
        ...cleanKeywords.map((kw) => ({
          OR: [
            { name: { contains: kw, mode: 'insensitive' as const } },
            { category: { name: { contains: kw, mode: 'insensitive' as const } } },
          ],
        })),
      );
    }

    dbProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        shop: {
          status: 'APPROVED',
          deletedAt: null,
        },
        OR: orConditions,
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

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/category' },
  ];

  if (category.parentName && category.parentSlug) {
    breadcrumbItems.push({
      label: category.parentName,
      href: `/category/${category.parentSlug}`,
    });
  }

  breadcrumbItems.push({ label: category.name });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="bg-white border-b border-slate-200/80">
        <Breadcrumb items={breadcrumbItems} className="mx-auto max-w-[1440px] px-4 md:px-6 py-3" />
      </div>

      <CategoryBanner category={category} />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-6 sm:py-8 space-y-6">
        {/* Subcategories Quick Filter Pills (if present) */}
        {category.subCategories && category.subCategories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-navy">
                Browse {category.name} Sub-Categories
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {category.subCategories.map((sub) => {
                const isActive = sub.slug === slug;
                return (
                  <Link
                    key={sub.id}
                    href={`/category/${sub.slug}`}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border shadow-2xs ${
                      isActive
                        ? 'bg-navy text-white border-navy shadow-xs scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-500 hover:text-amber-600'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {sub.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950">
                        {sub.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Header & Product Count */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Showing <span className="font-bold text-navy">{allProducts.length}</span> products in{' '}
            <span className="font-extrabold text-navy">{category.name}</span>
          </p>
          <Link
            href="/category"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-slate-100 transition-colors shadow-2xs"
          >
            All Categories →
          </Link>
        </div>

        {/* Product Grid or Empty State */}
        {allProducts.length > 0 ? (
          <>
            <ProductGrid products={allProducts} />
            {totalPages > 1 && <CategoryPagination page={1} totalPages={totalPages} />}
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-xs my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold mx-auto shadow-xs">
              🛍️
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-extrabold text-navy">
                No products in {category.name} yet
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Our partner boutique merchants and verified artisans are curating and adding new
                items daily. Check back soon or explore other trending fashion categories!
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/category"
                className="px-4 py-2 rounded-full bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs"
              >
                Browse All Categories
              </Link>
              <Link
                href="/shop"
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
