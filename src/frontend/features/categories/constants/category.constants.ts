import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';

import type { Category } from '../types/category.types';
import { MAIN_CATEGORY_GROUPS } from './category-explorer.constants';

export const CATEGORY_ACCENTS = [
  'from-navy to-[#234b8f]',
  'from-amber-600 to-amber-700',
  'from-[#0f2a52] to-navy',
  'from-rose-600 to-rose-700',
  'from-emerald-600 to-emerald-800',
  'from-indigo-600 to-indigo-800',
  'from-purple-600 to-purple-800',
  'from-slate-700 to-slate-900',
] as const;

export const CATEGORIES: Category[] = [
  // 1. IN THE SPOTLIGHT
  {
    id: 'group_spotlight',
    name: 'In The Spotlight',
    slug: 'spotlight',
    description: 'Handpicked seasonal drops, festive highlights, top-rated trends & budget finds.',
    image: '/images/categories/category-spotlight.jpg',
    banner: '/images/categories/category-spotlight.jpg',
    productCount: 12,
    accent: CATEGORY_ACCENTS[1],
    subCategories: [
      { id: 'spot_new_season', name: 'New Season', slug: 'new-season' },
      { id: 'spot_festivals_india', name: 'Festivals of India', slug: 'festivals-of-india' },
      { id: 'spot_korean_store', name: 'Korean Store', slug: 'korean-store' },
      { id: 'spot_best_sellers', name: 'Best Sellers', slug: 'best-sellers' },
      { id: 'spot_budget_finds', name: 'Budget Finds', slug: 'budget-finds' },
      { id: 'spot_trending_now', name: 'Trending Now', slug: 'trending' },
    ],
  },

  // 2. MEN
  {
    id: 'group_men',
    name: 'Men',
    slug: 'men',
    description:
      'Designer shirts, t-shirts, jeans, trousers, silk kurta sets, suits & accessories.',
    image: '/images/categories/category-men.jpg',
    banner: '/images/categories/category-men.jpg',
    productCount: 15,
    accent: CATEGORY_ACCENTS[0],
    subCategories: [
      { id: 'cat_men_shirts', name: 'Shirts', slug: 'men-shirts' },
      { id: 'cat_men_tshirts', name: 'T-Shirts', slug: 'men-t-shirts' },
      { id: 'cat_men_jeans', name: 'Jeans / Denims', slug: 'men-jeans' },
      { id: 'cat_men_chinos', name: 'Chinos', slug: 'men-chinos' },
      { id: 'cat_men_kurta_sets', name: 'Kurta Sets', slug: 'men-kurta-sets' },
      { id: 'cat_men_blazers', name: 'Blazers', slug: 'men-blazers' },
      { id: 'cat_men_trackpants', name: 'Track Pants', slug: 'men-track-pants' },
    ],
  },

  // 3. WOMEN
  {
    id: 'group_women',
    name: 'Women',
    slug: 'women',
    description: 'Handcrafted luxury sarees, bridal lehengas, kurtas, western wear & accessories.',
    image: '/images/categories/category-women.jpg',
    banner: '/images/categories/category-women.jpg',
    productCount: 15,
    accent: CATEGORY_ACCENTS[3],
    subCategories: [
      { id: 'cat_women_sarees', name: 'Sarees', slug: 'women-sarees' },
      { id: 'cat_women_lehengas', name: 'Lehenga Choli', slug: 'women-lehengas' },
      { id: 'cat_women_kurta_sets', name: 'Kurta Sets', slug: 'women-kurta-sets' },
      { id: 'cat_women_kurtas', name: 'Kurtas', slug: 'women-kurtas' },
      { id: 'cat_women_dresses', name: 'Dresses', slug: 'women-dresses' },
      { id: 'cat_women_tops_tees', name: 'Tops & Tees', slug: 'women-tops-tees' },
      { id: 'cat_women_bags', name: 'Bags', slug: 'women-bags' },
    ],
  },

  // 4. KIDS
  {
    id: 'group_kids',
    name: 'Kids',
    slug: 'kids',
    description: 'Fashion & essentials for baby, boys, girls and teens.',
    image: '/images/categories/category-kids.jpg',
    banner: '/images/categories/category-kids.jpg',
    productCount: 5,
    accent: CATEGORY_ACCENTS[4],
    subCategories: [
      { id: 'cat_kids_baby', name: 'Baby', slug: 'baby-fashion' },
      { id: 'cat_kids_boys', name: 'Boys', slug: 'boys-fashion' },
      { id: 'cat_kids_girls', name: 'Girls', slug: 'girls-fashion' },
      { id: 'cat_kids_teens', name: 'Teens', slug: 'teens-fashion' },
      { id: 'cat_kids_ethnic_wear', name: 'Ethnic Wear', slug: 'kids-ethnic-wear' },
      { id: 'cat_kids_essentials', name: 'Kids Essentials', slug: 'kids-essentials' },
    ],
  },

  // 5. NAVYA COLLECTION SHOPS
  {
    id: 'group_shops',
    name: 'Navya Collection Shops',
    slug: 'shops',
    description: 'Explore verified partner designer boutiques and independent regional shops.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    productCount: 4,
    accent: CATEGORY_ACCENTS[2],
    subCategories: [
      { id: 'cat_shops_all', name: 'All Shops', slug: 'all-shops' },
      { id: 'cat_shops_new', name: 'New Shops', slug: 'new-shops' },
      { id: 'cat_shops_trending', name: 'Trending Shops', slug: 'trending-shops' },
      { id: 'cat_shops_top_rated', name: 'Top-Rated Shops', slug: 'top-rated-shops' },
    ],
  },

  // Highlighted Core Categories
  {
    id: 'cat_women_sarees',
    name: 'Sarees',
    slug: 'women-sarees',
    description: 'Handcrafted luxury ethnic silk, chiffon, georgette and organza sarees.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 4,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_women_lehengas',
    name: 'Lehenga Choli',
    slug: 'women-lehengas',
    description: 'Exquisite bridal and festive lehenga cholis with rich embroidery.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
    productCount: 3,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_women_kurta_sets',
    name: 'Kurta Sets',
    slug: 'women-kurta-sets',
    description: 'Festive designer kurta sets, anarkalis, and shararas.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
    productCount: 4,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_men_shirts',
    name: 'Shirts',
    slug: 'men-shirts',
    description: 'Sharp casual and formal shirts crafted from premium cotton fabrics.',
    image: '/images/categories/men-shirts.jpg',
    banner: '/images/categories/men-shirts.jpg',
    productCount: 8,
    accent: CATEGORY_ACCENTS[0],
  },
];

export function findCategoryBySlug(slug: string): Category {
  const normalizedSlug = (slug || '').toLowerCase().trim();

  // Legacy mappings redirecting old names to canonical slugs
  const legacyAliases: Record<string, string> = {
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
  };

  const targetSlug = legacyAliases[normalizedSlug] || normalizedSlug;

  // 1. Check in static CATEGORIES list first
  const existing = CATEGORIES.find(
    (c) => c.slug === targetSlug || c.id === targetSlug || c.slug === normalizedSlug,
  );

  // 2. Check if matches one of the 5 Main Category Groups
  const mainGroup = MAIN_CATEGORY_GROUPS.find(
    (g) =>
      g.slug === targetSlug ||
      g.id === targetSlug ||
      g.slug === normalizedSlug ||
      (targetSlug === 'men' && g.id === 'group_men') ||
      (targetSlug === 'women' && g.id === 'group_women') ||
      (targetSlug === 'kids' && g.id === 'group_kids') ||
      (targetSlug === 'spotlight' && g.id === 'group_spotlight') ||
      (targetSlug === 'shops' && g.id === 'group_shops'),
  );

  if (mainGroup) {
    const subCategories = mainGroup.subSections.flatMap((s) =>
      s.items.map((it) => ({
        id: it.id,
        name: it.name,
        slug: it.slug,
        image: it.image,
        badge: it.badge,
      })),
    );

    return {
      id: mainGroup.id,
      name: mainGroup.name,
      slug: mainGroup.slug,
      description:
        mainGroup.banner?.subtitle || `Explore ${mainGroup.name} collection at Navya Collection.`,
      image: mainGroup.iconImage,
      banner: mainGroup.banner?.image || mainGroup.iconImage,
      accent: existing?.accent || 'from-navy to-[#234b8f]',
      subCategories: subCategories.slice(0, 16),
    };
  }

  // 3. Check if matches any subcategory item across all main groups in MAIN_CATEGORY_GROUPS
  for (const group of MAIN_CATEGORY_GROUPS) {
    for (const section of group.subSections) {
      const matchedItem = section.items.find(
        (it) => it.slug === targetSlug || it.id === targetSlug || it.slug === normalizedSlug,
      );
      if (matchedItem) {
        const siblingSubcategories = section.items.map((it) => ({
          id: it.id,
          name: it.name,
          slug: it.slug,
          image: it.image,
          badge: it.badge,
        }));

        return {
          id: matchedItem.id,
          name: matchedItem.name,
          slug: matchedItem.slug,
          description: `Shop authentic ${matchedItem.name} in ${group.name} collection at Navya Collection.`,
          image: matchedItem.image,
          banner: group.banner?.image || matchedItem.image,
          parentId: group.id,
          parentName: group.name,
          parentSlug: group.slug,
          accent: 'from-navy to-[#234b8f]',
          subCategories: siblingSubcategories,
        };
      }
    }
  }

  // 4. Check against full Canonical Taxonomy (CATEGORY_TAXONOMY)
  const flattened = getFlattenedCategoryOptions();
  const matchedFlat = flattened.find(
    (it) => it.slug === targetSlug || it.id === targetSlug || it.slug === normalizedSlug,
  );

  if (matchedFlat) {
    return {
      id: matchedFlat.id,
      name: matchedFlat.name,
      slug: matchedFlat.slug,
      description: `Explore ${matchedFlat.breadcrumb} collection at Navya Collection.`,
      image: '/images/categories/category-spotlight.jpg',
      banner: '/images/categories/category-spotlight.jpg',
      parentName: matchedFlat.mainGroupName,
      accent: 'from-navy to-[#234b8f]',
    };
  }

  if (existing) return existing;

  // Format slug dynamically if not found
  const formattedName = normalizedSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bAnd\b/gi, '&')
    .replace(/\bTshirts\b/gi, 'T-Shirts');

  return {
    id: `cat_${normalizedSlug.replace(/[^a-z0-9_]/g, '_')}`,
    name: formattedName,
    slug: normalizedSlug,
    description: `Explore ${formattedName} collection at Navya Collection.`,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: 'from-navy to-[#234b8f]',
  };
}

export const DEFAULT_PAGE_SIZE = 12;
