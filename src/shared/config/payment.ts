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
    /**
     * @deprecated Hardcoded GST is prohibited under BM-06 Decision 2.
     * All GST calculations must be dynamically determined via TaxService.calculateItemDynamicTax.
     */
    gstRate: 0,
    dynamicGstEnabled: true,
  },
} as const;
