import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
});

export const mergeWishlistSchema = z.object({
  productIds: z.array(z.string().min(1)),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type MergeWishlistInput = z.infer<typeof mergeWishlistSchema>;
