import { z } from 'zod';

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  weight: z.number().optional(),
  imageUrl: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  attributes: z.record(z.string(), z.any()).optional().nullable(),
});

export const imageSchema = z.object({
  imageUrl: z.string().url('Valid Image URL required'),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().optional(),
});

export const sellerProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  videoUrl: z.string().optional().nullable(),
  productType: z.string().optional(),

  // Pricing & Taxation
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  taxGstRate: z.number().optional(),
  hsnCode: z.string().optional(),

  // Inventory
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().nonnegative().optional().default(5),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),

  // Shipping & Packaging
  weight: z.number().optional(), // in grams
  packageLength: z.number().optional(), // in cm
  packageWidth: z.number().optional(),
  packageHeight: z.number().optional(),
  countryOfOrigin: z.string().optional().default('India'),
  manufacturerDetails: z.string().optional(),

  // Categories & Taxonomy
  categoryId: z.string().min(1, 'Category selection is required'),
  categoryIds: z.array(z.string()).optional(),

  // Core Standard Attributes
  gender: z.string().optional(),
  fabric: z.string().optional(),
  color: z.string().optional(),
  fit: z.string().optional(),
  occasion: z.string().optional(),
  pattern: z.string().optional(),
  sleeve: z.string().optional(),
  neck: z.string().optional(),

  // Dynamic Key-Value Attributes Engine
  attributes: z.record(z.string(), z.any()).optional(),

  status: z.enum(['active', 'draft', 'pending_approval', 'archived']).default('active'),
  isFeatured: z.boolean().default(false),
  images: z.array(imageSchema).min(1, 'At least one product image is required'),
  variants: z.array(variantSchema).optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  focusKeyword: z.string().optional(),
});

export type VariantInput = z.infer<typeof variantSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
export type SellerProductInput = z.infer<typeof sellerProductSchema>;
