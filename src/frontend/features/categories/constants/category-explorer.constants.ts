export interface SubCategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  queryParam: string; // Used for /shop?category=... or /shop?gender=... or /category/...
  badge?: string;
}

export interface CategorySubSection {
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
  gradient?: string;
  badge?: string;
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
  subSections: CategorySubSection[];
}

export const MAIN_CATEGORY_GROUPS: MainCategoryGroup[] = [
  // 1. FOR YOU / SPOTLIGHT
  {
    id: 'group_for_you',
    name: 'For You',
    slug: 'for-you',
    iconImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300',
    badge: 'Trending',
    banner: {
      title: 'Festive & Wedding Season ‘26',
      subtitle: 'Exclusive handcrafted collection across partner boutiques',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200',
      link: '/shop?tag=festive',
    },
    spotlights: [
      {
        id: 'spot_festivals',
        title: 'Festivals of India',
        subtitle: 'Shop Traditional',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
        slug: 'festive-couture',
        gradient: 'from-amber-500 to-rose-600',
        badge: 'Special',
      },
      {
        id: 'spot_new_season',
        title: 'Autumn Winter ‘26',
        subtitle: 'New Arrivals',
        image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400',
        slug: 'shop?sort=newest',
        gradient: 'from-[#183A73] to-indigo-700',
      },
      {
        id: 'spot_budget',
        title: 'Budget Buys (Under ₹999)',
        subtitle: 'Super Value',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
        slug: 'shop?maxPrice=999',
        gradient: 'from-[#F15A25] to-amber-600',
        badge: 'Hot',
      },
      {
        id: 'spot_genz',
        title: 'GenZ & Fusion Street',
        subtitle: 'Trendy Wear',
        image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400',
        slug: 'shop?category=gowns',
        gradient: 'from-purple-600 to-pink-600',
      },
      {
        id: 'spot_house_brands',
        title: 'Boutique Spotlight',
        subtitle: 'Top Rated Shops',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
        slug: 'shop',
        gradient: 'from-emerald-600 to-teal-700',
      },
    ],
    subSections: [
      {
        id: 'sec_trending_now',
        title: 'Trending Right Now',
        items: [
          {
            id: 'item_sarees_pop',
            name: 'Banarasi Sarees',
            slug: 'sarees',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=sarees',
            badge: 'Popular',
          },
          {
            id: 'item_kurta_pop',
            name: 'Mens Ethnic Kurta',
            slug: 'kurta',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=kurta',
          },
          {
            id: 'item_lehengas_pop',
            name: 'Bridal Lehengas',
            slug: 'lehengas',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=lehengas',
            badge: 'Bestseller',
          },
          {
            id: 'item_suits_pop',
            name: 'Anarkali Suits',
            slug: 'suits',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=suits',
          },
          {
            id: 'item_girls_pop',
            name: 'Kids Festive Frocks',
            slug: 'girls-clothing',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=girls-clothing',
          },
          {
            id: 'item_jewel_pop',
            name: 'Kundan Jewellery',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials',
          },
        ],
      },
    ],
  },

  // 2. WOMEN'S FASHION
  {
    id: 'group_women',
    name: 'Women Fashion',
    slug: 'women-wear',
    iconImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
    banner: {
      title: 'Women Ethnic & Western Wear',
      subtitle: 'From Handcrafted Sarees to Runway Dresses',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
      link: '/category/women-wear',
    },
    subSections: [
      {
        id: 'sec_women_clothing',
        title: "Women's Clothing",
        items: [
          {
            id: 'w_sarees',
            name: 'Sarees',
            slug: 'sarees',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=sarees',
            badge: 'Bestseller',
          },
          {
            id: 'w_kurtis',
            name: 'Kurtis & Tunics',
            slug: 'kurtis',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=kurtis',
          },
          {
            id: 'w_salwar_suits',
            name: 'Salwar Suits & Anarkalis',
            slug: 'suits',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=suits',
          },
          {
            id: 'w_lehengas',
            name: 'Lehenga Choli',
            slug: 'lehengas',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=lehengas',
          },
          {
            id: 'w_dresses',
            name: 'Western Dresses & Gowns',
            slug: 'dresses',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=dresses',
          },
          {
            id: 'w_dupattas',
            name: 'Dupattas & Stoles',
            slug: 'dupattas',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=dupattas',
          },
          {
            id: 'w_gowns',
            name: 'Indo-Western & Fusion',
            slug: 'gowns',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            queryParam: 'category=gowns',
          },
          {
            id: 'w_jackets',
            name: 'Jackets & Shrugs',
            slug: 'jackets',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=jackets',
          },
          {
            id: 'w_plus_size',
            name: 'Plus Size Styles',
            slug: 'women-wear',
            image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300',
            queryParam: 'category=women-wear&fit=plus',
          },
        ],
      },
      {
        id: 'sec_women_footwear',
        title: "Women's Footwear & Accessories",
        items: [
          {
            id: 'w_heels_flats',
            name: 'Heels & Flats',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300',
            queryParam: 'category=accessories-essentials&sub=heels',
          },
          {
            id: 'w_juttis',
            name: 'Punjabi Juttis & Mojaris',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=juttis',
            badge: 'Ethnic',
          },
          {
            id: 'w_slippers',
            name: 'Slippers & Slides',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300',
            queryParam: 'category=accessories-essentials&sub=slippers',
          },
          {
            id: 'w_handbags',
            name: 'Handbags & Totes',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
            queryParam: 'category=accessories-essentials&sub=handbags',
          },
          {
            id: 'w_sling_bags',
            name: 'Sling Bags & Clutches',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
            queryParam: 'category=accessories-essentials&sub=slings',
          },
          {
            id: 'w_jewellery',
            name: 'Earrings & Necklaces',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=jewellery',
          },
        ],
      },
      {
        id: 'sec_women_essentials',
        title: "Women's Essentials & Sleepwear",
        items: [
          {
            id: 'w_camisoles',
            name: 'Camisoles & Slips',
            slug: 'women-wear',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=women-wear&sub=innerwear',
          },
          {
            id: 'w_thermals',
            name: 'Thermals & Warmers',
            slug: 'women-wear',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=women-wear&sub=thermals',
          },
          {
            id: 'w_shapewear',
            name: 'Shapewear & Corsets',
            slug: 'women-wear',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=women-wear&sub=shapewear',
          },
        ],
      },
    ],
  },

  // 3. MEN'S FASHION
  {
    id: 'group_men',
    name: "Men's Fashion",
    slug: 'gents-wear',
    iconImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
    banner: {
      title: 'Men Ethnic & Everyday Wardrobe',
      subtitle: 'Tailored Kurtas, Sherwanis, Crisp Shirts & Jeans',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200',
      link: '/category/gents-wear',
    },
    subSections: [
      {
        id: 'sec_men_clothing',
        title: "Men's Clothing",
        items: [
          {
            id: 'm_kurta',
            name: 'Ethnic Kurtas',
            slug: 'kurta',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=kurta',
            badge: 'Festive',
          },
          {
            id: 'm_sherwani',
            name: 'Sherwanis & Groom Sets',
            slug: 'sherwani',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=sherwani',
          },
          {
            id: 'm_jackets',
            name: 'Nehru Jackets & Vests',
            slug: 'jackets',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=jackets',
          },
          {
            id: 'm_shirts',
            name: 'Shirts & Formal Tops',
            slug: 'shirts',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=shirts',
          },
          {
            id: 'm_tshirts',
            name: 'T-Shirts & Polos',
            slug: 't-shirts',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=t-shirts',
          },
          {
            id: 'm_bottomwear',
            name: 'Jeans & Trousers',
            slug: 'jeans',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=jeans',
          },
          {
            id: 'm_blazers',
            name: 'Blazers & Suits',
            slug: 'jackets',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=jackets&sub=blazers',
          },
          {
            id: 'm_sportswear',
            name: 'Sports & Activewear',
            slug: 't-shirts',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=t-shirts&sub=sports',
          },
          {
            id: 'm_plus_size',
            name: 'Plus Size Clothing',
            slug: 'gents-wear',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=gents-wear&fit=plus',
          },
        ],
      },
      {
        id: 'sec_men_footwear',
        title: "Men's Footwear & Accessories",
        items: [
          {
            id: 'm_sneakers',
            name: 'Casual Sneakers',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300',
            queryParam: 'category=accessories-essentials&sub=sneakers',
          },
          {
            id: 'm_mojaris',
            name: 'Traditional Mojaris',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=mojaris',
            badge: 'Ethnic',
          },
          {
            id: 'm_formal_shoes',
            name: 'Formal Leather Shoes',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300',
            queryParam: 'category=accessories-essentials&sub=formal-shoes',
          },
          {
            id: 'm_watches',
            name: 'Luxury Watches',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300',
            queryParam: 'category=accessories-essentials&sub=watches',
          },
          {
            id: 'm_wallets_belts',
            name: 'Wallets & Belts',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
            queryParam: 'category=accessories-essentials&sub=wallets',
          },
        ],
      },
      {
        id: 'sec_men_essentials',
        title: "Men's Essentials & Loungewear",
        items: [
          {
            id: 'm_briefs_boxers',
            name: 'Briefs & Boxers',
            slug: 'gents-wear',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=gents-wear&sub=innerwear',
          },
          {
            id: 'm_vests',
            name: 'Vests & Undershirts',
            slug: 'gents-wear',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=gents-wear&sub=vests',
          },
          {
            id: 'm_socks',
            name: 'Cotton Socks',
            slug: 'gents-wear',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=gents-wear&sub=socks',
          },
          {
            id: 'm_tracksuits',
            name: 'Tracksuits & Shorts',
            slug: 't-shirts',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
            queryParam: 'category=t-shirts&sub=tracksuits',
          },
        ],
      },
    ],
  },

  // 4. KIDS & BABY
  {
    id: 'group_kids',
    name: 'Kids & Baby',
    slug: 'kids-wear',
    iconImage: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
    banner: {
      title: 'Kids Festive & Daily Outfits',
      subtitle: 'Comfortable Cotton Sets, Traditional Wear & Party Frocks',
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200',
      link: '/category/kids-wear',
    },
    subSections: [
      {
        id: 'sec_girls_wear',
        title: 'Girls Fashion',
        items: [
          {
            id: 'k_girls_lehenga',
            name: 'Girls Lehengas & Gowns',
            slug: 'girls-clothing',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=girls-clothing&sub=ethnic',
            badge: 'Cute',
          },
          {
            id: 'k_girls_frocks',
            name: 'Party Frocks & Dresses',
            slug: 'kids-dresses',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300',
            queryParam: 'category=kids-dresses',
          },
          {
            id: 'k_girls_sets',
            name: 'Top & Bottom Sets',
            slug: 'kids-sets',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=kids-sets',
          },
        ],
      },
      {
        id: 'sec_boys_wear',
        title: 'Boys Fashion',
        items: [
          {
            id: 'k_boys_kurta',
            name: 'Boys Kurta Pajama Sets',
            slug: 'boys-clothing',
            image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300',
            queryParam: 'category=boys-clothing&sub=ethnic',
            badge: 'Festive',
          },
          {
            id: 'k_boys_suits',
            name: 'Coat Suits & Waistcoats',
            slug: 'boys-clothing',
            image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300',
            queryParam: 'category=boys-clothing&sub=suits',
          },
          {
            id: 'k_boys_casual',
            name: 'Shirts, Tees & Jeans',
            slug: 'boys-clothing',
            image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300',
            queryParam: 'category=boys-clothing&sub=casual',
          },
        ],
      },
      {
        id: 'sec_kids_footwear',
        title: 'Kids Footwear & Accessories',
        items: [
          {
            id: 'k_shoes',
            name: 'Kids Sneakers & Shoes',
            slug: 'kids-wear',
            image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300',
            queryParam: 'category=kids-wear&sub=footwear',
          },
          {
            id: 'k_ethnic_shoes',
            name: 'Kids Mojaris & Juttis',
            slug: 'kids-wear',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=kids-wear&sub=mojaris',
          },
        ],
      },
    ],
  },

  // 5. JEWELLERY & BEAUTY
  {
    id: 'group_jewellery',
    name: 'Jewellery & Beauty',
    slug: 'accessories-essentials',
    iconImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
    banner: {
      title: 'Ethnic Jewellery & Glow Essentials',
      subtitle: 'Kundan Sets, Chokers, Silver Bangles & Fragrances',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200',
      link: '/category/accessories-essentials',
    },
    subSections: [
      {
        id: 'sec_ethnic_jewellery',
        title: 'Traditional & Bridal Jewellery',
        items: [
          {
            id: 'j_kundan',
            name: 'Kundan & Polki Sets',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=kundan',
            badge: 'Royal',
          },
          {
            id: 'j_earrings',
            name: 'Jhumkas & Chaandbalis',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=earrings',
          },
          {
            id: 'j_bangles',
            name: 'Bangles & Kadas',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=bangles',
          },
          {
            id: 'j_silver',
            name: 'Oxidised Silver Jewellery',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300',
            queryParam: 'category=accessories-essentials&sub=silver',
          },
        ],
      },
      {
        id: 'sec_beauty',
        title: 'Beauty & Fragrances',
        items: [
          {
            id: 'b_perfumes',
            name: 'Attars & Perfumes',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=300',
            queryParam: 'category=accessories-essentials&sub=fragrances',
          },
          {
            id: 'b_skincare',
            name: 'Glow & Skincare',
            slug: 'accessories-essentials',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
            queryParam: 'category=accessories-essentials&sub=skincare',
          },
        ],
      },
    ],
  },
];
