import { z } from 'zod';

export const shopManagementSchema = z.object({
  shopId: z.string().optional(),
  name: z.string().min(2, 'Shop Name must be at least 2 characters'),
  ownerName: z.string().optional().or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be URL-friendly (lowercase letters, numbers, and hyphens)',
    )
    .optional()
    .or(z.literal('')),
  logo: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid contact phone required'),
  email: z.string().email('Valid support email required'),
  fullAddress: z.string().min(5, 'Physical address required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Pincode'),
  shippingPolicy: z.string().optional().or(z.literal('')),
  returnPolicy: z.string().optional().or(z.literal('')),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  panNumber: z.string().optional().or(z.literal('')),
  bankAccountHolder: z.string().optional().or(z.literal('')),
  bankAccountNumber: z.string().optional().or(z.literal('')),
  bankIfscCode: z.string().optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  isClosed: z.boolean().optional().default(false),
  closedReason: z.string().optional().or(z.literal('')),
  closedUntil: z.string().optional().or(z.literal('')),
  vacationMessage: z.string().optional().or(z.literal('')),
});

export type ShopManagementInput = z.infer<typeof shopManagementSchema>;
