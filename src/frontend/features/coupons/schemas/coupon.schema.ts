import { z } from 'zod';

export const discountTypeEnum = z.enum(['PERCENTAGE', 'FIXED']);

export const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Coupon code must be at least 2 characters.')
    .max(30, 'Coupon code is too long.'),
  cartAmount: z.number().min(0, 'Cart amount cannot be negative.'),
  items: z
    .array(
      z.object({
        productId: z.string(),
        categoryId: z.string().optional().nullable(),
        price: z.number(),
        quantity: z.number(),
      }),
    )
    .optional(),
});

export const applyCouponSchema = validateCouponSchema;

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9_-]{3,20}$/,
      'Coupon code must be 3-20 uppercase alphanumeric characters (hyphens and underscores allowed).',
    ),
  title: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(250).optional().nullable(),
  discountType: discountTypeEnum,
  discountValue: z.number().positive('Discount value must be greater than 0.'),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  usagePerUser: z.number().int().positive().default(1),
  startDate: z.string().or(z.date()).optional().nullable(),
  validUntil: z.string().or(z.date()),
  isActive: z.boolean().default(true),
  applicableCategories: z.array(z.string()).optional().nullable(),
  applicableProducts: z.array(z.string()).optional().nullable(),
  excludedProducts: z.array(z.string()).optional().nullable(),
});

export const updateCouponSchema = createCouponSchema.partial();

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
