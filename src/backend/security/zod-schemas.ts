import { z } from 'zod';

// 1. Auth Schemas
export const sendOtpSchema = z
  .object({
    email: z
      .string()
      .email('Please enter a valid email address')
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
      .optional(),
  })
  .refine((data) => Boolean(data.email || data.mobile), {
    message: 'Either email or mobile is required',
  });

export const verifyOtpSchema = z
  .object({
    email: z
      .string()
      .email('Please enter a valid email address')
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
      .optional(),
    otp: z
      .string()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  })
  .refine((data) => Boolean(data.email || data.mobile), {
    message: 'Either email or mobile is required',
  });

export const SendOtpSchema = sendOtpSchema;
export const VerifyOtpSchema = verifyOtpSchema;

export const adminLoginSchema = z.object({
  email: z
    .string()
    .email('Valid email is required')
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// 2. Profile & Address Schemas
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim()
    .optional(),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim().optional(),
});

export const addressSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(100).trim(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
  line1: z.string().min(5, 'Address line 1 is required').max(200).trim(),
  line2: z.string().max(200).trim().optional(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  state: z.string().min(2, 'State is required').max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required'),
  isDefault: z.boolean().optional().default(false),
});

// 3. Cart & Checkout Schemas
export const addCartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(20, 'Maximum 20 units allowed per item'),
});

export const updateCartItemQuantitySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(0, 'Quantity cannot be negative')
    .max(20, 'Maximum 20 units allowed'),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  paymentMethod: z.enum(['COD', 'RAZORPAY', 'UPI', 'CARD', 'NETBANKING']),
  couponCode: z.string().trim().uppercase().optional(),
  notes: z.string().max(500, 'Notes too long').trim().optional(),
});

// 4. Products & Categories Schemas
export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name required').max(200).trim(),
  slug: z.string().min(3).max(200).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').trim(),
  price: z.number().positive('Price must be greater than 0'),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  sku: z.string().min(3).max(100).trim(),
  images: z
    .array(z.string().url('Image must be a valid URL'))
    .min(1, 'At least 1 product image required'),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name required').max(100).trim(),
  slug: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  image: z.string().url().optional(),
});

// 5. Orders Management Schemas
export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingNumber: z.string().trim().optional(),
  courierName: z.string().trim().optional(),
});

// 6. Search & Reviews & Contact Schemas
export const searchQuerySchema = z.object({
  query: z.string().max(100, 'Search query too long').trim(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const submitReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z
    .string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment is too long')
    .trim(),
});

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(2, 'Coupon code is required')
    .max(30)
    .transform((val) => val.trim().toUpperCase()),
});

export const createCouponSchema = z.object({
  code: z.string().min(3, 'Coupon code required').max(30).trim().uppercase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be positive'),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxDiscountAmount: z.number().positive().optional(),
  expiresAt: z.string().datetime({ message: 'Expiry date must be a valid ISO timestamp' }),
  usageLimit: z.number().int().positive().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100).trim(),
  email: z.string().email('Valid email address required').toLowerCase().trim(),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required')
    .optional(),
  subject: z.string().min(3, 'Subject is required').max(200).trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000).trim(),
});
