import { z } from 'zod';

export const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  sku: z.string().min(2, 'Variant SKU required'),
  barcode: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
});

export const imageSchema = z.object({
  imageUrl: z.string().url('Valid Image URL required'),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const sellerProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().min(2, 'Product SKU is required'),
  barcode: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  categoryId: z.string().min(1, 'Category selection is required'),
  gender: z.string().optional(),
  fabric: z.string().optional(),
  color: z.string().optional(),
  fit: z.string().optional(),
  occasion: z.string().optional(),
  status: z.enum(['active', 'draft', 'pending_approval', 'archived']).default('active'),
  isFeatured: z.boolean().default(false),
  images: z.array(imageSchema).min(1, 'At least one product image is required'),
  variants: z.array(variantSchema).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  focusKeyword: z.string().optional(),
});

export type VariantInput = z.infer<typeof variantSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
export type SellerProductInput = z.infer<typeof sellerProductSchema>;
