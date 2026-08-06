import { z } from 'zod';

export const createVariantSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  sku: z
    .string()
    .trim()
    .min(3, 'SKU must be at least 3 characters')
    .transform((v) => v.toUpperCase()),
  barcode: z.string().trim().optional().nullable(),
  price: z.number().positive('Price must be greater than zero'),
  compareAtPrice: z
    .number()
    .positive('Compare at price must be greater than zero')
    .optional()
    .nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  weight: z.number().min(0, 'Weight cannot be negative').optional().nullable(),
  dimensions: z.string().trim().optional().nullable(),
  attributes: z.record(z.string(), z.any()).optional().nullable(), // Flexible JSON structure for future attributes (fabric, fit, season, etc.)
  status: z.enum(['active', 'inactive']).default('active'),
});

export const bulkCreateVariantsSchema = z.object({
  variants: z.array(createVariantSchema).min(1, 'At least one variant must be provided'),
});

export const updateVariantSchema = createVariantSchema.partial();

export const getVariantQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  inStock: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type BulkCreateVariantsInput = z.infer<typeof bulkCreateVariantsSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type GetVariantQueryParams = z.infer<typeof getVariantQuerySchema>;
