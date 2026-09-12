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
          { id: 'spot_new_season', name: 'New Season', slug: 'new-season' },
          { id: 'spot_festivals_india', name: 'Festivals of India', slug: 'festivals-of-india' },
          { id: 'spot_korean_store', name: 'Korean Store', slug: 'korean-store' },
          { id: 'spot_sports_store', name: 'Sports Store', slug: 'sports-store' },
          { id: 'spot_trendy_street', name: 'Trendy Street', slug: 'trendy-street' },
          { id: 'spot_genz_fashion', name: 'Gen Z Fashion', slug: 'gen-z-fashion' },
          { id: 'spot_new_on_navya', name: 'New on Navya', slug: 'new-arrivals' },
          { id: 'spot_top_rated', name: 'Top-Rated Styles', slug: 'top-rated' },
          { id: 'spot_shop_vibe', name: 'Shop Your Vibe', slug: 'shop-your-vibe' },
          { id: 'spot_budget_finds', name: 'Budget Finds', slug: 'budget-finds' },
          { id: 'spot_trending_now', name: 'Trending Now', slug: 'trending' },
          { id: 'spot_best_sellers', name: 'Best Sellers', slug: 'best-sellers' },
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
              { id: 'cat_men_tshirts', name: 'T-Shirts', slug: 'men-t-shirts' },
              { id: 'cat_men_shirts', name: 'Shirts', slug: 'men-shirts' },
              { id: 'cat_men_polos', name: 'Polos', slug: 'men-polos' },
              { id: 'cat_men_sweatshirts', name: 'Sweatshirts', slug: 'men-sweatshirts' },
              { id: 'cat_men_hoodies', name: 'Hoodies', slug: 'men-hoodies' },
              { id: 'cat_men_jackets_top', name: 'Jackets', slug: 'men-topwear-jackets' },
              { id: 'cat_men_sweaters', name: 'Sweaters', slug: 'men-sweaters' },
            ],
          },
          {
            id: 'cat_men_bottomwear',
            name: 'Bottomwear',
            slug: 'men-bottomwear',
            items: [
              { id: 'cat_men_jeans', name: 'Jeans / Denims', slug: 'men-jeans' },
              { id: 'cat_men_trousers', name: 'Trousers', slug: 'men-trousers' },
              { id: 'cat_men_chinos', name: 'Chinos', slug: 'men-chinos' },
              { id: 'cat_men_cargos', name: 'Cargo Pants', slug: 'men-cargo-pants' },
              { id: 'cat_men_shorts', name: 'Shorts', slug: 'men-shorts' },
              { id: 'cat_men_trackpants', name: 'Track Pants', slug: 'men-track-pants' },
            ],
          },
          {
            id: 'cat_men_ethnic',
            name: 'Ethnic Wear',
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
            name: 'Formal Wear',
            slug: 'men-formal-wear',
            items: [
              { id: 'cat_men_formal_shirts', name: 'Formal Shirts', slug: 'men-formal-shirts' },
              {
                id: 'cat_men_formal_trousers',
                name: 'Formal Trousers',
                slug: 'men-formal-trousers',
              },
              { id: 'cat_men_blazers', name: 'Blazers', slug: 'men-blazers' },
              { id: 'cat_men_suits', name: 'Suits', slug: 'men-suits' },
              { id: 'cat_men_waistcoats', name: 'Waistcoats', slug: 'men-waistcoats' },
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
              {
                id: 'cat_men_sports_trackpants',
                name: 'Track Pants',
                slug: 'men-sports-track-pants',
              },
              { id: 'cat_men_sports_shorts', name: 'Shorts', slug: 'men-sports-shorts' },
              { id: 'cat_men_tracksuits', name: 'Tracksuits', slug: 'men-tracksuits' },
              { id: 'cat_men_activewear_all', name: 'Activewear', slug: 'men-activewear' },
            ],
          },
          {
            id: 'cat_men_outerwear',
            name: 'Outerwear',
            slug: 'men-outerwear',
            items: [
              { id: 'cat_men_outer_jackets', name: 'Jackets', slug: 'men-jackets' },
              { id: 'cat_men_raincoats', name: 'Raincoats', slug: 'men-raincoats' },
              { id: 'cat_men_windcheaters', name: 'Windcheaters', slug: 'men-windcheaters' },
            ],
          },
          { id: 'cat_men_plus_size', name: 'Plus Size', slug: 'men-plus-size' },
          { id: 'cat_men_sale_50_off', name: 'Sale: 50%+ Off', slug: 'men-sale-50-off' },
          { id: 'cat_men_under_499', name: 'Deals: Under ₹499', slug: 'men-under-499' },
          { id: 'cat_men_under_999', name: 'Deals: Under ₹999', slug: 'men-under-999' },
          { id: 'cat_men_all_clothing', name: "All Men's Clothing", slug: 'men-all-clothing' },
        ],
      },
      {
        id: 'sec_men_accessories',
        title: "Men's Accessories",
        subCategories: [
          { id: 'cat_men_acc_new', name: 'New Arrivals', slug: 'men-accessories-new' },
          { id: 'cat_men_wallets', name: 'Wallets', slug: 'men-wallets' },
          { id: 'cat_men_belts', name: 'Belts', slug: 'men-belts' },
          { id: 'cat_men_watches', name: 'Watches', slug: 'men-watches' },
          { id: 'cat_men_sunglasses', name: 'Sunglasses', slug: 'men-sunglasses' },
          { id: 'cat_men_caps_hats', name: 'Caps & Hats', slug: 'men-caps-hats' },
          { id: 'cat_men_bags', name: 'Bags & Backpacks', slug: 'men-bags-backpacks' },
          { id: 'cat_men_ties', name: 'Ties & Pocket Squares', slug: 'men-ties' },
          { id: 'cat_men_jewellery', name: 'Jewellery', slug: 'men-jewellery' },
          {
            id: 'cat_men_fashion_acc',
            name: 'Fashion Accessories',
            slug: 'men-fashion-accessories',
          },
          { id: 'cat_men_all_acc', name: "All Men's Accessories", slug: 'men-all-accessories' },
        ],
      },
      {
        id: 'sec_men_essentials',
        title: "Men's Essentials",
        subCategories: [
          { id: 'cat_men_ess_new', name: 'New Arrivals', slug: 'men-essentials-new' },
          {
            id: 'cat_men_innerwear',
            name: 'Innerwear',
            slug: 'men-innerwear',
            items: [
              { id: 'cat_men_briefs', name: 'Briefs', slug: 'men-briefs' },
              { id: 'cat_men_boxers', name: 'Boxers', slug: 'men-boxers' },
              { id: 'cat_men_vests', name: 'Vests', slug: 'men-vests' },
              { id: 'cat_men_undershirts', name: 'Undershirts', slug: 'men-undershirts' },
            ],
          },
          {
            id: 'cat_men_socks',
            name: 'Socks',
            slug: 'men-socks',
            items: [
              { id: 'cat_men_ankle_socks', name: 'Ankle Socks', slug: 'men-ankle-socks' },
              { id: 'cat_men_crew_socks', name: 'Crew Socks', slug: 'men-crew-socks' },
              { id: 'cat_men_sports_socks', name: 'Sports Socks', slug: 'men-sports-socks' },
            ],
          },
          {
            id: 'cat_men_winter_essentials',
            name: 'Winter Essentials',
            slug: 'men-winter-essentials',
            items: [
              { id: 'cat_men_thermals', name: 'Thermals', slug: 'men-thermals' },
              { id: 'cat_men_thermal_tops', name: 'Thermal Tops', slug: 'men-thermal-tops' },
              {
                id: 'cat_men_thermal_bottoms',
                name: 'Thermal Bottoms',
                slug: 'men-thermal-bottoms',
              },
            ],
          },
          {
            id: 'cat_men_loungewear',
            name: 'Comfort & Loungewear',
            slug: 'men-loungewear',
            items: [
              { id: 'cat_men_lounge_shorts', name: 'Shorts', slug: 'men-lounge-shorts' },
              {
                id: 'cat_men_lounge_tracksuits',
                name: 'Tracksuits',
                slug: 'men-lounge-tracksuits',
              },
              { id: 'cat_men_lounge_pants', name: 'Lounge Pants', slug: 'men-lounge-pants' },
            ],
          },
          {
            id: 'cat_men_all_essentials',
            name: "All Men's Essentials",
            slug: 'men-all-essentials',
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
            name: 'Indian Wear',
            slug: 'women-indian-wear',
            items: [
              { id: 'cat_women_kurtas', name: 'Kurtas', slug: 'women-kurtas' },
              { id: 'cat_women_kurta_sets', name: 'Kurta Sets', slug: 'women-kurta-sets' },
              { id: 'cat_women_sarees', name: 'Sarees', slug: 'women-sarees' },
              { id: 'cat_women_lehengas', name: 'Lehenga Choli', slug: 'women-lehengas' },
              {
                id: 'cat_women_ethnic_dresses',
                name: 'Ethnic Dresses',
                slug: 'women-ethnic-dresses',
              },
            ],
          },
          {
            id: 'cat_women_western',
            name: 'Western Wear',
            slug: 'women-western-wear',
            items: [
              { id: 'cat_women_tops_tees', name: 'Tops & Tees', slug: 'women-tops-tees' },
              { id: 'cat_women_shirts', name: 'Shirts', slug: 'women-shirts' },
              { id: 'cat_women_dresses', name: 'Dresses', slug: 'women-dresses' },
              { id: 'cat_women_jumpsuits', name: 'Jumpsuits', slug: 'women-jumpsuits' },
              { id: 'cat_women_skirts', name: 'Skirts', slug: 'women-skirts' },
              { id: 'cat_women_coord_sets', name: 'Co-ord Sets', slug: 'women-coord-sets' },
              { id: 'cat_women_jeans', name: 'Jeans', slug: 'women-jeans' },
              { id: 'cat_women_trousers', name: 'Trousers', slug: 'women-trousers' },
              { id: 'cat_women_shorts', name: 'Shorts', slug: 'women-shorts' },
            ],
          },
          {
            id: 'cat_women_winter_outerwear',
            name: 'Winter & Outerwear',
            slug: 'women-winter-outerwear',
            items: [
              { id: 'cat_women_jackets', name: 'Jackets', slug: 'women-jackets' },
              { id: 'cat_women_sweaters', name: 'Sweaters', slug: 'women-sweaters' },
              { id: 'cat_women_sweatshirts', name: 'Sweatshirts', slug: 'women-sweatshirts' },
              { id: 'cat_women_coats', name: 'Coats', slug: 'women-coats' },
            ],
          },
          {
            id: 'cat_women_activewear',
            name: 'Activewear',
            slug: 'women-activewear',
            items: [
              {
                id: 'cat_women_active_all',
                name: 'Activewear Sets',
                slug: 'women-activewear-sets',
              },
              { id: 'cat_women_sports_tops', name: 'Sports Tops', slug: 'women-sports-tops' },
              { id: 'cat_women_track_pants', name: 'Track Pants', slug: 'women-track-pants' },
              { id: 'cat_women_active_shorts', name: 'Shorts', slug: 'women-active-shorts' },
            ],
          },
          {
            id: 'cat_women_sleepwear',
            name: 'Sleepwear',
            slug: 'women-sleepwear',
            items: [
              { id: 'cat_women_night_suits', name: 'Night Suits', slug: 'women-night-suits' },
              { id: 'cat_women_night_dresses', name: 'Night Dresses', slug: 'women-night-dresses' },
              {
                id: 'cat_women_night_loungewear',
                name: 'Loungewear',
                slug: 'women-night-loungewear',
              },
            ],
          },
          { id: 'cat_women_maternity', name: 'Maternity Wear', slug: 'women-maternity-wear' },
          { id: 'cat_women_plus_size', name: 'Plus Size', slug: 'women-plus-size' },
          { id: 'cat_women_sale_50_off', name: 'Sale: 50%+ Off', slug: 'women-sale-50-off' },
          { id: 'cat_women_under_499', name: 'Deals: Under ₹499', slug: 'women-under-499' },
          { id: 'cat_women_under_999', name: 'Deals: Under ₹999', slug: 'women-under-999' },
          {
            id: 'cat_women_all_clothing',
            name: "All Women's Clothing",
            slug: 'women-all-clothing',
          },
        ],
      },
      {
        id: 'sec_women_accessories',
        title: "Women's Accessories",
        subCategories: [
          { id: 'cat_women_acc_new', name: 'New Arrivals', slug: 'women-accessories-new' },
          {
            id: 'cat_women_bags',
            name: 'Bags',
            slug: 'women-bags',
            items: [
              { id: 'cat_women_handbags', name: 'Handbags', slug: 'women-handbags' },
              { id: 'cat_women_sling_bags', name: 'Sling Bags', slug: 'women-sling-bags' },
              { id: 'cat_women_shoulder_bags', name: 'Shoulder Bags', slug: 'women-shoulder-bags' },
              { id: 'cat_women_tote_bags', name: 'Tote Bags', slug: 'women-tote-bags' },
              { id: 'cat_women_backpacks', name: 'Backpacks', slug: 'women-backpacks' },
              { id: 'cat_women_clutches', name: 'Clutches', slug: 'women-clutches' },
            ],
          },
          { id: 'cat_women_sunglasses', name: 'Sunglasses', slug: 'women-sunglasses' },
          { id: 'cat_women_watches', name: 'Watches', slug: 'women-watches' },
          { id: 'cat_women_jewellery', name: 'Jewellery', slug: 'women-jewellery' },
          { id: 'cat_women_belts', name: 'Belts', slug: 'women-belts' },
          {
            id: 'cat_women_scarves_stoles',
            name: 'Scarves & Stoles',
            slug: 'women-scarves-stoles',
          },
          { id: 'cat_women_hair_acc', name: 'Hair Accessories', slug: 'women-hair-accessories' },
          {
            id: 'cat_women_all_acc',
            name: "All Women's Accessories",
            slug: 'women-all-accessories',
          },
        ],
      },
      {
        id: 'sec_women_essentials',
        title: "Women's Essentials",
        subCategories: [
          { id: 'cat_women_ess_new', name: 'New Arrivals', slug: 'women-essentials-new' },
          {
            id: 'cat_women_innerwear',
            name: 'Innerwear',
            slug: 'women-innerwear',
            items: [
              { id: 'cat_women_bras', name: 'Bras', slug: 'women-bras' },
              { id: 'cat_women_panties', name: 'Panties', slug: 'women-panties' },
              { id: 'cat_women_lingerie', name: 'Lingerie', slug: 'women-lingerie' },
              { id: 'cat_women_camisoles', name: 'Camisoles', slug: 'women-camisoles' },
            ],
          },
          {
            id: 'cat_women_shapewear',
            name: 'Comfort & Shapewear',
            slug: 'women-shapewear',
            items: [
              {
                id: 'cat_women_shapewear_items',
                name: 'Shapewear',
                slug: 'women-shapewear-bodysuits',
              },
              { id: 'cat_women_slips', name: 'Slips', slug: 'women-slips' },
              {
                id: 'cat_women_shapewear_camis',
                name: 'Camisoles',
                slug: 'women-shapewear-camisoles',
              },
            ],
          },
          {
            id: 'cat_women_winter_essentials',
            name: 'Winter Essentials',
            slug: 'women-winter-essentials',
            items: [
              { id: 'cat_women_thermals', name: 'Thermals', slug: 'women-thermals' },
              { id: 'cat_women_thermal_tops', name: 'Thermal Tops', slug: 'women-thermal-tops' },
              {
                id: 'cat_women_thermal_bottoms',
                name: 'Thermal Bottoms',
                slug: 'women-thermal-bottoms',
              },
            ],
          },
          {
            id: 'cat_women_loungewear',
            name: 'Loungewear',
            slug: 'women-loungewear',
            items: [
              { id: 'cat_women_lounge_sets', name: 'Lounge Sets', slug: 'women-lounge-sets' },
              { id: 'cat_women_comfort_wear', name: 'Comfort Wear', slug: 'women-comfort-wear' },
            ],
          },
          {
            id: 'cat_women_all_essentials',
            name: "All Women's Essentials",
            slug: 'women-all-essentials',
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
              { id: 'cat_baby_newborn', name: 'Newborn', slug: 'baby-newborn' },
              { id: 'cat_baby_boys', name: 'Baby Boys', slug: 'baby-boys' },
              { id: 'cat_baby_girls', name: 'Baby Girls', slug: 'baby-girls' },
              { id: 'cat_baby_sets', name: 'Baby Sets', slug: 'baby-sets' },
              { id: 'cat_baby_rompers', name: 'Baby Rompers', slug: 'baby-rompers' },
            ],
          },
          {
            id: 'cat_kids_boys',
            name: 'Boys (2-14 Yrs)',
            slug: 'boys-fashion',
            items: [
              { id: 'cat_boys_tshirts', name: 'T-Shirts', slug: 'boys-t-shirts' },
              { id: 'cat_boys_polos', name: 'Polos', slug: 'boys-polos' },
              { id: 'cat_boys_shirts', name: 'Shirts', slug: 'boys-shirts' },
              { id: 'cat_boys_jeans', name: 'Jeans', slug: 'boys-jeans' },
              { id: 'cat_boys_trousers', name: 'Trousers', slug: 'boys-trousers' },
              { id: 'cat_boys_shorts', name: 'Shorts', slug: 'boys-shorts' },
              { id: 'cat_boys_ethnic', name: 'Ethnic Wear', slug: 'boys-ethnic-wear' },
              { id: 'cat_boys_jackets', name: 'Jackets', slug: 'boys-jackets' },
            ],
          },
          {
            id: 'cat_kids_girls',
            name: 'Girls (2-14 Yrs)',
            slug: 'girls-fashion',
            items: [
              { id: 'cat_girls_tops_tees', name: 'Tops & Tees', slug: 'girls-tops-tees' },
              { id: 'cat_girls_dresses', name: 'Dresses', slug: 'girls-dresses' },
              { id: 'cat_girls_jumpsuits', name: 'Jumpsuits', slug: 'girls-jumpsuits' },
              { id: 'cat_girls_skirts', name: 'Skirts', slug: 'girls-skirts' },
              {
                id: 'cat_girls_jeans_trousers',
                name: 'Jeans & Trousers',
                slug: 'girls-jeans-trousers',
              },
              { id: 'cat_girls_ethnic', name: 'Ethnic Wear', slug: 'girls-ethnic-wear' },
              { id: 'cat_girls_jackets', name: 'Jackets', slug: 'girls-jackets' },
            ],
          },
          {
            id: 'cat_kids_teens',
            name: 'Teens',
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
              { id: 'cat_kids_innerwear', name: 'Innerwear', slug: 'kids-innerwear' },
              { id: 'cat_kids_socks', name: 'Socks', slug: 'kids-socks' },
              { id: 'cat_kids_nightwear', name: 'Nightwear', slug: 'kids-nightwear' },
              { id: 'cat_kids_thermals', name: 'Thermals', slug: 'kids-thermals' },
            ],
          },
          {
            id: 'cat_kids_ethnic_wear',
            name: 'Kids Ethnic Wear',
            slug: 'kids-ethnic-collection',
            items: [
              { id: 'cat_kids_ethnic_boys', name: 'Boys Ethnic', slug: 'kids-ethnic-boys' },
              { id: 'cat_kids_ethnic_girls', name: 'Girls Ethnic', slug: 'kids-ethnic-girls' },
            ],
          },
          { id: 'cat_kids_all_fashion', name: "All Kids' Fashion", slug: 'kids-all-fashion' },
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
          { id: 'cat_shops_all', name: 'All Shops', slug: 'all-shops' },
          { id: 'cat_shops_new', name: 'New Shops', slug: 'new-shops' },
          { id: 'cat_shops_trending', name: 'Trending Shops', slug: 'trending-shops' },
          { id: 'cat_shops_top_rated', name: 'Top-Rated Shops', slug: 'top-rated-shops' },
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
