import { MetadataRoute } from 'next';

/**
 * Dynamic Robots.txt Generator for SEO & Crawler Access Controls.
 * Allows crawling of public routes while protecting genuine internal/admin areas.
 * Private customer utility pages (/cart, /checkout, /wishlist, /login, /search)
 * declare explicit noindex meta tags so search engines can read the directives without crawl blocks.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store'
  ).replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin', '/seller/', '/seller', '/api/', '/account/', '/account'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
