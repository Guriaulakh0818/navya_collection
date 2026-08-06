import { z } from 'zod';

export const productImageSchema = z.object({
  url: z.string().trim().url('Invalid image URL'),
  alt: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const productVariantSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  sku: z
    .string()
    .trim()
    .min(1, 'Variant SKU is required')
    .transform((v) => v.toUpperCase()),
  price: z.number().positive('Variant price must be greater than zero'),
  stock: z.number().int().min(0, 'Variant stock cannot be negative').default(0),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  sku: z
    .string()
    .trim()
    .min(3, 'SKU must be at least 3 characters')
    .transform((v) => v.toUpperCase()),
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
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Selling price must be greater than zero'),
  compareAtPrice: z
    .number()
    .positive('Compare at price must be greater than zero')
    .optional()
    .nullable(),
  costPrice: z.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold cannot be negative').default(5),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  categoryId: z.string().trim().min(1, 'Category is mandatory'),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const getProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  isNewArrival: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['createdAt', 'price', 'name', 'rating', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductQueryParams = z.infer<typeof getProductQuerySchema>;
