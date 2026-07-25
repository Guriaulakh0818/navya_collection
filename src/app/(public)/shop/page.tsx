'use client';

import { Filter } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { DEFAULT_PAGE_SIZE, SORT_OPTIONS } from '@/features/products/constants/product.constants';
import type { Product } from '@/features/products/types/product.types';

const allProducts: Product[] = Array.from({ length: 48 }).map((_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  description: 'Premium quality product with excellent craftsmanship.',
  price: 899 + (i % 12) * 100,
  compareAtPrice: [1299, 1499, 1799, 1999][i % 4],
  images: [],
  category: {
    id: String((i % 4) + 1),
    name: ['Gents', 'Kids', 'New Arrivals', 'Offers'][i % 4],
    slug: ['gents', 'kids', 'new', 'offers'][i % 4],
  },
  categoryId: String((i % 4) + 1),
  status: 'active',
  stock: 10,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 20 + i * 5,
}));

const categories = [
  { id: '1', name: 'Gents', slug: 'gents' },
  { id: '2', name: 'Kids', slug: 'kids' },
  { id: '3', name: 'New Arrivals', slug: 'new' },
  { id: '4', name: 'Offers', slug: 'offers' },
];

export default function ShopPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }

    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.categoryId === cat.id);
    }

    const min = Number(priceRange.min);
    const max = Number(priceRange.max);
    if (!Number.isNaN(min)) result = result.filter((p) => p.price >= min);
    if (!Number.isNaN(max)) result = result.filter((p) => p.price <= max);

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        break;
    }

    return result;
  }, [search, selectedCategory, sort, priceRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DEFAULT_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * DEFAULT_PAGE_SIZE,
    safePage * DEFAULT_PAGE_SIZE,
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSort('newest');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

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

        {/* Mobile filter bar */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <Button variant="outline" className="rounded-full" onClick={() => setIsFilterOpen(true)}>
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-full border border-border px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div>
              <h2 className="font-heading text-xl text-navy mb-3">Categories</h2>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug);
                      setCurrentPage(1);
                    }}
                    className={`block w-full text-left text-sm ${selectedCategory === cat.slug ? 'text-navy font-semibold' : 'text-slate-600 hover:text-navy'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-heading text-xl text-navy mb-3">Price Range</h2>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button
                className="w-full mt-3 rounded-full"
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                Apply
              </Button>
            </div>
          </aside>

          {/* Product area */}
          <div className="lg:col-span-3">
            <div className="mb-4 hidden md:flex items-center justify-between">
              <p className="text-sm text-slate-600">{filtered.length} products</p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-full border border-border px-4 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <ProductGrid products={[]} loading />
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-lg text-slate-600">{error}</p>
                <Button className="mt-4 rounded-full" onClick={() => setError(null)}>
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-slate-600">No products found.</p>
                <Button className="mt-4 rounded-full" variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <ProductGrid products={paginated} />
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      page={safePage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filters"
        side="left"
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-xl text-navy mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug);
                    setCurrentPage(1);
                  }}
                  className={`block w-full text-left text-sm ${selectedCategory === cat.slug ? 'text-navy font-semibold' : 'text-slate-600 hover:text-navy'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-xl text-navy mb-3">Price Range</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                className="w-full"
              />
            </div>
            <Button
              className="w-full mt-3 rounded-full"
              size="sm"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply
            </Button>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              className="flex-1 rounded-full"
              variant="outline"
              onClick={() => setIsFilterOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
