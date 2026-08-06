export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  category: string;
  images: string[];
  description: string;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod_001',
    name: 'Pure Chanderi Silk Saree with Zari Border',
    slug: 'pure-chanderi-silk-saree-with-zari-border',
    price: 3499,
    originalPrice: 4999,
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    category: 'Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'],
    description: 'Elegant handcrafted Chanderi silk saree featuring intricate metallic zari work.',
  },
  {
    id: 'prod_002',
    name: 'Anarkali Kurti Set with Dupatta',
    slug: 'anarkali-kurti-set-with-dupatta',
    price: 2199,
    originalPrice: 2999,
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    category: 'Kurti Sets',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b'],
    description: 'Flowy floral printed cotton Anarkali suit set with gold lace border.',
  },
  {
    id: 'prod_003',
    name: 'Handblock Printed Cotton Dupatta',
    slug: 'handblock-printed-cotton-dupatta',
    price: 699,
    originalPrice: 999,
    rating: 4.9,
    reviewCount: 45,
    inStock: false,
    category: 'Dupattas',
    images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e'],
    description: 'Traditional Bagru handblock printed lightweight cotton dupatta.',
  },
];
