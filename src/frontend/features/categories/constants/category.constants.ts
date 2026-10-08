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
  // Master Parent Categories
  {
    id: 'sarees',
    name: 'Sarees',
    slug: 'sarees',
    description: 'Handcrafted luxury ethnic silk, chiffon, georgette and organza sarees.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 3,
    accent: CATEGORY_ACCENTS[0],
    subCategories: [
      {
        id: 'banarasi-sarees',
        name: 'Banarasi Sarees',
        slug: 'banarasi-sarees',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      },
      {
        id: 'kanjeevaram-silk-sarees',
        name: 'Kanjeevaram Silk Sarees',
        slug: 'kanjeevaram-silk-sarees',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
      },
      {
        id: 'chanderi-sarees',
        name: 'Chanderi Sarees',
        slug: 'chanderi-sarees',
        image: 'https://images.unsplash.com/photo-1610030469668-98e550d6193c?w=600',
      },
    ],
  },
  {
    id: 'anarkalis-suits',
    name: 'Anarkalis & Suits',
    slug: 'anarkalis-suits',
    description: 'Elegant designer suits, floor-length anarkalis, and festive churidar sets.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
    productCount: 2,
    accent: CATEGORY_ACCENTS[3],
    subCategories: [
      {
        id: 'silk-anarkali-sets',
        name: 'Silk Anarkali Sets',
        slug: 'silk-anarkali-sets',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
      },
    ],
  },
  {
    id: 'lehengas',
    name: 'Lehengas',
    slug: 'lehengas',
    description: 'Exquisite bridal and festive lehenga cholis with rich embroidery.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
    productCount: 3,
    accent: CATEGORY_ACCENTS[1],
    subCategories: [
      {
        id: 'bridal-lehengas',
        name: 'Bridal Lehengas',
        slug: 'bridal-lehengas',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
      },
      {
        id: 'partywear-lehengas',
        name: 'Partywear Lehengas',
        slug: 'partywear-lehengas',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
      },
    ],
  },
  {
    id: 'kurtis-tunics',
    name: 'Kurtis & Tunics',
    slug: 'kurtis-tunics',
    description: 'Contemporary daily wear and festive designer kurtis.',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600',
    banner: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1200',
    productCount: 2,
    accent: CATEGORY_ACCENTS[5],
  },
  {
    id: 'indo-western-fusion',
    name: 'Indo-Western & Fusion',
    slug: 'indo-western-fusion',
    description: 'Modern silhouettes blended with traditional Indian craftsmanship.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
    productCount: 5,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'gents-mens-couture',
    name: 'Gents & Mens Couture',
    slug: 'gents-mens-couture',
    description: 'Handcrafted designer sherwanis, kurta pajamas, and shirts for men.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
    productCount: 17,
    accent: CATEGORY_ACCENTS[0],
    subCategories: [
      {
        id: 'designer-kurta-pajamas',
        name: 'Designer Kurta Pajamas',
        slug: 'designer-kurta-pajamas',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
      },
    ],
  },
  {
    id: 'dupattas-stoles',
    name: 'Dupattas & Stoles',
    slug: 'dupattas-stoles',
    description: 'Heavy embroidered Banarasi, Phulkari, and Silk designer dupattas.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 1,
    accent: CATEGORY_ACCENTS[4],
    subCategories: [
      {
        id: 'phulkari-dupattas',
        name: 'Phulkari Dupattas',
        slug: 'phulkari-dupattas',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      },
    ],
  },
];

export function findCategoryBySlug(slug: string): Category {
  const normalizedSlug = (slug || '').toLowerCase().trim();

  // Aliases mapping for common variations back to authentic Master categories
  const aliases: Record<string, string> = {
    // Legacy main mappings mapped to Master
    'women-sarees': 'sarees',
    'women-lehengas': 'lehengas',
    'women-kurtas': 'kurtis-tunics',
    'women-kurta-sets': 'anarkalis-suits',
    'salwar-suits': 'anarkalis-suits',
    suits: 'anarkalis-suits',
    anarkalis: 'anarkalis-suits',
    'women-dresses': 'indo-western-fusion',
    'women-western': 'indo-western-fusion',
    women: 'sarees',
    'women-clothing': 'sarees',
    'women-wear': 'sarees',

    // Men mappings mapped to Master
    men: 'gents-mens-couture',
    'men-clothing': 'gents-mens-couture',
    gents: 'gents-mens-couture',
    'gents-wear': 'gents-mens-couture',
    'men-kurtas': 'designer-kurta-pajamas',
    'men-shirts': 'gents-mens-couture',
    'men-t-shirts': 'gents-mens-couture',
    'men-jeans': 'gents-mens-couture',
    'men-trousers': 'gents-mens-couture',
    'men-suits': 'gents-mens-couture',
    'men-new-arrivals': 'gents-mens-couture',
    shirts: 'gents-mens-couture',
    't-shirts': 'gents-mens-couture',
    jeans: 'gents-mens-couture',

    // Kids mappings mapped to Master
    kids: 'indo-western-fusion',
    'kids-wear': 'indo-western-fusion',
    'kids-fashion': 'indo-western-fusion',
    'boys-fashion': 'indo-western-fusion',
    'girls-fashion': 'indo-western-fusion',
    'baby-fashion': 'indo-western-fusion',
    'baby-essentials': 'indo-western-fusion',
    'kids-new-arrivals': 'indo-western-fusion',

    // Collections
    spotlight: 'sarees',
    'in-the-spotlight': 'sarees',
    'best-sellers': 'sarees',
    'top-rated': 'sarees',
    trending: 'sarees',
    'new-season': 'sarees',
    'new-arrivals': 'sarees',
    'under-499': 'sarees',
    'under-999': 'sarees',
  };

  const targetSlug = aliases[normalizedSlug] || normalizedSlug;

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

  // 3. Check if matches any subcategory item across all main groups
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
