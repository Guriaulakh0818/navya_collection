'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Product } from '@/features/products/types/product.types';

const MOCK_PRODUCTS: Product[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  description: 'Premium quality product.',
  price: 599 + i * 100,
  compareAtPrice: [1199, 1499, 1799, 1999][i % 4],
  images: [],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: i % 3 === 0 ? 'draft' : 'active',
  stock: 10 + i,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 20 + i * 5,
}));

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'draft' : 'active' } : p,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-navy">Products</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <Button className="rounded-full" onClick={() => setIsAdding(true)}>
          Add Product
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-semibold text-navy">Name</th>
                <th className="pb-3 font-semibold text-navy">Category</th>
                <th className="pb-3 font-semibold text-navy">Price</th>
                <th className="pb-3 font-semibold text-navy">Stock</th>
                <th className="pb-3 font-semibold text-navy">Status</th>
                <th className="pb-3 font-semibold text-navy text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="py-4">
                    <div>
                      <p className="font-semibold text-navy">{product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {product.slug}</p>
                    </div>
                  </td>
                  <td className="py-4">{product.category.name}</td>
                  <td className="py-4">₹{product.price.toLocaleString('en-IN')}</td>
                  <td className="py-4">{product.stock}</td>
                  <td className="py-4">
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleToggleStatus(product.id)}
                      >
                        {product.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-error hover:text-error"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
