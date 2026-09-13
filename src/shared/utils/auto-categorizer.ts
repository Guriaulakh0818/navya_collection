import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';

export interface AutoCategorizeResult {
  primaryCategoryId: string;
  categoryIds: string[];
  matchedLabels: string[];
  matchedRules: string[];
}

export interface ProductInputForCategorization {
  name: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  gender?: string;
  fabric?: string;
  color?: string;
  occasion?: string;
}

// Keyword mapping dictionary targeting exact category IDs
const KEYWORD_CATEGORY_RULES: {
  keywords: string[];
  categoryIds: string[];
  gender?: 'men' | 'women' | 'kids' | 'unisex';
}[] = [
  // --- WOMEN INDIAN WEAR ---
  {
    keywords: [
      'saree',
      'sari',
      'banarasi',
      'kanjeevaram',
      'chiffon saree',
      'georgette saree',
      'silk saree',
      'paithani',
      'chanderi saree',
      'bandhani',
    ],
    categoryIds: ['cat_women_sarees', 'cat_women_ethnic', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['lehenga', 'choli', 'chaniya choli', 'ghagra', 'bridal lehenga', 'wedding lehenga'],
    categoryIds: ['cat_women_lehengas', 'cat_women_ethnic', 'group_women'],
    gender: 'women',
  },
  {
    keywords: [
      'kurta set',
      'kurti set',
      'suit set',
      'salwar suit',
      'anarkali set',
      'sharara set',
      'gharara',
      'palazzo suit',
    ],
    categoryIds: [
      'cat_women_kurta_sets',
      'cat_women_salwar_suits',
      'cat_women_ethnic',
      'group_women',
    ],
    gender: 'women',
  },
  {
    keywords: ['kurti', 'kurta', 'anarkali', 'tunic', 'ethnic top'],
    categoryIds: ['cat_women_kurtas', 'cat_women_ethnic', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['ethnic dress', 'indowestern', 'indo western', 'fusion dress', 'maxi ethnic'],
    categoryIds: ['cat_women_ethnic_dresses', 'cat_women_ethnic', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['dupatta', 'stole', 'chunri', 'odhni'],
    categoryIds: ['cat_women_dupattas', 'cat_women_accessories', 'group_women'],
    gender: 'women',
  },

  // --- WOMEN WESTERN WEAR ---
  {
    keywords: [
      'women dress',
      'gown',
      'mini dress',
      'midi dress',
      'maxi dress',
      'bodycon',
      'wrap dress',
    ],
    categoryIds: ['cat_women_dresses', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['jumpsuit', 'playsuit', 'romper women'],
    categoryIds: ['cat_women_jumpsuits', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['women top', 'crop top', 'blouse', 'peplum', 'women tee', 'tank top'],
    categoryIds: ['cat_women_tops', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['women shirt', 'oversized shirt women', 'formal shirt women'],
    categoryIds: ['cat_women_shirts', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['women jeans', 'mom jeans', 'wide leg jeans', 'skinny jeans women', 'flared jeans'],
    categoryIds: ['cat_women_jeans', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['skirt', 'mini skirt', 'pleated skirt', 'pencil skirt'],
    categoryIds: ['cat_women_skirts', 'cat_women_western', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['co-ord', 'coord set', 'matching set', 'two piece set'],
    categoryIds: ['cat_women_coords', 'cat_women_western', 'group_women'],
    gender: 'women',
  },

  // --- WOMEN ACCESSORIES & BAGS ---
  {
    keywords: ['handbag', 'tote bag', 'shoulder bag', 'satchel'],
    categoryIds: ['cat_women_handbags', 'cat_women_bags', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['sling bag', 'crossbody'],
    categoryIds: ['cat_women_sling_bags', 'cat_women_bags', 'group_women'],
    gender: 'women',
  },
  {
    keywords: ['clutch', 'potli', 'evening purse'],
    categoryIds: ['cat_women_clutches', 'cat_women_bags', 'group_women'],
    gender: 'women',
  },
  {
    keywords: [
      'jewellery',
      'jewelry',
      'earrings',
      'jhumka',
      'necklace',
      'choker',
      'bangles',
      'bracelet',
      'kundan',
    ],
    categoryIds: ['cat_women_jewellery', 'cat_women_accessories', 'group_women'],
    gender: 'women',
  },

  // --- MEN CLOTHING ---
  {
    keywords: [
      'men shirt',
      'formal shirt',
      'casual shirt',
      'oxford shirt',
      'cuban collar',
      'linen shirt',
      'half sleeve shirt',
      'full sleeve shirt',
      'striped shirt',
    ],
    categoryIds: ['cat_men_shirts', 'cat_men_topwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: [
      'men t-shirt',
      'men tshirt',
      'men tee',
      'graphic tee',
      'oversized t-shirt',
      'round neck tee',
      'v neck',
    ],
    categoryIds: ['cat_men_tshirts', 'cat_men_topwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['polo', 'polo shirt', 'collared t-shirt'],
    categoryIds: ['cat_men_polos', 'cat_men_topwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['men kurta', 'kurta pajama', 'sherwani', 'nehru jacket', 'bandhgala', 'men ethnic'],
    categoryIds: ['cat_men_kurtas', 'cat_men_ethnic', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['men jeans', 'denim pants men', 'straight fit jeans', 'slim fit jeans men'],
    categoryIds: ['cat_men_jeans', 'cat_men_bottomwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['trousers', 'formal pants', 'chinos', 'cargo pants', 'cargos'],
    categoryIds: ['cat_men_trousers', 'cat_men_bottomwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['hoodie', 'sweatshirt men', 'pullover', 'sweater men'],
    categoryIds: ['cat_men_hoodies', 'cat_men_sweatshirts', 'cat_men_topwear', 'group_men'],
    gender: 'men',
  },
  {
    keywords: ['men jacket', 'bomber jacket', 'denim jacket men', 'blazer men', 'suit men'],
    categoryIds: ['cat_men_jackets_top', 'cat_men_topwear', 'group_men'],
    gender: 'men',
  },

  // --- KIDS CLOTHING ---
  {
    keywords: ['baby boy', 'baby girl', 'newborn', 'infant', 'romper', 'baby set'],
    categoryIds: ['cat_kids_baby_sets', 'cat_kids_baby', 'group_kids'],
    gender: 'kids',
  },
  {
    keywords: ['boys shirt', 'boys t-shirt', 'boys jeans', 'boys ethnic', 'boy clothes'],
    categoryIds: ['cat_kids_boys_tshirts', 'cat_kids_boys', 'group_kids'],
    gender: 'kids',
  },
  {
    keywords: ['girls dress', 'frock', 'girls lehenga', 'girls top', 'girl clothes'],
    categoryIds: ['cat_kids_girls_dresses', 'cat_kids_girls', 'group_kids'],
    gender: 'kids',
  },
  {
    keywords: ['kids', 'kid', 'child', 'children', 'toddler', 'teen'],
    categoryIds: ['cat_kids_fashion', 'group_kids'],
    gender: 'kids',
  },

  // --- HOME & LIVING ---
  {
    keywords: ['bedsheet', 'bed sheet', 'bed linen', 'duvet', 'bedcover', 'pillow cover'],
    categoryIds: ['cat_home_bedsheets', 'cat_home_bed_linen', 'group_home'],
  },
  {
    keywords: ['curtain', 'drapes', 'window curtain', 'sheer curtain'],
    categoryIds: ['cat_home_curtains', 'group_home'],
  },
  {
    keywords: ['cushion', 'cushion cover', 'throw pillow', 'bolster'],
    categoryIds: ['cat_home_cushions', 'group_home'],
  },
  {
    keywords: ['carpet', 'rug', 'doormat', 'runner rug'],
    categoryIds: ['cat_home_rugs', 'group_home'],
  },
  {
    keywords: ['decor', 'wall art', 'vase', 'candle', 'showpiece', 'clock'],
    categoryIds: ['cat_home_decor', 'group_home'],
  },
];

export function autoCategorizeProduct(
  product: ProductInputForCategorization,
): AutoCategorizeResult {
  const text =
    `${product.name} ${product.description || ''} ${product.fabric || ''} ${product.occasion || ''}`.toLowerCase();
  const allFlattened = getFlattenedCategoryOptions();

  const assignedSet = new Set<string>();
  const matchedRules: string[] = [];

  // 1. Gender / Keyword Rule Processing
  for (const rule of KEYWORD_CATEGORY_RULES) {
    const hasKeyword = rule.keywords.some((kw) => text.includes(kw));
    if (hasKeyword) {
      // If rule specifies gender and product has explicit opposing gender, skip
      if (rule.gender && product.gender) {
        const prodGen = product.gender.toLowerCase();
        if (rule.gender === 'men' && (prodGen === 'women' || prodGen === 'girls')) continue;
        if (rule.gender === 'women' && (prodGen === 'men' || prodGen === 'boys')) continue;
      }

      rule.categoryIds.forEach((id) => assignedSet.add(id));
      matchedRules.push(rule.keywords.find((kw) => text.includes(kw)) || '');
    }
  }

  // 2. Direct name matching across all taxonomy categories
  for (const opt of allFlattened) {
    const optName = opt.name.toLowerCase();
    if (optName.length > 3 && text.includes(optName)) {
      assignedSet.add(opt.id);
      if (opt.slug) assignedSet.add(opt.slug);
    }
  }

  // 3. Price-Based & Deals Categorization (Under 499, Under 999, 50%+ Off)
  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || 0);

  if (price > 0 && price <= 499) {
    assignedSet.add('spot_budget_finds');
    assignedSet.add('cat_women_sale_under_499');
    assignedSet.add('cat_men_sale_under_499');
    matchedRules.push('Budget Deals (Under ₹499)');
  } else if (price > 0 && price <= 999) {
    assignedSet.add('spot_budget_finds');
    assignedSet.add('cat_women_sale_under_999');
    assignedSet.add('cat_men_sale_under_999');
    matchedRules.push('Deals (Under ₹999)');
  }

  // 4. Discount-Based (50%+ Off)
  if (compareAtPrice > price && price > 0) {
    const discountPct = ((compareAtPrice - price) / compareAtPrice) * 100;
    if (discountPct >= 50) {
      assignedSet.add('cat_women_sale_50_off');
      assignedSet.add('cat_men_sale_50_off');
      matchedRules.push('Mega Discount (50%+ Off)');
    }
  }

  // 5. Spotlight & Curations
  assignedSet.add('spot_trending_now');
  assignedSet.add('spot_new_season');

  // If no category matched, assign default fallback
  if (assignedSet.size === 0) {
    assignedSet.add('cat_women_sarees');
    assignedSet.add('group_women');
  }

  const categoryIds = Array.from(assignedSet);
  const primaryCategoryId = categoryIds[0] || 'cat_women_sarees';

  const matchedLabels = categoryIds
    .map((id) => {
      const found = allFlattened.find((c) => c.id === id || c.slug === id);
      return found?.name || id;
    })
    .filter(Boolean);

  return {
    primaryCategoryId,
    categoryIds,
    matchedLabels,
    matchedRules: Array.from(new Set(matchedRules.filter(Boolean))),
  };
}
