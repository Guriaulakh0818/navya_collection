import { z } from 'zod';

export const productSearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z
    .enum([
      'newest',
      'oldest',
      'price_asc',
      'price_desc',
      'name_asc',
      'name_desc',
      'rating_desc',
      'best_selling',
    ])
    .default('newest'),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  featured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export const searchSuggestionsQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query cannot be empty'),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export type ProductSearchQueryParams = z.infer<typeof productSearchQuerySchema>;
export type SearchSuggestionsQueryParams = z.infer<typeof searchSuggestionsQuerySchema>;
