export interface CityShopItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  rating: number;
  reviewCount: number;
  verificationBadge?: string;
  _count?: {
    products?: number;
  };
}

export interface CityProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  shop: {
    id: string;
    name: string;
    slug: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CityCategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface CitySeoData {
  cityName: string;
  stateName?: string | null;
  citySlug: string;
  approvedShopCount: number;
  activeProductCount: number;
  categories: CityCategoryItem[];
  isIndexable: boolean;
}

export interface CityJsonLdOptions {
  cityName: string;
  stateName?: string | null;
  canonicalUrl: string;
  shops?: CityShopItem[];
  products?: CityProductItem[];
}
