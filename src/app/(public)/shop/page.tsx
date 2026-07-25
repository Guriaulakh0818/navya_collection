import { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductSkeleton } from '@/features/products/components/ProductSkeleton';
import type { Product } from '@/features/products/types/product.types';

export const metadata: Metadata = {
  title: 'Shop | Navya Collection',
  description: 'Browse our complete catalog of affordable premium fashion.',
};

const mockProducts: Product[] = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  description: 'Premium quality product with excellent craftsmanship.',
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

export default function ShopPage() {
  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-navy">Shop All Products</h1>
          <p className="mt-2 text-sm text-slate-600">
            Discover our curated collection of premium fashion.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="font-heading text-xl text-navy mb-3">Categories</h2>
              <div className="space-y-2">
                {['Gents', 'Kids', 'New Arrivals', 'Offers'].map((cat) => (
                  <button
                    key={cat}
                    className="block w-full text-left text-sm text-slate-600 hover:text-navy"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-heading text-xl text-navy mb-3">Price Range</h2>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" className="w-full" />
                <Input type="number" placeholder="Max" className="w-full" />
              </div>
              <Button className="w-full mt-3 rounded-full" size="sm">
                Apply
              </Button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">{mockProducts.length} products</p>
              <select className="rounded-full border border-border px-4 py-2 text-sm text-slate-900">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
            <ProductGrid products={mockProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
