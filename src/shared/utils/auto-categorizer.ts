import { getFlattenedCategoryOptions } from '@/config/categories.config';

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

// Regex Helper for exact whole word or phrase matching with word boundaries
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
  const title = (product.name || '').trim().toLowerCase();
  const desc = (product.description || '').trim().toLowerCase();
  const fabric = (product.fabric || '').trim().toLowerCase();
  const occasion = (product.occasion || '').trim().toLowerCase();
  const text = `${title} ${desc} ${fabric} ${occasion}`.toLowerCase();

  const allFlattened = getFlattenedCategoryOptions();
  const assignedSet = new Set<string>();
  const matchedRules: string[] = [];

  // Determine explicit or inferred gender
  let gender = (product.gender || '').toLowerCase();
  if (!gender) {
    if (
      hasWord(
        text,
        /\b(women|woman|ladies|female|mrs|miss|saree|sari|lehenga|kurti|anarkali|choli|bra|bras|pantie|panties|lingerie|camisole|petticoat)\b/i,
      )
    ) {
      gender = 'women';
    } else if (
      hasWord(
        text,
        /\b(men|man|gents|male|mr|sherwani|dhoti|kurta\s+pajama|nehru\s+jacket|bandhgala|boxers?|briefs?)\b/i,
      )
    ) {
      gender = 'men';
    } else if (
      hasWord(
        text,
        /\b(kids?|baby|infant|toddler|newborn|children|frock|romper|girls?\s+clothing|boys?\s+clothing)\b/i,
      )
    ) {
      gender = 'kids';
    } else {
      gender = 'women';
    }
  }

  // --- GARMENT TYPE HELPERS ---
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

  let suggestedProductType = 'women_sarees';
  let departmentGroup:
    'group_men' | 'group_women' | 'group_kids' | 'group_spotlight' | 'group_shops' = 'group_women';

  // =========================================================================
  // 1. WOMEN'S CATEGORIES
  // =========================================================================
  if (gender === 'women') {
    departmentGroup = 'group_women';

    // 1A. Indian Ethnic Wear
    if (
      hasWord(
        text,
        /\b(saree|sari|saris|sarees|banarasi|kanjeevaram|kanjivaram|chanderi|paithani|bandhani|patola|chiffon\s+saree|georgette\s+saree|silk\s+saree|organza\s+saree)\b/i,
      )
    ) {
      assignedSet.add('cat_women_sarees');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Women Sarees');
      suggestedProductType = 'women_sarees';
    } else if (hasWord(text, /\b(lehenga|choli|ghagra|chaniya\s+choli|bridal\s+lehenga)\b/i)) {
      assignedSet.add('cat_women_lehengas');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Women Lehengas');
      suggestedProductType = 'women_lehengas';
    } else if (
      hasWord(
        text,
        /\b(kurta\s+set|kurti\s+set|suit\s+set|salwar\s+suit|anarkali\s+set|sharara|gharara|palazzo\s+suit|dress\s+material|unstitched\s+suit)\b/i,
      )
    ) {
      assignedSet.add('cat_women_kurta_sets');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Women Kurta Sets & Suits');
      suggestedProductType = 'women_kurta_sets';
    } else if (
      hasWord(text, /\b(kurti|kurta|kurtis|anarkali|chikankari|angrakha|tunic\s+kurti)\b/i)
    ) {
      assignedSet.add('cat_women_kurtas');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Women Kurtis');
      suggestedProductType = 'women_kurtas';
    } else if (hasWord(text, /\b(ethnic\s+dress|indo\s*western|ethnic\s+gown)\b/i)) {
      assignedSet.add('cat_women_ethnic_dresses');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Ethnic Dresses');
      suggestedProductType = 'women_dresses';
    }

    // 1B. Western Wear
    if (
      isTShirt ||
      (hasWord(
        text,
        /\b(crop\s+top|blouses?|peplum|tank\s+top|tunic\s+top|ruffle\s+top|corset|camisole\s+top|tees?|t-?shirts?)\b/i,
      ) &&
        !hasWord(text, 'saree blouse'))
    ) {
      assignedSet.add('cat_women_tops_tees');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push('Women Tops & Tees');
      suggestedProductType = 'women_tops_tees';
    }
    if (isShirt) {
      assignedSet.add('cat_women_shirts');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push("Women's Shirts");
      suggestedProductType = 'women_tops_tees';
    }
    if (
      hasWord(
        text,
        /\b(dresses?|gowns?|maxi\s+dress|midi\s+dress|mini\s+dress|bodycon|frocks?|party\s+dress|wrap\s+dress|shirt\s+dress)\b/i,
      )
    ) {
      assignedSet.add('cat_women_dresses');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push('Women Dresses & Gowns');
      suggestedProductType = 'women_dresses';
    }
    if (hasWord(text, /\b(jumpsuits?|rompers?|playsuits?)\b/i)) {
      assignedSet.add('cat_women_jumpsuits');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push('Women Jumpsuits');
      suggestedProductType = 'women_jumpsuits';
    }
    if (hasWord(text, /\b(skirts?|pleated\s+skirt|denim\s+skirt|flared\s+skirt)\b/i)) {
      assignedSet.add('cat_women_skirts');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push('Women Skirts');
      suggestedProductType = 'women_skirts';
    }
    if (hasWord(text, /\b(co-?ords?|coords?|two\s+piece\s+set|matching\s+set)\b/i)) {
      assignedSet.add('cat_women_coord_sets');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push('Women Co-ord Sets');
      suggestedProductType = 'women_coords';
    }
    if (hasWord(text, /\b(jeans|denim\s+pants|skinny\s+jeans|mom\s+jeans|flared\s+jeans)\b/i)) {
      assignedSet.add('cat_women_jeans');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push("Women's Jeans");
    }
    if (hasWord(text, /\b(trousers?|chinos?|palazzo|culottes|formal\s+pants)\b/i)) {
      assignedSet.add('cat_women_trousers');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push("Women's Trousers");
    }
    if (hasWord(text, /\b(shorts|hot\s+pants|cycling\s+shorts)\b/i)) {
      assignedSet.add('cat_women_shorts');
      assignedSet.add('cat_women_western_wear');
      matchedRules.push("Women's Shorts");
    }

    // 1C. Winter & Outerwear
    if (isSweater) {
      assignedSet.add('cat_women_sweaters');
      assignedSet.add('cat_women_winter_outerwear');
      matchedRules.push("Women's Sweaters");
      suggestedProductType = 'women_tops_tees';
    }
    if (isSweatshirt || isHoodie) {
      assignedSet.add('cat_women_sweatshirts');
      assignedSet.add('cat_women_winter_outerwear');
      matchedRules.push("Women's Sweatshirts");
      suggestedProductType = 'women_tops_tees';
    }
    if (hasWord(text, /\b(jackets?|bomber|leather\s+jacket|denim\s+jacket|blazer)\b/i)) {
      assignedSet.add('cat_women_jackets');
      assignedSet.add('cat_women_winter_outerwear');
      matchedRules.push("Women's Jackets");
      suggestedProductType = 'women_tops_tees';
    }
    if (hasWord(text, /\b(coats?|trench\s+coat|overcoat|shrugs?)\b/i)) {
      assignedSet.add('cat_women_coats');
      assignedSet.add('cat_women_winter_outerwear');
      matchedRules.push("Women's Coats");
    }

    // 1D. Activewear
    if (hasWord(text, /\b(activewear|gym\s+wear|workout|yoga\s+pants|tights|leggings)\b/i)) {
      assignedSet.add('cat_women_activewear_sets');
      assignedSet.add('cat_women_activewear');
      matchedRules.push("Women's Activewear");
      suggestedProductType = 'women_activewear';
    }

    // 1E. Sleepwear & Loungewear
    if (
      hasWord(text, /\b(night\s+suit|night\s+suits|nightwear\s+set|pyjama\s+set|pajama\s+set)\b/i)
    ) {
      assignedSet.add('cat_women_night_suits');
      assignedSet.add('cat_women_sleepwear');
      matchedRules.push('Night Suits');
      suggestedProductType = 'women_sleepwear';
    }
    if (hasWord(text, /\b(nighty|nighties|night\s+dress|nightdress|sleep\s+dress|nightgown)\b/i)) {
      assignedSet.add('cat_women_night_dresses');
      assignedSet.add('cat_women_sleepwear');
      matchedRules.push('Night Dresses & Nighties');
      suggestedProductType = 'women_sleepwear';
    }
    if (
      hasWord(
        text,
        /\b(loungewear|lounge\s+wear|lounge\s+sets?|comfort\s+wear|kaftans?|sleepwear|sleep\s+tee)\b/i,
      )
    ) {
      assignedSet.add('cat_women_sleep_loungewear');
      assignedSet.add('cat_women_loungewear_sec');
      assignedSet.add('cat_women_lounge_sets');
      assignedSet.add('cat_women_comfort_wear');
      matchedRules.push('Loungewear & Comfort Wear');
      suggestedProductType = 'women_sleepwear';
    }

    // 1F. Women's Essentials (Innerwear, Shapewear, Thermals)
    if (
      hasWord(
        text,
        /\b(bras?|bralettes?|sports\s+bra|padded\s+bra|t-?shirt\s+bra|push\s*up\s+bra|strapless\s+bra)\b/i,
      )
    ) {
      assignedSet.add('cat_women_bras');
      assignedSet.add('cat_women_innerwear');
      matchedRules.push("Women's Bras");
      suggestedProductType = 'women_bras';
    }
    if (
      hasWord(
        text,
        /\b(panties|panty|briefs?|thongs?|bikini\s+panty|hipster|boyshorts?|seamless\s+panty|cotton\s+panties)\b/i,
      )
    ) {
      assignedSet.add('cat_women_panties');
      assignedSet.add('cat_women_innerwear');
      matchedRules.push("Women's Panties");
      suggestedProductType = 'women_panties';
    }
    if (
      hasWord(
        text,
        /\b(lingerie|babydoll|chemise|teddy|lace\s+set|bridal\s+lingerie|night\s+robe)\b/i,
      )
    ) {
      assignedSet.add('cat_women_lingerie');
      assignedSet.add('cat_women_innerwear');
      matchedRules.push("Women's Lingerie");
      suggestedProductType = 'women_panties';
    }
    if (hasWord(text, /\b(camisoles?|tank\s+slips?|slips?|inner\s+slips?|petticoats?)\b/i)) {
      assignedSet.add('cat_women_camisoles');
      assignedSet.add('cat_women_slips');
      assignedSet.add('cat_women_shape_camisoles');
      assignedSet.add('cat_women_innerwear');
      assignedSet.add('cat_women_shapewear_sec');
      matchedRules.push('Camisoles & Slips');
      suggestedProductType = 'women_camisoles';
    }
    if (
      hasWord(
        text,
        /\b(shapewear|body\s*shaper|tummy\s*tucker|saree\s+shapewear|butt\s+lifter|waist\s+cincher|corsets?)\b/i,
      )
    ) {
      assignedSet.add('cat_women_shapewear');
      assignedSet.add('cat_women_shapewear_sec');
      matchedRules.push('Comfort & Shapewear');
      suggestedProductType = 'women_shapewear';
    }
    if (
      hasWord(
        text,
        /\b(thermals?|thermal\s+tops?|thermal\s+bottoms?|body\s+warmers?|winter\s+innerwear)\b/i,
      )
    ) {
      assignedSet.add('cat_women_thermals');
      assignedSet.add('cat_women_thermal_tops');
      assignedSet.add('cat_women_thermal_bottoms');
      assignedSet.add('cat_women_winter_essentials');
      matchedRules.push("Women's Thermals");
      suggestedProductType = 'women_sleepwear';
    }

    // 1G. Maternity & Plus Size
    if (hasWord(text, /\b(maternity|nursing|feeding|pregnancy)\b/i)) {
      assignedSet.add('cat_women_maternity');
      matchedRules.push('Maternity Wear');
      suggestedProductType = 'women_maternity';
    }
    if (hasWord(text, /\b(plus\s+size|curvy|3xl|4xl|5xl|6xl)\b/i)) {
      assignedSet.add('cat_women_plus_size');
      matchedRules.push('Plus Size');
    }

    // 1H. Bags & Accessories
    if (
      hasWord(
        text,
        /\b(handbags?|tote\s+bag|sling\s+bag|clutches?|potlis?|shoulder\s+bag|crossbody|purses?)\b/i,
      )
    ) {
      assignedSet.add('cat_women_handbags');
      assignedSet.add('cat_women_bags');
      matchedRules.push('Handbags & Purses');
      suggestedProductType = 'women_handbags';
    }
    if (
      hasWord(
        text,
        /\b(jewellery|jewelry|necklace|earrings?|jhumka|jhumkas|kundan|bangles?|bracelets?|choker|maang\s+tikka|anklets?|payal)\b/i,
      )
    ) {
      assignedSet.add('cat_women_jewellery');
      matchedRules.push('Fashion Jewellery');
      suggestedProductType = 'women_jewellery';
    }
    if (hasWord(text, /\b(dupattas?|stoles?|chunri|odhni|scarf|scarves)\b/i)) {
      assignedSet.add('cat_women_scarves_stoles');
      assignedSet.add('cat_women_indian_wear');
      matchedRules.push('Dupattas & Scarves');
    }
    if (hasWord(text, /\b(watches?|wrist\s*watch)\b/i)) {
      assignedSet.add('cat_women_watches');
      matchedRules.push("Women's Watches");
      suggestedProductType = 'women_watches';
    }
    if (hasWord(text, /\b(sunglasses?|shades|eyewear)\b/i)) {
      assignedSet.add('cat_women_sunglasses');
      matchedRules.push("Women's Sunglasses");
    }

    // Auto add Women New Arrivals
    assignedSet.add('cat_women_new_arrivals');
  }

  // =========================================================================
  // 2. MEN'S CATEGORIES
  // =========================================================================
  if (gender === 'men') {
    departmentGroup = 'group_men';

    if (isShirt) {
      if (hasWord(text, /\b(formal\s+shirt|office\s+shirt|executive)\b/i)) {
        assignedSet.add('cat_men_formal_shirts');
        assignedSet.add('cat_men_formal');
        suggestedProductType = 'men_formal_shirts';
      } else {
        assignedSet.add('cat_men_shirts');
        assignedSet.add('cat_men_topwear');
        suggestedProductType = 'men_shirts';
      }
      matchedRules.push("Men's Shirts");
    } else if (isPolo) {
      assignedSet.add('cat_men_polos');
      assignedSet.add('cat_men_topwear');
      matchedRules.push("Men's Polos");
      suggestedProductType = 'men_polos';
    } else if (isTShirt) {
      assignedSet.add('cat_men_tshirts');
      assignedSet.add('cat_men_topwear');
      matchedRules.push("Men's T-Shirts");
      suggestedProductType = 'men_tshirts';
    }

    if (isSweatshirt) {
      assignedSet.add('cat_men_sweatshirts');
      assignedSet.add('cat_men_topwear');
      matchedRules.push("Men's Sweatshirts");
      suggestedProductType = 'men_hoodies';
    }

    if (isHoodie) {
      assignedSet.add('cat_men_hoodies');
      assignedSet.add('cat_men_topwear');
      matchedRules.push("Men's Hoodies");
      suggestedProductType = 'men_hoodies';
    }

    if (isSweater) {
      assignedSet.add('cat_men_sweaters');
      assignedSet.add('cat_men_topwear');
      matchedRules.push("Men's Sweaters");
      suggestedProductType = 'men_jackets';
    }

    // Men Ethnic Wear
    if (
      hasWord(text, /\b(kurta|sherwani|kurta\s+pajama|nehru\s+jacket|bandhgala|pathani|dhoti)\b/i)
    ) {
      if (hasWord(text, /\b(kurta\s+set|kurta\s+pajama)\b/i)) {
        assignedSet.add('cat_men_kurta_sets');
        assignedSet.add('cat_men_ethnic');
        suggestedProductType = 'men_kurta_sets';
      } else if (hasWord(text, /\bsherwanis?\b/i)) {
        assignedSet.add('cat_men_sherwanis');
        assignedSet.add('cat_men_ethnic');
        suggestedProductType = 'men_sherwanis';
      } else if (hasWord(text, /\b(nehru\s+jacket|bandhgala|modi\s+jacket)\b/i)) {
        assignedSet.add('cat_men_nehru_jackets');
        assignedSet.add('cat_men_ethnic');
        suggestedProductType = 'men_nehru_jackets';
      } else {
        assignedSet.add('cat_men_kurtas');
        assignedSet.add('cat_men_ethnic');
        suggestedProductType = 'men_kurtas';
      }
      matchedRules.push("Men's Ethnic Wear");
    }

    // Men Bottomwear
    if (hasWord(text, /\b(jeans|denim\s+pants|skinny\s+jeans|slim\s+fit\s+jeans)\b/i)) {
      assignedSet.add('cat_men_jeans');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Jeans");
      suggestedProductType = 'men_jeans';
    }
    if (hasWord(text, /\b(trousers?|formal\s+pants)\b/i)) {
      assignedSet.add('cat_men_trousers');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Trousers");
      suggestedProductType = 'men_trousers';
    }
    if (hasWord(text, /\bchinos?\b/i)) {
      assignedSet.add('cat_men_chinos');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Chinos");
      suggestedProductType = 'men_chinos';
    }
    if (hasWord(text, /\b(cargo\s+pants|cargos?)\b/i)) {
      assignedSet.add('cat_men_cargos');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Cargo Pants");
      suggestedProductType = 'men_cargo_pants';
    }
    if (hasWord(text, /\bshorts?\b/i)) {
      assignedSet.add('cat_men_shorts');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Shorts");
      suggestedProductType = 'men_shorts';
    }
    if (hasWord(text, /\b(track\s*pants?|joggers?)\b/i)) {
      assignedSet.add('cat_men_trackpants');
      assignedSet.add('cat_men_bottomwear');
      matchedRules.push("Men's Track Pants");
      suggestedProductType = 'men_track_pants';
    }

    // Men Suits & Blazers
    if (hasWord(text, /\b(suits?|blazers?|tuxedo|waistcoats?)\b/i)) {
      if (hasWord(text, /\bblazers?\b/i)) {
        assignedSet.add('cat_men_blazers');
        assignedSet.add('cat_men_formal');
        suggestedProductType = 'men_blazers';
      } else {
        assignedSet.add('cat_men_suits');
        assignedSet.add('cat_men_formal');
        suggestedProductType = 'men_suits';
      }
      matchedRules.push("Men's Suits & Blazers");
    }

    // Men Essentials (Innerwear & Thermals)
    if (hasWord(text, /\b(briefs?|boxers?|trunks?|underwear)\b/i)) {
      assignedSet.add('cat_men_briefs');
      assignedSet.add('cat_men_boxers');
      assignedSet.add('cat_men_innerwear');
      matchedRules.push("Men's Innerwear");
      suggestedProductType = 'men_briefs_boxers';
    }
    if (hasWord(text, /\b(vests?|undershirts?|baniyan)\b/i)) {
      assignedSet.add('cat_men_vests');
      assignedSet.add('cat_men_undershirts');
      assignedSet.add('cat_men_innerwear');
      matchedRules.push("Men's Vests");
      suggestedProductType = 'men_vests';
    }
    if (hasWord(text, /\b(socks|ankle\s+socks|crew\s+socks)\b/i)) {
      assignedSet.add('cat_men_socks');
      matchedRules.push("Men's Socks");
      suggestedProductType = 'men_socks';
    }
    if (hasWord(text, /\b(thermals?|thermal\s+tops?|thermal\s+bottoms?|body\s+warmers?)\b/i)) {
      assignedSet.add('cat_men_thermals');
      assignedSet.add('cat_men_thermal_tops');
      assignedSet.add('cat_men_thermal_bottoms');
      assignedSet.add('cat_men_winter_essentials');
      matchedRules.push("Men's Thermals");
      suggestedProductType = 'men_thermals';
    }

    // Auto add Men New Arrivals
    assignedSet.add('cat_men_new_arrivals');
  }

  // =========================================================================
  // 3. KIDS' CATEGORIES
  // =========================================================================
  if (gender === 'kids') {
    departmentGroup = 'group_kids';

    if (hasWord(text, /\b(baby|infant|newborn|rompers?|onesies?)\b/i)) {
      assignedSet.add('cat_baby_sets');
      assignedSet.add('cat_baby_rompers');
      assignedSet.add('cat_kids_baby');
      matchedRules.push('Baby Wear');
      suggestedProductType = 'kids_baby_clothing';
    } else if (hasWord(text, /\b(boy|boys)\b/i)) {
      assignedSet.add('cat_boys_tshirts');
      assignedSet.add('cat_kids_boys');
      matchedRules.push('Boys Clothing');
      suggestedProductType = 'kids_boys_clothing';
    } else if (hasWord(text, /\b(girl|girls|frocks?|princess)\b/i)) {
      assignedSet.add('cat_girls_dresses');
      assignedSet.add('cat_kids_girls');
      matchedRules.push('Girls Clothing');
      suggestedProductType = 'kids_girls_clothing';
    } else {
      assignedSet.add('cat_kids_all_fashion');
      matchedRules.push('Kids Fashion');
      suggestedProductType = 'kids_boys_clothing';
    }

    if (hasWord(text, /\b(ethnic|kurta|lehenga|dhoti)\b/i)) {
      assignedSet.add('cat_kids_ethnic_wear');
      matchedRules.push("Kids' Ethnic Wear");
      suggestedProductType = 'kids_ethnic_wear';
    }

    assignedSet.add('cat_kids_new_arrivals');
  }

  // =========================================================================
  // 4. PRICE-BASED DEALS & BUDGET FINDS (Under ₹499, Under ₹999, 50%+ Off)
  // =========================================================================
  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || 0);

  if (price > 0 && price <= 499) {
    assignedSet.add('spot_budget_finds');
    if (departmentGroup === 'group_women') assignedSet.add('cat_women_deals_under_499');
    if (departmentGroup === 'group_men') assignedSet.add('cat_men_deals_under_499');
    matchedRules.push('Deals Under ₹499');
  } else if (price > 0 && price <= 999) {
    assignedSet.add('spot_budget_finds');
    if (departmentGroup === 'group_women') assignedSet.add('cat_women_deals_under_999');
    if (departmentGroup === 'group_men') assignedSet.add('cat_men_deals_under_999');
    matchedRules.push('Deals Under ₹999');
  }

  if (compareAtPrice > price && price > 0) {
    const discountPct = ((compareAtPrice - price) / compareAtPrice) * 100;
    if (discountPct >= 50) {
      if (departmentGroup === 'group_women') assignedSet.add('cat_women_deals_50_off');
      if (departmentGroup === 'group_men') assignedSet.add('cat_men_deals_50_off');
      matchedRules.push('50%+ Off Sale');
    }
  }

  // =========================================================================
  // 5. SMART SPOTLIGHT CURATIONS
  // =========================================================================
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

  // Trendy Street & Gen Z Fashion
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

  // Korean Aesthetic Store
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

  // Sports & Activewear
  if (
    hasWord(text, /\b(polo|track\s*pants?|joggers?|activewear|sports?|gym|running|athletic)\b/i) ||
    isPolo
  ) {
    assignedSet.add('spot_sports_store');
    matchedRules.push('Sports & Activewear');
  }

  // Fallback if nothing matched
  if (assignedSet.size === 0) {
    if (gender === 'men') {
      assignedSet.add('cat_men_shirts');
      assignedSet.add('cat_men_topwear');
      assignedSet.add('cat_men_new_arrivals');
      suggestedProductType = 'men_shirts';
      departmentGroup = 'group_men';
    } else if (gender === 'kids') {
      assignedSet.add('cat_kids_all_fashion');
      assignedSet.add('cat_kids_new_arrivals');
      suggestedProductType = 'kids_boys_clothing';
      departmentGroup = 'group_kids';
    } else {
      assignedSet.add('cat_women_sarees');
      assignedSet.add('cat_women_indian_wear');
      assignedSet.add('cat_women_new_arrivals');
      suggestedProductType = 'women_sarees';
      departmentGroup = 'group_women';
    }
  }

  // =========================================================================
  // 6. STRICT CANONICAL TAXONOMY VALIDATION
  // Filter all category IDs so that ONLY 100% valid taxonomy IDs are returned
  // =========================================================================
  const validIdsSet = new Set(allFlattened.map((f: any) => f.id));
  const categoryIds = Array.from(assignedSet).filter((id) => validIdsSet.has(id));

  // Determine the best specific primary category (prefer leaf categories over section containers)
  let primaryCategoryId = categoryIds[0] || 'cat_women_sarees';
  const specificCat = categoryIds.find(
    (c) =>
      !c.startsWith('spot_') &&
      !c.includes('sale_') &&
      !c.includes('deals_') &&
      !c.includes('new_arrivals'),
  );
  if (specificCat) {
    primaryCategoryId = specificCat;
  }

  const matchedLabels = categoryIds
    .map((id) => {
      const found = allFlattened.find((c: any) => c.id === id);
      return found?.name || id;
    })
    .filter(Boolean);

  return {
    primaryCategoryId,
    categoryIds,
    matchedLabels,
    matchedRules: Array.from(new Set(matchedRules.filter(Boolean))),
    suggestedProductType,
    departmentGroup,
  };
}
