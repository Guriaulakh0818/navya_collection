import { z } from 'zod';

export const orderPreviewQuerySchema = z.object({
  addressId: z.string().optional().nullable(),
  couponCode: z.string().trim().optional().nullable(),
  shippingMethodCode: z.string().optional().default('STANDARD'),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        name: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number().min(1),
        image: z.string().optional(),
      }),
    )
    .optional(),
});

export type OrderPreviewQueryInput = z.infer<typeof orderPreviewQuerySchema>;
