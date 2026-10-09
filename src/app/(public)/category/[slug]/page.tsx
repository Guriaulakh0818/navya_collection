import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CategoryBanner } from '@/features/categories/components/CategoryBanner';
import {
  CATEGORIES,
  DEFAULT_PAGE_SIZE,
  findCategoryBySlug,
} from '@/features/categories/constants/category.constants';
import { CategoryFilteredView } from '@/frontend/features/categories/components/CategoryFilteredView';
import {
  generateCategoryJsonLdSchemas,
  generateCategoryMetadata,
  JsonLd,
} from '@/frontend/features/seo';

const CATEGORY_ALIAS_MAP: Record<string, string> = {
  sarees: 'women-sarees',
  'banarasi-sarees': 'women-sarees',
  'kanjeevaram-silk-sarees': 'women-sarees',
  'chanderi-sarees': 'women-sarees',
  lehengas: 'women-lehengas',
  'bridal-lehengas': 'women-lehengas',
  'partywear-lehengas': 'women-lehengas',
  kurtis: 'women-kurtas',
  'kurtis-tunics': 'women-kurtas',
  'anarkalis-suits': 'women-kurta-sets',
  'silk-anarkali-sets': 'women-kurta-sets',
  'salwar-suits': 'women-kurta-sets',
  suits: 'women-kurta-sets',
  dresses: 'women-dresses',
  'phulkari-dupattas': 'women-scarves-stoles',
  'dupattas-stoles': 'women-scarves-stoles',
  'gents-mens-couture': 'men',
  'designer-kurta-pajamas': 'men-kurta-sets',
  'indo-western-fusion': 'women-indian-wear',
  shirts: 'men-shirts',
  't-shirts': 'men-t-shirts',
  jeans: 'men-jeans',
  chinos: 'men-chinos',
  'track-pants': 'men-track-pants',
  blazers: 'men-blazers',
  watches: 'men-watches',
  'boys-clothing': 'boys-fashion',
  'girls-clothing': 'girls-fashion',
  'teen-trends': 'teens-fashion',
  'women-handbags': 'women-bags',
  handbags: 'women-bags',
  clutches: 'women-bags',
  'women-winter-outerwear': 'women-jackets',
};

async function getDescendantCategoryIds(prisma: any, rootCategoryId: string): Promise<string[]> {
  const matchingIds = new Set<string>([rootCategoryId]);

  const level2 = await prisma.category.findMany({
    where: { parentId: rootCategoryId, deletedAt: null },
    select: { id: true },
  });
  const level2Ids = level2.map((c: any) => c.id);
  level2Ids.forEach((id: string) => matchingIds.add(id));

  if (level2Ids.length > 0) {
    const level3 = await prisma.category.findMany({
      where: { parentId: { in: level2Ids }, deletedAt: null },
      select: { id: true },
    });
    const level3Ids = level3.map((c: any) => c.id);
    level3Ids.forEach((id: string) => matchingIds.add(id));

    if (level3Ids.length > 0) {
      const level4 = await prisma.category.findMany({
        where: { parentId: { in: level3Ids }, deletedAt: null },
        select: { id: true },
      });
      level4.forEach((c: any) => matchingIds.add(c.id));
    }
  }

  return Array.from(matchingIds);
}

async function buildCategoryConditions(
  prisma: any,
  cleanSlug: string,
  category: any,
): Promise<{ orConditions: any[]; andConditions: any[] }> {
  const isMen =
    cleanSlug === 'men' ||
    cleanSlug.startsWith('men-') ||
    cleanSlug === 'all-men-clothing' ||
    cleanSlug === 'men-clothing' ||
    category?.id === 'group_men' ||
    category?.parentId === 'group_men';

  const isWomen =
    cleanSlug === 'women' ||
    cleanSlug.startsWith('women-') ||
    cleanSlug === 'all-women-clothing' ||
    cleanSlug === 'women-clothing' ||
    category?.id === 'group_women' ||
    category?.parentId === 'group_women';

  const isKids =
    cleanSlug === 'kids' ||
    cleanSlug.startsWith('kids-') ||
    cleanSlug.startsWith('baby-') ||
    cleanSlug.startsWith('boys-') ||
    cleanSlug.startsWith('girls-') ||
    cleanSlug.startsWith('teen') ||
    cleanSlug === 'all-kids-fashion' ||
    category?.id === 'group_kids' ||
    category?.parentId === 'group_kids';

  const matchingIds = new Set<string>();
  if (category?.id) {
    const descendants = await getDescendantCategoryIds(prisma, category.id);
    descendants.forEach((id) => matchingIds.add(id));
  }

  // Cross-category intelligent mappings for seamless catalog browsing
  if (cleanSlug === 'all-kids-fashion' || cleanSlug === 'kids') {
    const kidsDescendants = await getDescendantCategoryIds(prisma, 'group_kids');
    kidsDescendants.forEach((id) => matchingIds.add(id));
  }
  if (cleanSlug === 'all-men-clothing' || cleanSlug === 'men-clothing') {
    const menDescendants = await getDescendantCategoryIds(prisma, 'group_men');
    menDescendants.forEach((id) => matchingIds.add(id));
  }
  if (cleanSlug === 'all-women-clothing' || cleanSlug === 'women-clothing') {
    const womenDescendants = await getDescendantCategoryIds(prisma, 'group_women');
    womenDescendants.forEach((id) => matchingIds.add(id));
  }
  if (cleanSlug === 'kids-ethnic-wear') {
    matchingIds.add('cat_boys_ethnic');
    matchingIds.add('cat_girls_ethnic');
    matchingIds.add('cat_kids_ethnic_wear');
  }
  if (cleanSlug === 'women-kurtas' || cleanSlug === 'kurtis' || cleanSlug === 'kurtis-tunics') {
    matchingIds.add('cat_women_kurtas');
    matchingIds.add('cat_women_kurta_sets');
  }
  if (cleanSlug === 'women-bags' || cleanSlug === 'handbags') {
    matchingIds.add('cat_women_bags');
    matchingIds.add('cat_women_handbags');
    matchingIds.add('cat_women_clutches');
    matchingIds.add('cat_women_sling_bags');
    matchingIds.add('cat_women_tote_bags');
  }

  const orConditions: any[] = [];
  const andConditions: any[] = [];

  if (matchingIds.size > 0) {
    orConditions.push({ categoryId: { in: Array.from(matchingIds) } });
  }

  // Include direct slug & category relations as fallback
  if (category?.slug) {
    orConditions.push({ category: { slug: category.slug } });
  }
  if (cleanSlug && cleanSlug !== category?.slug) {
    orConditions.push({ category: { slug: cleanSlug } });
  }

  // Dynamic Price Deals & Curations Matching (Only for curated hubs)
  if (cleanSlug.includes('budget-finds') || cleanSlug.includes('under-999')) {
    orConditions.push({ price: { lte: 999 } });
  } else if (cleanSlug.includes('under-499')) {
    orConditions.push({ price: { lte: 499 } });
  }
  if (cleanSlug.includes('50-off') || cleanSlug.includes('50-percent-off')) {
    orConditions.push({ compareAtPrice: { gt: 0 } });
  }

  // Curations & Special Spotlight Pages
  const isFestivals =
    cleanSlug.includes('festivals-of-india') ||
    cleanSlug.includes('festive') ||
    cleanSlug.includes('wedding');

  const isTrendyStreet =
    cleanSlug.includes('trendy-street') ||
    cleanSlug.includes('gen-z-fashion') ||
    cleanSlug.includes('streetwear');

  const isKoreanStore =
    cleanSlug.includes('korean-store') ||
    cleanSlug.includes('aesthetic') ||
    cleanSlug.includes('minimal');

  const isSportsStore =
    cleanSlug.includes('sports-store') ||
    cleanSlug.includes('activewear') ||
    cleanSlug.includes('athleisure');

  const isGeneralSpotlight =
    cleanSlug.includes('trending') ||
    cleanSlug.includes('best-sellers') ||
    cleanSlug.includes('top-rated') ||
    cleanSlug.includes('featured') ||
    cleanSlug.includes('spotlight') ||
    cleanSlug.includes('new-season') ||
    cleanSlug.includes('new-arrivals') ||
    cleanSlug.includes('new-on-navya') ||
    cleanSlug.includes('shop-your-vibe') ||
    cleanSlug.includes('new-listings') ||
    cleanSlug === 'new';

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
  } else if (isGeneralSpotlight && !isMen && !isWomen && !isKids) {
    orConditions.push({ isNewArrival: true });
    orConditions.push({ isFeatured: true });
    orConditions.push({ status: 'active' });
  }

  // Strict Department Isolation Constraints
  if (isMen) {
    andConditions.push({
      category: {
        NOT: {
          OR: [
            { parentId: 'group_women' },
            { parent: { slug: 'women' } },
            { slug: { startsWith: 'women-' } },
            { parentId: 'group_kids' },
            { parent: { slug: 'kids' } },
            { slug: { startsWith: 'kids-' } },
            { slug: { startsWith: 'boys-' } },
            { slug: { startsWith: 'girls-' } },
            { slug: { startsWith: 'baby-' } },
          ],
        },
      },
    });
    andConditions.push({
      OR: [
        { gender: null },
        { gender: { equals: 'men', mode: 'insensitive' as const } },
        { gender: { equals: 'unisex', mode: 'insensitive' as const } },
      ],
    });
  } else if (isWomen) {
    andConditions.push({
      category: {
        NOT: {
          OR: [
            { parentId: 'group_men' },
            { parent: { slug: 'men' } },
            { slug: { startsWith: 'men-' } },
            { parentId: 'group_kids' },
            { parent: { slug: 'kids' } },
            { slug: { startsWith: 'kids-' } },
            { slug: { startsWith: 'boys-' } },
            { slug: { startsWith: 'girls-' } },
            { slug: { startsWith: 'baby-' } },
          ],
        },
      },
    });
    andConditions.push({
      OR: [
        { gender: null },
        { gender: { equals: 'women', mode: 'insensitive' as const } },
        { gender: { equals: 'unisex', mode: 'insensitive' as const } },
      ],
    });
  } else if (isKids) {
    andConditions.push({
      category: {
        NOT: {
          OR: [
            { parentId: 'group_men' },
            { parent: { slug: 'men' } },
            { slug: { startsWith: 'men-' } },
            { parentId: 'group_women' },
            { parent: { slug: 'women' } },
            { slug: { startsWith: 'women-' } },
          ],
        },
      },
    });
    andConditions.push({
      OR: [
        { gender: null },
        { gender: { equals: 'kids', mode: 'insensitive' as const } },
        { gender: { equals: 'unisex', mode: 'insensitive' as const } },
      ],
    });
  }

  return { orConditions, andConditions };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = (slug || '').toLowerCase().trim();

  if (CATEGORY_ALIAS_MAP[cleanSlug]) {
    return {
      alternates: {
        canonical: `https://navyacollection.store/category/${CATEGORY_ALIAS_MAP[cleanSlug]}`,
      },
      robots: { index: false, follow: true },
    };
  }

  let dbCategory: any = null;
  let publicProductCount = 0;

  try {
    const { prisma } = await import('@/lib/prisma');
    dbCategory = await prisma.category.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (dbCategory) {
      if (dbCategory.status === 'inactive') {
        return {
          title: 'Category Not Available | Navya Collection',
          robots: { index: false, follow: false },
        };
      }

      // Count genuinely public active products belonging to this category hierarchy
      const { orConditions, andConditions } = await buildCategoryConditions(
        prisma,
        cleanSlug,
        dbCategory,
      );

      publicProductCount = await prisma.product.count({
        where: {
          status: 'active',
          deletedAt: null,
          ...(orConditions.length > 0 ? { OR: orConditions } : {}),
          AND: [
            {
              OR: [
                { shopId: null },
                {
                  shop: {
                    status: 'APPROVED',
                    deletedAt: null,
                  },
                },
              ],
            },
            ...andConditions,
          ],
        },
      });

      return generateCategoryMetadata(
        {
          id: dbCategory.id,
          name: dbCategory.name,
          slug: dbCategory.slug,
          description: dbCategory.description,
          image: dbCategory.image,
          metaTitle: dbCategory.metaTitle,
          metaDescription: dbCategory.metaDescription,
          metaKeywords: dbCategory.metaKeywords,
          canonicalUrl: dbCategory.canonicalUrl,
          status: dbCategory.status,
        },
        {
          slug: cleanSlug,
          parentName: dbCategory.parent?.name,
          hasPublicProducts: publicProductCount > 0,
        },
      );
    }
  } catch (err) {
    console.error('Failed to query DB category for metadata:', err);
  }

  // Fallback to constant categories for curated spotlights
  const constCategory = findCategoryBySlug(cleanSlug);
  if (constCategory) {
    try {
      const { prisma } = await import('@/lib/prisma');
      publicProductCount = await prisma.product.count({
        where: {
          status: 'active',
          deletedAt: null,
          OR: [{ categoryId: constCategory.id }, { category: { slug: constCategory.slug } }],
          AND: [
            {
              OR: [
                { shopId: null },
                {
                  shop: {
                    status: 'APPROVED',
                    deletedAt: null,
                  },
                },
              ],
            },
          ],
        },
      });
    } catch {
      // Fallback
    }

    return generateCategoryMetadata(
      {
        id: constCategory.id,
        name: constCategory.name,
        slug: constCategory.slug,
        description: constCategory.description,
        image: constCategory.image,
        banner: constCategory.banner,
        status: 'active',
      },
      {
        slug: cleanSlug,
        parentName: constCategory.parentName,
        hasPublicProducts: publicProductCount > 0,
      },
    );
  }

  return {
    title: 'Category Not Found | Navya Collection',
    description: 'The requested category does not exist on Navya Collection.',
    robots: { index: false, follow: false },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = (slug || '').toLowerCase().trim();

  if (CATEGORY_ALIAS_MAP[cleanSlug]) {
    redirect(`/category/${CATEGORY_ALIAS_MAP[cleanSlug]}`);
  }

  let dbCategory: any = null;
  try {
    const { prisma } = await import('@/lib/prisma');
    dbCategory = await prisma.category.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { status: 'active', deletedAt: null },
          select: { id: true, name: true, slug: true },
        },
      },
    });
  } catch (err) {
    console.error('Failed to query DB category for page:', err);
  }

  if (dbCategory && dbCategory.status === 'inactive') {
    notFound();
  }

  // Resolve category configuration
  const constCategory = findCategoryBySlug(cleanSlug);

  const category = dbCategory
    ? {
        id: dbCategory.id,
        name: dbCategory.name,
        slug: dbCategory.slug,
        description: dbCategory.description || constCategory?.description || '',
        image: dbCategory.image || constCategory?.image || '',
        banner: dbCategory.image || constCategory?.banner || constCategory?.image || '',
        productCount: 0,
        accent: constCategory?.accent || 'from-navy to-[#234b8f]',
        parentId: dbCategory.parentId || constCategory?.parentId,
        parentName: dbCategory.parent?.name || constCategory?.parentName,
        parentSlug: dbCategory.parent?.slug || constCategory?.parentSlug,
        subCategories:
          dbCategory.children?.length > 0
            ? dbCategory.children.map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))
            : constCategory?.subCategories || [],
      }
    : constCategory;

  if (!category) {
    notFound();
  }

  let dbProducts: any[] = [];
  try {
    const { prisma } = await import('@/lib/prisma');

    // Build targeted conditions with full hierarchical descendant resolution
    const { orConditions, andConditions } = await buildCategoryConditions(
      prisma,
      cleanSlug,
      category,
    );

    // Specific category keyword extraction with strict distinctions
    const categoryLower = category.name.toLowerCase();
    const isTShirt =
      cleanSlug.includes('t-shirt') ||
      cleanSlug.includes('tshirt') ||
      categoryLower.includes('t-shirt') ||
      categoryLower.includes('tshirt') ||
      cleanSlug.includes('polo') ||
      categoryLower.includes('polo');

    const isSweater =
      cleanSlug.includes('sweater') ||
      categoryLower.includes('sweater') ||
      cleanSlug.includes('cardigan') ||
      categoryLower.includes('cardigan');

    const isSweatshirt = cleanSlug.includes('sweatshirt') || categoryLower.includes('sweatshirt');

    const isShirt =
      !isTShirt &&
      !isSweater &&
      !isSweatshirt &&
      (cleanSlug.includes('shirt') || categoryLower.includes('shirt'));

    const rawProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        shop: {
          status: 'APPROVED',
          deletedAt: null,
        },
        ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        ...(andConditions.length > 0 ? { AND: andConditions } : {}),
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

    // High-Precision in-memory filter to guarantee shirts vs t-shirts vs sweaters never mix
    const filteredProducts = rawProducts.filter((p: any) => {
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const pText = `${pName} ${pDesc}`;

      if (isShirt) {
        // Must NOT be a T-Shirt, Sweatshirt, Hoodie or Sweater
        const hasTeeOrSweat =
          /\b(t-?shirt|tshirts?|tees?|sweatshirts?|hoodies?|sweaters?|cardigans?)\b/i.test(pName);
        if (hasTeeOrSweat) return false;
      } else if (isTShirt && !cleanSlug.includes('polo')) {
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

    dbProducts = filteredProducts.map((p: any) => {
      const primary = p.images.find((img: any) => img.isPrimary) || p.images[0];
      return {
        id: String(p.id),
        name: String(p.name || ''),
        slug: String(p.slug || ''),
        sku: String(p.sku || ''),
        brand: p.brand ? String(p.brand) : null,
        gender: p.gender ? String(p.gender) : null,
        ageGroup: p.ageGroup ? String(p.ageGroup) : null,
        fabric: p.fabric ? String(p.fabric) : null,
        occasion: p.occasion ? String(p.occasion) : null,
        color: p.color ? String(p.color) : null,
        fit: p.fit ? String(p.fit) : null,
        description: p.description ? String(p.description) : '',
        price: Number(p.price || 0),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        stock: Number(p.stock || 0),
        lowStockThreshold: p.lowStockThreshold ? Number(p.lowStockThreshold) : 5,
        status: String(p.status || 'active'),
        isFeatured: Boolean(p.isFeatured),
        isNewArrival: Boolean(p.isNewArrival),
        categoryId: String(p.categoryId || ''),
        rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : null,
        reviewCount: Number(p.reviewCount || 0),
        metaTitle: p.metaTitle || null,
        metaDescription: p.metaDescription || null,
        metaKeywords: p.metaKeywords || null,
        canonicalUrl: p.canonicalUrl || null,
        ogImage: p.ogImage || null,
        robots: p.robots || null,
        schemaEnabled: Boolean(p.schemaEnabled),
        focusKeyword: p.focusKeyword || null,
        brandId: p.brandId || null,
        returnPolicyType: p.returnPolicyType || null,
        returnAllowed: Boolean(p.returnAllowed),
        returnWindowDays: p.returnWindowDays ? Number(p.returnWindowDays) : 7,
        replacementAllowed: Boolean(p.replacementAllowed),
        replacementWindowDays: p.replacementWindowDays ? Number(p.replacementWindowDays) : 7,
        specialShippingMode: p.specialShippingMode || null,
        specialShippingRate: p.specialShippingRate ? Number(p.specialShippingRate) : null,
        taxRate: p.taxRate ? Number(p.taxRate) : null,
        hsnCode: p.hsnCode || null,
        createdAt:
          p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt || ''),
        updatedAt:
          p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt || ''),
        deletedAt: p.deletedAt instanceof Date ? p.deletedAt.toISOString() : null,
        shopId: p.shopId || null,
        pickupLocationId: p.pickupLocationId || null,
        images: (p.images || []).map((img: any) => ({
          id: String(img.id),
          url: img.imageUrl,
          imageUrl: img.imageUrl,
          isPrimary: Boolean(img.isPrimary),
          alt: img.altText || p.name,
        })),
        imageUrl: primary?.imageUrl,
        shop: p.shop
          ? {
              id: String(p.shop.id),
              name: String(p.shop.name || ''),
              slug: String(p.shop.slug || ''),
              city: p.shop.city || null,
              verificationBadge: p.shop.verificationBadge || null,
            }
          : null,
        category: p.category
          ? {
              id: String(p.category.id),
              name: String(p.category.name || ''),
              slug: String(p.category.slug || ''),
            }
          : null,
      };
    });
  } catch (err) {
    console.error('Failed to query category products:', err);
  }

  const allProducts = dbProducts;

  // Derive the matching parent category group for explorer back link
  let groupParam = 'spotlight';
  const normSlug = cleanSlug;
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

  // Generate Schema.org structured data (BreadcrumbList + ItemList)
  const categoryJsonLd = generateCategoryJsonLdSchemas({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      banner: category.banner,
      parent:
        category.parentName && category.parentSlug
          ? {
              id: category.parentId || '',
              name: category.parentName,
              slug: category.parentSlug,
            }
          : null,
    },
    parentCategory:
      category.parentName && category.parentSlug
        ? {
            name: category.parentName,
            slug: category.parentSlug,
          }
        : null,
    products: allProducts,
    canonicalUrl: `https://navyacollection.store/category/${category.slug}`,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Category Schema.org Structured Data */}
      <JsonLd data={categoryJsonLd} />

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
              {category.subCategories.map((sub: any) => {
                const isActive = sub.slug === cleanSlug;
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

        {/* Main Category Filtered View with Faceted Sidebar & Mobile Dual-Pane Drawer */}
        <CategoryFilteredView initialProducts={allProducts} category={category} />
      </div>
    </div>
  );
}
