import { z } from 'zod';

export const addressTypeEnum = z.enum(['HOME', 'WORK', 'OTHER']);

export const createAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.'),
  mobile: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number.')),
  pincode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit Pincode.')),
  addressLine1: z
    .string()
    .trim()
    .min(3, 'Address line 1 must be at least 3 characters.')
    .max(250, 'Address line 1 cannot exceed 250 characters.'),
  addressLine2: z.string().trim().max(250).optional().nullable(),
  city: z.string().trim().min(2, 'City is required.').max(100),
  state: z.string().trim().min(2, 'State is required.').max(100),
  type: addressTypeEnum.default('HOME'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
