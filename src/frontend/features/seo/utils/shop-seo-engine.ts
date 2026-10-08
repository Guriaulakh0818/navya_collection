import type { Metadata } from 'next';

import { SEO_CONSTANTS } from '../constants/seo.constants';
import type { ProductSeoInput, SeoContext } from '../types/product-seo.types';
import type { ShopSeoInput } from '../types/shop-seo.types';
import { generateBreadcrumbSchema, generateOrganizationSchema } from './schema-generators';
import { generateSeoSlug } from './slug-generator';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store';

/**
 * Truncates text smartly to target char limit without breaking words
 */
function smartTruncate(text: string, targetLength: number): string {
  if (!text || text.length <= targetLength) return text;
  const truncated = text.substring(0, targetLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * 1. DYNAMIC SHOP META TITLE GENERATOR
 * Formula: {Shop Name} - {City} | Navya Collection (or {Shop Name} | Navya Collection)
 * Target: 50-60 characters
 */
export function generateShopMetaTitle(shop: ShopSeoInput): string {
  if (shop.metaTitle && shop.metaTitle.trim().length > 0) {
    return shop.metaTitle.trim();
  }

  const city = shop.city?.trim();
  const rawTitle = city
    ? `${shop.name} - ${city} | ${SEO_CONSTANTS.SITE_NAME}`
    : `${shop.name} | ${SEO_CONSTANTS.SITE_NAME}`;

  if (rawTitle.length > 60) {
    const conciseTitle = `${shop.name} | ${SEO_CONSTANTS.SITE_NAME}`;
    if (conciseTitle.length <= 60) return conciseTitle;
    return smartTruncate(conciseTitle, 60);
  }

  return rawTitle;
}

/**
 * 2. DYNAMIC SHOP META DESCRIPTION GENERATOR
 * Formula: Natural description from real shop location, boutique categories, and marketplace delivery.
 * Target: 150-160 characters
 */
export function generateShopMetaDescription(shop: ShopSeoInput): string {
  if (shop.metaDescription && shop.metaDescription.trim().length > 0) {
    return smartTruncate(shop.metaDescription.trim(), 160);
  }

  // If DB contains a genuine description, clean and use it
  if (shop.description && shop.description.trim().length > 25) {
    const cleanDesc = shop.description.replace(/\s+/g, ' ').trim();
    if (cleanDesc.length <= 160) {
      return cleanDesc;
    }
    return smartTruncate(cleanDesc, 160);
  }

  const locationParts = [shop.city, shop.state].filter(Boolean);
  const locationText = locationParts.length > 0 ? ` in ${locationParts.join(', ')}` : '';
  const baseText = `Shop ${shop.name} on ${SEO_CONSTANTS.SITE_NAME}.${locationText} Explore verified designer fashion & ethnic wear with Pan-India delivery.`;

  return smartTruncate(baseText, 160);
}

/**
 * 3. SHOP CANONICAL URL GENERATOR
 * Clean URL without tracking, filters, or query parameters.
 */
export function generateShopCanonicalUrl(shop: ShopSeoInput, context?: SeoContext): string {
  const baseUrl = context?.baseUrl || DEFAULT_BASE_URL;
  const rawSlug = shop.slug || shop.name;
  // Strip any query parameters or hash
  const cleanSlug = rawSlug.split('?')[0].split('#')[0].trim();
  const safeSlug = generateSeoSlug(cleanSlug);

  return `${baseUrl}/shop/${safeSlug}`;
}

/**
 * 4. NEXT.JS 15 METADATA GENERATOR FOR SHOPS (App Router)
 */
export function generateShopMetadata(
  shop: ShopSeoInput,
  options?: { baseUrl?: string; hasProducts?: boolean } | SeoContext,
): Metadata {
  const title = generateShopMetaTitle(shop);
  const description = generateShopMetaDescription(shop);
  const canonicalUrl = generateShopCanonicalUrl(shop, options);

  // Check if shop is eligible for indexing (must have active products unless explicitly allowed)
  const isIndexable =
    options && 'hasProducts' in options && options.hasProducts !== undefined
      ? options.hasProducts
      : shop.productCount === undefined || shop.productCount > 0;

  // Primary Image (Banner > Logo > Default OG Image)
  const primaryImage = shop.banner || shop.logo || SEO_CONSTANTS.DEFAULT_OG_IMAGE;

  return {
    metadataBase: new URL(options?.baseUrl || DEFAULT_BASE_URL),
    title: {
      absolute: title,
    },
    description,
    keywords: [
      shop.name,
      ...(shop.city ? [`${shop.name} ${shop.city}`, `${shop.city} boutique`] : []),
      ...(shop.state ? [`fashion store in ${shop.state}`] : []),
      'Navya Collection shop',
      'verified boutique India',
      'ethnic wear boutique',
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
      type: 'website',
      url: canonicalUrl,
      siteName: SEO_CONSTANTS.SITE_NAME,
      locale: 'en_IN',
      title,
      description,
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: `${shop.name} - Navya Collection`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage],
    },
  };
}

/**
 * 5. SCHEMA.ORG JSON-LD SCHEMAS GENERATOR FOR SHOPS
 * Generates:
 * - Store / LocalBusiness Schema (with genuine address & AggregateRating ONLY IF real reviews exist)
 * - BreadcrumbList Schema (Home -> Shop -> Shop Name)
 */
export function generateShopJsonLdSchemas(shop: ShopSeoInput, context?: SeoContext) {
  const baseUrl = context?.baseUrl || DEFAULT_BASE_URL;
  const canonicalUrl = generateShopCanonicalUrl(shop, context);

  // 1. Base Store / LocalBusiness Schema
  const storeSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${canonicalUrl}#store`,
    name: shop.name,
    description: shop.description || generateShopMetaDescription(shop),
    url: canonicalUrl,
    image: shop.banner || shop.logo || SEO_CONSTANTS.DEFAULT_OG_IMAGE,
    priceRange: '₹₹',
    parentOrganization: {
      '@type': 'Organization',
      name: SEO_CONSTANTS.SITE_NAME,
      url: baseUrl,
    },
  };

  if (shop.logo) {
    storeSchema.logo = {
      '@type': 'ImageObject',
      url: shop.logo,
    };
  }

  if (shop.phone) {
    storeSchema.telephone = shop.phone;
  }

  if (shop.email) {
    storeSchema.email = shop.email;
  }

  // Real Postal Address (Local SEO) - only emit if genuine address parts exist
  const addressParts = [shop.city, shop.state, shop.pincode].filter(Boolean);
  if (addressParts.length > 0 || shop.fullAddress) {
    storeSchema.address = {
      '@type': 'PostalAddress',
      streetAddress:
        shop.fullAddress ||
        (shop.city ? [shop.city, shop.state].filter(Boolean).join(', ') : undefined),
      addressLocality: shop.city || undefined,
      addressRegion: shop.state || undefined,
      postalCode: shop.pincode || undefined,
      addressCountry: 'IN',
    };
  }

  // AGGREGATE RATING: Generated ONLY IF reviewCount > 0 AND rating > 0
  const rawRating = shop.rating ? Number(shop.rating) : 0;
  const rawReviewCount = shop.reviewCount ? Number(shop.reviewCount) : 0;

  if (rawReviewCount > 0 && rawRating > 0) {
    storeSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(rawRating.toFixed(1)),
      reviewCount: rawReviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // 2. BreadcrumbList Schema (Home -> Shop -> Shop Name)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: shop.name, url: `/shop/${generateSeoSlug(shop.slug || shop.name)}` },
  ]);

  return [storeSchema, breadcrumbSchema];
}
