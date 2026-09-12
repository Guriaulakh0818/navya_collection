export interface SubCategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  queryParam: string;
  badge?: string;
}

export interface SubCategorySection {
  id: string;
  title: string;
  items: SubCategoryItem[];
}

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  slug: string;
  badge?: string;
  gradient?: string;
}

export interface MainCategoryGroup {
  id: string;
  name: string;
  slug: string;
  iconImage: string;
  badge?: string;
  banner?: {
    title: string;
    subtitle: string;
    image: string;
    link: string;
  };
  spotlights?: SpotlightItem[];
  subSections: SubCategorySection[];
}

export const MAIN_CATEGORY_GROUPS: MainCategoryGroup[] = [
  // 1. IN THE SPOTLIGHT
  {
    id: 'group_spotlight',
    name: 'In The Spotlight',
    slug: 'spotlight',
    iconImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=160',
    badge: 'Trending',
    banner: {
      title: 'In The Spotlight Collections',
      subtitle: 'Handpicked seasonal drops, festive highlights, top-rated trends & budget finds',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      link: '/shop?tag=spotlight',
    },
    spotlights: [
      {
        id: 'spot_new_season',
        title: 'New Season',
        subtitle: 'Autumn Winter',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300',
        slug: '/shop?collection=new-season',
        badge: 'NEW',
        gradient: 'from-amber-700 via-rose-700 to-red-800',
      },
      {
        id: 'spot_festivals_india',
        title: 'Festivals of India',
        subtitle: 'Grand Celebrations',
        image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
        slug: '/shop?occasion=festive',
        badge: 'HOT',
        gradient: 'from-pink-600 via-purple-700 to-indigo-900',
      },
      {
        id: 'spot_korean_store',
        title: 'Korean Store',
        subtitle: 'K-Aesthetic Drops',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300',
        slug: '/shop?style=korean',
        badge: 'TREND',
        gradient: 'from-slate-700 via-zinc-800 to-neutral-900',
      },
      {
        id: 'spot_sports_store',
        title: 'Sports Store',
        subtitle: 'Active & Gymwear',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300',
        slug: '/shop?category=activewear',
        badge: 'SPORT',
        gradient: 'from-blue-600 via-indigo-700 to-sky-800',
      },
      {
        id: 'spot_trendy_street',
        title: 'Trendy Street',
        subtitle: 'Urban & Oversized',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300',
        slug: '/shop?style=streetwear',
        badge: 'STREET',
        gradient: 'from-orange-600 via-amber-700 to-yellow-800',
      },
      {
        id: 'spot_genz_fashion',
        title: 'Gen Z Fashion',
        subtitle: 'Youth Aesthetics',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300',
        slug: '/shop?style=gen-z',
        badge: 'GEN Z',
        gradient: 'from-fuchsia-600 via-pink-600 to-rose-700',
      },
      {
        id: 'spot_new_on_navya',
        title: 'New on Navya',
        subtitle: 'Fresh Arrivals',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
        slug: '/shop?sort=newest',
        badge: 'FRESH',
        gradient: 'from-teal-600 via-emerald-700 to-cyan-800',
      },
      {
        id: 'spot_top_rated',
        title: 'Top-Rated Styles',
        subtitle: 'Highest Rated',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
        slug: '/shop?sort=rating',
        badge: '★ 4.8',
        gradient: 'from-indigo-700 via-purple-800 to-navy',
      },
      {
        id: 'spot_shop_vibe',
        title: 'Shop Your Vibe',
        subtitle: 'Aesthetic Picks',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300',
        slug: '/shop?view=vibe',
        badge: 'VIBE',
        gradient: 'from-violet-600 via-purple-700 to-indigo-900',
      },
      {
        id: 'spot_budget_finds',
        title: 'Budget Finds',
        subtitle: 'Pocket Friendly',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300',
        slug: '/shop?maxPrice=999',
        badge: 'VALUE',
        gradient: 'from-emerald-700 via-green-800 to-teal-900',
      },
      {
        id: 'spot_trending_now',
        title: 'Trending Now',
        subtitle: 'Most Loved Items',
        image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300',
        slug: '/shop?sort=popular',
        badge: 'VIRAL',
        gradient: 'from-rose-600 via-red-700 to-orange-800',
      },
      {
        id: 'spot_best_sellers',
        title: 'Best Sellers',
        subtitle: 'Customer Favorites',
        image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300',
        slug: '/shop?filter=best_seller',
        badge: 'TOP',
        gradient: 'from-amber-600 via-yellow-700 to-amber-900',
      },
    ],
    subSections: [
      {
        id: 'sec_spotlight_all',
        title: 'All Spotlight Varieties',
        items: [
          {
            id: 'item_new_season',
            name: 'New Season',
            slug: 'new-season',
            image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300',
            queryParam: 'collection=new-season',
            badge: 'NEW',
          },
          {
            id: 'item_festivals_india',
            name: 'Festivals of India',
            slug: 'festivals-of-india',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'occasion=festive',
            badge: 'FESTIVE',
          },
          {
            id: 'item_korean_store',
            name: 'Korean Store',
            slug: 'korean-store',
            image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300',
            queryParam: 'style=korean',
          },
          {
            id: 'item_sports_store',
            name: 'Sports Store',
            slug: 'sports-store',
            image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300',
            queryParam: 'category=activewear',
          },
          {
            id: 'item_trendy_street',
            name: 'Trendy Street',
            slug: 'trendy-street',
            image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300',
            queryParam: 'style=streetwear',
          },
          {
            id: 'item_genz_fashion',
            name: 'Gen Z Fashion',
            slug: 'gen-z-fashion',
            image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300',
            queryParam: 'style=gen-z',
          },
          {
            id: 'item_new_on_navya',
            name: 'New on Navya',
            slug: 'new-arrivals',
            image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
            queryParam: 'sort=newest',
            badge: 'FRESH',
          },
          {
            id: 'item_top_rated',
            name: 'Top-Rated Styles',
            slug: 'top-rated',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
            queryParam: 'sort=rating',
            badge: '4.8★',
          },
          {
            id: 'item_shop_vibe',
            name: 'Shop Your Vibe',
            slug: 'shop-your-vibe',
            image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300',
            queryParam: 'view=vibe',
          },
          {
            id: 'item_budget_finds',
            name: 'Budget Finds',
            slug: 'budget-finds',
            image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300',
            queryParam: 'maxPrice=999',
            badge: 'SAVE',
          },
          {
            id: 'item_trending_now',
            name: 'Trending Now',
            slug: 'trending',
            image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300',
            queryParam: 'sort=popular',
            badge: 'TRENDING',
          },
          {
            id: 'item_best_sellers',
            name: 'Best Sellers',
            slug: 'best-sellers',
            image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300',
            queryParam: 'filter=best_seller',
            badge: 'TOP',
          },
        ],
      },
    ],
  },

  // 2. MEN
  {
    id: 'group_men',
    name: 'Men',
    slug: 'men',
    iconImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160',
    badge: 'Popular',
    banner: {
      title: "Men's Collection",
      subtitle: 'From Handcrafted Silk Kurtas & Suits to Everyday Tops & Bottoms',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
      link: '/shop?gender=men',
    },
    subSections: [
      {
        id: 'sec_men_topwear',
        title: 'Topwear',
        items: [
          {
            id: 'men_tshirts',
            name: 'T-Shirts',
            slug: 'men-t-shirts',
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300',
            queryParam: 'category=men-t-shirts',
          },
          {
            id: 'men_shirts',
            name: 'Shirts',
            slug: 'men-shirts',
            image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300',
            queryParam: 'category=men-shirts',
            badge: 'BESTSELLER',
          },
          {
            id: 'men_polos',
            name: 'Polos',
            slug: 'men-polos',
            image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=300',
            queryParam: 'category=men-polos',
          },
          {
            id: 'men_sweatshirts',
            name: 'Sweatshirts',
            slug: 'men-sweatshirts',
            image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
            queryParam: 'category=men-sweatshirts',
          },
          {
            id: 'men_hoodies',
            name: 'Hoodies',
            slug: 'men-hoodies',
            image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
            queryParam: 'category=men-hoodies',
          },
          {
            id: 'men_jackets',
            name: 'Jackets',
            slug: 'men-jackets',
            image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300',
            queryParam: 'category=men-jackets',
          },
          {
            id: 'men_sweaters',
            name: 'Sweaters',
            slug: 'men-sweaters',
            image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300',
            queryParam: 'category=men-sweaters',
          },
        ],
      },
      {
        id: 'sec_men_bottomwear',
        title: 'Bottomwear',
        items: [
          {
            id: 'men_jeans',
            name: 'Jeans / Denims',
            slug: 'men-jeans',
            image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=300',
            queryParam: 'category=men-jeans',
            badge: 'DENIM',
          },
          {
            id: 'men_trousers',
            name: 'Trousers',
            slug: 'men-trousers',
            image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300',
            queryParam: 'category=men-trousers',
          },
          {
            id: 'men_chinos',
            name: 'Chinos',
            slug: 'men-chinos',
            image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300',
            queryParam: 'category=men-chinos',
          },
          {
            id: 'men_cargos',
            name: 'Cargo Pants',
            slug: 'men-cargo-pants',
            image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=300',
            queryParam: 'category=men-cargo-pants',
          },
          {
            id: 'men_shorts',
            name: 'Shorts',
            slug: 'men-shorts',
            image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300',
            queryParam: 'category=men-shorts',
          },
          {
            id: 'men_trackpants',
            name: 'Track Pants',
            slug: 'men-track-pants',
            image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300',
            queryParam: 'category=men-track-pants',
          },
        ],
      },
      {
        id: 'sec_men_ethnic',
        title: 'Ethnic Wear',
        items: [
          {
            id: 'men_kurtas',
            name: 'Kurtas',
            slug: 'men-kurtas',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=men-kurtas',
            badge: 'ETHNIC',
          },
          {
            id: 'men_kurta_sets',
            name: 'Kurta Sets',
            slug: 'men-kurta-sets',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=men-kurta-sets',
          },
          {
            id: 'men_ethnic_shirts',
            name: 'Ethnic Shirts',
            slug: 'men-ethnic-shirts',
            image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300',
            queryParam: 'category=men-ethnic-shirts',
          },
          {
            id: 'men_sherwanis',
            name: 'Sherwanis',
            slug: 'men-sherwanis',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=men-sherwanis',
            badge: 'WEDDING',
          },
          {
            id: 'men_nehru_jackets',
            name: 'Nehru Jackets',
            slug: 'men-nehru-jackets',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300',
            queryParam: 'category=men-nehru-jackets',
          },
        ],
      },
      {
        id: 'sec_men_formal',
        title: 'Formal Wear',
        items: [
          {
            id: 'men_formal_shirts',
            name: 'Formal Shirts',
            slug: 'men-formal-shirts',
            image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300',
            queryParam: 'category=men-formal-shirts',
          },
          {
            id: 'men_formal_trousers',
            name: 'Formal Trousers',
            slug: 'men-formal-trousers',
            image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300',
            queryParam: 'category=men-formal-trousers',
          },
          {
            id: 'men_blazers',
            name: 'Blazers',
            slug: 'men-blazers',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300',
            queryParam: 'category=men-blazers',
            badge: 'PREMIUM',
          },
          {
            id: 'men_suits',
            name: 'Suits',
            slug: 'men-suits',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=men-suits',
          },
          {
            id: 'men_waistcoats',
            name: 'Waistcoats',
            slug: 'men-waistcoats',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300',
            queryParam: 'category=men-waistcoats',
          },
        ],
      },
      {
        id: 'sec_men_accessories',
        title: "Men's Accessories",
        items: [
          {
            id: 'men_wallets',
            name: 'Wallets',
            slug: 'men-wallets',
            image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300',
            queryParam: 'category=men-wallets',
          },
          {
            id: 'men_belts',
            name: 'Belts',
            slug: 'men-belts',
            image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300',
            queryParam: 'category=men-belts',
          },
          {
            id: 'men_watches',
            name: 'Watches',
            slug: 'men-watches',
            image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300',
            queryParam: 'category=men-watches',
            badge: 'LUXURY',
          },
          {
            id: 'men_sunglasses',
            name: 'Sunglasses',
            slug: 'men-sunglasses',
            image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300',
            queryParam: 'category=men-sunglasses',
          },
          {
            id: 'men_bags',
            name: 'Bags & Backpacks',
            slug: 'men-bags-backpacks',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
            queryParam: 'category=men-bags-backpacks',
          },
          {
            id: 'men_ties',
            name: 'Ties & Squares',
            slug: 'men-ties',
            image: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?w=300',
            queryParam: 'category=men-ties',
          },
        ],
      },
      {
        id: 'sec_men_essentials',
        title: "Men's Essentials",
        items: [
          {
            id: 'men_briefs',
            name: 'Briefs',
            slug: 'men-briefs',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
            queryParam: 'category=men-briefs',
          },
          {
            id: 'men_boxers',
            name: 'Boxers',
            slug: 'men-boxers',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
            queryParam: 'category=men-boxers',
          },
          {
            id: 'men_vests',
            name: 'Vests',
            slug: 'men-vests',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
            queryParam: 'category=men-vests',
          },
          {
            id: 'men_socks',
            name: 'Socks',
            slug: 'men-socks',
            image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300',
            queryParam: 'category=men-socks',
          },
          {
            id: 'men_thermals',
            name: 'Thermals',
            slug: 'men-thermals',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300',
            queryParam: 'category=men-thermals',
          },
          {
            id: 'men_loungewear',
            name: 'Loungewear & Tracksuits',
            slug: 'men-loungewear',
            image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300',
            queryParam: 'category=men-loungewear',
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
    iconImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160',
    badge: 'Hot',
    banner: {
      title: "Women's Collection",
      subtitle: 'Pure Heritage Sarees, Bridal Lehengas, Kurtis, Western & Essentials',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      link: '/shop?gender=women',
    },
    subSections: [
      {
        id: 'sec_women_indian',
        title: 'Indian Wear',
        items: [
          {
            id: 'women_sarees',
            name: 'Sarees',
            slug: 'women-sarees',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=women-sarees',
            badge: 'HERITAGE',
          },
          {
            id: 'women_lehengas',
            name: 'Lehenga Choli',
            slug: 'women-lehengas',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=women-lehengas',
            badge: 'BRIDAL',
          },
          {
            id: 'women_kurtas',
            name: 'Kurtas',
            slug: 'women-kurtas',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=women-kurtas',
          },
          {
            id: 'women_kurta_sets',
            name: 'Kurta Sets & Suits',
            slug: 'women-kurta-sets',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=women-kurta-sets',
            badge: 'TRENDING',
          },
          {
            id: 'women_ethnic_dresses',
            name: 'Ethnic Dresses',
            slug: 'women-ethnic-dresses',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=women-ethnic-dresses',
          },
        ],
      },
      {
        id: 'sec_women_western',
        title: 'Western Wear',
        items: [
          {
            id: 'women_tops_tees',
            name: 'Tops & Tees',
            slug: 'women-tops-tees',
            image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300',
            queryParam: 'category=women-tops-tees',
          },
          {
            id: 'women_shirts',
            name: 'Shirts',
            slug: 'women-shirts',
            image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300',
            queryParam: 'category=women-shirts',
          },
          {
            id: 'women_dresses',
            name: 'Dresses',
            slug: 'women-dresses',
            image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300',
            queryParam: 'category=women-dresses',
            badge: 'STYLISH',
          },
          {
            id: 'women_jumpsuits',
            name: 'Jumpsuits',
            slug: 'women-jumpsuits',
            image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300',
            queryParam: 'category=women-jumpsuits',
          },
          {
            id: 'women_skirts',
            name: 'Skirts',
            slug: 'women-skirts',
            image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300',
            queryParam: 'category=women-skirts',
          },
          {
            id: 'women_coord_sets',
            name: 'Co-ord Sets',
            slug: 'women-coord-sets',
            image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300',
            queryParam: 'category=women-coord-sets',
            badge: 'HOT',
          },
          {
            id: 'women_jeans',
            name: 'Jeans & Trousers',
            slug: 'women-jeans',
            image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300',
            queryParam: 'category=women-jeans',
          },
        ],
      },
      {
        id: 'sec_women_accessories',
        title: "Women's Accessories",
        items: [
          {
            id: 'women_handbags',
            name: 'Handbags',
            slug: 'women-handbags',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
            queryParam: 'category=women-handbags',
            badge: 'PREMIUM',
          },
          {
            id: 'women_sling_bags',
            name: 'Sling Bags',
            slug: 'women-sling-bags',
            image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300',
            queryParam: 'category=women-sling-bags',
          },
          {
            id: 'women_jewellery',
            name: 'Jewellery',
            slug: 'women-jewellery',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=women-jewellery',
            badge: 'SPARKLE',
          },
          {
            id: 'women_watches',
            name: 'Watches',
            slug: 'women-watches',
            image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300',
            queryParam: 'category=women-watches',
          },
          {
            id: 'women_sunglasses',
            name: 'Sunglasses',
            slug: 'women-sunglasses',
            image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300',
            queryParam: 'category=women-sunglasses',
          },
          {
            id: 'women_scarves',
            name: 'Scarves & Stoles',
            slug: 'women-scarves-stoles',
            image: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=300',
            queryParam: 'category=women-scarves-stoles',
          },
        ],
      },
      {
        id: 'sec_women_essentials',
        title: "Women's Essentials",
        items: [
          {
            id: 'women_bras',
            name: 'Bras',
            slug: 'women-bras',
            image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=300',
            queryParam: 'category=women-bras',
          },
          {
            id: 'women_panties',
            name: 'Panties',
            slug: 'women-panties',
            image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=300',
            queryParam: 'category=women-panties',
          },
          {
            id: 'women_shapewear',
            name: 'Shapewear & Slips',
            slug: 'women-shapewear',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
            queryParam: 'category=women-shapewear',
          },
          {
            id: 'women_night_suits',
            name: 'Night Suits',
            slug: 'women-night-suits',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
            queryParam: 'category=women-night-suits',
          },
          {
            id: 'women_thermals',
            name: 'Thermals',
            slug: 'women-thermals',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300',
            queryParam: 'category=women-thermals',
          },
          {
            id: 'women_loungewear',
            name: 'Loungewear',
            slug: 'women-loungewear',
            image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300',
            queryParam: 'category=women-loungewear',
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
    iconImage: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=160',
    badge: 'Cute',
    banner: {
      title: "Kids' Fashion World",
      subtitle: 'Soft Newborn Sets, Boys & Girls Ethnic Outfits, Casuals & Essentials',
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800',
      link: '/shop?gender=kids',
    },
    subSections: [
      {
        id: 'sec_kids_baby',
        title: 'Baby (0-2 Yrs)',
        items: [
          {
            id: 'baby_newborn',
            name: 'Newborn Wear',
            slug: 'baby-newborn',
            image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300',
            queryParam: 'category=baby-newborn',
            badge: 'SOFT',
          },
          {
            id: 'baby_sets',
            name: 'Baby Sets & Combos',
            slug: 'baby-sets',
            image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300',
            queryParam: 'category=baby-sets',
          },
          {
            id: 'baby_rompers',
            name: 'Baby Rompers',
            slug: 'baby-rompers',
            image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300',
            queryParam: 'category=baby-rompers',
          },
        ],
      },
      {
        id: 'sec_kids_boys',
        title: 'Boys (2-14 Yrs)',
        items: [
          {
            id: 'boys_ethnic',
            name: 'Ethnic Kurta Sets',
            slug: 'boys-ethnic-wear',
            image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300',
            queryParam: 'category=boys-ethnic-wear',
            badge: 'FESTIVE',
          },
          {
            id: 'boys_tshirts',
            name: 'T-Shirts & Polos',
            slug: 'boys-t-shirts',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=boys-t-shirts',
          },
          {
            id: 'boys_shirts',
            name: 'Shirts & Trousers',
            slug: 'boys-shirts',
            image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300',
            queryParam: 'category=boys-shirts',
          },
          {
            id: 'boys_jeans',
            name: 'Jeans & Shorts',
            slug: 'boys-jeans',
            image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300',
            queryParam: 'category=boys-jeans',
          },
          {
            id: 'boys_jackets',
            name: 'Jackets',
            slug: 'boys-jackets',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=boys-jackets',
          },
        ],
      },
      {
        id: 'sec_kids_girls',
        title: 'Girls (2-14 Yrs)',
        items: [
          {
            id: 'girls_dresses',
            name: 'Frocks & Dresses',
            slug: 'girls-dresses',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=girls-dresses',
            badge: 'CUTE',
          },
          {
            id: 'girls_ethnic',
            name: 'Ethnic Lehengas & Gowns',
            slug: 'girls-ethnic-wear',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=girls-ethnic-wear',
            badge: 'ROYAL',
          },
          {
            id: 'girls_tops_tees',
            name: 'Tops & Tees',
            slug: 'girls-tops-tees',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=girls-tops-tees',
          },
          {
            id: 'girls_jumpsuits',
            name: 'Jumpsuits & Skirts',
            slug: 'girls-jumpsuits',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=girls-jumpsuits',
          },
          {
            id: 'girls_jeans',
            name: 'Jeans & Trousers',
            slug: 'girls-jeans-trousers',
            image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300',
            queryParam: 'category=girls-jeans-trousers',
          },
        ],
      },
      {
        id: 'sec_kids_essentials',
        title: 'Kids Essentials',
        items: [
          {
            id: 'kids_innerwear',
            name: 'Kids Innerwear',
            slug: 'kids-innerwear',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
            queryParam: 'category=kids-innerwear',
          },
          {
            id: 'kids_socks',
            name: 'Kids Socks',
            slug: 'kids-socks',
            image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300',
            queryParam: 'category=kids-socks',
          },
          {
            id: 'kids_nightwear',
            name: 'Nightwear Sets',
            slug: 'kids-nightwear',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=kids-nightwear',
          },
          {
            id: 'kids_thermals',
            name: 'Kids Thermals',
            slug: 'kids-thermals',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300',
            queryParam: 'category=kids-thermals',
          },
        ],
      },
    ],
  },

  // 5. NAVYA COLLECTION SHOPS
  {
    id: 'group_shops',
    name: 'Shops',
    slug: 'shops',
    iconImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=160',
    badge: 'Boutiques',
    banner: {
      title: 'Navya Partner Boutiques',
      subtitle:
        'Shop directly from authentic designer boutiques, verified artisans & premium stores',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      link: '/shop',
    },
    subSections: [
      {
        id: 'sec_shops_grid',
        title: 'Explore Boutiques',
        items: [
          {
            id: 'shops_all',
            name: 'All Shops',
            slug: 'all-shops',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
            queryParam: 'view=all-shops',
            badge: 'ALL',
          },
          {
            id: 'shops_new',
            name: 'New Shops',
            slug: 'new-shops',
            image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300',
            queryParam: 'filter=new_shops',
            badge: 'NEW',
          },
          {
            id: 'shops_trending',
            name: 'Trending Shops',
            slug: 'trending-shops',
            image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=300',
            queryParam: 'filter=trending_shops',
            badge: 'POPULAR',
          },
          {
            id: 'shops_top_rated',
            name: 'Top-Rated Shops',
            slug: 'top-rated-shops',
            image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300',
            queryParam: 'filter=top_rated_shops',
            badge: '★ 4.9',
          },
        ],
      },
    ],
  },
];
