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

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Address {
  id: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}
