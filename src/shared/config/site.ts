export const SITE_CONFIG = {
  name: 'Navya Collection',
  description:
    'Navya Collection is a fashion marketplace connecting customers with local clothing stores, boutiques and fashion sellers across India.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store',
  ogImage: '/og-image.jpg',
  links: {
    email: 'helpdesk@navyacollection.store',
    phone: '+91 9053883125',
  },
} as const;

