import type { Metadata } from 'next';

import { SEO_CONSTANTS } from '../constants/seo.constants';
import type { ProductSeoInput, SeoContext } from '../types/product-seo.types';
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
 * 1. DYNAMIC META TITLE GENERATOR
 * Formula: {Product Name} - {Shop Name} | Navya Collection (or {Product Name} | Navya Collection)
 * Target: 50-60 characters
 */
export function generateProductMetaTitle(product: ProductSeoInput): string {
  if (product.metaTitle && product.metaTitle.trim().length > 0) {
    return product.metaTitle.trim();
  }

  const categoryName = product.category?.name;
  const siteName = SEO_CONSTANTS.SITE_NAME;

  if (categoryName && categoryName.trim().length > 0) {
    const withCategory = `${product.name} - ${categoryName.trim()} | ${siteName}`;
    if (withCategory.length <= 60) {
      return withCategory;
    }
  }

  const baseTitle = `${product.name} | ${siteName}`;
  if (baseTitle.length <= 60) {
    return baseTitle;
  }

  return smartTruncate(baseTitle, 60);
}

/**
 * 2. DYNAMIC META DESCRIPTION GENERATOR
 * Formula: Unique description from actual product attributes, category, seller, price, and Pan-India delivery.
 * Target: 150-160 characters
 */
export function generateProductMetaDescription(product: ProductSeoInput): string {
  if (product.metaDescription && product.metaDescription.trim().length > 0) {
    return smartTruncate(product.metaDescription.trim(), 160);
  }

  // If DB has a genuine description, clean and use it
  if (product.description && product.description.trim().length > 25) {
    const cleanDesc = product.description.replace(/\s+/g, ' ').trim();
    if (cleanDesc.length <= 160) {
      return cleanDesc;
    }
    return smartTruncate(cleanDesc, 160);
  }

  const shopName = product.shop?.name;
  const sellerText = shopName && shopName.trim().toLowerCase() !== SEO_CONSTANTS.SITE_NAME.toLowerCase()
    ? ` from ${shopName.trim()}`
    : '';
  const priceText = product.price ? ` at ₹${Number(product.price).toLocaleString('en-IN')}` : '';
  const catText = product.category?.name ? ` in ${product.category.name}` : '';
  const stockText = product.stock !== undefined && product.stock <= 0 ? ' Check back soon for restocks.' : ' Available now.';

  const baseText = `Buy ${product.name}${catText}${sellerText}${priceText} on ${SEO_CONSTANTS.SITE_NAME}.${stockText} Pan-India shipping & easy 7-day returns.`;
  return smartTruncate(baseText, 160);
}

/**
 * 3. DYNAMIC META KEYWORDS GENERATOR
 */
export function generateProductMetaKeywords(product: ProductSeoInput): string[] {
  if (product.metaKeywords && product.metaKeywords.trim().length > 0) {
    return product.metaKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const keywordsSet = new Set<string>();

  // Add Product Name words
  keywordsSet.add(product.name.toLowerCase());
  product.name
    .toLowerCase()
    .split(/\s+/)
    .forEach((w) => {
      if (w.length > 3) keywordsSet.add(w);
    });

  // Add Category
  if (product.category?.name) {
    keywordsSet.add(product.category.name.toLowerCase());
    keywordsSet.add(`${product.category.name.toLowerCase()} online`);
  }

  // Add Seller / Shop
  if (product.shop?.name) {
    keywordsSet.add(product.shop.name.toLowerCase());
  }

  // Add Attributes if genuinely present
  if (product.brand) keywordsSet.add(product.brand.toLowerCase());
  if (product.gender) keywordsSet.add(`${product.gender.toLowerCase()}'s fashion`);
  if (product.color) keywordsSet.add(`${product.color.toLowerCase()} clothing`);
  if (product.fabric) keywordsSet.add(`${product.fabric.toLowerCase()} fabric`);
  if (product.fit) keywordsSet.add(`${product.fit.toLowerCase()} fit`);
  if (product.occasion) keywordsSet.add(`${product.occasion.toLowerCase()} wear`);

  // Brand Defaults
  SEO_CONSTANTS.DEFAULT_KEYWORDS.forEach((k) => keywordsSet.add(k.toLowerCase()));

  return Array.from(keywordsSet);
}

/**
 * 4. CANONICAL URL GENERATOR
 * Clean URL without tracking, filters, or query parameters.
 */
export function generateProductCanonicalUrl(
  product: ProductSeoInput,
  context?: SeoContext,
): string {
  const baseUrl = context?.baseUrl || DEFAULT_BASE_URL;
  const rawSlug = product.slug || product.name;
  // Strip any query parameters or hash
  const cleanSlug = rawSlug.split('?')[0].split('#')[0].trim();
  const safeSlug = generateSeoSlug(cleanSlug);

  return `${baseUrl}/product/${safeSlug}`;
}

/**
 * 5. NEXT.JS 15 METADATA GENERATOR (App Router)
 */
export function generateProductMetadata(product: ProductSeoInput, context?: SeoContext): Metadata {
  const title = generateProductMetaTitle(product);
  const description = generateProductMetaDescription(product);
  const keywords = generateProductMetaKeywords(product);
  const canonicalUrl = generateProductCanonicalUrl(product, context);

  // Primary Og Image
  const primaryImage =
    product.ogImage ||
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    SEO_CONSTANTS.DEFAULT_OG_IMAGE;

  const imagesList =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          url: img.url,
          width: img.width || 1200,
          height: img.height || 630,
          alt: img.alt || `${product.name} - Navya Collection`,
        }))
      : [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: `${product.name} - Navya Collection`,
          },
        ];

  return {
    metadataBase: new URL(context?.baseUrl || DEFAULT_BASE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
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
      images: imagesList,
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
 * 6. SCHEMA.ORG JSON-LD SCHEMAS GENERATOR
 * Generates:
 * - Product Schema (Offer, and AggregateRating/Reviews ONLY IF genuine reviews exist)
 * - BreadcrumbList Schema (Home -> Shop -> Category -> Product)
 * - Organization Schema
 */
export function generateProductJsonLdSchemas(product: ProductSeoInput, context?: SeoContext) {
  const baseUrl = context?.baseUrl || DEFAULT_BASE_URL;
  const currency = context?.currency || 'INR';
  const canonicalUrl = generateProductCanonicalUrl(product, context);

  // 1. ImageObjects
  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          '@type': 'ImageObject',
          contentUrl: img.url,
          name: img.alt || product.name,
          caption: img.alt || product.name,
          ...(img.width ? { width: img.width } : {}),
          ...(img.height ? { height: img.height } : {}),
        }))
      : [
          {
            '@type': 'ImageObject',
            contentUrl: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
            name: product.name,
            caption: product.name,
          },
        ];

  // 2. Offer Schema
  const sellerName = product.shop?.name || SEO_CONSTANTS.SITE_NAME;
  const offerSchema = {
    '@type': 'Offer',
    url: canonicalUrl,
    priceCurrency: currency,
    price: Number(product.price || 0),
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    itemCondition: 'https://schema.org/NewCondition',
    availability:
      product.stock !== undefined && product.stock <= 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: sellerName,
    },
  };

  // 3. Base Product Schema
  const productSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    description: product.description || generateProductMetaDescription(product),
    image: images,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || sellerName,
    },
    category: product.category?.name || 'Garments',
    offers: offerSchema,
    url: canonicalUrl,
  };

  if (product.color) productSchema.color = product.color;
  if (product.fabric) productSchema.material = product.fabric;

  // 4. AGGREGATE RATING: Generated ONLY IF reviewCount > 0 AND rating > 0
  const rawRating = product.rating ? Number(product.rating) : 0;
  const rawReviewCount = product.reviewCount !== undefined && product.reviewCount !== null
    ? Number(product.reviewCount)
    : (product.reviews?.length || 0);

  if (rawReviewCount > 0 && rawRating > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(rawRating.toFixed(1)),
      reviewCount: rawReviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // 5. REVIEW SCHEMA: Generated ONLY IF genuine review records exist
  if (product.reviews && product.reviews.length > 0) {
    const genuineReviews = product.reviews
      .filter((r) => r.comment || (r.rating && r.rating > 0))
      .map((r) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.user?.name || r.userName || 'Verified Buyer',
        },
        datePublished: r.createdAt
          ? new Date(r.createdAt).toISOString().split('T')[0]
          : undefined,
        reviewBody: r.comment || '',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating || 5,
          bestRating: 5,
          worstRating: 1,
        },
      }));

    if (genuineReviews.length > 0) {
      productSchema.review = genuineReviews;
    }
  }

  // 6. Breadcrumb Schema (Home -> Shop -> Category -> Product)
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ];

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `/category/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: `/product/${generateSeoSlug(product.slug || product.name)}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return [productSchema, breadcrumbSchema];
}
