'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import type { Product } from '@/features/products/types/product.types';

const mockProducts: Product[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  description: 'Premium quality product.',
  price: 899 + i * 100,
  compareAtPrice: [1299, 1499, 1799, 1999][i % 4],
  images: [],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 10,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 20 + i * 5,
}));

export default function CartPage() {
  const [items, setItems] = useState(mockProducts.slice(0, 3));

  const subtotal = items.reduce((sum, p) => sum + p.price, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="font-heading text-3xl text-navy">Your Cart is Empty</h1>
        <p className="mt-2 text-sm text-slate-600">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="font-heading text-3xl text-navy mb-6">Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"
              >
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50" />
                <div className="flex-1">
                  <h3 className="font-heading text-navy">{item.name}</h3>
                  <p className="text-sm text-slate-600">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input type="number" value={1} min={1} className="w-16" />
                  <Button variant="ghost" onClick={() => removeItem(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
            <h3 className="font-heading text-xl text-navy mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-navy">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-4 rounded-full">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
