export interface SubCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface MainCategoryOption {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategoryOption[];
}

export const CATEGORY_TAXONOMY: MainCategoryOption[] = [
  {
    id: 'cat_women',
    name: 'Women Wear',
    slug: 'women-wear',
    subCategories: [
      {
        id: 'cat_women_sarees',
        name: 'Sarees (Banarasi, Silk, Chiffon, Georgette)',
        slug: 'sarees',
      },
      { id: 'cat_women_lehengas', name: 'Designer Lehengas & Bridal Wear', slug: 'lehengas' },
      { id: 'cat_women_suits', name: 'Salwar Suits, Anarkalis & Shararas', slug: 'salwar-suits' },
      { id: 'cat_women_kurtis', name: 'Kurtis, Tunics & Tops', slug: 'kurtis' },
      { id: 'cat_women_gowns', name: 'Indo-Western Gowns & Dresses', slug: 'indo-western-gowns' },
      { id: 'cat_women_dupattas', name: 'Dupattas, Shawls & Stoles', slug: 'dupattas-shawls' },
      { id: 'cat_women_western', name: 'Western Tops, Dresses & Jeans', slug: 'women-western' },
    ],
  },
  {
    id: 'cat_gents',
    name: 'Gents / Men Wear',
    slug: 'gents-wear',
    subCategories: [
      { id: 'cat_gents_kurtas', name: 'Ethnic Kurtas & Pyjamas', slug: 'ethnic-kurtas' },
      { id: 'cat_gents_sherwanis', name: 'Designer Sherwanis & Indo-Western', slug: 'sherwanis' },
      { id: 'cat_gents_nehru', name: 'Nehru Jackets & Ethnic Vests', slug: 'nehru-jackets' },
      { id: 'cat_gents_shirts', name: 'Formal & Casual Shirts', slug: 'gents-shirts' },
      { id: 'cat_gents_trousers', name: 'Trousers, Chinos & Jeans', slug: 'gents-trousers' },
      { id: 'cat_gents_suits', name: 'Blazers, Suits & Tuxedos', slug: 'blazers-suits' },
      { id: 'cat_gents_tshirts', name: 'T-Shirts & Polos', slug: 'gents-tshirts' },
    ],
  },
  {
    id: 'cat_boys',
    name: 'Boys Wear',
    slug: 'boys-wear',
    subCategories: [
      { id: 'cat_boys_kurtas', name: 'Boys Kurta Pyjama Sets', slug: 'boys-kurta-sets' },
      {
        id: 'cat_boys_indowestern',
        name: 'Boys Indo-Western & Sherwani Sets',
        slug: 'boys-indo-western',
      },
      { id: 'cat_boys_shirts', name: 'Boys Shirts & Trousers', slug: 'boys-shirts' },
      { id: 'cat_boys_suits', name: 'Boys Party Wear Suits & Blazers', slug: 'boys-party-suits' },
      { id: 'cat_boys_shorts', name: 'Boys Shorts, Tees & Casuals', slug: 'boys-casuals' },
    ],
  },
  {
    id: 'cat_girls',
    name: 'Girls Wear',
    slug: 'girls-wear',
    subCategories: [
      { id: 'cat_girls_gowns', name: 'Girls Ethnic Gowns & Lehengas', slug: 'girls-ethnic-gowns' },
      { id: 'cat_girls_frocks', name: 'Girls Frocks & Party Dresses', slug: 'girls-party-dresses' },
      { id: 'cat_girls_kurtis', name: 'Girls Kurti & Sharara Sets', slug: 'girls-kurti-sets' },
      { id: 'cat_girls_casual', name: 'Girls Skirts, Tops & Shorts', slug: 'girls-casuals' },
    ],
  },
  {
    id: 'cat_kids',
    name: 'Children / Kids Wear',
    slug: 'kids-wear',
    subCategories: [
      { id: 'cat_kids_daily', name: 'Kids Daily Clothing Sets', slug: 'kids-daily-wear' },
      { id: 'cat_kids_ethnic', name: 'Kids Ethnic & Festive Clothing', slug: 'kids-ethnic-wear' },
      {
        id: 'cat_kids_sleepwear',
        name: 'Kids Cotton Sleepwear & Loungewear',
        slug: 'kids-sleepwear',
      },
      { id: 'cat_kids_casual', name: 'Kids Shorts, Tees & Dungarees', slug: 'kids-casuals' },
    ],
  },
  {
    id: 'cat_newborn',
    name: 'Newborn / Baby Wear',
    slug: 'newborn-wear',
    subCategories: [
      { id: 'cat_newborn_onesies', name: 'Soft Cotton Onesies & Sleepsuits', slug: 'baby-onesies' },
      { id: 'cat_newborn_ethnic', name: 'Baby Ethnic Kurta & Frock Sets', slug: 'baby-ethnic' },
      {
        id: 'cat_newborn_swaddles',
        name: 'Baby Swaddles, Wraps & Blankets',
        slug: 'baby-swaddles',
      },
      { id: 'cat_newborn_rompers', name: 'Baby Rompers & Bodysuits', slug: 'baby-rompers' },
      {
        id: 'cat_newborn_essentials',
        name: 'Baby Booties, Caps & Mittens',
        slug: 'baby-essentials',
      },
    ],
  },
  {
    id: 'cat_festive',
    name: 'Festive & Wedding Couture',
    slug: 'festive-couture',
    subCategories: [
      { id: 'cat_festive_bridal', name: 'Royal Bridal Lehengas', slug: 'bridal-lehengas' },
      { id: 'cat_festive_groom', name: 'Groom Sherwani & Safa Sets', slug: 'groom-sherwanis' },
      { id: 'cat_festive_special', name: 'Festival Special Ethnic Sets', slug: 'festival-special' },
      { id: 'cat_festive_silk', name: 'Pure Heritage Silk Sarees', slug: 'heritage-silk-sarees' },
    ],
  },
  {
    id: 'cat_accessories',
    name: 'Accessories & Essentials',
    slug: 'accessories-essentials',
    subCategories: [
      { id: 'cat_acc_jewellery', name: 'Jewellery & Ornaments', slug: 'jewellery' },
      { id: 'cat_acc_footwear', name: 'Footwear, Mojris & Juttis', slug: 'footwear-juttis' },
      { id: 'cat_acc_bags', name: 'Handbags, Clutches & Potlis', slug: 'handbags-clutches' },
      { id: 'cat_acc_turbans', name: 'Turbans, Safas & Stoles', slug: 'turbans-stoles' },
    ],
  },
];
