export interface ProductImage {
  id: string;
  url: string;
  imageUrl?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku?: string;
  name?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  attributes?: Record<string, string>;
  size?: string;
  color?: string;
  material?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  category: ProductCategory;
  categoryId: string;
  variants?: ProductVariant[];
  status: 'draft' | 'active' | 'archived';
  stock: number;
  lowStockThreshold?: number;
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  isNewArrival?: boolean;
  isFeatured?: boolean;
  shop?: {
    id: string;
    name: string;
    slug: string;
    verificationBadge?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
