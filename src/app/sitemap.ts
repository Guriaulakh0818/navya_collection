import { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';

/**
 * Dynamic XML Sitemap Generator for SEO.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-seller`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // 1. Boutique Shops
    const shops = await prisma.shop.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { slug: true, updatedAt: true },
    });

    const shopUrls: MetadataRoute.Sitemap = shops.map((s) => ({
      url: `${baseUrl}/shop/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 2. Active Products
    const products = await prisma.product.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { slug: true, updatedAt: true },
      take: 1000,
    });

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    return [...staticPages, ...shopUrls, ...productUrls];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return staticPages;
  }
}
