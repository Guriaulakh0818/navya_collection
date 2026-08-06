import { ROLES } from '@/constants/roles';

const ROLES_CUSTOMER_PERMISSIONS = [
  'read:products',
  'write:cart',
  'read:orders',
  'write:reviews',
  'write:wishlist',
] as const;

const ROLES_ADMIN_PERMISSIONS = [
  ...ROLES_CUSTOMER_PERMISSIONS,
  'read:admin',
  'write:products',
  'write:orders',
  'write:categories',
  'write:coupons',
  'write:banners',
] as const;

export const AUTH_CONFIG = {
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  otp: {
    expiry: 5 * 60,
    maxResend: 3,
    maxAttempts: 5,
  },
  roles: {
    [ROLES.CUSTOMER]: ROLES_CUSTOMER_PERMISSIONS,
    [ROLES.ADMIN]: ROLES_ADMIN_PERMISSIONS,
  },
} as const;
