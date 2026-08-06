import { SEO_CONSTANTS } from '../constants/seo.constants';
import type {
  BreadcrumbItemInput,
  OrganizationSchemaInput,
  ProductSchemaInput,
  WebSiteSchemaInput,
} from '../types/seo.types';

export function generateOrganizationSchema(input?: OrganizationSchemaInput) {
  const name = input?.name || SEO_CONSTANTS.ORGANIZATION.NAME;
  const url = input?.url || SEO_CONSTANTS.ORGANIZATION.URL;
  const logo = input?.logo || SEO_CONSTANTS.ORGANIZATION.LOGO;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    sameAs: input?.sameAs || SEO_CONSTANTS.ORGANIZATION.SAME_AS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: input?.contactPoint?.telephone || SEO_CONSTANTS.ORGANIZATION.TELEPHONE,
        contactType: input?.contactPoint?.contactType || 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    ],
  };
}

export function generateWebSiteSchema(input?: WebSiteSchemaInput) {
  const name = input?.name || SEO_CONSTANTS.SITE_NAME;
  const url = input?.url || SEO_CONSTANTS.SITE_URL;
  const searchUrl = input?.searchUrl || `${url}/shop?search={search_term_string}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductSchema(product: ProductSchemaInput) {
  const currency = product.currency || 'INR';
  const images =
    product.images && product.images.length > 0 ? product.images : [SEO_CONSTANTS.DEFAULT_OG_IMAGE];

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SEO_CONSTANTS.SITE_URL}/product/${product.id}#product`,
    name: product.name,
    description: product.description,
    image: images,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || SEO_CONSTANTS.SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: product.url || `${SEO_CONSTANTS.SITE_URL}/product/${product.id}`,
      priceCurrency: currency,
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SEO_CONSTANTS.SITE_NAME,
      },
    },
  };

  if (product.category) {
    schema.category = product.category;
  }

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
    };
  }

  return schema;
}

export function generateBreadcrumbSchema(items: BreadcrumbItemInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SEO_CONSTANTS.SITE_URL}${item.url}`,
    })),
  };
}

export function generateItemListSchema(
  products: Array<{ name: string; url: string; image?: string; price?: number }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url.startsWith('http') ? item.url : `${SEO_CONSTANTS.SITE_URL}${item.url}`,
      name: item.name,
      image: item.image,
    })),
  };
}

export function generateShopSchema(shop: {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SEO_CONSTANTS.SITE_URL}/shop/${shop.slug}#store`,
    name: shop.name,
    description:
      shop.description || `${shop.name} boutique partner on Navya Collection marketplace.`,
    url: `${SEO_CONSTANTS.SITE_URL}/shop/${shop.slug}`,
    logo: shop.logo || SEO_CONSTANTS.ORGANIZATION.LOGO,
    telephone: shop.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address || 'India',
      addressCountry: 'IN',
    },
    ...(shop.rating && shop.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: shop.rating,
            reviewCount: shop.reviewCount,
          },
        }
      : {}),
  };
}
