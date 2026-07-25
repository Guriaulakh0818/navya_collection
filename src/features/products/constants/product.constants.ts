export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
] as const;

export const DEFAULT_PAGE_SIZE = 12;

export const PRODUCT_BADGE_VARIANTS = {
  NEW: 'new',
  BEST_SELLER: 'best_seller',
  TRENDING: 'trending',
  SALE: 'sale',
} as const;
