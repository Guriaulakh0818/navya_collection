import type { MetadataRoute } from 'next';

import { SEO_CONSTANTS } from '@/features/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_CONSTANTS.SITE_NAME,
    short_name: 'JiivaaKart',
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: SEO_CONSTANTS.THEME_COLOR,
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
