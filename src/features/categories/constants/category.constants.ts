import type { Category } from '../types/category.types';

export const CATEGORY_ACCENTS = [
  'from-navy to-[#234b8f]',
  'from-orange to-[#d94a1f]',
  'from-[#0f2a52] to-navy',
  'from-[#b84d1f] to-orange',
  'from-sky-700 to-navy',
  'from-orange-500 to-red-600',
] as const;

export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Gents',
    slug: 'gents',
    description: 'Premium fashion for men. Shirts, trousers, ethnic wear and more.',
    image: '/images/categories/gents.jpg',
    banner: '/images/categories/gents-banner.jpg',
    productCount: 128,
    accent: CATEGORY_ACCENTS[0],
  },
  {
    id: '2',
    name: 'Kids',
    slug: 'kids',
    description: 'Trendy and comfortable outfits for kids.',
    image: '/images/categories/kids.jpg',
    banner: '/images/categories/kids-banner.jpg',
    productCount: 86,
    accent: CATEGORY_ACCENTS[1],
  },
  {
    id: '3',
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'The latest additions to our collection.',
    image: '/images/categories/new.jpg',
    banner: '/images/categories/new-banner.jpg',
    productCount: 45,
    accent: CATEGORY_ACCENTS[2],
  },
  {
    id: '4',
    name: 'Offers',
    slug: 'offers',
    description: 'Exclusive deals and limited-time discounts.',
    image: '/images/categories/offers.jpg',
    banner: '/images/categories/offers-banner.jpg',
    productCount: 32,
    accent: CATEGORY_ACCENTS[3],
  },
  {
    id: '5',
    name: 'Ethnic',
    slug: 'ethnic',
    description: 'Traditional wear with a modern touch.',
    image: '/images/categories/ethnic.jpg',
    banner: '/images/categories/ethnic-banner.jpg',
    productCount: 64,
    accent: CATEGORY_ACCENTS[4],
  },
  {
    id: '6',
    name: 'Casual',
    slug: 'casual',
    description: 'Relaxed everyday essentials.',
    image: '/images/categories/casual.jpg',
    banner: '/images/categories/casual-banner.jpg',
    productCount: 97,
    accent: CATEGORY_ACCENTS[5],
  },
];

export const DEFAULT_PAGE_SIZE = 12;
