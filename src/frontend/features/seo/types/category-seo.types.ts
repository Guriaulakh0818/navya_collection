export interface CategorySeoData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  banner?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  status?: string;
  productCount?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
}

export interface CategoryProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  imageUrl?: string;
}

export interface CategoryJsonLdOptions {
  category: CategorySeoData;
  parentCategory?: {
    name: string;
    slug: string;
  } | null;
  products?: CategoryProductListItem[];
  canonicalUrl?: string;
}
