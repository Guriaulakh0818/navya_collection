import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) =>
      v
        ? v
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : undefined,
    ),
  description: z.string().trim().optional().nullable(),
  image: z.string().trim().url('Invalid image URL').optional().nullable(),
  icon: z.string().trim().optional().nullable(),
  parentId: z.string().trim().optional().nullable(),
  displayOrder: z.number().int().min(0, 'Display order must be 0 or greater').default(0),
  isFeatured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  metaTitle: z
    .string()
    .trim()
    .max(150, 'Meta title cannot exceed 150 characters')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .trim()
    .max(300, 'Meta description cannot exceed 300 characters')
    .optional()
    .nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const getCategoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  parentId: z.string().trim().optional().nullable(),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sortBy: z.enum(['createdAt', 'name', 'displayOrder']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoryQueryParams = z.infer<typeof getCategoryQuerySchema>;
