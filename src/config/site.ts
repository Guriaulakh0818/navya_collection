export const SITE_CONFIG = {
  name: 'Navya Collection',
  description: 'Affordable Premium Fashion for Gents and Kids',
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  ogImage: '/images/og.jpg',
  links: {
    github: 'https://github.com/navya-collection',
    twitter: 'https://twitter.com/navyacollection',
    instagram: 'https://instagram.com/navyacollection',
    email: 'hello@navyacollection.in',
    phone: '+91 9876543210',
  },
} as const;
