export interface CategoryChildItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  banner?: string;
  parentId?: string;
  parentName?: string;
  parentSlug?: string;
  productCount?: number;
  accent?: string;
  subCategories?: CategoryChildItem[];
}
