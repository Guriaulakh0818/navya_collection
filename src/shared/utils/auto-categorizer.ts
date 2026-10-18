import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';

export interface AutoCategorizeResult {
  primaryCategoryId: string;
  categoryIds: string[];
  matchedLabels: string[];
  matchedRules: string[];
  suggestedProductType?: string;
  departmentGroup?: 'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops';
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

// Regex Helper for exact whole word or phrase matching
function hasWord(text: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i').test(text);
  }
  return pattern.test(text);
}

export function autoCategorizeProduct(
  product: ProductInputForCategorization,
): AutoCategorizeResult {
  const title = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const fabric = (product.fabric || '').toLowerCase();
  const occasion = (product.occasion || '').toLowerCase();
  const text = `${title} ${desc} ${fabric} ${occasion}`.toLowerCase();

  const allFlattened = getFlattenedCategoryOptions();
  const assignedSet = new Set<string>();
  const matchedRules: string[] = [];

  // Determine explicit or inferred gender
  let gender = (product.gender || '').toLowerCase();
  if (!gender) {
    if (
      hasWord(title, /women|woman|ladies|girl|female|mrs|miss|saree|lehenga|kurti|anarkali|choli/)
    ) {
      gender = 'women';
    } else if (hasWord(title, /men|man|gents|boy|male|mr|sherwani|dhoti|kurta pajama/)) {
      gender = 'men';
    } else if (hasWord(title, /kids|baby|toddler|infant|children/)) {
      gender = 'kids';
    }
  }

  // --- 1. MEN & WOMEN TOPWEAR REFINED DISCRIMINATION ---

  // Check specific garment types using word boundaries
  const isTShirt =
    hasWord(
      text,
      /\b(t-?shirt|tshirts?|tees?|graphic\s+tee|round\s+neck\s+tee|v-?neck\s+tee|crewneck\s+tee|oversized\s+t-?shirt)\b/i,
    ) ||
    hasWord(text, 't-shirt') ||
    hasWord(text, 'tshirt') ||
    hasWord(text, 'tee');

  const isPolo =
    hasWord(text, /\b(polo|polos|polo\s+t-?shirt|collared\s+t-?shirt)\b/i) ||
    hasWord(text, 'polo shirt') ||
    hasWord(text, 'polo tee');

  const isSweatshirt =
    hasWord(text, /\b(sweatshirts?|fleece\s+pullover|crewneck\s+sweatshirt)\b/i) ||
    hasWord(text, 'sweatshirt');

  const isHoodie =
    hasWord(text, /\b(hoodies?|hooded\s+sweatshirt|hooded\s+jacket|hooded\s+pullover)\b/i) ||
    hasWord(text, 'hoodie');

  const isSweater =
    !isHoodie &&
    !isSweatshirt &&
    (hasWord(
      text,
      /\b(sweaters?|cardigans?|knitwear|woolen\s+sweater|knit\s+sweater|wool\s+blend)\b/i,
    ) ||
      hasWord(text, 'sweater') ||
      hasWord(text, 'cardigan'));

  // Strict Button-Down / Formal / Casual Shirt (ONLY IF NOT T-Shirt / Sweatshirt / Sweater)
  const isShirt =
    !isTShirt &&
    !isSweatshirt &&
    !isSweater &&
    (hasWord(
      text,
      /\b(shirts?|formal\s+shirt|casual\s+shirt|oxford\s+shirt|linen\s+shirt|denim\s+shirt|printed\s+shirt|checked\s+shirt|striped\s+shirt|half\s+sleeve\s+shirt|full\s+sleeve\s+shirt|button\s+down)\b/i,
    ) ||
      hasWord(text, 'cuban collar') ||
      hasWord(text, 'mandarin collar'));

  // --- 2. MEN GARMENT MAPPING ---
  if (
    gender === 'men' ||
    (!gender && (isShirt || isTShirt || isPolo || isSweatshirt || isSweater || isHoodie))
  ) {
    if (isShirt) {
      assignedSet.add('cat_men_shirts');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Shirts");
    } else if (isPolo) {
      assignedSet.add('cat_men_polos');
      assignedSet.add('cat_men_tshirts');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Polos & T-Shirts");
    } else if (isTShirt) {
      assignedSet.add('cat_men_tshirts');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's T-Shirts");
    }

    if (isSweatshirt) {
      assignedSet.add('cat_men_sweatshirts');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Sweatshirts");
    }

    if (isHoodie) {
      assignedSet.add('cat_men_hoodies');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Hoodies");
    }

    if (isSweater) {
      assignedSet.add('cat_men_sweaters');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Sweaters");
    }

    // Men Ethnic Wear
    if (
      hasWord(text, /\b(kurta|sherwani|kurta\s+pajama|nehru\s+jacket|bandhgala|pathani|dhoti)\b/i)
    ) {
      assignedSet.add('cat_men_kurtas');
      assignedSet.add('cat_men_ethnic');
      assignedSet.add('group_men');
      matchedRules.push("Men's Ethnic Wear");
    }

    // Men Bottomwear
    if (hasWord(text, /\b(jeans|denim\s+pants|skinny\s+jeans|slim\s+fit\s+jeans)\b/i)) {
      assignedSet.add('cat_men_jeans');
      assignedSet.add('cat_men_bottomwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Jeans");
    }
    if (hasWord(text, /\b(trousers?|chinos?|formal\s+pants|cargo\s+pants|cargos?)\b/i)) {
      assignedSet.add('cat_men_trousers');
      assignedSet.add('cat_men_bottomwear');
      assignedSet.add('group_men');
      matchedRules.push("Men's Trousers");
    }

    // Men Suits & Blazers
    if (hasWord(text, /\b(suits?|blazers?|tuxedo|waistcoat|formal\s+coat)\b/i)) {
      assignedSet.add('cat_men_suits');
      assignedSet.add('group_men');
      matchedRules.push("Men's Suits & Blazers");
    }
  }

  // --- 3. WOMEN ETHNIC & WESTERN WEAR ---
  if (gender === 'women' || (!gender && !isShirt && !isPolo)) {
    // Sarees
    if (
      hasWord(
        text,
        /\b(saree|sari|saris|sarees|banarasi|kanjeevaram|kanjivaram|chanderi|paithani|bandhani|patola|chiffon\s+saree|georgette\s+saree|silk\s+saree|organza\s+saree)\b/i,
      )
    ) {
      assignedSet.add('cat_women_sarees');
      assignedSet.add('cat_women_ethnic');
      assignedSet.add('group_women');
      matchedRules.push('Women Sarees');
    }

    // Lehengas
    if (hasWord(text, /\b(lehenga|choli|ghagra|chaniya\s+choli|bridal\s+lehenga)\b/i)) {
      assignedSet.add('cat_women_lehengas');
      assignedSet.add('cat_women_ethnic');
      assignedSet.add('group_women');
      matchedRules.push('Women Lehengas');
    }

    // Kurta Sets & Salwar Suits
    if (
      hasWord(
        text,
        /\b(kurta\s+set|kurti\s+set|suit\s+set|salwar\s+suit|anarkali\s+set|sharara|gharara|palazzo\s+suit|dress\s+material|unstitched\s+suit)\b/i,
      )
    ) {
      assignedSet.add('cat_women_kurta_sets');
      assignedSet.add('cat_women_salwar_suits');
      assignedSet.add('cat_women_ethnic');
      assignedSet.add('group_women');
      matchedRules.push('Women Kurta Sets & Suits');
    } else if (
      hasWord(text, /\b(kurti|kurta|kurtis|anarkali|chikankari|angrakha|tunic\s+kurti)\b/i)
    ) {
      assignedSet.add('cat_women_kurtas');
      assignedSet.add('cat_women_ethnic');
      assignedSet.add('group_women');
      matchedRules.push('Women Kurtis');
    }

    // Dresses & Gowns
    if (
      hasWord(
        text,
        /\b(gowns?|maxi\s+dress|midi\s+dress|mini\s+dress|bodycon|jumpsuits?|rompers?|frocks?|party\s+dress)\b/i,
      )
    ) {
      assignedSet.add('cat_women_dresses');
      assignedSet.add('cat_women_western');
      assignedSet.add('group_women');
      matchedRules.push('Women Dresses & Gowns');
    }

    // Women Tops & Blouses (NOT Saree)
    if (
      hasWord(
        text,
        /\b(crop\s+top|blouses?|peplum|tank\s+top|tunic\s+top|ruffle\s+top|corset)\b/i,
      ) &&
      !hasWord(text, 'saree blouse')
    ) {
      assignedSet.add('cat_women_tops');
      assignedSet.add('cat_women_western');
      assignedSet.add('group_women');
      matchedRules.push('Women Tops');
    }

    // Women Sweaters / Cardigans
    if (isSweater) {
      assignedSet.add('cat_women_sweaters');
      assignedSet.add('group_women');
      matchedRules.push('Women Sweaters');
    }

    // Handbags & Clutches
    if (
      hasWord(
        text,
        /\b(handbag|tote\s+bag|sling\s+bag|clutch|potli|shoulder\s+bag|crossbody|satchel|purse)\b/i,
      )
    ) {
      assignedSet.add('cat_women_handbags');
      assignedSet.add('cat_women_bags');
      assignedSet.add('group_women');
      matchedRules.push('Handbags & Purses');
    }

    // Jewellery
    if (
      hasWord(
        text,
        /\b(jewellery|jewelry|necklace|earrings?|jhumka|jhumkas|kundan|bangles?|bracelet|choker|maang\s+tikka|anklet|payal)\b/i,
      )
    ) {
      assignedSet.add('cat_women_jewellery');
      assignedSet.add('cat_women_accessories');
      assignedSet.add('group_women');
      matchedRules.push('Fashion Jewellery');
    }

    // Dupattas
    if (hasWord(text, /\b(dupatta|dupattas|stole|stoles|chunri|odhni)\b/i)) {
      assignedSet.add('cat_women_dupattas');
      assignedSet.add('cat_women_accessories');
      assignedSet.add('group_women');
      matchedRules.push('Dupattas & Stoles');
    }
  }

  // --- 4. KIDS WEAR ---
  if (
    gender === 'kids' ||
    hasWord(
      text,
      /\b(kids|baby|infant|toddler|boys?\s+clothing|girls?\s+clothing|boys?\s+wear|girls?\s+wear)\b/i,
    )
  ) {
    if (hasWord(text, /\b(baby|infant|newborn|romper)\b/i)) {
      assignedSet.add('cat_kids_baby_sets');
      assignedSet.add('cat_kids_baby');
      assignedSet.add('group_kids');
      matchedRules.push('Baby Wear');
    } else if (hasWord(text, /\b(boy|boys)\b/i)) {
      assignedSet.add('cat_kids_boys_tshirts');
      assignedSet.add('cat_kids_boys');
      assignedSet.add('group_kids');
      matchedRules.push('Boys Clothing');
    } else if (hasWord(text, /\b(girl|girls|frock)\b/i)) {
      assignedSet.add('cat_kids_girls_dresses');
      assignedSet.add('cat_kids_girls');
      assignedSet.add('group_kids');
      matchedRules.push('Girls Clothing');
    } else {
      assignedSet.add('cat_kids_fashion');
      assignedSet.add('group_kids');
      matchedRules.push('Kids Fashion');
    }
  }

  // --- 5. HOME & LIVING ---
  if (
    hasWord(
      text,
      /\b(bedsheet|bed\s+sheet|pillow\s+cover|duvet|bedcover|comforter|quilt|dohar|cushion\s+cover|curtain|curtains|drapes|runner\s+rug|doormat|wall\s+art|decor|showpiece)\b/i,
    )
  ) {
    if (
      hasWord(text, /\b(bedsheet|bed\s+sheet|pillow\s+cover|duvet|bedcover|comforter|quilt)\b/i)
    ) {
      assignedSet.add('cat_home_bedsheets');
      assignedSet.add('cat_home_bed_linen');
      assignedSet.add('group_home');
      matchedRules.push('Bedsheets & Linen');
    }
    if (hasWord(text, /\b(curtain|curtains|drapes)\b/i)) {
      assignedSet.add('cat_home_curtains');
      assignedSet.add('group_home');
      matchedRules.push('Curtains & Drapes');
    }
    if (hasWord(text, /\b(cushion|cushion\s+cover)\b/i)) {
      assignedSet.add('cat_home_cushions');
      assignedSet.add('group_home');
      matchedRules.push('Cushions');
    }
    if (hasWord(text, /\b(decor|wall\s+art|showpiece|candle|vase)\b/i)) {
      assignedSet.add('cat_home_decor');
      assignedSet.add('group_home');
      matchedRules.push('Home Decor');
    }
  }

  // --- 6. PRICE DEALS & DISCOUNTS (Under 499, Under 999, 50%+ Off) ---
  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || 0);

  if (price > 0 && price <= 499) {
    assignedSet.add('spot_budget_finds');
    assignedSet.add('cat_women_sale_under_499');
    assignedSet.add('cat_men_sale_under_499');
    matchedRules.push('Deals Under ₹499');
  } else if (price > 0 && price <= 999) {
    assignedSet.add('spot_budget_finds');
    assignedSet.add('cat_women_sale_under_999');
    assignedSet.add('cat_men_sale_under_999');
    matchedRules.push('Deals Under ₹999');
  }

  if (compareAtPrice > price && price > 0) {
    const discountPct = ((compareAtPrice - price) / compareAtPrice) * 100;
    if (discountPct >= 50) {
      assignedSet.add('cat_women_sale_50_off');
      assignedSet.add('cat_men_sale_50_off');
      matchedRules.push('50%+ Off Sale');
    }
  }

  // --- 7. FEATURED CURATIONS & SPOTLIGHT INTELLIGENCE ---
  assignedSet.add('group_spotlight');
  assignedSet.add('spot_trending_now');
  assignedSet.add('spot_new_on_navya');
  assignedSet.add('spot_new_season');
  assignedSet.add('spot_best_sellers');
  assignedSet.add('spot_top_rated');
  assignedSet.add('spot_shop_vibe');

  // Festivals of India (Ethnic Wear & Jewellery)
  if (
    hasWord(
      text,
      /\b(saree|sari|lehenga|choli|kurta|kurti|salwar|anarkali|sherwani|bandhgala|dupatta|kundan|jewellery|jewelry|jhumka|ethnic|festive|wedding)\b/i,
    )
  ) {
    assignedSet.add('spot_festivals_india');
    matchedRules.push('Festivals of India');
  }

  // Trendy Street & Gen Z Fashion (Streetwear, Graphics, Oversized, Cargos, Denim)
  if (
    hasWord(
      text,
      /\b(graphic|oversized|cargo|cargos|hoodie|hoodies|sweatshirt|streetwear|baggy|crop\s+top|denim|ripped|flared\s+jeans)\b/i,
    ) ||
    isTShirt ||
    isHoodie ||
    isSweatshirt
  ) {
    assignedSet.add('spot_trendy_street');
    assignedSet.add('spot_genz_fashion');
    matchedRules.push('Trendy Street & Gen Z');
  }

  // Korean Store (Aesthetic Minimalist, Co-ords, Oversized Tops/Shirts, Pleated, Chic)
  if (
    hasWord(
      text,
      /\b(coord|co-ord|oversized|korean|aesthetic|pleated|minimal|crop\s+top|pastel|wrap\s+dress|shirt\s+dress|chic)\b/i,
    ) ||
    isShirt
  ) {
    assignedSet.add('spot_korean_store');
    matchedRules.push('Korean Aesthetic Store');
  }

  // Sports Store (Polos, Track Pants, Activewear, Hoodies, Tees)
  if (
    hasWord(text, /\b(polo|track\s*pants?|joggers?|activewear|sports?|gym|running|athletic)\b/i) ||
    isPolo
  ) {
    assignedSet.add('spot_sports_store');
    matchedRules.push('Sports & Activewear');
  }

  // Department-Specific New Arrivals
  if (gender === 'men') {
    assignedSet.add('cat_men_new_arrivals');
  } else if (gender === 'women') {
    assignedSet.add('cat_women_new_arrivals');
  } else if (gender === 'kids') {
    assignedSet.add('cat_kids_new_arrivals');
  }

  // Fallback if nothing matched
  if (assignedSet.size <= 1) {
    if (gender === 'men') {
      assignedSet.add('cat_men_shirts');
      assignedSet.add('group_men');
    } else {
      assignedSet.add('cat_women_sarees');
      assignedSet.add('group_women');
    }
  }

  const categoryIds = Array.from(assignedSet);

  // Pick best primary category
  let primaryCategoryId = categoryIds[0] || 'cat_women_sarees';
  // Avoid setting top groups or spot as primary if specific category exists
  const specificCat = categoryIds.find(
    (c) => !c.startsWith('group_') && !c.startsWith('spot_') && !c.includes('sale_'),
  );
  if (specificCat) {
    primaryCategoryId = specificCat;
  }

  const matchedLabels = categoryIds
    .map((id) => {
      const found = allFlattened.find((c) => c.id === id || c.slug === id);
      return found?.name || id;
    })
    .filter(Boolean);

  // Compute suggested Product Type & Department Group for dynamic Category Engine synchronization
  let suggestedProductType = 'women_sarees';
  let departmentGroup:
    'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops' = 'group_women';

  if (assignedSet.has('group_men') || gender === 'men') {
    departmentGroup = 'group_men';
    if (
      assignedSet.has('cat_men_formal_shirts') ||
      hasWord(text, /formal\s+shirt|office\s+shirt/i)
    ) {
      suggestedProductType = 'men_formal_shirts';
    } else if (assignedSet.has('cat_men_shirts') || isShirt) {
      suggestedProductType = 'men_shirts';
    } else if (assignedSet.has('cat_men_polos') || isPolo) {
      suggestedProductType = 'men_polos';
    } else if (assignedSet.has('cat_men_tshirts') || isTShirt) {
      suggestedProductType = 'men_tshirts';
    } else if (assignedSet.has('cat_men_hoodies') || isHoodie) {
      suggestedProductType = 'men_hoodies';
    } else if (
      assignedSet.has('cat_men_jackets') ||
      hasWord(text, /jackets?|bomber|leather\s+jacket/i)
    ) {
      suggestedProductType = 'men_jackets';
    } else if (assignedSet.has('cat_men_jeans') || hasWord(text, /jeans|denim/i)) {
      suggestedProductType = 'men_jeans';
    } else if (assignedSet.has('cat_men_trousers') || hasWord(text, /trousers?|formal\s+pants/i)) {
      suggestedProductType = 'men_trousers';
    } else if (assignedSet.has('cat_men_chinos') || hasWord(text, /chinos?/i)) {
      suggestedProductType = 'men_chinos';
    } else if (assignedSet.has('cat_men_cargos') || hasWord(text, /cargos?|cargo\s+pants/i)) {
      suggestedProductType = 'men_cargo_pants';
    } else if (assignedSet.has('cat_men_shorts') || hasWord(text, /shorts?/i)) {
      suggestedProductType = 'men_shorts';
    } else if (assignedSet.has('cat_men_trackpants') || hasWord(text, /track\s*pants?|joggers?/i)) {
      suggestedProductType = 'men_track_pants';
    } else if (assignedSet.has('cat_men_kurtas') || hasWord(text, /\bkurta\b/i)) {
      suggestedProductType = 'men_kurtas';
    } else if (
      assignedSet.has('cat_men_kurta_sets') ||
      hasWord(text, /kurta\s+set|kurta\s+pajama/i)
    ) {
      suggestedProductType = 'men_kurta_sets';
    } else if (assignedSet.has('cat_men_sherwanis') || hasWord(text, /sherwani/i)) {
      suggestedProductType = 'men_sherwanis';
    } else if (
      assignedSet.has('cat_men_nehru_jackets') ||
      hasWord(text, /nehru\s+jacket|bandhgala|modi\s+jacket/i)
    ) {
      suggestedProductType = 'men_nehru_jackets';
    } else if (assignedSet.has('cat_men_suits') || hasWord(text, /\bsuits?\b/i)) {
      suggestedProductType = 'men_suits';
    } else if (assignedSet.has('cat_men_blazers') || hasWord(text, /blazers?/i)) {
      suggestedProductType = 'men_blazers';
    } else {
      suggestedProductType = 'men_shirts';
    }
  } else if (assignedSet.has('group_kids') || gender === 'kids') {
    departmentGroup = 'group_kids';
    if (assignedSet.has('cat_kids_baby_sets') || hasWord(text, /baby|infant|newborn|romper/i)) {
      suggestedProductType = 'kids_baby_clothing';
    } else if (
      assignedSet.has('cat_kids_girls_dresses') ||
      hasWord(text, /girl|girls|frock|princess/i)
    ) {
      suggestedProductType = 'kids_girls_clothing';
    } else if (
      assignedSet.has('cat_kids_ethnic_wear') ||
      hasWord(text, /ethnic|kurta|lehenga|dhoti/i)
    ) {
      suggestedProductType = 'kids_ethnic_wear';
    } else if (hasWord(text, /teen|teens/i)) {
      suggestedProductType = 'kids_teens';
    } else {
      suggestedProductType = 'kids_boys_clothing';
    }
  } else {
    departmentGroup = 'group_women';
    if (
      assignedSet.has('cat_women_sarees') ||
      hasWord(
        text,
        /saree|sari|banarasi|kanjeevaram|chanderi|paithani|silk\s+saree|georgette\s+saree/i,
      )
    ) {
      suggestedProductType = 'women_sarees';
    } else if (assignedSet.has('cat_women_lehengas') || hasWord(text, /lehenga|choli|ghagra/i)) {
      suggestedProductType = 'women_lehengas';
    } else if (
      assignedSet.has('cat_women_kurta_sets') ||
      hasWord(text, /kurta\s+set|suit\s+set|salwar\s+suit|anarkali\s+set|sharara/i)
    ) {
      suggestedProductType = 'women_kurta_sets';
    } else if (
      assignedSet.has('cat_women_kurtas') ||
      hasWord(text, /kurti|kurta|anarkali|tunic/i)
    ) {
      suggestedProductType = 'women_kurtas';
    } else if (
      assignedSet.has('cat_women_dresses') ||
      hasWord(text, /dress|gowns?|maxi|midi|bodycon|frock/i)
    ) {
      suggestedProductType = 'women_dresses';
    } else if (assignedSet.has('cat_women_jumpsuits') || hasWord(text, /jumpsuit|romper/i)) {
      suggestedProductType = 'women_jumpsuits';
    } else if (assignedSet.has('cat_women_skirts') || hasWord(text, /skirts?/i)) {
      suggestedProductType = 'women_skirts';
    } else if (assignedSet.has('cat_women_coords') || hasWord(text, /co-?ord|coord|two\s+piece/i)) {
      suggestedProductType = 'women_coords';
    } else if (
      assignedSet.has('cat_women_tops') ||
      hasWord(text, /top|tops|blouse|crop\s+top|t-?shirt|tee/i)
    ) {
      suggestedProductType = 'women_tops_tees';
    } else if (assignedSet.has('cat_women_handbags') || hasWord(text, /handbag|bag|tote|purse/i)) {
      suggestedProductType = 'women_handbags';
    } else if (hasWord(text, /sling\s+bag|crossbody/i)) {
      suggestedProductType = 'women_sling_bags';
    } else if (
      assignedSet.has('cat_women_jewellery') ||
      hasWord(text, /jewellery|jewelry|necklace|earring|jhumka|bangle/i)
    ) {
      suggestedProductType = 'women_jewellery';
    } else if (hasWord(text, /watch|watches/i)) {
      suggestedProductType = 'women_watches';
    } else if (hasWord(text, /maternity|feeding|pregnancy/i)) {
      suggestedProductType = 'women_maternity';
    } else if (hasWord(text, /activewear|gym|tights|leggings/i)) {
      suggestedProductType = 'women_activewear';
    } else {
      suggestedProductType = 'women_sarees';
    }
  }

  return {
    primaryCategoryId,
    categoryIds,
    matchedLabels,
    matchedRules: Array.from(new Set(matchedRules.filter(Boolean))),
    suggestedProductType,
    departmentGroup,
  };
}
