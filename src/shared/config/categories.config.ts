export interface LeafCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface SubCategoryOption {
  id: string;
  name: string;
  slug: string;
  items?: LeafCategoryOption[];
}

export interface MainCategoryOption {
  id: string;
  name: string;
  slug: string;
  badge?: string;
  sections: {
    id: string;
    title: string;
    subCategories: SubCategoryOption[];
  }[];
  // Backward compatibility convenience getter
  subCategories?: SubCategoryOption[];
}

export const CATEGORY_TAXONOMY: MainCategoryOption[] = [
  // 1. IN THE SPOTLIGHT
  {
    id: 'group_spotlight',
    name: 'In The Spotlight',
    slug: 'spotlight',
    badge: 'Trending',
    sections: [
      {
        id: 'sec_spotlight_collections',
        title: 'Featured Curations',
        subCategories: [
          { id: 'spot_festivals_india', name: 'Festivals of India', slug: 'festivals-of-india' },
          { id: 'spot_new_season', name: 'New Season Drops', slug: 'new-season' },
          { id: 'spot_best_sellers', name: 'Best Sellers', slug: 'best-sellers' },
          { id: 'spot_korean_store', name: 'Korean Aesthetic', slug: 'korean-store' },
          { id: 'spot_trendy_street', name: 'Trendy Streetwear', slug: 'trendy-street' },
          { id: 'spot_genz_fashion', name: 'Gen Z Trends', slug: 'gen-z-fashion' },
          { id: 'spot_sports_store', name: 'Sports & Active Store', slug: 'sports-store' },
          { id: 'spot_new_on_navya', name: 'Fresh Arrivals', slug: 'new-arrivals' },
          { id: 'spot_top_rated', name: 'Top-Rated Styles', slug: 'top-rated' },
          { id: 'spot_budget_finds', name: 'Budget Store (Under ₹999)', slug: 'budget-finds' },
        ],
      },
    ],
  },

  // 2. MEN
  {
    id: 'group_men',
    name: 'Men',
    slug: 'men',
    badge: 'Popular',
    sections: [
      {
        id: 'sec_men_clothing',
        title: "Men's Clothing",
        subCategories: [
          { id: 'cat_men_new_arrivals', name: 'New Arrivals', slug: 'men-new-arrivals' },
          {
            id: 'cat_men_topwear',
            name: 'Topwear',
            slug: 'men-topwear',
            items: [
              { id: 'cat_men_shirts', name: 'Shirts', slug: 'men-shirts' },
              { id: 'cat_men_tshirts', name: 'T-Shirts', slug: 'men-t-shirts' },
              { id: 'cat_men_polos', name: 'Polos', slug: 'men-polos' },
              { id: 'cat_men_sweatshirts', name: 'Sweatshirts & Hoodies', slug: 'men-sweatshirts' },
              { id: 'cat_men_sweaters', name: 'Sweaters', slug: 'men-sweaters' },
            ],
          },
          {
            id: 'cat_men_bottomwear',
            name: 'Bottomwear',
            slug: 'men-bottomwear',
            items: [
              { id: 'cat_men_jeans', name: 'Jeans / Denims', slug: 'men-jeans' },
              { id: 'cat_men_trousers', name: 'Trousers & Chinos', slug: 'men-trousers' },
              { id: 'cat_men_cargos', name: 'Cargo Pants', slug: 'men-cargo-pants' },
              { id: 'cat_men_shorts', name: 'Shorts', slug: 'men-shorts' },
              { id: 'cat_men_trackpants', name: 'Track Pants', slug: 'men-track-pants' },
            ],
          },
          {
            id: 'cat_men_ethnic',
            name: 'Ethnic & Festive Wear',
            slug: 'men-ethnic-wear',
            items: [
              { id: 'cat_men_kurtas', name: 'Kurtas', slug: 'men-kurtas' },
              { id: 'cat_men_kurta_sets', name: 'Kurta Sets', slug: 'men-kurta-sets' },
              { id: 'cat_men_ethnic_shirts', name: 'Ethnic Shirts', slug: 'men-ethnic-shirts' },
              { id: 'cat_men_sherwanis', name: 'Sherwanis', slug: 'men-sherwanis' },
              { id: 'cat_men_nehru_jackets', name: 'Nehru Jackets', slug: 'men-nehru-jackets' },
            ],
          },
          {
            id: 'cat_men_formal',
            name: 'Formal & Party Wear',
            slug: 'men-formal-wear',
            items: [
              { id: 'cat_men_formal_shirts', name: 'Formal Shirts', slug: 'men-formal-shirts' },
              {
                id: 'cat_men_formal_trousers',
                name: 'Formal Trousers',
                slug: 'men-formal-trousers',
              },
              { id: 'cat_men_blazers', name: 'Blazers', slug: 'men-blazers' },
              { id: 'cat_men_suits', name: 'Suits & Waistcoats', slug: 'men-suits' },
            ],
          },
          {
            id: 'cat_men_outerwear',
            name: 'Outerwear & Jackets',
            slug: 'men-outerwear',
            items: [
              { id: 'cat_men_outer_jackets', name: 'Jackets & Coats', slug: 'men-jackets' },
              { id: 'cat_men_windcheaters', name: 'Windcheaters & Raincoats', slug: 'men-windcheaters' },
            ],
          },
          {
            id: 'cat_men_sports',
            name: 'Sports & Activewear',
            slug: 'men-sports-activewear',
            items: [
              {
                id: 'cat_men_sports_tshirts',
                name: 'Sports T-Shirts',
                slug: 'men-sports-t-shirts',
              },
              { id: 'cat_men_tracksuits', name: 'Tracksuits & Active Sets', slug: 'men-tracksuits' },
            ],
          },
          { id: 'cat_men_plus_size', name: 'Plus Size', slug: 'men-plus-size' },
        ],
      },
      {
        id: 'sec_men_accessories',
        title: "Men's Accessories",
        subCategories: [
          { id: 'cat_men_wallets', name: 'Wallets', slug: 'men-wallets' },
          { id: 'cat_men_belts', name: 'Belts', slug: 'men-belts' },
          { id: 'cat_men_watches', name: 'Watches', slug: 'men-watches' },
          { id: 'cat_men_sunglasses', name: 'Sunglasses', slug: 'men-sunglasses' },
          { id: 'cat_men_caps_hats', name: 'Caps & Hats', slug: 'men-caps-hats' },
          { id: 'cat_men_bags', name: 'Bags & Backpacks', slug: 'men-bags-backpacks' },
          { id: 'cat_men_ties', name: 'Ties & Pocket Squares', slug: 'men-ties' },
        ],
      },
      {
        id: 'sec_men_essentials',
        title: "Men's Essentials & Innerwear",
        subCategories: [
          {
            id: 'cat_men_innerwear',
            name: 'Innerwear',
            slug: 'men-innerwear',
            items: [
              { id: 'cat_men_briefs', name: 'Briefs & Boxers', slug: 'men-briefs' },
              { id: 'cat_men_vests', name: 'Vests & Undershirts', slug: 'men-vests' },
            ],
          },
          {
            id: 'cat_men_socks',
            name: 'Socks',
            slug: 'men-socks',
            items: [
              { id: 'cat_men_ankle_socks', name: 'Ankle & Crew Socks', slug: 'men-ankle-socks' },
            ],
          },
          {
            id: 'cat_men_winter_essentials',
            name: 'Winter Thermals',
            slug: 'men-winter-essentials',
            items: [
              { id: 'cat_men_thermals', name: 'Thermals', slug: 'men-thermals' },
            ],
          },
          {
            id: 'cat_men_loungewear',
            name: 'Comfort & Loungewear',
            slug: 'men-loungewear',
            items: [
              { id: 'cat_men_lounge_pants', name: 'Lounge Pants & Sets', slug: 'men-lounge-pants' },
            ],
          },
        ],
      },
    ],
  },

  // 3. WOMEN
  {
    id: 'group_women',
    name: 'Women',
    slug: 'women',
    badge: 'Hot',
    sections: [
      {
        id: 'sec_women_clothing',
        title: "Women's Clothing",
        subCategories: [
          { id: 'cat_women_new_arrivals', name: 'New Arrivals', slug: 'women-new-arrivals' },
          {
            id: 'cat_women_indian',
            name: 'Indian & Festive Wear',
            slug: 'women-indian-wear',
            items: [
              { id: 'cat_women_sarees', name: 'Sarees', slug: 'women-sarees' },
              { id: 'cat_women_lehengas', name: 'Lehenga Choli', slug: 'women-lehengas' },
              { id: 'cat_women_kurta_sets', name: 'Kurta Sets & Salwar Suits', slug: 'women-kurta-sets' },
              { id: 'cat_women_kurtas', name: 'Kurtas & Kurtis', slug: 'women-kurtas' },
              {
                id: 'cat_women_ethnic_dresses',
                name: 'Ethnic Gowns & Dresses',
                slug: 'women-ethnic-dresses',
              },
            ],
          },
          {
            id: 'cat_women_western',
            name: 'Western & Casual Wear',
            slug: 'women-western-wear',
            items: [
              { id: 'cat_women_dresses', name: 'Dresses & Gowns', slug: 'women-dresses' },
              { id: 'cat_women_tops_tees', name: 'Tops & Tees', slug: 'women-tops-tees' },
              { id: 'cat_women_shirts', name: 'Shirts', slug: 'women-shirts' },
              { id: 'cat_women_coord_sets', name: 'Co-ord Sets & Jumpsuits', slug: 'women-coord-sets' },
              { id: 'cat_women_skirts', name: 'Skirts', slug: 'women-skirts' },
              { id: 'cat_women_jeans', name: 'Jeans & Trousers', slug: 'women-jeans' },
              { id: 'cat_women_shorts', name: 'Shorts', slug: 'women-shorts' },
            ],
          },
          {
            id: 'cat_women_winter_outerwear',
            name: 'Winter & Outerwear',
            slug: 'women-winter-outerwear',
            items: [
              { id: 'cat_women_jackets', name: 'Jackets & Shrugs', slug: 'women-jackets' },
              { id: 'cat_women_sweaters', name: 'Sweaters & Cardigans', slug: 'women-sweaters' },
              { id: 'cat_women_sweatshirts', name: 'Sweatshirts & Hoodies', slug: 'women-sweatshirts' },
              { id: 'cat_women_coats', name: 'Long Coats', slug: 'women-coats' },
            ],
          },
          {
            id: 'cat_women_activewear',
            name: 'Activewear & Gym',
            slug: 'women-activewear',
            items: [
              {
                id: 'cat_women_active_all',
                name: 'Activewear Sets & Tights',
                slug: 'women-activewear-sets',
              },
              { id: 'cat_women_sports_tops', name: 'Sports Tops & Bras', slug: 'women-sports-tops' },
            ],
          },
          {
            id: 'cat_women_sleepwear',
            name: 'Sleep & Loungewear',
            slug: 'women-sleepwear',
            items: [
              { id: 'cat_women_night_suits', name: 'Night Suits', slug: 'women-night-suits' },
              { id: 'cat_women_night_dresses', name: 'Night Dresses & Robes', slug: 'women-night-dresses' },
            ],
          },
          { id: 'cat_women_maternity', name: 'Maternity Wear', slug: 'women-maternity-wear' },
          { id: 'cat_women_plus_size', name: 'Plus Size', slug: 'women-plus-size' },
        ],
      },
      {
        id: 'sec_women_accessories',
        title: "Women's Bags & Accessories",
        subCategories: [
          {
            id: 'cat_women_bags',
            name: 'Bags & Clutches',
            slug: 'women-bags',
            items: [
              { id: 'cat_women_handbags', name: 'Handbags', slug: 'women-handbags' },
              { id: 'cat_women_sling_bags', name: 'Sling & Shoulder Bags', slug: 'women-sling-bags' },
              { id: 'cat_women_tote_bags', name: 'Tote & Backpacks', slug: 'women-tote-bags' },
              { id: 'cat_women_clutches', name: 'Clutches & Potlis', slug: 'women-clutches' },
            ],
          },
          { id: 'cat_women_jewellery', name: 'Jewellery & Sets', slug: 'women-jewellery' },
          { id: 'cat_women_watches', name: 'Watches', slug: 'women-watches' },
          { id: 'cat_women_sunglasses', name: 'Sunglasses', slug: 'women-sunglasses' },
          { id: 'cat_women_belts', name: 'Belts', slug: 'women-belts' },
          {
            id: 'cat_women_scarves_stoles',
            name: 'Scarves, Stoles & Dupattas',
            slug: 'women-scarves-stoles',
          },
          { id: 'cat_women_hair_acc', name: 'Hair Accessories', slug: 'women-hair-accessories' },
        ],
      },
      {
        id: 'sec_women_essentials',
        title: "Women's Lingerie & Essentials",
        subCategories: [
          {
            id: 'cat_women_innerwear',
            name: 'Innerwear',
            slug: 'women-innerwear',
            items: [
              { id: 'cat_women_bras', name: 'Bras', slug: 'women-bras' },
              { id: 'cat_women_panties', name: 'Panties', slug: 'women-panties' },
              { id: 'cat_women_lingerie', name: 'Lingerie Sets', slug: 'women-lingerie' },
              { id: 'cat_women_camisoles', name: 'Camisoles & Slips', slug: 'women-camisoles' },
            ],
          },
          {
            id: 'cat_women_shapewear',
            name: 'Shapewear',
            slug: 'women-shapewear',
            items: [
              {
                id: 'cat_women_shapewear_items',
                name: 'Shapewear Bodysuits & Tights',
                slug: 'women-shapewear-bodysuits',
              },
            ],
          },
          {
            id: 'cat_women_winter_essentials',
            name: 'Winter Thermals',
            slug: 'women-winter-essentials',
            items: [
              { id: 'cat_women_thermals', name: 'Thermals & Warmers', slug: 'women-thermals' },
            ],
          },
        ],
      },
    ],
  },

  // 4. KIDS
  {
    id: 'group_kids',
    name: 'Kids',
    slug: 'kids',
    badge: 'Cute',
    sections: [
      {
        id: 'sec_kids_fashion',
        title: "Kids' Fashion",
        subCategories: [
          { id: 'cat_kids_new_arrivals', name: 'New Arrivals', slug: 'kids-new-arrivals' },
          {
            id: 'cat_kids_baby',
            name: 'Baby (0-2 Yrs)',
            slug: 'baby-fashion',
            items: [
              { id: 'cat_baby_newborn', name: 'Newborn Essentials', slug: 'baby-newborn' },
              { id: 'cat_baby_boys', name: 'Baby Boys Outfits', slug: 'baby-boys' },
              { id: 'cat_baby_girls', name: 'Baby Girls Outfits', slug: 'baby-girls' },
              { id: 'cat_baby_rompers', name: 'Rompers & Sets', slug: 'baby-rompers' },
            ],
          },
          {
            id: 'cat_kids_boys',
            name: 'Boys (2-14 Yrs)',
            slug: 'boys-fashion',
            items: [
              { id: 'cat_boys_tshirts', name: 'T-Shirts & Polos', slug: 'boys-t-shirts' },
              { id: 'cat_boys_shirts', name: 'Shirts', slug: 'boys-shirts' },
              { id: 'cat_boys_jeans', name: 'Jeans & Trousers', slug: 'boys-jeans' },
              { id: 'cat_boys_shorts', name: 'Shorts & Track Pants', slug: 'boys-shorts' },
              { id: 'cat_boys_ethnic', name: 'Ethnic Wear (Kurtas & Sets)', slug: 'boys-ethnic-wear' },
              { id: 'cat_boys_jackets', name: 'Jackets & Sweatshirts', slug: 'boys-jackets' },
            ],
          },
          {
            id: 'cat_kids_girls',
            name: 'Girls (2-14 Yrs)',
            slug: 'girls-fashion',
            items: [
              { id: 'cat_girls_dresses', name: 'Dresses & Frocks', slug: 'girls-dresses' },
              { id: 'cat_girls_tops_tees', name: 'Tops & Tees', slug: 'girls-tops-tees' },
              { id: 'cat_girls_ethnic', name: 'Ethnic Wear (Lehengas & Suits)', slug: 'girls-ethnic-wear' },
              { id: 'cat_girls_skirts', name: 'Skirts & Jumpsuits', slug: 'girls-skirts' },
              {
                id: 'cat_girls_jeans_trousers',
                name: 'Jeans & Trousers',
                slug: 'girls-jeans-trousers',
              },
              { id: 'cat_girls_jackets', name: 'Jackets & Shrugs', slug: 'girls-jackets' },
            ],
          },
          {
            id: 'cat_kids_teens',
            name: 'Teens Fashion',
            slug: 'teens-fashion',
            items: [
              { id: 'cat_teens_boys', name: 'Teen Boys', slug: 'teen-boys' },
              { id: 'cat_teens_girls', name: 'Teen Girls', slug: 'teen-girls' },
              { id: 'cat_teens_trends', name: 'Teen Trends', slug: 'teen-trends' },
            ],
          },
          {
            id: 'cat_kids_essentials',
            name: 'Kids Essentials',
            slug: 'kids-essentials',
            items: [
              { id: 'cat_kids_innerwear', name: 'Innerwear & Vests', slug: 'kids-innerwear' },
              { id: 'cat_kids_socks', name: 'Socks', slug: 'kids-socks' },
              { id: 'cat_kids_nightwear', name: 'Nightwear & Loungewear', slug: 'kids-nightwear' },
              { id: 'cat_kids_thermals', name: 'Thermals & Warmers', slug: 'kids-thermals' },
            ],
          },
        ],
      },
    ],
  },

  // 5. NAVYA COLLECTION SHOPS
  {
    id: 'group_shops',
    name: 'Navya Collection Shops',
    slug: 'shops',
    badge: 'Boutiques',
    sections: [
      {
        id: 'sec_shops_explorer',
        title: 'Explore Partner Boutiques',
        subCategories: [
          { id: 'cat_shops_all', name: 'All Boutiques', slug: 'all-shops' },
          { id: 'cat_shops_new', name: 'New Stores', slug: 'new-shops' },
          { id: 'cat_shops_trending', name: 'Trending Boutiques', slug: 'trending-shops' },
          { id: 'cat_shops_top_rated', name: 'Top-Rated Boutiques', slug: 'top-rated-shops' },
        ],
      },
    ],
  },
];

// Helper: Populate legacy subCategories for backwards compatibility
CATEGORY_TAXONOMY.forEach((group) => {
  if (!group.subCategories) {
    group.subCategories = group.sections.flatMap((s) => s.subCategories);
  }
});

export interface FlatCategoryOption {
  id: string;
  name: string;
  slug: string;
  mainGroupId: string;
  mainGroupName: string;
  sectionTitle: string;
  breadcrumb: string;
  isLeaf?: boolean;
}

/**
 * Returns a flattened list of all categories and sub-items with full breadcrumbs
 * for effortless searching, selection in dropdowns, and admin recategorization.
 */
export function getFlattenedCategoryOptions(): FlatCategoryOption[] {
  const list: FlatCategoryOption[] = [];

  for (const main of CATEGORY_TAXONOMY) {
    for (const sec of main.sections) {
      for (const sub of sec.subCategories) {
        if (sub.items && sub.items.length > 0) {
          // Parent container category
          list.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            mainGroupId: main.id,
            mainGroupName: main.name,
            sectionTitle: sec.title,
            breadcrumb: `${main.name} > ${sec.title} > ${sub.name} (All)`,
            isLeaf: false,
          });

          // Individual Leaf categories
          for (const leaf of sub.items) {
            list.push({
              id: leaf.id,
              name: leaf.name,
              slug: leaf.slug,
              mainGroupId: main.id,
              mainGroupName: main.name,
              sectionTitle: sec.title,
              breadcrumb: `${main.name} > ${sec.title} > ${sub.name} > ${leaf.name}`,
              isLeaf: true,
            });
          }
        } else {
          list.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            mainGroupId: main.id,
            mainGroupName: main.name,
            sectionTitle: sec.title,
            breadcrumb: `${main.name} > ${sec.title} > ${sub.name}`,
            isLeaf: true,
          });
        }
      }
    }
  }

  return list;
}
