import type { MetadataRoute } from 'next';

import { SEO_CONSTANTS } from '@/features/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_CONSTANTS.SITE_NAME,
    short_name: 'Navya',
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
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
