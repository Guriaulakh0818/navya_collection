export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  CART: '/api/cart',
  ORDERS: '/api/orders',
  AUTH: {
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGOUT: '/api/auth/logout',
  },
  PAYMENT: {
    CREATE_ORDER: '/api/payment/create-order',
    VERIFY: '/api/payment/verify',
  },
  SHIPPING: {
    CREATE: '/api/shipping/create',
    TRACK: '/api/shipping/track',
  },
} as const;
