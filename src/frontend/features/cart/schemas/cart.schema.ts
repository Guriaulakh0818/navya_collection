import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
  variantId: z.string().optional().nullable(),
  quantity: z
    .number()
    .int('Quantity must be an integer.')
    .min(1, 'Quantity must be at least 1.')
    .max(99, 'Quantity cannot exceed 99 units.')
    .default(1),
  name: z.string().optional(),
  price: z.number().optional(),
  image: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer.')
    .min(1, 'Quantity must be at least 1.')
    .max(99, 'Quantity cannot exceed 99 units.'),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required.'),
      variantId: z.string().optional().nullable(),
      quantity: z.number().int().min(1).max(99),
      name: z.string().optional(),
      price: z.number().optional(),
      image: z.string().optional(),
    }),
  ),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
