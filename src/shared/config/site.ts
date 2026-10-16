export const SITE_CONFIG = {
  name: 'JiivaaKart',
  description:
    'JiivaaKart - Style That Speaks. A fashion marketplace connecting customers with local clothing stores, boutiques and fashion sellers across India.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://jiivaakart.com',
  ogImage: '/og-image.jpg',
  links: {
    email: 'helpdesk@jiivaakart.com',
    phone: '+91 9053883125',
  },
} as const;
