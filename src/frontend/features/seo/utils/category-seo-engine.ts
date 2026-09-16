import { Metadata } from 'next';

import { SEO_CONSTANTS } from '../constants/seo.constants';
import type { BreadcrumbItemInput } from '../types/seo.types';
import type {
  CategoryJsonLdOptions,
  CategorySeoData,
} from '../types/category-seo.types';
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
} from './schema-generators';

/**
 * Truncate description cleanly at word boundaries around maxLength characters.
 */
function truncateDescription(text: string, maxLength: number = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
}

/**
 * Build natural, non-keyword-stuffed fallback description based on category context.
 */
function buildNaturalCategoryDescription(category: CategorySeoData, parentName?: string | null): string {
  if (category.metaDescription && category.metaDescription.trim().length > 0) {
    return truncateDescription(category.metaDescription.trim());
  }

  if (category.description && category.description.trim().length > 0) {
    return truncateDescription(category.description.trim());
  }

  const name = category.name.trim();

  if (parentName) {
    return truncateDescription(
      `Explore authentic ${name} in ${parentName} collection on Navya Collection, featuring products from local clothing stores and boutiques across India.`
    );
  }

  return truncateDescription(
    `Explore ${name} on Navya Collection, featuring fashion from verified clothing stores and boutiques across India.`
  );
}

/**
 * Generates dynamic SSR Next.js Metadata for category pages (/category/[slug]).
 */
export function generateCategoryMetadata(
  category: CategorySeoData | null,
  options?: {
    slug?: string;
    parentName?: string | null;
    hasPublicProducts?: boolean;
  }
): Metadata {
  const siteUrl = SEO_CONSTANTS.SITE_URL;

  // If category is not found or inactive
  if (!category || category.status === 'inactive') {
    return {
      title: `Category Not Found | ${SEO_CONSTANTS.SITE_NAME}`,
      description: 'The requested category is not available on Navya Collection.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const cleanSlug = (category.slug || options?.slug || '').toLowerCase().trim();
  const canonicalUrl = `${siteUrl}/category/${cleanSlug}`;
  const title = category.metaTitle || `${category.name} | ${SEO_CONSTANTS.SITE_NAME}`;
  const description = buildNaturalCategoryDescription(category, options?.parentName);
  const imageUrl = category.banner || category.image || SEO_CONSTANTS.DEFAULT_OG_IMAGE;
  const isIndexable = options?.hasPublicProducts !== false;

  return {
    title,
    description,
    keywords: [
      category.name,
      ...(category.metaKeywords ? category.metaKeywords.split(',').map((k) => k.trim()) : []),
      'fashion marketplace',
      'local boutiques India',
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
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${category.name} collection on Navya Collection`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * Generates Schema.org JSON-LD structured data for category pages.
 * Includes BreadcrumbList (Home -> [Parent] -> Category) and ItemList (products).
 */
export function generateCategoryJsonLdSchemas(options: CategoryJsonLdOptions): any[] {
  const { category, parentCategory, products, canonicalUrl } = options;
  const siteUrl = SEO_CONSTANTS.SITE_URL;
  const currentCanonical = canonicalUrl || `${siteUrl}/category/${category.slug}`;

  // 1. BreadcrumbList Schema
  const breadcrumbs: BreadcrumbItemInput[] = [
    {
      name: 'Home',
      url: siteUrl,
    },
    {
      name: 'All Categories',
      url: `${siteUrl}/category`,
    },
  ];

  if (parentCategory && parentCategory.slug) {
    breadcrumbs.push({
      name: parentCategory.name,
      url: `${siteUrl}/category/${parentCategory.slug}`,
    });
  }

  breadcrumbs.push({
    name: category.name,
    url: currentCanonical,
  });

  const schemas: any[] = [generateBreadcrumbSchema(breadcrumbs)];

  // 2. ItemList Schema (only if real products are present)
  if (products && products.length > 0) {
    const itemListProducts = products.slice(0, 24).map((p) => ({
      name: p.name,
      url: `${siteUrl}/product/${p.slug}`,
      image: p.imageUrl || p.image,
      price: p.price,
    }));

    schemas.push(generateItemListSchema(itemListProducts));
  }

  return schemas;
}

/**
 * Generates SSR Metadata for Category Directory (/category).
 */
export function generateCategoryDirectoryMetadata(): Metadata {
  const siteUrl = SEO_CONSTANTS.SITE_URL;
  const canonicalUrl = `${siteUrl}/category`;
  const title = `All Fashion Categories | ${SEO_CONSTANTS.SITE_NAME}`;
  const description =
    'Explore verified clothing categories, regional ethnic wear, designer collections, and boutique fashion from local stores across India on Navya Collection.';

  return {
    title,
    description,
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
          alt: 'All Categories on Navya Collection',
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
 * Generates Schema.org JSON-LD for Category Directory (/category).
 */
export function generateCategoryDirectoryJsonLd(
  categories: Array<{ name: string; slug: string; image?: string }>
): any[] {
  const siteUrl = SEO_CONSTANTS.SITE_URL;

  const breadcrumbs: BreadcrumbItemInput[] = [
    {
      name: 'Home',
      url: siteUrl,
    },
    {
      name: 'All Categories',
      url: `${siteUrl}/category`,
    },
  ];

  const schemas: any[] = [generateBreadcrumbSchema(breadcrumbs)];

  if (categories && categories.length > 0) {
    const items = categories.map((cat) => ({
      name: cat.name,
      url: `${siteUrl}/category/${cat.slug}`,
      image: cat.image,
    }));

    schemas.push(generateItemListSchema(items));
  }

  return schemas;
}
