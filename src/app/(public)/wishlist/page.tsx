'use client';

import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import type { Product } from '@/features/products/types/product.types';

const mockProducts: Product[] = Array.from({ length: 4 }).map((_, i) => ({
  id: String(i + 1),
  name: `Wishlist Item ${i + 1}`,
  slug: `wishlist-${i + 1}`,
  description: 'Premium quality product.',
  price: 899 + i * 100,
  images: [],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 10,
  rating: 4,
  reviewCount: 20,
}));

export default function WishlistPage() {
  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="font-heading text-3xl text-navy mb-6">My Wishlist</h1>
        <ProductGrid products={mockProducts} />
      </div>
    </div>
  );
}
