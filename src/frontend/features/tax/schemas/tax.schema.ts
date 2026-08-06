import { z } from 'zod';

export const calculateTaxSchema = z.object({
  cartId: z.string().optional().nullable(),
  addressId: z.string().optional().nullable(),
  subtotal: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).optional().nullable(),
  shipping: z.number().min(0).optional().nullable(),
  couponCode: z.string().optional().nullable(),
});

export type CalculateTaxInput = z.infer<typeof calculateTaxSchema>;
