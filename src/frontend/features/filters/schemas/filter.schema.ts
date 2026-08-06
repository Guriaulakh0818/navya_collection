import { z } from 'zod';

export const productFilterQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  ageGroup: z.string().trim().optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  fabric: z.string().trim().optional(),
  pattern: z.string().trim().optional(),
  sleeveType: z.string().trim().optional(),
  fit: z.string().trim().optional(),
  occasion: z.string().trim().optional(),
  season: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  featured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  newArrivals: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  bestSellers: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sort: z
    .enum([
      'newest',
      'oldest',
      'price-asc',
      'price_asc',
      'price-desc',
      'price_desc',
      'highest-discount',
      'discount_desc',
      'highest-rated',
      'rating_desc',
      'name-asc',
      'name_asc',
      'name-desc',
      'name_desc',
      'best-selling',
      'best_selling',
    ])
    .default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ProductFilterQueryParams = z.infer<typeof productFilterQuerySchema>;
