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
  // Primary Categories
  {
    id: 'cat_women',
    name: 'Women Wear',
    slug: 'women-wear',
    description: 'Sarees, Designer Lehengas, Salwar Suits, Kurtis & Indo-Western Gowns.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_gents',
    name: 'Gents / Men Wear',
    slug: 'gents-wear',
    description: 'Ethnic Kurtas, Sherwanis, Nehru Jackets, Formal Shirts & Tuxedo Suits.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_kids',
    name: 'Children / Kids Wear',
    slug: 'kids-wear',
    description: 'Daily Wear Sets, Ethnic Festive Clothes, Cotton Sleepwear & Dungarees.',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600',
    banner: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[4],
  },
  {
    id: 'cat_festive',
    name: 'Festive & Wedding Couture',
    slug: 'festive-couture',
    description: 'Royal Bridal Lehengas, Groom Sherwani Sets & Festival Special Collections.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'cat_accessories',
    name: 'Accessories & Essentials',
    slug: 'accessories-essentials',
    description: 'Jewellery, Mojris, Juttis, Clutches, Potlis & Turbans.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
    banner: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[7],
  },

  // Women Subcategories & Product Types
  {
    id: 'cat_sarees',
    name: 'Sarees',
    slug: 'sarees',
    description: 'Banarasi, Kanjeevaram, Silk, Chiffon, Georgette & Designer Sarees.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_suits',
    name: 'Anarkalis & Salwar Suits',
    slug: 'suits',
    description: 'Designer Salwar Suits, Anarkali Gowns, Sharara Sets & Punjabi Suits.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_anarkalis_suits',
    name: 'Anarkalis & Suits',
    slug: 'anarkalis-suits',
    description: 'Heavy Embroidered Anarkali Suits, Silk Suits & Festive Suits.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_kurtis',
    name: 'Kurtis & Tunics',
    slug: 'kurtis',
    description: 'Cotton Kurtis, Designer Tunics, Long Kurtis & Indo-Western Tops.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[5],
  },
  {
    id: 'cat_dresses',
    name: 'Dresses',
    slug: 'dresses',
    description: 'Western Dresses, Maxis, Evening Gowns & Casual Frocks.',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600',
    banner: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'cat_lehengas',
    name: 'Designer Lehengas',
    slug: 'lehengas',
    description: 'Bridal Lehengas, Wedding Chaniya Cholis & Festive Party Lehengas.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',
    banner: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'cat_dupattas',
    name: 'Dupattas & Stoles',
    slug: 'dupattas',
    description: 'Banarasi Silk Dupattas, Phulkari Stoles, Net Dupattas & Heavy Borders.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: 'cat_gowns',
    name: 'Indo-Western & Fusion Gowns',
    slug: 'gowns',
    description: 'Designer Gowns, Crop Top Skirts & Contemporary Ethnic Fusion.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[4],
  },

  // Men Subcategories & Product Types
  {
    id: 'cat_shirts',
    name: 'Shirts',
    slug: 'shirts',
    description: 'Formal Shirts, Casual Cotton Shirts, Linen Blend & Slim Fit Shirts.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_tshirts',
    name: 'T-Shirts & Polos',
    slug: 't-shirts',
    description: 'Polo T-Shirts, Casual Crew Neck Tees & Printed Cotton T-Shirts.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: 'cat_trousers',
    name: 'Trousers & Chinos',
    slug: 'trousers',
    description: 'Formal Trousers, Slim Fit Chinos, Formal Pants & Casual Bottoms.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[7],
  },
  {
    id: 'cat_jeans',
    name: 'Jeans',
    slug: 'jeans',
    description: 'Denim Jeans, Slim Fit Jeans & Casual Stretch Denim.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: 'cat_kurta',
    name: 'Ethnic Kurtas',
    slug: 'kurta',
    description: 'Cotton Kurtas, Festive Kurta Pyjama Sets & Designer Pathani Kurtas.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: 'cat_sherwani',
    name: 'Sherwani & Groom Wear',
    slug: 'sherwani',
    description: 'Royal Wedding Sherwanis, Groom Indo-Western Sets & Achkans.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[6],
  },
  {
    id: 'cat_jackets',
    name: 'Jackets & Vests',
    slug: 'jackets',
    description: 'Nehru Jackets, Modi Vests, Ethnic Waistcoats & Blazers.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_ethnic_wear',
    name: 'Ethnic Wear',
    slug: 'ethnic-wear',
    description: 'Traditional Ethnic Sets, Kurtas, Sherwanis & Festive Wear.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    banner: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[5],
  },

  // Kids Subcategories
  {
    id: 'cat_boys_clothing',
    name: 'Boys Clothing',
    slug: 'boys-clothing',
    description: 'Boys Kurta Sets, Shirts, Trousers, Party Suits & Ethnic Wear.',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600',
    banner: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: 'cat_girls_clothing',
    name: 'Girls Clothing',
    slug: 'girls-clothing',
    description: 'Girls Ethnic Gowns, Lehengas, Frocks & Party Wear Dresses.',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600',
    banner: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: 'cat_kids_ethnic',
    name: 'Kids Ethnic Wear',
    slug: 'kids-ethnic-wear',
    description: 'Traditional Ethnic Wear for Boys & Girls.',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600',
    banner: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[4],
  },
  {
    id: 'cat_kids_dresses',
    name: 'Kids Dresses',
    slug: 'kids-dresses',
    description: 'Cute Dresses, Frocks & Casual Outfits for Children.',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600',
    banner: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[5],
  },
  {
    id: 'cat_kids_sets',
    name: 'Kids Sets',
    slug: 'kids-sets',
    description: 'Matching Clothing Sets, Top & Bottom Combos & Sleepwear.',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600',
    banner: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200',
    productCount: 0,
    accent: CATEGORY_ACCENTS[1],
  },
];

export function findCategoryBySlug(slug: string): Category {
  const normalizedSlug = slug.toLowerCase().trim();

  // Aliases mapping for common variations
  const aliases: Record<string, string> = {
    men: 'gents-wear',
    gents: 'gents-wear',
    women: 'women-wear',
    kids: 'kids-wear',
    boys: 'boys-clothing',
    girls: 'girls-clothing',
    anarkalis: 'anarkalis-suits',
    'salwar-suits': 'suits',
    't-shirts': 't-shirts',
    tshirts: 't-shirts',
    blazers: 'jackets',
    'indo-western-fusion': 'gowns',
    'dupattas-stoles': 'dupattas',
  };

  const targetSlug = aliases[normalizedSlug] || normalizedSlug;
  const existing = CATEGORIES.find((c) => c.slug === targetSlug || c.id === targetSlug);
  if (existing) return existing;

  // Format slug dynamically if not found
  const formattedName = normalizedSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bAnd\b/gi, '&')
    .replace(/\bGents\b/gi, 'Gents / Men')
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
