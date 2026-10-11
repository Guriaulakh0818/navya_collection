import { z } from 'zod';

import { CommissionService } from '../../backend/services/commission.service';

export const variantSchema = z
  .object({
    id: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    price: z.number().positive('Price must be greater than 0'),
    compareAtPrice: z.number().positive('MRP must be greater than 0').optional().nullable(),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    weight: z.number().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    attributes: z.record(z.string(), z.any()).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.compareAtPrice && data.compareAtPrice > 0) {
      if (data.price > data.compareAtPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selling price (₹${data.price}) cannot exceed MRP (₹${data.compareAtPrice})`,
          path: ['price'],
        });
        return;
      }
      const floors = CommissionService.calculatePricingFloors(data.compareAtPrice);
      if (CommissionService.roundMoney(data.price) < floors.psychologicalMinimumSellingPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selling price (₹${data.price}) exceeds maximum allowed discount (70% limit with ₹1 psychological floor is ₹${floors.psychologicalMinimumSellingPrice})`,
          path: ['price'],
        });
      }
    }
  });

export const imageSchema = z.object({
  imageUrl: z.string().url('Valid Image URL required'),
  altText: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().optional().nullable(),
});

export const sellerProductSchema = z
  .object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    videoUrl: z.string().optional().nullable(),
    productType: z.string().optional().nullable(),

    // Pricing & Taxation (BM-02)
    price: z.number().positive('Selling price must be greater than 0'),
    compareAtPrice: z.number().positive('MRP must be greater than 0').optional().nullable(),
    costPrice: z.number().optional().nullable(),
    taxGstRate: z.number().optional().nullable(),
    hsnCode: z.string().optional().nullable(),

    // Inventory
    stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
    lowStockThreshold: z.number().int().nonnegative().optional().nullable().default(5),
    stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional().nullable(),

    // Shipping & Packaging
    weight: z.number().optional().nullable(), // in grams
    packageLength: z.number().optional().nullable(), // in cm
    packageWidth: z.number().optional().nullable(),
    packageHeight: z.number().optional().nullable(),
    countryOfOrigin: z.string().optional().nullable().default('India'),
    manufacturerDetails: z.string().optional().nullable(),

    // Categories & Taxonomy
    categoryId: z.string().min(1, 'Category selection is required'),
    categoryIds: z.array(z.string()).optional().nullable(),

    // Core Standard Attributes
    gender: z.string().optional().nullable(),
    fabric: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    fit: z.string().optional().nullable(),
    occasion: z.string().optional().nullable(),
    pattern: z.string().optional().nullable(),
    sleeve: z.string().optional().nullable(),
    neck: z.string().optional().nullable(),

    // Dynamic Key-Value Attributes Engine
    attributes: z.record(z.string(), z.any()).optional().nullable(),

    status: z.enum(['active', 'draft', 'pending_approval', 'archived']).default('active'),
    isFeatured: z.boolean().default(false),
    images: z.array(imageSchema).min(1, 'At least one product image is required'),
    variants: z.array(variantSchema).optional().nullable(),

    // Return & Replacement Policy (Enforced Options: RETURN_AND_REPLACEMENT, REPLACEMENT_ONLY, NONE)
    returnPolicyType: z
      .enum(['RETURN_AND_REPLACEMENT', 'REPLACEMENT_ONLY', 'NONE'])
      .default('RETURN_AND_REPLACEMENT'),
    returnAllowed: z.boolean().optional().nullable(),
    returnWindowDays: z.number().int().optional().nullable(),
    replacementAllowed: z.boolean().optional().nullable(),
    replacementWindowDays: z.number().int().optional().nullable(),

    // SEO
    metaTitle: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
    metaKeywords: z.string().optional().nullable(),
    focusKeyword: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.compareAtPrice && data.compareAtPrice > 0) {
      if (data.price > data.compareAtPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selling price (₹${data.price}) cannot exceed MRP (₹${data.compareAtPrice})`,
          path: ['price'],
        });
        return;
      }
      const floors = CommissionService.calculatePricingFloors(data.compareAtPrice);
      if (CommissionService.roundMoney(data.price) < floors.psychologicalMinimumSellingPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selling price (₹${data.price}) exceeds maximum allowed discount (70% limit with ₹1 psychological floor is ₹${floors.psychologicalMinimumSellingPrice})`,
          path: ['price'],
        });
      }
    }
  });

/**
 * Computes strictly enforced server-side return/replacement policy attributes.
 * Prevents arbitrary days or invalid options per Section 3.
 */
export function enforceReturnPolicy(
  policyType:
    'RETURN_AND_REPLACEMENT' | 'REPLACEMENT_ONLY' | 'NONE' | string = 'RETURN_AND_REPLACEMENT',
) {
  switch (policyType) {
    case 'RETURN_AND_REPLACEMENT':
      return {
        returnPolicyType: 'RETURN_AND_REPLACEMENT' as const,
        returnAllowed: true,
        returnWindowDays: 3,
        replacementAllowed: true,
        replacementWindowDays: 7,
      };
    case 'REPLACEMENT_ONLY':
      return {
        returnPolicyType: 'REPLACEMENT_ONLY' as const,
        returnAllowed: false,
        returnWindowDays: 0,
        replacementAllowed: true,
        replacementWindowDays: 7,
      };
    case 'NONE':
    default:
      return {
        returnPolicyType: 'NONE' as const,
        returnAllowed: false,
        returnWindowDays: 0,
        replacementAllowed: false,
        replacementWindowDays: 0,
      };
  }
}

export type VariantInput = z.infer<typeof variantSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
export type SellerProductInput = z.infer<typeof sellerProductSchema>;
