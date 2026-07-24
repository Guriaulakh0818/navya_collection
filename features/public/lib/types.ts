export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  tag?: string;
  category: string;
  description: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge?: string;
}
