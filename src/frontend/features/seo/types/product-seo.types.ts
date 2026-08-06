export interface ProductSeoDbFields {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  robots?: string | null;
}

export interface ProductImageInput {
  id?: string;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  isPrimary?: boolean;
}

export interface ProductVariantSeoInput {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock?: number;
  size?: string | null;
  color?: string | null;
}

export interface ProductSeoInput extends ProductSeoDbFields {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;
  status?: string;
  brand?: string | null;
  gender?: string | null;
  ageGroup?: string | null;
  fabric?: string | null;
  color?: string | null;
  fit?: string | null;
  occasion?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
  images?: ProductImageInput[];
  variants?: ProductVariantSeoInput[];
  rating?: number;
  reviewCount?: number;
}

export interface SeoContext {
  baseUrl?: string;
  locale?: string;
  currency?: string;
  country?: string;
  domain?: string;
}
