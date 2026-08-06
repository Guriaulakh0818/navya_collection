import type { Metadata } from 'next';

import { SEO_CONSTANTS } from '../constants/seo.constants';
import type { ProductSeoInput, SeoContext } from '../types/product-seo.types';
import { generateBreadcrumbSchema, generateOrganizationSchema } from './schema-generators';
import { generateSeoSlug } from './slug-generator';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.in';

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
 * Formula: Product Name + Category + Brand | Navya Collection
 * Goal: 50-60 characters
 */
export function generateProductMetaTitle(product: ProductSeoInput): string {
  if (product.metaTitle && product.metaTitle.trim().length > 0) {
    return product.metaTitle.trim();
  }

  const categoryName = product.category?.name ? ` for ${product.category.name}` : '';
  const brandName =
    product.brand && product.brand !== SEO_CONSTANTS.SITE_NAME ? ` by ${product.brand}` : '';
  const rawTitle = `${product.name}${categoryName}${brandName} | ${SEO_CONSTANTS.SITE_NAME}`;

  if (rawTitle.length > 60) {
    // Trim category/brand descriptors if too long
    const conciseTitle = `${product.name} | ${SEO_CONSTANTS.SITE_NAME}`;
    return smartTruncate(conciseTitle, 60);
  }

  return rawTitle;
}

/**
 * 2. DYNAMIC META DESCRIPTION GENERATOR
 * Formula: Buy {Product Name} from Navya Collection. Premium quality, affordable price, fast delivery across India, easy returns. 100% genuine products.
 * Goal: 150-160 characters
 */
export function generateProductMetaDescription(product: ProductSeoInput): string {
  if (product.metaDescription && product.metaDescription.trim().length > 0) {
    return product.metaDescription.trim();
  }

  const baseText = `Buy ${product.name} from ${SEO_CONSTANTS.SITE_NAME}. Premium quality, affordable price, fast delivery across India, easy returns. 100% genuine products.`;

  return smartTruncate(baseText, 160);
}

/**
 * 3. DYNAMIC META KEYWORDS GENERATOR
 * Extracted from: Product Name, Category, Brand, Gender, Color, Fabric, Fit, Occasion
 */
export function generateProductMetaKeywords(product: ProductSeoInput): string[] {
  if (product.metaKeywords && product.metaKeywords.trim().length > 0) {
    return product.metaKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const keywordsSet = new Set<string>();

  // Add Product Name & Words
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

  // Add Attributes
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
 */
export function generateProductCanonicalUrl(
  product: ProductSeoInput,
  context?: SeoContext,
): string {
  if (product.canonicalUrl && product.canonicalUrl.trim().length > 0) {
    return product.canonicalUrl.trim();
  }

  const baseUrl = context?.baseUrl || DEFAULT_BASE_URL;
  const cleanSlug = generateSeoSlug(product.slug || product.name);

  return `${baseUrl}/product/${cleanSlug}`;
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
          alt: img.alt || product.name,
        }))
      : [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ];

  const robotsDirective =
    product.robots || 'index, follow, max-image-preview:large, max-snippet:-1';

  return {
    metadataBase: new URL(context?.baseUrl || DEFAULT_BASE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: robotsDirective,
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      siteName: SEO_CONSTANTS.SITE_NAME,
      title,
      description,
      images: imagesList,
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONSTANTS.TWITTER_HANDLE,
      title,
      description,
      images: [primaryImage],
    },
  };
}

/**
 * 6. SCHEMA.ORG JSON-LD SCHEMAS GENERATOR
 * Generates:
 * - Product Schema (with ImageObject list, Offer, and AggregateRating IF reviews exist)
 * - BreadcrumbList Schema (Home -> Category -> Subcategory -> Product)
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
  const offerSchema = {
    '@type': 'Offer',
    url: canonicalUrl,
    priceCurrency: currency,
    price: product.price,
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    itemCondition: 'https://schema.org/NewCondition',
    availability:
      product.stock !== undefined && product.stock <= 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: SEO_CONSTANTS.SITE_NAME,
    },
  };

  // 3. Base Product Schema
  const productSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    description: product.description,
    image: images,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || SEO_CONSTANTS.SITE_NAME,
    },
    category: product.category?.name || 'Garments',
    offers: offerSchema,
    url: canonicalUrl,
  };

  if (product.color) productSchema.color = product.color;
  if (product.fabric) productSchema.material = product.fabric;

  // 4. AGGREGATE RATING: Generated ONLY IF reviews exist
  if (product.reviewCount && product.reviewCount > 0 && product.rating && product.rating > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // 5. Breadcrumb Schema (Home -> Category -> Subcategory -> Product)
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ];

  if (product.category?.parent) {
    breadcrumbItems.push({
      name: product.category.parent.name,
      url: `/shop/${product.category.parent.slug}`,
    });
  }

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `/shop/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: `/product/${generateSeoSlug(product.slug || product.name)}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  // 6. Organization Schema
  const organizationSchema = generateOrganizationSchema({
    url: baseUrl,
  });

  return [productSchema, breadcrumbSchema, organizationSchema];
}
