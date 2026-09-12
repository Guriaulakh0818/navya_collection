import type { Category } from '../types/category.types';

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
  // 1. Primary Category Groups
  {
    id: 'cat_spotlight',
    name: 'In The Spotlight',
    slug: 'spotlight',
    description: 'Trending collections, festive specials, Korean aesthetics & budget finds.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_men',
    name: 'Men',
    slug: 'men',
    description:
      'Kurtas, Sherwanis, Shirts, T-Shirts, Jeans, Trousers, Suits, Footwear & Essentials.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600',
    banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_women',
    name: 'Women',
    slug: 'women',
    description:
      'Sarees, Lehengas, Salwar Suits, Kurtis, Western Tops, Dresses, Bags & Essentials.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_kids',
    name: 'Kids',
    slug: 'kids',
    description: 'Baby Wear, Boys Outfits, Girls Lehengas & Frocks, Teens & Kids Essentials.',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600',
    banner: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[4],
  },
  {
    id: 'cat_shops',
    name: 'Navya Collection Shops',
    slug: 'shops',
    description:
      'Shop directly from authentic designer boutiques, verified artisans & premium stores.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },

  // 2. Women Categories & Garment Types
  {
    id: 'cat_women_sarees',
    name: 'Sarees',
    slug: 'women-sarees',
    description: 'Banarasi, Kanjeevaram, Pure Silk, Chiffon, Georgette & Designer Sarees.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_women_lehengas',
    name: 'Lehenga Choli',
    slug: 'women-lehengas',
    description: 'Royal Bridal Lehengas, Wedding Chaniya Cholis & Festive Party Lehengas.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_women_kurtas',
    name: 'Kurtas & Tunics',
    slug: 'women-kurtas',
    description: 'Cotton Kurtas, Designer Tunics, Long Kurtis & Indo-Western Tops.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[5],
  },
  {
    id: 'cat_women_kurta_sets',
    name: 'Kurta Sets & Salwar Suits',
    slug: 'women-kurta-sets',
    description: 'Designer Salwar Suits, Anarkali Gowns, Sharara Sets & Punjabi Suits.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_women_dresses',
    name: 'Western Dresses & Gowns',
    slug: 'women-dresses',
    description: 'Western Dresses, Maxis, Evening Gowns & Casual Frocks.',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600',
    banner: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'cat_women_handbags',
    name: 'Handbags & Accessories',
    slug: 'women-handbags',
    description: 'Designer Handbags, Sling Bags, Clutches, Jewellery & Watches.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    banner: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },

  // 3. Men Categories & Garment Types
  {
    id: 'cat_men_kurtas',
    name: 'Men Ethnic Kurtas',
    slug: 'men-kurtas',
    description: 'Cotton Kurtas, Festive Kurta Pyjama Sets & Designer Pathani Kurtas.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_men_shirts',
    name: 'Men Shirts',
    slug: 'men-shirts',
    description: 'Formal Shirts, Casual Cotton Shirts, Linen Blend & Slim Fit Shirts.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
    banner: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_men_tshirts',
    name: 'Men T-Shirts & Polos',
    slug: 'men-t-shirts',
    description: 'Polo T-Shirts, Casual Crew Neck Tees & Printed Cotton T-Shirts.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
    banner: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: 'cat_men_jeans',
    name: 'Men Jeans & Denims',
    slug: 'men-jeans',
    description: 'Denim Jeans, Slim Fit Jeans & Casual Stretch Denim.',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600',
    banner: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_men_suits',
    name: 'Men Suits & Blazers',
    slug: 'men-suits',
    description: 'Tuxedo Suits, Wedding Blazers, Waistcoats & Formal Coats.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600',
    banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },

  // 4. Kids Categories
  {
    id: 'cat_kids_boys',
    name: 'Boys Clothing',
    slug: 'boys-fashion',
    description: 'Boys Kurta Sets, Shirts, Trousers, Party Suits & Ethnic Wear.',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600',
    banner: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: 'cat_kids_girls',
    name: 'Girls Clothing',
    slug: 'girls-fashion',
    description: 'Girls Ethnic Gowns, Lehengas, Frocks & Party Wear Dresses.',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600',
    banner: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_kids_baby',
    name: 'Baby Wear',
    slug: 'baby-fashion',
    description: 'Newborn Rompers, Soft Cotton Sets, Swaddles & Baby Essentials.',
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600',
    banner: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[4],
  },
];

export function findCategoryBySlug(slug: string): Category {
  const normalizedSlug = slug.toLowerCase().trim();

  // Aliases mapping for common variations
  const aliases: Record<string, string> = {
    men: 'men',
    gents: 'men',
    'gents-wear': 'men',
    women: 'women',
    'women-wear': 'women',
    kids: 'kids',
    'kids-wear': 'kids',
    sarees: 'women-sarees',
    lehengas: 'women-lehengas',
    kurtis: 'women-kurtas',
    suits: 'women-kurta-sets',
    'salwar-suits': 'women-kurta-sets',
    shirts: 'men-shirts',
    't-shirts': 'men-t-shirts',
    jeans: 'men-jeans',
    boys: 'boys-fashion',
    girls: 'girls-fashion',
    baby: 'baby-fashion',
    spotlight: 'spotlight',
    shops: 'shops',
  };

  const targetSlug = aliases[normalizedSlug] || normalizedSlug;
  const existing = CATEGORIES.find(
    (c) => c.slug === targetSlug || c.id === targetSlug || c.slug === normalizedSlug,
  );
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
