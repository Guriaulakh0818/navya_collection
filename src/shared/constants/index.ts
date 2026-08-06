import { env } from '@/lib/env';

export const routes = {
  home: '/',
  shop: '/shop',
  product: (slug: string) => `/product/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  about: '/about',
  contact: '/contact',
};

export const apiEndpoints = {
  products: '/api/products',
  categories: '/api/categories',
  cart: '/api/cart',
  orders: '/api/orders',
  auth: {
    sendOtp: '/api/auth/send-otp',
    verifyOtp: '/api/auth/verify-otp',
    logout: '/api/auth/logout',
  },
};
