'use client';

import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import type { Product } from '@/features/products/types/product.types';
import { useWishlistStore } from '@/stores';

function toProduct(item: {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
}): Product {
  return {
    id: item.productId,
    name: item.name,
    slug: item.slug || item.productId,
    description: '',
    price: item.price,
    images: item.image
      ? [{ id: item.productId, url: item.image, alt: item.name, isPrimary: true }]
      : [],
    category: { id: '1', name: '', slug: '' },
    categoryId: '1',
    status: 'active',
    stock: 10,
    rating: 0,
    reviewCount: 0,
  };
}

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const products = items.map(toProduct);

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Wishlist' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-3xl text-navy">My Wishlist</h1>
          {items.length > 0 && (
            <Button variant="outline" className="rounded-full" onClick={clearWishlist}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 font-heading text-2xl text-navy">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-slate-600">
              Save items you love by clicking the heart icon on any product.
            </p>
            <Button className="mt-6 rounded-full" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
