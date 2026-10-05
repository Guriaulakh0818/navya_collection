/**
 * Centralized Authoritative Business & Platform Facts for Navya Collection AEO & GEO.
 * Single source of truth for factual descriptions, entities, policies, and routes.
 */
export const AEO_FACTS = {
  BRAND: {
    NAME: 'Navya Collection',
    LEGAL_NAME: 'Navya Collection Private Limited',
    DOMAIN: 'https://navyacollection.store',
    FOUNDING_YEAR: '2022',
    BUSINESS_TYPE: 'Fashion Marketplace',
    PRIMARY_MARKET: 'India',
    HEADQUARTERS: {
      CITY: 'Fatehabad',
      STATE: 'Haryana',
      COUNTRY: 'India',
      PINCODE: '125050',
    },
    MISSION:
      'Connecting customers across India with authentic local clothing stores, designer boutiques, and regional fashion creators.',
    CORE_DEFINITION:
      'Navya Collection is a fashion marketplace connecting customers with local clothing stores, boutiques and fashion sellers across India.',
  },

  CONTACT: {
    EMAIL: 'helpdesk@navyacollection.store',
    PHONE: '+91-9053883125',
    SUPPORT_URL: 'https://navyacollection.store/contact',
  },

  CANONICAL_ROUTES: {
    HOME: '/',
    SHOP: '/shop',
    CATEGORIES: '/category',
    BECOME_SELLER: '/become-seller',
    ABOUT: '/about',
    FAQ: '/faq',
    CONTACT: '/contact',
    SHIPPING_POLICY: '/shipping-policy',
    RETURN_POLICY: '/return-policy',
    TERMS: '/terms-and-conditions',
    PRIVACY: '/privacy-policy',
    CANCELLATION: '/cancellation-policy',
    SELLER_AGREEMENT: '/seller-agreement',
  },

  PAYMENTS: {
    SUPPORTED_METHODS: [
      'Cash on Delivery (COD)',
      'UPI (Google Pay, PhonePe, Paytm)',
      'Debit & Credit Cards (Visa, Mastercard, RuPay)',
      'Net Banking',
    ],
    GATEWAY: 'Razorpay',
    COD_POLICY:
      'Cash on Delivery is available across serviceable Indian pin codes with zero hidden charges.',
  },

  SHIPPING: {
    LOGISTICS_PARTNER: 'Shiprocket',
    COVERAGE: 'Pan-India across 19,000+ pin codes',
    FREE_SHIPPING_THRESHOLD: 'Orders above ₹999 qualify for free express delivery',
    STANDARD_SHIPPING_FEE: 'Flat ₹99 per order for cart totals below ₹999',
    MULTI_SELLER_FULFILLMENT:
      'Orders containing items from multiple boutique merchants are split into separate consignments dispatched directly by each seller with dedicated tracking.',
  },

  RETURNS: {
    RETURN_WINDOW_DAYS: 3,
    REPLACEMENT_WINDOW_DAYS: 7,
    WINDOW_DAYS: 3,
    WINDOW_DESCRIPTION:
      '3-day returns and 7-day size replacements from the date of package delivery',
    PICKUP_MODE: 'Doorstep reverse pickup across serviceable pin codes',
    REFUND_TIMELINE:
      'Refunds processed within 24 hours of warehouse inspection (banks reflect credit in 3–5 business days)',
  },

  SELLER_PROGRAM: {
    PORTAL_URL: '/become-seller',
    ELIGIBILITY:
      'Verified clothing stores, regional boutiques, and independent fashion designers in India',
    ONBOARDING_FLOW:
      'Sellers submit shop details, business documents (GST/PAN/Bank), and complete verification to list products and start selling.',
  },
} as const;
