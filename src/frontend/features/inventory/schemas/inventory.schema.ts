import { z } from 'zod';

export const updateInventorySchema = z.object({
  availableStock: z.number().int().min(0, 'Available stock cannot be negative').optional(),
  minimumStockLevel: z.number().int().min(0, 'Minimum stock level cannot be negative').optional(),
  maximumStockLevel: z
    .number()
    .int()
    .min(0, 'Maximum stock level cannot be negative')
    .optional()
    .nullable(),
});

export const adjustStockSchema = z.object({
  type: z.enum(['INCREASE', 'DECREASE', 'RESERVE', 'RELEASE', 'SET']),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reason: z.string().trim().optional(),
});

export const bulkUpdateInventorySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().trim().min(1, 'Variant ID is required'),
        availableStock: z.number().int().min(0, 'Available stock cannot be negative'),
        minimumStockLevel: z.number().int().min(0).optional(),
      }),
    )
    .min(1, 'At least one inventory item must be specified'),
});

export const getInventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(), // Search by SKU or Product Name
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  productId: z.string().trim().optional(),
  sortBy: z.enum(['availableStock', 'updatedAt', 'sku']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type BulkUpdateInventoryInput = z.infer<typeof bulkUpdateInventorySchema>;
export type GetInventoryQueryParams = z.infer<typeof getInventoryQuerySchema>;
