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

    if (category.name) {
      orConditions.push(
        { category: { name: { contains: category.name, mode: 'insensitive' as const } } },
        { name: { contains: category.name, mode: 'insensitive' as const } },
      );
    }

    if (isMen && normalized === 'men') {
      orConditions.push({ gender: { equals: 'men', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'men', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'shirt', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 't-shirt', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'kurta', mode: 'insensitive' as const } });
    } else if (isWomen && normalized === 'women') {
      orConditions.push({ gender: { equals: 'women', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'women', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'saree', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'lehenga', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'kurti', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'dress', mode: 'insensitive' as const } });
    } else if (isKids && normalized === 'kids') {
      orConditions.push({ gender: { equals: 'kids', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'kid', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'baby', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'boy', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'girl', mode: 'insensitive' as const } });
      orConditions.push({ name: { contains: 'frock', mode: 'insensitive' as const } });
    }

    // Dynamic Price Deals & Curations Matching
    if (normalized.includes('under-499') || normalized.includes('budget-finds')) {
      orConditions.push({ price: { lte: 499 } });
    }
    if (normalized.includes('under-999')) {
      orConditions.push({ price: { lte: 999 } });
    }
    if (normalized.includes('50-off') || normalized.includes('50-percent-off')) {
      orConditions.push({ compareAtPrice: { gt: 0 } });
    }

    // Curations & Special Spotlight Pages
    const isFestivals =
      normalized.includes('festivals-of-india') ||
      normalized.includes('festive') ||
      normalized.includes('wedding');

    const isTrendyStreet =
      normalized.includes('trendy-street') ||
      normalized.includes('gen-z-fashion') ||
      normalized.includes('streetwear');

    const isKoreanStore =
      normalized.includes('korean-store') ||
      normalized.includes('aesthetic') ||
      normalized.includes('minimal');

    const isSportsStore =
      normalized.includes('sports-store') ||
      normalized.includes('activewear') ||
      normalized.includes('athleisure');

    const isGeneralSpotlight =
      normalized.includes('trending') ||
      normalized.includes('best-sellers') ||
      normalized.includes('top-rated') ||
      normalized.includes('featured') ||
      normalized.includes('spotlight') ||
      normalized.includes('new-season') ||
      normalized.includes('new-arrivals') ||
      normalized.includes('new-on-navya') ||
      normalized.includes('shop-your-vibe') ||
      normalized.includes('new-listings') ||
      normalized === 'new';

    if (isFestivals) {
      orConditions.push(
        { metaKeywords: { contains: 'spot_festivals_india', mode: 'insensitive' as const } },
        { name: { contains: 'saree', mode: 'insensitive' as const } },
        { name: { contains: 'lehenga', mode: 'insensitive' as const } },
        { name: { contains: 'kurta', mode: 'insensitive' as const } },
        { name: { contains: 'kurti', mode: 'insensitive' as const } },
        { name: { contains: 'suit', mode: 'insensitive' as const } },
        { name: { contains: 'sherwani', mode: 'insensitive' as const } },
        { name: { contains: 'jewellery', mode: 'insensitive' as const } },
        { name: { contains: 'kundan', mode: 'insensitive' as const } },
      );
    } else if (isTrendyStreet) {
      orConditions.push(
        { metaKeywords: { contains: 'spot_trendy_street', mode: 'insensitive' as const } },
        { metaKeywords: { contains: 'spot_genz_fashion', mode: 'insensitive' as const } },
        { name: { contains: 't-shirt', mode: 'insensitive' as const } },
        { name: { contains: 'tshirt', mode: 'insensitive' as const } },
        { name: { contains: 'cargo', mode: 'insensitive' as const } },
        { name: { contains: 'graphic', mode: 'insensitive' as const } },
        { name: { contains: 'oversized', mode: 'insensitive' as const } },
        { name: { contains: 'hoodie', mode: 'insensitive' as const } },
        { name: { contains: 'denim', mode: 'insensitive' as const } },
        { name: { contains: 'jeans', mode: 'insensitive' as const } },
      );
    } else if (isKoreanStore) {
      orConditions.push(
        { metaKeywords: { contains: 'spot_korean_store', mode: 'insensitive' as const } },
        { name: { contains: 'shirt', mode: 'insensitive' as const } },
        { name: { contains: 'coord', mode: 'insensitive' as const } },
        { name: { contains: 'dress', mode: 'insensitive' as const } },
        { name: { contains: 'top', mode: 'insensitive' as const } },
        { name: { contains: 'oversized', mode: 'insensitive' as const } },
      );
    } else if (isSportsStore) {
      orConditions.push(
        { metaKeywords: { contains: 'spot_sports_store', mode: 'insensitive' as const } },
        { name: { contains: 'polo', mode: 'insensitive' as const } },
        { name: { contains: 'track', mode: 'insensitive' as const } },
        { name: { contains: 'jogger', mode: 'insensitive' as const } },
        { name: { contains: 'hoodie', mode: 'insensitive' as const } },
        { name: { contains: 't-shirt', mode: 'insensitive' as const } },
      );
    } else if (isGeneralSpotlight) {
      if (isMen) {
        orConditions.push({ gender: { equals: 'men', mode: 'insensitive' as const } });
        orConditions.push({
          metaKeywords: { contains: 'group_men', mode: 'insensitive' as const },
        });
        orConditions.push({
          metaKeywords: { contains: 'cat_men_new_arrivals', mode: 'insensitive' as const },
        });
      } else if (isWomen) {
        orConditions.push({ gender: { equals: 'women', mode: 'insensitive' as const } });
        orConditions.push({
          metaKeywords: { contains: 'group_women', mode: 'insensitive' as const },
        });
        orConditions.push({
          metaKeywords: { contains: 'cat_women_new_arrivals', mode: 'insensitive' as const },
        });
      } else if (isKids) {
        orConditions.push({ gender: { equals: 'kids', mode: 'insensitive' as const } });
        orConditions.push({
          metaKeywords: { contains: 'group_kids', mode: 'insensitive' as const },
        });
        orConditions.push({
          metaKeywords: { contains: 'cat_kids_new_arrivals', mode: 'insensitive' as const },
        });
      } else {
        orConditions.push({ isNewArrival: true });
        orConditions.push({ isFeatured: true });
        orConditions.push({ status: 'active' });
      }
    }

    // Specific category keyword extraction with strict distinctions
    const categoryLower = category.name.toLowerCase();
    const isTShirt =
      normalized.includes('t-shirt') ||
      normalized.includes('tshirt') ||
      categoryLower.includes('t-shirt') ||
      categoryLower.includes('tshirt') ||
      normalized.includes('polo') ||
      categoryLower.includes('polo');

    const isSweater =
      normalized.includes('sweater') ||
      categoryLower.includes('sweater') ||
      normalized.includes('cardigan') ||
      categoryLower.includes('cardigan');

    const isSweatshirt = normalized.includes('sweatshirt') || categoryLower.includes('sweatshirt');

    const isShirt =
      !isTShirt &&
      !isSweater &&
      !isSweatshirt &&
      (normalized.includes('shirt') || categoryLower.includes('shirt'));

    if (categoryLower.includes('saree') || normalized.includes('saree')) {
      orConditions.push(
        { name: { contains: 'saree', mode: 'insensitive' as const } },
        { name: { contains: 'sari', mode: 'insensitive' as const } },
        { name: { contains: 'banarasi', mode: 'insensitive' as const } },
        { name: { contains: 'kanjeevaram', mode: 'insensitive' as const } },
      );
    }

    if (isShirt) {
      orConditions.push(
        { name: { contains: 'shirt', mode: 'insensitive' as const } },
        { name: { contains: 'oxford', mode: 'insensitive' as const } },
        { name: { contains: 'button down', mode: 'insensitive' as const } },
      );
    } else if (isTShirt) {
      orConditions.push(
        { name: { contains: 't-shirt', mode: 'insensitive' as const } },
        { name: { contains: 'tshirt', mode: 'insensitive' as const } },
        { name: { contains: 'polo', mode: 'insensitive' as const } },
        { name: { contains: 'tee', mode: 'insensitive' as const } },
      );
    } else if (isSweater) {
      orConditions.push(
        { name: { contains: 'sweater', mode: 'insensitive' as const } },
        { name: { contains: 'cardigan', mode: 'insensitive' as const } },
        { name: { contains: 'woolen', mode: 'insensitive' as const } },
        { name: { contains: 'pullover', mode: 'insensitive' as const } },
      );
    } else if (isSweatshirt) {
      orConditions.push(
        { name: { contains: 'sweatshirt', mode: 'insensitive' as const } },
        { name: { contains: 'fleece', mode: 'insensitive' as const } },
      );
    }

    if (
      categoryLower.includes('kurta') ||
      categoryLower.includes('kurti') ||
      normalized.includes('kurta')
    ) {
      orConditions.push(
        { name: { contains: 'kurta', mode: 'insensitive' as const } },
        { name: { contains: 'kurti', mode: 'insensitive' as const } },
        { name: { contains: 'anarkali', mode: 'insensitive' as const } },
        { name: { contains: 'suit', mode: 'insensitive' as const } },
      );
    }
    if (categoryLower.includes('lehenga') || normalized.includes('lehenga')) {
      orConditions.push(
        { name: { contains: 'lehenga', mode: 'insensitive' as const } },
        { name: { contains: 'choli', mode: 'insensitive' as const } },
        { name: { contains: 'ghagra', mode: 'insensitive' as const } },
      );
    }
    if (
      categoryLower.includes('jeans') ||
      normalized.includes('jeans') ||
      normalized.includes('denim')
    ) {
      orConditions.push(
        { name: { contains: 'jean', mode: 'insensitive' as const } },
        { name: { contains: 'denim', mode: 'insensitive' as const } },
      );
    }
    if (
      categoryLower.includes('dress') ||
      categoryLower.includes('frock') ||
      normalized.includes('dress')
    ) {
      orConditions.push(
        { name: { contains: 'dress', mode: 'insensitive' as const } },
        { name: { contains: 'frock', mode: 'insensitive' as const } },
        { name: { contains: 'gown', mode: 'insensitive' as const } },
      );
    }

    let rawProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        OR: orConditions,
      },
      include: {
        images: {
          select: { id: true, imageUrl: true, isPrimary: true, altText: true },
          orderBy: { isPrimary: 'desc' },
        },
        shop: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Zero-Empty Guarantee: If curation category has 0 items, backfill with active relevant store items
    if (
      rawProducts.length === 0 &&
      (isGeneralSpotlight || isFestivals || isTrendyStreet || isKoreanStore || isSportsStore)
    ) {
      const fallbackWhere: any = { status: 'active', deletedAt: null };
      if (isMen) fallbackWhere.gender = { equals: 'men', mode: 'insensitive' };
      if (isWomen) fallbackWhere.gender = { equals: 'women', mode: 'insensitive' };
      if (isKids) fallbackWhere.gender = { equals: 'kids', mode: 'insensitive' };

      rawProducts = await prisma.product.findMany({
        where: fallbackWhere,
        take: 24,
        include: {
          images: {
            select: { id: true, imageUrl: true, isPrimary: true, altText: true },
            orderBy: { isPrimary: 'desc' },
          },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // High-Precision in-memory filter to guarantee shirts vs t-shirts vs sweaters never mix
    const filteredProducts = rawProducts.filter((p) => {
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const pText = `${pName} ${pDesc}`;

      if (isShirt) {
        // Must NOT be a T-Shirt, Sweatshirt, Hoodie or Sweater
        const hasTeeOrSweat =
          /\b(t-?shirt|tshirts?|tees?|sweatshirts?|hoodies?|sweaters?|cardigans?)\b/i.test(pName);
        if (hasTeeOrSweat) return false;
      } else if (isTShirt && !normalized.includes('polo')) {
        // If viewing pure T-Shirts, exclude formal shirts
        if (/\b(formal shirt|button down|dress shirt)\b/i.test(pName)) return false;
      } else if (isSweater) {
        // If viewing Sweaters, exclude plain t-shirts and shirts
        if (
          /\b(t-?shirt|tshirt|tee|polo)\b/i.test(pName) &&
          !/\b(sweater|woolen|cardigan|knit)\b/i.test(pText)
        )
          return false;
      }
      return true;
    });

    dbProducts = filteredProducts.map((p) => {
      const primary = p.images.find((img) => img.isPrimary) || p.images[0];
      return {
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        images: p.images.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          alt: img.altText || p.name,
        })),
        imageUrl: primary?.imageUrl,
      };
    });
  } catch (err) {
    console.error('Failed to query category products:', err);
  }

  const allProducts = dbProducts;
  const totalPages = Math.max(1, Math.ceil(allProducts.length / DEFAULT_PAGE_SIZE));

  // Derive the matching parent category group for explorer back link
  let groupParam = 'spotlight';
  const normSlug = slug.toLowerCase();
  const normParent = (category.parentSlug || '').toLowerCase();
  const normName = (category.name || '').toLowerCase();

  if (
    normSlug.startsWith('women') ||
    normParent.startsWith('women') ||
    normSlug.includes('saree') ||
    normSlug.includes('lehenga') ||
    normSlug.includes('kurti') ||
    normSlug.includes('dupatt') ||
    normSlug.includes('gown') ||
    normName.includes('women') ||
    normName.includes('saree') ||
    normName.includes('lehenga') ||
    normName.includes('kurti')
  ) {
    groupParam = 'women';
  } else if (
    normSlug.startsWith('men') ||
    normParent.startsWith('men') ||
    normSlug.includes('shirt') ||
    normSlug.includes('polo') ||
    normSlug.includes('kurta') ||
    normSlug.includes('blazer') ||
    normName.includes('men') ||
    normName.includes('shirt') ||
    normName.includes('kurta')
  ) {
    groupParam = 'men';
  } else if (
    normSlug.startsWith('kids') ||
    normParent.startsWith('kids') ||
    normSlug.startsWith('baby') ||
    normSlug.startsWith('boy') ||
    normSlug.startsWith('girl') ||
    normName.includes('kid') ||
    normName.includes('baby') ||
    normName.includes('boy') ||
    normName.includes('girl')
  ) {
    groupParam = 'kids';
  }

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: `/category?group=${groupParam}` },
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
                {category.parentName
                  ? `Explore More ${category.parentName} Categories`
                  : `Browse ${category.name} Sub-Categories`}
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
            href={`/category?group=${groupParam}`}
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
