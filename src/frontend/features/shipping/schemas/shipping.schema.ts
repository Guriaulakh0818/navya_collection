import { z } from 'zod';

export const calculateShippingSchema = z.object({
  addressId: z.string().optional().nullable(),
  pincode: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  cartId: z.string().optional().nullable(),
  cartAmount: z.number().min(0).optional().nullable(),
  shippingMethodCode: z.string().default('STANDARD'),
});

export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;
