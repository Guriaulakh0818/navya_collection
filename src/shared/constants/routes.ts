export const ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  PRODUCT: (slug: string) => `/product/${slug}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  ABOUT: '/about',
  CONTACT: '/contact',
  ORDERS: '/orders',
  WISHLIST: '/wishlist',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;
