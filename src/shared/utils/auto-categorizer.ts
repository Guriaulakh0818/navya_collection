import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';

export interface RankedCategoryCandidate {
  categoryId: string;
  name: string;
  breadcrumb: string;
  score: number;
  matchPercentage: number;
  suggestedProductType: string;
  departmentGroup: 'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops';
  deptId: 'dept_women' | 'dept_men' | 'dept_kids';
  subId: string;
  reasons: string[];
}

export interface SpotlightCurationItem {
  id: string;
  name: string;
  badge?: string;
  reason: string;
  tier: 'style' | 'deals' | 'lifecycle';
}

export interface ExtractedAttributes {
  fabric?: string;
  pattern?: string;
  sleeve?: string;
  neck?: string;
  fit?: string;
  occasion?: string;
  suggestedGstRate?: number;
  suggestedHsnCode?: string;
}

export interface AutoCategorizeResult {
  primaryCategoryId: string;
  categoryIds: string[];
  matchedLabels: string[];
  matchedRules: string[];
  suggestedProductType?: string;
  departmentGroup?: 'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops';
  topCandidates: RankedCategoryCandidate[];
  spotlightCurations: SpotlightCurationItem[];
  extractedAttributes: ExtractedAttributes;
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

// -----------------------------------------------------------------------------
// 1. TYPO-TOLERANCE & HINGLISH SYNONYM NORMALIZATION
// -----------------------------------------------------------------------------
const SYNONYM_DICTIONARY: [RegExp, string][] = [
  // Plazo / Palazzo
  [/\b(plazo|plazzo|palazo|pallazo|palazzos)\b/gi, 'palazzo'],
  // Lehenga / Lehnga
  [/\b(lehnga|lahenga|lahnga|lehengas|ghagra|chaniya\s*choli)\b/gi, 'lehenga'],
  // Pajama / Pyjama
  [/\b(payjama|pyjama|pajamas|pyjamas|payjamas)\b/gi, 'pajama'],
  // T-Shirt / Tee
  [/\b(t-?shrt|tshrt|t-?shir|teeshirt|teeshirts)\b/gi, 't-shirt'],
  // Chunni / Dupatta
  [/\b(chunni|dupata|chuni|odhni|duppatta|dupatas)\b/gi, 'dupatta'],
  // Jeggings / Denim
  [/\b(jeggins|jeggings|jeen|jeens)\b/gi, 'jeans'],
  // Chudidar / Churidar
  [/\b(chudidar|churidaar|chudidaar)\b/gi, 'churidar'],
  // Kurta / Kurti
  [/\b(kurtee|kurties|kurtis)\b/gi, 'kurti'],
  // Coord / Co-ord
  [/\b(co\s*ord|two\s*piece\s*set|matching\s*set|2\s*piece\s*set)\b/gi, 'coord'],
  // Anarkali
  [/\b(anarkly|anarkali\s*suit|anarkali\s*set)\b/gi, 'anarkali set'],
  // Nighty
  [/\b(nighty|nightie|nightsuit|night\s*suit)\b/gi, 'nightwear'],
];

function normalizeText(input: string): string {
  let text = ` ${input.toLowerCase()} `;
  for (const [regex, replacement] of SYNONYM_DICTIONARY) {
    text = text.replace(regex, replacement);
  }
  return text.trim();
}

function hasWord(text: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i').test(text);
  }
  return pattern.test(text);
}

// -----------------------------------------------------------------------------
// 2. CANDIDATE DEFINITIONS FOR MULTI-FACTOR WEIGHTED SCORING
// -----------------------------------------------------------------------------
interface CategoryRuleDef {
  categoryId: string;
  name: string;
  department: 'women' | 'men' | 'kids';
  deptId: 'dept_women' | 'dept_men' | 'dept_kids';
  subId: string;
  productType: string;
  departmentGroup: 'group_women' | 'group_men' | 'group_kids';
  parentCategoryIds: string[];
  primaryTerms: { term: string | RegExp; weight: number; reason: string }[];
  contextTerms: { term: string | RegExp; weight: number; reason: string }[];
  negativeTerms?: (string | RegExp)[];
}

const CATEGORY_RULES: CategoryRuleDef[] = [
  // ===========================================================================
  // WOMEN CATEGORIES
  // ===========================================================================
  {
    categoryId: 'cat_women_sarees',
    name: 'Sarees',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_indian',
    productType: 'women_sarees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_indian_wear'],
    primaryTerms: [{ term: /\b(saree|sari|saris|sarees)\b/i, weight: 60, reason: 'Saree keyword' }],
    contextTerms: [
      {
        term: /\b(banarasi|kanjeevaram|kanjivaram|paithani|bandhani|patola|chanderi|zari|pallu|blouse\s+piece)\b/i,
        weight: 25,
        reason: 'Traditional saree weave / feature',
      },
      {
        term: /\b(organza|georgette|chiffon|silk|tussar|linen|cotton\s+silk)\b/i,
        weight: 15,
        reason: 'Saree fabric',
      },
    ],
    negativeTerms: [/\b(saree\s+shapewear|saree\s+blouse\s+only|petticoat)\b/i],
  },
  {
    categoryId: 'cat_women_kurta_sets',
    name: 'Kurta Sets & Suits',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_indian',
    productType: 'women_kurta_sets',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_indian_wear'],
    primaryTerms: [
      {
        term: /\b(kurta\s+set|kurti\s+set|suit\s+set|salwar\s+suit|anarkali\s+set|sharara\s+set|gharara\s+set|palazzo\s+suit|pant\s+set|kurta\s+with\s+pant|kurti\s+with\s+palazzo|suit\s+with\s+dupatta|unstitched\s+suit|dress\s+material)\b/i,
        weight: 65,
        reason: 'Multi-piece Indian suit/set',
      },
      { term: /\b(sharara|gharara|salwar)\b/i, weight: 40, reason: 'Ethnic suit bottom' },
    ],
    contextTerms: [
      {
        term: /\b(with\s+dupatta|with\s+palazzo|with\s+pant|with\s+trousers|3\s*piece|set\s+of\s+2|set\s+of\s+3)\b/i,
        weight: 25,
        reason: 'Compound set indicator',
      },
      {
        term: /\b(chanderi|chikankari|gotapatti|bandhani|angrakha|anarkali)\b/i,
        weight: 15,
        reason: 'Ethnic work/style',
      },
    ],
  },
  {
    categoryId: 'cat_women_kurtas',
    name: 'Kurtas & Kurtis',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_indian',
    productType: 'women_kurtas',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_indian_wear'],
    primaryTerms: [
      {
        term: /\b(kurti|kurta|kurtis|kurtas|tunic\s+kurti)\b/i,
        weight: 50,
        reason: 'Single Kurta/Kurti',
      },
      {
        term: /\b(anarkali|chikankari|angrakha|straight\s+kurti|a-line\s+kurti|short\s+kurti|flared\s+kurti)\b/i,
        weight: 35,
        reason: 'Kurti style',
      },
    ],
    contextTerms: [
      {
        term: /\b(daily\s+wear|office\s+wear|calf\s+length|knee\s+length|round\s+neck|v\s*neck)\b/i,
        weight: 15,
        reason: 'Kurti styling',
      },
    ],
    negativeTerms: [
      /\b(kurta\s+set|kurti\s+set|suit\s+set|with\s+pant|with\s+palazzo|with\s+dupatta)\b/i,
    ],
  },
  {
    categoryId: 'cat_women_lehengas',
    name: 'Lehengas',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_indian',
    productType: 'women_lehengas',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_indian_wear'],
    primaryTerms: [
      {
        term: /\b(lehenga|choli|ghagra|chaniya\s+choli|bridal\s+lehenga|semi\s+stitched\s+lehenga)\b/i,
        weight: 65,
        reason: 'Lehenga garment',
      },
    ],
    contextTerms: [
      {
        term: /\b(flair|can\s*can|zari\s+embroidered|bridal|wedding|sangeet|mehendi)\b/i,
        weight: 20,
        reason: 'Festive bridal attributes',
      },
    ],
  },
  {
    categoryId: 'cat_women_ethnic_dresses',
    name: 'Ethnic Dresses & Gowns',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_indian',
    productType: 'women_dresses',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_indian_wear'],
    primaryTerms: [
      {
        term: /\b(ethnic\s+dress|ethnic\s+gown|indo\s*western\s+dress|indo\s*western\s+gown)\b/i,
        weight: 60,
        reason: 'Indo-western/ethnic dress',
      },
    ],
    contextTerms: [
      {
        term: /\b(maxi|flared|embellished|floor\s+length)\b/i,
        weight: 20,
        reason: 'Gown length/styling',
      },
    ],
  },
  {
    categoryId: 'cat_women_tops_tees',
    name: 'Tops & Tees',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_tops_tees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(crop\s+top|tank\s+top|peplum|peplum\s+top|corset|camisole|halter\s+top|tunic\s+top|ruffle\s+top|tees?|t-?shirts?)\b/i,
        weight: 55,
        reason: 'Western top/tee',
      },
      { term: /\b(top|tops|blouse)\b/i, weight: 35, reason: 'General top' },
    ],
    contextTerms: [
      {
        term: /\b(ribbed|knit|casual|graphic|crewneck|v\s*neck)\b/i,
        weight: 15,
        reason: 'Topwear attribute',
      },
    ],
    negativeTerms: [/\b(saree\s+blouse|suit|kurti|dress|lehenga)\b/i],
  },
  {
    categoryId: 'cat_women_shirts',
    name: "Women's Shirts",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_tops_tees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(shirts?|formal\s+shirt|casual\s+shirt|oxford\s+shirt|linen\s+shirt|button\s+down\s+shirt|satin\s+shirt)\b/i,
        weight: 55,
        reason: 'Women shirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(collared|full\s+sleeve|cuff|spread\s+collar)\b/i,
        weight: 20,
        reason: 'Shirt styling',
      },
    ],
    negativeTerms: [/\b(t-?shirt|tee|polo)\b/i],
  },
  {
    categoryId: 'cat_women_dresses',
    name: 'Dresses & Gowns',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_dresses',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(dresses?|gowns?|maxi\s+dress|midi\s+dress|mini\s+dress|bodycon|wrap\s+dress|shirt\s+dress|a-line\s+dress|skater\s+dress)\b/i,
        weight: 60,
        reason: 'Western dress',
      },
    ],
    contextTerms: [
      {
        term: /\b(party|evening|cocktail|floral\s+dress|sleeveless\s+dress)\b/i,
        weight: 20,
        reason: 'Dress occasion',
      },
    ],
    negativeTerms: [/\b(dressing\s+gown|dress\s+material|unstitched)\b/i],
  },
  {
    categoryId: 'cat_women_coord_sets',
    name: 'Co-ord Sets',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_coords',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(coord|co-ord|coord\s+set|co-ord\s+set|two\s+piece\s+set|matching\s+set|blazer\s+set|skirt\s+set)\b/i,
        weight: 65,
        reason: 'Co-ord set',
      },
    ],
    contextTerms: [
      {
        term: /\b(korean|linen\s+coord|top\s+and\s+pant\s+set)\b/i,
        weight: 20,
        reason: 'Coord styling',
      },
    ],
  },
  {
    categoryId: 'cat_women_jeans',
    name: "Women's Jeans",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_jeans',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(jeans|denim\s+pants|skinny\s+jeans|mom\s+jeans|flared\s+jeans|wide\s+leg\s+jeans|boyfriend\s+jeans|high\s+waist\s+jeans)\b/i,
        weight: 65,
        reason: 'Jeans bottomwear',
      },
    ],
    contextTerms: [
      {
        term: /\b(denim|stretchable|washed|distressed|ripped|ankle\s+length)\b/i,
        weight: 20,
        reason: 'Denim attributes',
      },
    ],
    negativeTerms: [/\b(denim\s+jacket|denim\s+shirt)\b/i],
  },
  {
    categoryId: 'cat_women_trousers',
    name: "Women's Trousers",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_trousers',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(trousers?|formal\s+pants|chinos?|palazzo|palazzos|culottes|wide\s+leg\s+pants|cigarette\s+pants)\b/i,
        weight: 55,
        reason: 'Trousers/Pants',
      },
    ],
    contextTerms: [
      { term: /\b(formal|office|pleated|high\s+rise)\b/i, weight: 20, reason: 'Trouser styling' },
    ],
    negativeTerms: [/\b(kurta\s+set|suit\s+set|with\s+palazzo)\b/i],
  },
  {
    categoryId: 'cat_women_jumpsuits',
    name: 'Jumpsuits & Playsuits',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_jumpsuits',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(jumpsuits?|rompers?|playsuits?|dungarees?)\b/i,
        weight: 65,
        reason: 'Jumpsuit garment',
      },
    ],
    contextTerms: [
      { term: /\b(belted|sleeveless|flared\s+leg)\b/i, weight: 20, reason: 'Jumpsuit style' },
    ],
  },
  {
    categoryId: 'cat_women_skirts',
    name: 'Skirts',
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_western',
    productType: 'women_skirts',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_western_wear'],
    primaryTerms: [
      {
        term: /\b(skirts?|pleated\s+skirt|denim\s+skirt|mini\s+skirt|maxi\s+skirt|pencil\s+skirt|flared\s+skirt)\b/i,
        weight: 60,
        reason: 'Skirt garment',
      },
    ],
    contextTerms: [
      { term: /\b(high\s+waist|a-line|button\s+front)\b/i, weight: 20, reason: 'Skirt attribute' },
    ],
  },
  {
    categoryId: 'cat_women_sweaters',
    name: "Women's Sweaters & Cardigans",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_winter',
    productType: 'women_tops_tees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_winter_outerwear'],
    primaryTerms: [
      {
        term: /\b(sweaters?|cardigans?|pullover|knitwear|woolen\s+sweater)\b/i,
        weight: 60,
        reason: 'Sweater/Knitwear',
      },
    ],
    contextTerms: [
      {
        term: /\b(warm|wool|cashmere|cable\s+knit|winter)\b/i,
        weight: 25,
        reason: 'Winter attributes',
      },
    ],
  },
  {
    categoryId: 'cat_women_sweatshirts',
    name: "Women's Hoodies & Sweatshirts",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_winter',
    productType: 'women_tops_tees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_winter_outerwear'],
    primaryTerms: [
      {
        term: /\b(hoodies?|sweatshirts?|fleece\s+pullover|hooded\s+sweatshirt)\b/i,
        weight: 65,
        reason: 'Hoodie/Sweatshirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(kangaroo\s+pocket|oversized|fleece|graphic\s+hoodie)\b/i,
        weight: 20,
        reason: 'Hoodie attribute',
      },
    ],
  },
  {
    categoryId: 'cat_women_jackets',
    name: "Women's Jackets & Coats",
    department: 'women',
    deptId: 'dept_women',
    subId: 'sub_women_winter',
    productType: 'women_tops_tees',
    departmentGroup: 'group_women',
    parentCategoryIds: ['cat_women_winter_outerwear'],
    primaryTerms: [
      {
        term: /\b(jackets?|blazers?|bomber\s+jacket|denim\s+jacket|leather\s+jacket|trench\s+coat|overcoat)\b/i,
        weight: 60,
        reason: 'Jacket/Blazer',
      },
    ],
    contextTerms: [
      { term: /\b(outerwear|winter|zip\s+up|puffer)\b/i, weight: 20, reason: 'Outerwear style' },
    ],
  },

  // ===========================================================================
  // MEN CATEGORIES
  // ===========================================================================
  {
    categoryId: 'cat_men_tshirts',
    name: "Men's T-Shirts",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_tshirts',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear'],
    primaryTerms: [
      {
        term: /\b(t-?shirt|tshirts?|tees?|graphic\s+tee|round\s+neck\s+tee|v-?neck\s+tee|crewneck\s+tee|oversized\s+t-?shirt)\b/i,
        weight: 60,
        reason: 'T-shirt keyword',
      },
    ],
    contextTerms: [
      {
        term: /\b(combed\s+cotton|half\s+sleeve|graphic|printed|solid\s+tee|bio\s*wash)\b/i,
        weight: 20,
        reason: 'T-shirt attributes',
      },
    ],
    negativeTerms: [/\b(polo|collared|shirt\s+formal)\b/i],
  },
  {
    categoryId: 'cat_men_polos',
    name: "Men's Polos",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_polos',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear'],
    primaryTerms: [
      {
        term: /\b(polo|polos|polo\s+t-?shirt|collared\s+t-?shirt|pique\s+polo)\b/i,
        weight: 65,
        reason: 'Polo shirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(ribbed\s+collar|matty|pique|button\s+placket)\b/i,
        weight: 20,
        reason: 'Polo features',
      },
    ],
  },
  {
    categoryId: 'cat_men_shirts',
    name: "Men's Shirts",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_shirts',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear'],
    primaryTerms: [
      {
        term: /\b(shirts?|casual\s+shirt|printed\s+shirt|linen\s+shirt|checked\s+shirt|striped\s+shirt|denim\s+shirt|cuban\s+collar|mandarin\s+collar)\b/i,
        weight: 55,
        reason: 'Men shirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(button\s+down|full\s+sleeve|half\s+sleeve|cotton\s+shirt|slim\s+fit\s+shirt)\b/i,
        weight: 20,
        reason: 'Shirt styling',
      },
    ],
    negativeTerms: [/\b(t-?shirt|tee|polo|sweatshirt)\b/i],
  },
  {
    categoryId: 'cat_men_formal_shirts',
    name: "Men's Formal Shirts",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_shirts',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear', 'cat_men_formal'],
    primaryTerms: [
      {
        term: /\b(formal\s+shirt|office\s+shirt|oxford\s+shirt|business\s+shirt|dress\s+shirt)\b/i,
        weight: 65,
        reason: 'Formal shirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(crisp|solid|formal|office|executive|spread\s+collar)\b/i,
        weight: 25,
        reason: 'Formal work attributes',
      },
    ],
  },
  {
    categoryId: 'cat_men_jeans',
    name: "Men's Jeans",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_bottomwear',
    productType: 'men_jeans',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_bottomwear'],
    primaryTerms: [
      {
        term: /\b(jeans|denim\s+pants|skinny\s+jeans|slim\s+fit\s+jeans|tapered\s+jeans|straight\s+fit\s+jeans|bootcut\s+jeans)\b/i,
        weight: 65,
        reason: 'Men jeans',
      },
    ],
    contextTerms: [
      {
        term: /\b(denim|washed|distressed|mid\s+rise|stretchable)\b/i,
        weight: 20,
        reason: 'Denim wash/fit',
      },
    ],
  },
  {
    categoryId: 'cat_men_trousers',
    name: "Men's Trousers",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_bottomwear',
    productType: 'men_trousers',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_bottomwear'],
    primaryTerms: [
      {
        term: /\b(trousers?|formal\s+trousers?|formal\s+pants?|pleated\s+trousers?|office\s+pants?)\b/i,
        weight: 60,
        reason: 'Men trousers',
      },
    ],
    contextTerms: [
      {
        term: /\b(formal|office|creased|flat\s+front|slim\s+trouser)\b/i,
        weight: 20,
        reason: 'Trouser fit',
      },
    ],
  },
  {
    categoryId: 'cat_men_chinos',
    name: "Men's Chinos",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_bottomwear',
    productType: 'men_chinos',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_bottomwear'],
    primaryTerms: [
      {
        term: /\b(chinos?|cotton\s+trousers?|casual\s+trousers?|khakis?)\b/i,
        weight: 60,
        reason: 'Men chinos',
      },
    ],
    contextTerms: [
      {
        term: /\b(stretch\s+cotton|slim\s+fit|casual\s+smart)\b/i,
        weight: 20,
        reason: 'Chino features',
      },
    ],
  },
  {
    categoryId: 'cat_men_cargos',
    name: "Men's Cargo Pants",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_bottomwear',
    productType: 'men_cargos',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_bottomwear'],
    primaryTerms: [
      {
        term: /\b(cargos?|cargo\s+pants?|cargo\s+trousers?|tactical\s+pants?|combat\s+pants?)\b/i,
        weight: 65,
        reason: 'Cargo pants',
      },
    ],
    contextTerms: [
      {
        term: /\b(multi\s+pocket|streetwear|baggy|drawstring)\b/i,
        weight: 20,
        reason: 'Cargo styling',
      },
    ],
  },
  {
    categoryId: 'cat_men_kurtas',
    name: "Men's Kurtas",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_ethnic',
    productType: 'men_kurtas',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_ethnic'],
    primaryTerms: [
      {
        term: /\b(kurta|kurtas|short\s+kurta|pathani\s+kurta|mandarin\s+kurta)\b/i,
        weight: 55,
        reason: 'Men kurta',
      },
    ],
    contextTerms: [
      {
        term: /\b(cotton\s+kurta|festive|chikankari|ethnic)\b/i,
        weight: 20,
        reason: 'Kurta attributes',
      },
    ],
    negativeTerms: [/\b(kurta\s+pajama|kurta\s+set|suit)\b/i],
  },
  {
    categoryId: 'cat_men_kurta_sets',
    name: "Men's Kurta Sets & Pajama",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_ethnic',
    productType: 'men_kurta_sets',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_ethnic'],
    primaryTerms: [
      {
        term: /\b(kurta\s+pajama|kurta\s+set|dhoti\s+kurta|sherwani\s+set|kurta\s+with\s+churidar)\b/i,
        weight: 65,
        reason: 'Men ethnic set',
      },
    ],
    contextTerms: [
      {
        term: /\b(with\s+pajama|with\s+dhoti|festive\s+set|wedding)\b/i,
        weight: 25,
        reason: 'Set components',
      },
    ],
  },
  {
    categoryId: 'cat_men_hoodies',
    name: "Men's Hoodies",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_hoodies',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear'],
    primaryTerms: [
      {
        term: /\b(hoodies?|hooded\s+sweatshirt|pullover\s+hoodie|zipper\s+hoodie)\b/i,
        weight: 65,
        reason: 'Hoodie',
      },
    ],
    contextTerms: [
      {
        term: /\b(kangaroo\s+pocket|drawstring|fleece|winter)\b/i,
        weight: 20,
        reason: 'Hoodie attributes',
      },
    ],
  },
  {
    categoryId: 'cat_men_sweatshirts',
    name: "Men's Sweatshirts",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_topwear',
    productType: 'men_sweatshirts',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_topwear'],
    primaryTerms: [
      {
        term: /\b(sweatshirts?|crewneck\s+sweatshirt|fleece\s+pullover)\b/i,
        weight: 65,
        reason: 'Sweatshirt',
      },
    ],
    contextTerms: [
      {
        term: /\b(ribbed\s+cuff|crew\s+neck|warm|winter)\b/i,
        weight: 20,
        reason: 'Sweatshirt features',
      },
    ],
  },
  {
    categoryId: 'cat_men_blazers',
    name: "Men's Blazers & Suits",
    department: 'men',
    deptId: 'dept_men',
    subId: 'men_formal',
    productType: 'men_blazers',
    departmentGroup: 'group_men',
    parentCategoryIds: ['cat_men_formal'],
    primaryTerms: [
      {
        term: /\b(blazers?|suits?|tuxedo|formal\s+coat|waistcoat)\b/i,
        weight: 65,
        reason: 'Blazer/Suit',
      },
    ],
    contextTerms: [
      {
        term: /\b(single\s+breasted|double\s+breasted|slim\s+fit|wedding|formal)\b/i,
        weight: 20,
        reason: 'Suit style',
      },
    ],
  },

  // ===========================================================================
  // KIDS CATEGORIES
  // ===========================================================================
  {
    categoryId: 'cat_boys_tshirts',
    name: "Boys' T-Shirts",
    department: 'kids',
    deptId: 'dept_kids',
    subId: 'kids_boys',
    productType: 'kids_boys_clothing',
    departmentGroup: 'group_kids',
    parentCategoryIds: ['cat_kids_boys', 'cat_kids_all_fashion'],
    primaryTerms: [
      {
        term: /\b(boys?\s+t-?shirt|boys?\s+tee|graphic\s+tee\s+for\s+boys?)\b/i,
        weight: 65,
        reason: 'Boy t-shirt',
      },
    ],
    contextTerms: [
      { term: /\b(cartoon|printed|half\s+sleeve|cotton)\b/i, weight: 20, reason: 'Kids graphics' },
    ],
  },
  {
    categoryId: 'cat_girls_dresses',
    name: "Girls' Dresses & Frocks",
    department: 'kids',
    deptId: 'dept_kids',
    subId: 'kids_girls',
    productType: 'kids_girls_clothing',
    departmentGroup: 'group_kids',
    parentCategoryIds: ['cat_kids_girls', 'cat_kids_all_fashion'],
    primaryTerms: [
      {
        term: /\b(girls?\s+dress|frocks?|girls?\s+frock|party\s+dress\s+for\s+girls?)\b/i,
        weight: 65,
        reason: 'Girl dress/frock',
      },
    ],
    contextTerms: [
      {
        term: /\b(ruffle|princess|birthday|cute|tulle|flared)\b/i,
        weight: 25,
        reason: 'Frock styling',
      },
    ],
  },
  {
    categoryId: 'cat_kids_ethnic_wear',
    name: "Kids' Ethnic Wear",
    department: 'kids',
    deptId: 'dept_kids',
    subId: 'kids_ethnic',
    productType: 'kids_ethnic_wear',
    departmentGroup: 'group_kids',
    parentCategoryIds: ['cat_kids_all_fashion'],
    primaryTerms: [
      {
        term: /\b(kids?\s+ethnic|boys?\s+kurta|girls?\s+lehenga|kids?\s+sherwani|dhoti\s+kurta\s+for\s+boys?)\b/i,
        weight: 65,
        reason: 'Kids ethnic',
      },
    ],
    contextTerms: [
      { term: /\b(festive|diwali|wedding|traditional)\b/i, weight: 20, reason: 'Kids festive' },
    ],
  },
  {
    categoryId: 'cat_baby_rompers',
    name: 'Baby Rompers & Sets',
    department: 'kids',
    deptId: 'dept_kids',
    subId: 'kids_baby',
    productType: 'kids_baby_clothing',
    departmentGroup: 'group_kids',
    parentCategoryIds: ['cat_kids_baby', 'cat_kids_all_fashion'],
    primaryTerms: [
      {
        term: /\b(rompers?|onesies?|baby\s+suit|infant\s+wear|newborn\s+clothing|bodysuit)\b/i,
        weight: 65,
        reason: 'Baby romper',
      },
    ],
    contextTerms: [
      {
        term: /\b(snap\s+button|soft\s+cotton|infant|toddler|newborn)\b/i,
        weight: 25,
        reason: 'Infant wear features',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 3. ATTRIBUTE EXTRACTION ENGINE (Title -> Attributes)
// -----------------------------------------------------------------------------
const FABRIC_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Banarasi Silk', regex: /\b(banarasi\s+silk|banarasi)\b/i },
  { name: 'Kanjeevaram Silk', regex: /\b(kanjeevaram|kanjivaram)\b/i },
  { name: 'Pure Cotton', regex: /\b(pure\s+cotton|100%\s+cotton|combed\s+cotton)\b/i },
  { name: 'Cotton Silk', regex: /\b(cotton\s+silk)\b/i },
  { name: 'Georgette', regex: /\b(georgette|pure\s+georgette)\b/i },
  { name: 'Chiffon', regex: /\b(chiffon|pure\s+chiffon)\b/i },
  { name: 'Chanderi', regex: /\b(chanderi|chanderi\s+silk|chanderi\s+cotton)\b/i },
  { name: 'Organza', regex: /\b(organza|pure\s+organza)\b/i },
  { name: 'Rayon', regex: /\b(rayon|viscose\s+rayon)\b/i },
  { name: 'Linen', regex: /\b(linen|pure\s+linen)\b/i },
  { name: 'Denim', regex: /\b(denim|cotton\s+denim)\b/i },
  { name: 'Velvet', regex: /\b(velvet)\b/i },
  { name: 'Satin', regex: /\b(satin|silk\s+satin)\b/i },
  { name: 'Cotton', regex: /\b(cotton)\b/i },
  { name: 'Silk', regex: /\b(silk)\b/i },
];

const PATTERN_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Floral Printed', regex: /\b(floral|flower\s+print|floral\s+printed)\b/i },
  { name: 'Zari Work', regex: /\b(zari|zari\s+border|gold\s+zari|silver\s+zari)\b/i },
  { name: 'Chikankari', regex: /\b(chikankari|chikan\s+work|lucknowi)\b/i },
  { name: 'Embroidered', regex: /\b(embroidered|embroidery|thread\s+work)\b/i },
  { name: 'Bandhani', regex: /\b(bandhani|tie\s*(&|and)?\s*dye|bandhej)\b/i },
  { name: 'Block Printed', regex: /\b(block\s+print|hand\s*block|kalamkari)\b/i },
  { name: 'Striped', regex: /\b(striped|stripes)\b/i },
  { name: 'Checked', regex: /\b(checked|checks|plaid)\b/i },
  { name: 'Graphic', regex: /\b(graphic|printed\s+graphic|typography)\b/i },
  { name: 'Solid', regex: /\b(solid|plain)\b/i },
  { name: 'Printed', regex: /\b(printed|print)\b/i },
];

const SLEEVE_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Sleeveless', regex: /\b(sleeveless|without\s+sleeves?)\b/i },
  { name: 'Full Sleeve', regex: /\b(full\s+sleeves?|long\s+sleeves?)\b/i },
  { name: '3/4th Sleeve', regex: /\b(3\/4th?\s+sleeves?|three\s+quarter\s+sleeves?)\b/i },
  { name: 'Half Sleeve', regex: /\b(half\s+sleeves?|short\s+sleeves?)\b/i },
];

function extractAttributesFromText(text: string, price: number): ExtractedAttributes {
  const result: ExtractedAttributes = {};

  for (const item of FABRIC_PATTERNS) {
    if (item.regex.test(text)) {
      result.fabric = item.name;
      break;
    }
  }

  for (const item of PATTERN_PATTERNS) {
    if (item.regex.test(text)) {
      result.pattern = item.name;
      break;
    }
  }

  for (const item of SLEEVE_PATTERNS) {
    if (item.regex.test(text)) {
      result.sleeve = item.name;
      break;
    }
  }

  // Suggest GST Rate & HSN Code
  if (price > 0) {
    result.suggestedGstRate = price <= 1000 ? 5 : 12;
  }

  // Suggest HSN
  if (/\b(saree|sari|kurta|kurti|lehenga|suit)\b/i.test(text)) {
    result.suggestedHsnCode = '6204'; // Women Suits, Ensembles, Dresses
  } else if (/\b(t-?shirt|tee|polo)\b/i.test(text)) {
    result.suggestedHsnCode = '6109'; // T-Shirts, singlets, knitted
  } else if (/\b(shirt|trousers|jeans|blazer)\b/i.test(text)) {
    result.suggestedHsnCode = '6203'; // Men Suits, Ensembles, Trousers, Shirts
  }

  return result;
}

// -----------------------------------------------------------------------------
// 4. MAIN AUTO-CATEGORIZATION & SHORTLISTING FUNCTION
// -----------------------------------------------------------------------------
export function autoCategorizeProduct(
  product: ProductInputForCategorization,
): AutoCategorizeResult {
  const rawTitle = product.name || '';
  const rawDesc = product.description || '';
  const rawFabric = product.fabric || '';
  const rawOccasion = product.occasion || '';

  const normalizedTitle = normalizeText(rawTitle);
  const normalizedDesc = normalizeText(rawDesc);
  const normalizedFabric = normalizeText(rawFabric);
  const normalizedOccasion = normalizeText(rawOccasion);

  const fullText =
    `${normalizedTitle} ${normalizedDesc} ${normalizedFabric} ${normalizedOccasion}`.toLowerCase();
  const allFlattened = getFlattenedCategoryOptions();
  const assignedCategoryIds = new Set<string>();
  const matchedRules: string[] = [];

  // Determine explicit or inferred gender
  let gender = (product.gender || '').toLowerCase().trim();
  if (!gender) {
    if (
      hasWord(
        fullText,
        /\b(women|woman|ladies|female|mrs|miss|saree|sari|lehenga|kurti|anarkali|choli|bra|bras|pantie|panties|lingerie|camisole|petticoat|frock)\b/i,
      )
    ) {
      gender = 'women';
    } else if (
      hasWord(
        fullText,
        /\b(men|man|gents|male|mr|sherwani|dhoti|kurta\s+pajama|nehru\s+jacket|bandhgala|boxers?|briefs?)\b/i,
      )
    ) {
      gender = 'men';
    } else if (
      hasWord(
        fullText,
        /\b(kids?|baby|infant|toddler|newborn|children|boys?\s+clothing|girls?\s+clothing)\b/i,
      )
    ) {
      gender = 'kids';
    } else {
      gender = 'women';
    }
  }

  // Score each Category Candidate using Multi-Factor Weights
  const candidateScores: {
    rule: CategoryRuleDef;
    score: number;
    reasons: string[];
  }[] = [];

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const reasons: string[] = [];

    // Gender boost or penalty
    if (rule.department === gender) {
      score += 20;
      reasons.push(`Matches target gender (${gender})`);
    } else {
      score -= 40; // Mismatched gender gets heavy penalty
    }

    // Check negative terms
    if (rule.negativeTerms) {
      const isDisqualified = rule.negativeTerms.some((neg) => hasWord(fullText, neg));
      if (isDisqualified) {
        continue; // Skip this category if negative keyword matched
      }
    }

    // Check primary terms (High weight 50-65)
    for (const pt of rule.primaryTerms) {
      if (hasWord(normalizedTitle, pt.term)) {
        score += pt.weight;
        reasons.push(`${pt.reason} in title (+${pt.weight})`);
      } else if (hasWord(fullText, pt.term)) {
        score += Math.round(pt.weight * 0.7);
        reasons.push(`${pt.reason} in description (+${Math.round(pt.weight * 0.7)})`);
      }
    }

    // Check context / secondary terms (Weight 15-25)
    for (const ct of rule.contextTerms) {
      if (hasWord(fullText, ct.term)) {
        score += ct.weight;
        reasons.push(`${ct.reason} matched (+${ct.weight})`);
      }
    }

    if (score > 15) {
      candidateScores.push({ rule, score, reasons });
    }
  }

  // Sort candidates by highest score
  candidateScores.sort((a, b) => b.score - a.score);

  // Compute Top Candidates with breadcrumbs and match percentages
  const maxScore = candidateScores.length > 0 ? Math.max(candidateScores[0].score, 80) : 80;
  const topCandidates: RankedCategoryCandidate[] = candidateScores.slice(0, 4).map((c) => {
    const flatCat = allFlattened.find((f: any) => f.id === c.rule.categoryId);
    const breadcrumb = flatCat?.breadcrumb || `${c.rule.department.toUpperCase()} > ${c.rule.name}`;
    const pct = Math.min(99, Math.max(55, Math.round((c.score / maxScore) * 98)));

    return {
      categoryId: c.rule.categoryId,
      name: c.rule.name,
      breadcrumb,
      score: c.score,
      matchPercentage: pct,
      suggestedProductType: c.rule.productType,
      departmentGroup: c.rule.departmentGroup,
      deptId: c.rule.deptId,
      subId: c.rule.subId,
      reasons: c.reasons,
    };
  });

  // Assign Top Candidate categories to output
  let primaryCategoryId = 'cat_women_sarees';
  let suggestedProductType = 'women_sarees';
  let departmentGroup:
    'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops' =
    gender === 'men' ? 'group_men' : gender === 'kids' ? 'group_kids' : 'group_women';

  if (topCandidates.length > 0) {
    const winner = topCandidates[0];
    primaryCategoryId = winner.categoryId;
    suggestedProductType = winner.suggestedProductType;
    departmentGroup = winner.departmentGroup;
    assignedCategoryIds.add(winner.categoryId);

    const winningRule = CATEGORY_RULES.find((r) => r.categoryId === winner.categoryId);
    if (winningRule) {
      winningRule.parentCategoryIds.forEach((pid) => assignedCategoryIds.add(pid));
      matchedRules.push(winner.name);
    }
  } else {
    // Default fallback if no match found
    if (gender === 'men') {
      primaryCategoryId = 'cat_men_shirts';
      suggestedProductType = 'men_shirts';
      departmentGroup = 'group_men';
      assignedCategoryIds.add('cat_men_shirts');
      assignedCategoryIds.add('cat_men_topwear');
    } else if (gender === 'kids') {
      primaryCategoryId = 'cat_kids_all_fashion';
      suggestedProductType = 'kids_boys_clothing';
      departmentGroup = 'group_kids';
      assignedCategoryIds.add('cat_kids_all_fashion');
    } else {
      primaryCategoryId = 'cat_women_sarees';
      suggestedProductType = 'women_sarees';
      departmentGroup = 'group_women';
      assignedCategoryIds.add('cat_women_sarees');
      assignedCategoryIds.add('cat_women_indian_wear');
    }
  }

  // ---------------------------------------------------------------------------
  // 5. 4-TIER SPOTLIGHT & EXTRA CURATIONS GENERATOR
  // ---------------------------------------------------------------------------
  const spotlightCurations: SpotlightCurationItem[] = [];
  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || 0);

  // TIER 1: Style & Aesthetic Vibes
  // Festivals of India
  if (
    hasWord(
      fullText,
      /\b(saree|sari|lehenga|choli|kurta|kurti|salwar|anarkali|sherwani|bandhgala|dupatta|kundan|ethnic|festive|wedding|bridal|banarasi|zari|chanderi|diwali|puja)\b/i,
    ) ||
    primaryCategoryId.includes('indian_wear') ||
    primaryCategoryId.includes('saree') ||
    primaryCategoryId.includes('lehenga') ||
    primaryCategoryId.includes('kurta')
  ) {
    assignedCategoryIds.add('spot_festivals_india');
    spotlightCurations.push({
      id: 'spot_festivals_india',
      name: 'Festivals of India',
      badge: 'Festive Vibe',
      reason: 'Ethnic, Traditional, or Festive Garment',
      tier: 'style',
    });
    matchedRules.push('Festivals of India');
  }

  // Trendy Street & Gen Z Fashion
  if (
    hasWord(
      fullText,
      /\b(graphic|oversized|cargo|cargos|hoodie|hoodies|sweatshirt|streetwear|baggy|crop\s+top|denim|ripped|flared\s+jeans|parachute)\b/i,
    )
  ) {
    assignedCategoryIds.add('spot_trendy_street');
    assignedCategoryIds.add('spot_genz_fashion');
    spotlightCurations.push({
      id: 'spot_trendy_street',
      name: 'Trendy Street',
      badge: 'Streetwear',
      reason: 'Oversized, Graphic, Cargo, or Streetwear Style',
      tier: 'style',
    });
    spotlightCurations.push({
      id: 'spot_genz_fashion',
      name: 'Gen Z Fashion',
      badge: 'Trending',
      reason: 'Youth Fashion & Modern Aesthetic',
      tier: 'style',
    });
    matchedRules.push('Trendy Street & Gen Z');
  }

  // Korean Aesthetic Store
  if (
    hasWord(
      fullText,
      /\b(coord|co-ord|oversized|korean|aesthetic|pleated|minimal|crop\s+top|pastel|wrap\s+dress|shirt\s+dress|chic|clean\s+girl)\b/i,
    )
  ) {
    assignedCategoryIds.add('spot_korean_store');
    spotlightCurations.push({
      id: 'spot_korean_store',
      name: 'Korean Store',
      badge: 'K-Aesthetic',
      reason: 'Korean Minimalist, Pastel, or Co-ord Vibe',
      tier: 'style',
    });
    matchedRules.push('Korean Aesthetic Store');
  }

  // Sports & Activewear
  if (
    hasWord(
      fullText,
      /\b(polo|track\s*pants?|joggers?|activewear|sports?|gym|running|athletic|dri-fit|workout)\b/i,
    )
  ) {
    assignedCategoryIds.add('spot_sports_store');
    spotlightCurations.push({
      id: 'spot_sports_store',
      name: 'Sports Store',
      badge: 'Activewear',
      reason: 'Gym, Athletic, Joggers, or Sports Apparel',
      tier: 'style',
    });
    matchedRules.push('Sports & Activewear');
  }

  // Shop Your Vibe (Occasion based)
  if (hasWord(fullText, /\b(formal|office|executive|blazer|formal\s+shirt|formal\s+trousers)\b/i)) {
    assignedCategoryIds.add('spot_shop_your_vibe');
    spotlightCurations.push({
      id: 'spot_shop_your_vibe',
      name: 'Work / Office Vibe',
      badge: 'Office Style',
      reason: 'Formal & Professional Workwear',
      tier: 'style',
    });
  } else if (hasWord(fullText, /\b(party|evening|cocktail|bodycon|sequin|satin)\b/i)) {
    assignedCategoryIds.add('spot_shop_your_vibe');
    spotlightCurations.push({
      id: 'spot_shop_your_vibe',
      name: 'Party & Evening Vibe',
      badge: 'Party Look',
      reason: 'Glamorous Party & Night-Out Wear',
      tier: 'style',
    });
  }

  // TIER 2: Price & Deals Math Engine
  if (price > 0 && price <= 499) {
    assignedCategoryIds.add('spot_budget_finds');
    if (departmentGroup === 'group_women') assignedCategoryIds.add('cat_women_deals_under_499');
    if (departmentGroup === 'group_men') assignedCategoryIds.add('cat_men_deals_under_499');
    spotlightCurations.push({
      id: 'spot_budget_finds',
      name: 'Budget Finds (Under ₹499)',
      badge: 'Under ₹499',
      reason: `Affordable price: ₹${price}`,
      tier: 'deals',
    });
  } else if (price > 0 && price <= 999) {
    assignedCategoryIds.add('spot_budget_finds');
    if (departmentGroup === 'group_women') assignedCategoryIds.add('cat_women_deals_under_999');
    if (departmentGroup === 'group_men') assignedCategoryIds.add('cat_men_deals_under_999');
    spotlightCurations.push({
      id: 'spot_budget_finds',
      name: 'Budget Finds (Under ₹999)',
      badge: 'Under ₹999',
      reason: `Great budget find: ₹${price}`,
      tier: 'deals',
    });
  }

  if (compareAtPrice > price && price > 0) {
    const discountPct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    if (discountPct >= 50) {
      if (departmentGroup === 'group_women') assignedCategoryIds.add('cat_women_deals_50_off');
      if (departmentGroup === 'group_men') assignedCategoryIds.add('cat_men_deals_50_off');
      spotlightCurations.push({
        id: 'spot_trending_now',
        name: '50%+ Off Mega Sale',
        badge: `${discountPct}% OFF`,
        reason: `Huge discount: ${discountPct}% off MRP`,
        tier: 'deals',
      });
      matchedRules.push(`${discountPct}% Off Sale`);
    }
  }

  // TIER 3: Lifecycle & Status
  assignedCategoryIds.add('spot_new_season');
  assignedCategoryIds.add('spot_new_on_navya');
  spotlightCurations.push({
    id: 'spot_new_on_navya',
    name: 'New on Navya',
    badge: 'Fresh Arrival',
    reason: 'Newly listed collection',
    tier: 'lifecycle',
  });

  if (departmentGroup === 'group_women') assignedCategoryIds.add('cat_women_new_arrivals');
  if (departmentGroup === 'group_men') assignedCategoryIds.add('cat_men_new_arrivals');
  if (departmentGroup === 'group_kids') assignedCategoryIds.add('cat_kids_new_arrivals');

  // Filter against canonical taxonomy to guarantee 100% database / schema compatibility
  const validIdsSet = new Set(allFlattened.map((f: any) => f.id));
  const categoryIds = Array.from(assignedCategoryIds).filter((id) => validIdsSet.has(id));

  // Determine matched user-friendly labels
  const matchedLabels = categoryIds
    .map((id) => {
      const found = allFlattened.find((c: any) => c.id === id);
      return found?.name || id;
    })
    .filter(Boolean);

  // Extract attributes
  const extractedAttributes = extractAttributesFromText(fullText, price);

  return {
    primaryCategoryId,
    categoryIds,
    matchedLabels,
    matchedRules: Array.from(new Set(matchedRules.filter(Boolean))),
    suggestedProductType,
    departmentGroup,
    topCandidates,
    spotlightCurations,
    extractedAttributes,
  };
}
