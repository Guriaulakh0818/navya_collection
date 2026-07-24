export const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL || '',
  password: process.env.SHIPROCKET_PASSWORD || '',
  baseUrl: 'https://apiv2.shiprocket.in/v1/external',
  channels: {
    cashfree: 'cashfree',
    razorpay: 'razorpay',
    paytm: 'paytm',
  },
} as const;
