export const PAYMENT_CONFIG = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    currency: 'INR',
    capture: true,
  },
  shipping: {
    freeThreshold: 999,
    rates: {
      standard: 49,
      express: 99,
      sameDay: 149,
    },
  },
  tax: {
    gstRate: 0.18,
  },
} as const;
