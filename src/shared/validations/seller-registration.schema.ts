import { z } from 'zod';

export const emailOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z
    .string()
    .min(10, 'Mobile number required')
    .regex(/^(?:\+91)?[6-9]\d{9}$/, 'Please enter a valid phone number'),
});

export const shopDetailsSchema = z.object({
  shopName: z.string().min(3, 'Shop Name must be at least 3 characters'),
  description: z.string().min(10, 'Please provide a short description (min 10 characters)'),
  logo: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Business phone is required')
    .regex(/^(?:\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  email: z.string().email('Valid support email required'),
});

export const businessTypeSchema = z.object({
  businessType: z.enum([
    'PROPRIETORSHIP',
    'PARTNERSHIP',
    'PRIVATE_LIMITED',
    'LLP',
    'INDIVIDUAL_ARTISAN',
  ]),
  legalName: z.string().min(2, 'Legal Registered Name is required'),
  pan: z
    .string()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card Number format (e.g. ABCDE1234F)'),
  gstin: z
    .string()
    .toUpperCase()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      { message: 'Invalid GSTIN format (e.g. 06ABCDE1234F1Z5)' },
    ),
});

export const shopAddressSchema = z.object({
  fullAddress: z.string().min(5, 'Building, Street & Area required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Pincode (e.g. 125001)'),
  landmark: z.string().optional(),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, 'Account Holder Name required'),
  bankName: z.string().min(2, 'Bank Name required'),
  accountNumber: z.string().min(6, 'Account Number must be at least 6 digits'),
  ifscCode: z
    .string()
    .toUpperCase()
    .min(4, 'IFSC Code required')
    .regex(/^[A-Z]{4}0?[A-Z0-9]{5,6}$/i, 'Invalid IFSC Code format (e.g. SBIN0001234)'),
  upiId: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.length === 0 || /^[\w.-]+@[\w.-]+$/.test(val), {
      message: 'Invalid UPI ID format (e.g. name@upi)',
    }),
});

export const documentsSchema = z.object({
  gstCertificate: z.string().optional().or(z.literal('')),
  panCard: z.string().optional().or(z.literal('')),
  shopPhoto: z.string().optional().or(z.literal('')),
});

export const sellerRegistrationSchema = z.object({
  basicInfo: basicInfoSchema,
  shopDetails: shopDetailsSchema,
  businessType: businessTypeSchema,
  address: shopAddressSchema,
  bankDetails: bankDetailsSchema,
  documents: documentsSchema.optional(),
});

export type EmailOtpInput = z.infer<typeof emailOtpSchema>;
export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type ShopDetailsInput = z.infer<typeof shopDetailsSchema>;
export type BusinessTypeInput = z.infer<typeof businessTypeSchema>;
export type ShopAddressInput = z.infer<typeof shopAddressSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type DocumentsInput = z.infer<typeof documentsSchema>;
export type SellerRegistrationInput = z.infer<typeof sellerRegistrationSchema>;
