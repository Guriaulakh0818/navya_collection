'use client';

import { Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import type { Product } from '@/features/products/types/product.types';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Royal Navy Shirt',
    slug: 'classic-royal-navy-shirt',
    sku: 'NC-SHIRT-001',
    description: '100% Breathable Egyptian Cotton Slim Fit Shirt.',
    price: 899,
    compareAtPrice: 1399,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
        alt: 'Shirt',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents Collection', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 25,
    rating: 4.8,
    reviewCount: 142,
  },
  {
    id: '2',
    name: 'Kids Festive Kurta Set',
    slug: 'kids-festive-kurta-set',
    sku: 'NC-KIDS-002',
    description: 'Soft Jacquard Kurta Set with ethnic vest.',
    price: 749,
    compareAtPrice: 1099,
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
        alt: 'Kids Kurta',
        isPrimary: true,
      },
    ],
    category: { id: '2', name: 'Kids Wear', slug: 'kids' },
    categoryId: '2',
    status: 'active',
    stock: 18,
    rating: 4.9,
    reviewCount: 88,
  },
  {
    id: '3',
    name: 'Handcrafted Silk Ethnic Kurta',
    slug: 'handcrafted-silk-kurta',
    sku: 'NC-GENTS-003',
    description: 'Silk blend handcrafted kurta with mandarin collar.',
    price: 1499,
    compareAtPrice: 2199,
    images: [
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        alt: 'Kurta',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents Collection', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 12,
    rating: 4.7,
    reviewCount: 95,
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryName, setCategoryName] = useState('Gents Collection');
  const [imageUrl, setImageUrl] = useState('');

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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price) {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        sku: `NC-PROD-${Math.floor(100 + Math.random() * 900)}`,
        description: 'New product added by admin.',
        price: Number(price),
        images: imageUrl ? [{ id: '1', url: imageUrl, isPrimary: true }] : [],
        category: {
          id: '1',
          name: categoryName,
          slug: categoryName.toLowerCase().includes('kids') ? 'kids' : 'gents',
        },
        categoryId: '1',
        status: 'active',
        stock: Number(stock) || 10,
        rating: 5.0,
        reviewCount: 0,
      };

      setProducts([newProd, ...products]);
      setName('');
      setPrice('');
      setStock('');
      setImageUrl('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage active listings, inventory, and status
          </p>
        </div>
        <Button
          className="rounded-full bg-navy hover:bg-navy-hover text-xs font-bold gap-2"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full text-xs pl-10"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-slate-400 font-bold tracking-wider">
                <th className="pb-3 font-semibold">Product Info</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                          No img
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 font-medium text-slate-600">{product.category?.name}</td>
                  <td className="py-3.5 font-bold text-navy">
                    ₹{product.price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-700">{product.stock} units</td>
                  <td className="py-3.5">
                    <Badge
                      className={
                        product.status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-[11px] h-7"
                        onClick={() => handleToggleStatus(product.id)}
                      >
                        {product.status === 'active' ? 'Draft' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-rose-600 hover:text-rose-700 h-7"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Product Drawer */}
      <Drawer
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="Create New Product"
        side="right"
      >
        <form onSubmit={handleAddProduct} className="space-y-4 p-2 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Product Title</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Linen Cotton Shirt"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="899"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="20"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-700"
            >
              <option value="Gents Collection">Gents Collection</option>
              <option value="Kids Wear">Kids Wear</option>
              <option value="New Season 2026">New Season 2026</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Product Image URL</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full rounded-full bg-navy text-xs font-bold mt-4">
            Save Product to Catalog
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
