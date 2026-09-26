import { Metadata } from 'next';

import { SEO_CONSTANTS } from '../constants/seo.constants';
import type { CityJsonLdOptions, CitySeoData } from '../types/city-seo.types';
import type { BreadcrumbItemInput } from '../types/seo.types';
import { generateBreadcrumbSchema, generateItemListSchema } from './schema-generators';

/**
 * Strict programmatic Local SEO indexability thresholds:
 * - At least 2 approved, non-deleted public shops in the city
 * - At least 10 active, non-deleted public products belonging to those shops
 * - At least 2 distinct active categories represented by those products
 */
export const CITY_SEO_THRESHOLDS = {
  MIN_APPROVED_SHOPS: 2,
  MIN_ACTIVE_PRODUCTS: 10,
  MIN_ACTIVE_CATEGORIES: 2,
} as const;

export function isCityEligibleForSeo(params: {
  approvedShopCount: number;
  activeProductCount: number;
  activeCategoryCount: number;
}): boolean {
  return (
    params.approvedShopCount >= CITY_SEO_THRESHOLDS.MIN_APPROVED_SHOPS &&
    params.activeProductCount >= CITY_SEO_THRESHOLDS.MIN_ACTIVE_PRODUCTS &&
    params.activeCategoryCount >= CITY_SEO_THRESHOLDS.MIN_ACTIVE_CATEGORIES
  );
}

/**
 * Converts a city name string to a URL-friendly slug (e.g. "New Delhi" -> "new-delhi").
 */
export function slugifyCity(cityName: string): string {
  return cityName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a city slug to a capitalized display name (e.g. "new-delhi" -> "New Delhi").
 */
export function formatCityDisplayName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates dynamic SSR Next.js Metadata for city pages (/city/[slug]).
 */
export function generateCityMetadata(data: CitySeoData | null): Metadata {
  const siteUrl = SEO_CONSTANTS.SITE_URL;

  if (!data) {
    return {
      title: `City Not Found | ${SEO_CONSTANTS.SITE_NAME}`,
      description: 'The requested city marketplace page is not available on Navya Collection.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { cityName, stateName, citySlug, approvedShopCount, isIndexable } = data;
  const locationLabel = stateName ? `${cityName}, ${stateName}` : cityName;
  const canonicalUrl = `${siteUrl}/city/${citySlug}`;
  const title = `Local Fashion Stores in ${cityName} | ${SEO_CONSTANTS.SITE_NAME}`;

  const description =
    approvedShopCount > 0
      ? `Discover clothing collections from verified local boutiques and fashion stores in ${locationLabel} on Navya Collection.`
      : `Explore fashion from approved partner stores in ${locationLabel} on Navya Collection.`;

  return {
    title,
    description,
    keywords: [
      `fashion stores in ${cityName}`,
      `boutiques in ${cityName}`,
      `clothing stores ${cityName}`,
      `ethnic wear ${cityName}`,
      cityName,
      stateName || 'India',
      SEO_CONSTANTS.SITE_NAME,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: isIndexable,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SEO_CONSTANTS.SITE_NAME,
      locale: SEO_CONSTANTS.DEFAULT_LOCALE,
      type: 'website',
      images: [
        {
          url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `Local Fashion Stores in ${cityName} - Navya Collection`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Generates Schema.org JSON-LD structured data for city discovery pages.
 * Includes BreadcrumbList (Home -> Local Shops -> City) and ItemList of local partner shops.
 */
export function generateCityJsonLdSchemas(options: CityJsonLdOptions): any[] {
  const { cityName, canonicalUrl, shops, products } = options;
  const siteUrl = SEO_CONSTANTS.SITE_URL;

  // 1. BreadcrumbList Schema
  const breadcrumbs: BreadcrumbItemInput[] = [
    {
      name: 'Home',
      url: siteUrl,
    },
    {
      name: 'Marketplace Shops',
      url: `${siteUrl}/shop`,
    },
    {
      name: cityName,
      url: canonicalUrl,
    },
  ];

  const schemas: any[] = [generateBreadcrumbSchema(breadcrumbs)];

  // 2. ItemList Schema for Real Local Shops (if available)
  if (shops && shops.length > 0) {
    const shopListItems = shops.map((s) => ({
      name: s.name,
      url: `${siteUrl}/shop/${s.slug}`,
      image: s.logo || s.banner || undefined,
    }));

    schemas.push(generateItemListSchema(shopListItems));
  } else if (products && products.length > 0) {
    // Alternatively ItemList of top products if shops are fewer
    const productListItems = products.slice(0, 16).map((p) => ({
      name: p.name,
      url: `${siteUrl}/product/${p.slug}`,
      image: p.imageUrl,
      price: p.price,
    }));

    schemas.push(generateItemListSchema(productListItems));
  }

  return schemas;
}
