import { z } from 'zod';

export const orderPreviewQuerySchema = z.object({
  addressId: z.string().optional().nullable(),
  couponCode: z.string().trim().optional().nullable(),
  shippingMethodCode: z.string().optional().default('STANDARD'),
  paymentMethod: z.string().optional().default('PREPAID'),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        name: z.string().optional(),
        productName: z.string().optional(),
        variantName: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        price: z.number().optional(),
        compareAtPrice: z.number().optional().nullable(),
        quantity: z.number().min(1),
        image: z.string().optional(),
        shopId: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

export type OrderPreviewQueryInput = z.infer<typeof orderPreviewQuerySchema>;
