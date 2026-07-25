'use client';

import { Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { DEFAULT_PAGE_SIZE, SORT_OPTIONS } from '@/features/products/constants/product.constants';
import type { Product } from '@/features/products/types/product.types';

const imageUrls = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
];

const allProducts: Product[] = Array.from({ length: 36 }).map((_, i) => {
  const catIdx = i % 4;
  const catNames = ['Gents', 'Kids', 'New Arrivals', 'Offers'];
  const catSlugs = ['gents', 'kids', 'new', 'offers'];
  const names = [
    'Classic Royal Navy Cotton Shirt',
    'Kids Festive Kurta Pyjama Set',
    'Handcrafted Silk Ethnic Kurta',
    'Slim Fit Stretch Cotton Chinos',
    'Italian Fit Formal Blazer',
    'Boys Bio-Washed Graphic T-Shirt',
    'Linen Blend Casual Shirt',
    'Girls Floral Summer Party Dress',
  ];

  return {
    id: String(i + 1),
    name: `${names[i % names.length]} ${i > 7 ? `#${i + 1}` : ''}`.trim(),
    slug: `product-${i + 1}`,
    sku: `NC-PROD-${String(i + 1).padStart(3, '0')}`,
    description: 'Crafted with premium cotton fabric, tailored for elegance and lasting comfort.',
    price: 699 + (i % 8) * 250,
    compareAtPrice: 1199 + (i % 8) * 350,
    images: [
      {
        id: `img-${i}`,
        url: imageUrls[i % imageUrls.length],
        alt: names[i % names.length],
        isPrimary: true,
      },
    ],
    category: {
      id: String(catIdx + 1),
      name: catNames[catIdx],
      slug: catSlugs[catIdx],
    },
    categoryId: String(catIdx + 1),
    status: 'active',
    stock: 15,
    rating: 4.5 + (i % 5) * 0.1,
    reviewCount: 24 + i * 7,
    isNewArrival: i % 3 === 0,
  };
});

const categories = [
  { id: '1', name: 'Gents Collection', slug: 'gents' },
  { id: '2', name: 'Kids Wear', slug: 'kids' },
  { id: '3', name: 'New Season 2026', slug: 'new' },
  { id: '4', name: 'Special Offers', slug: 'offers' },
];

const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
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
    if (!Number.isNaN(min) && priceRange.min !== '') result = result.filter((p) => p.price >= min);
    if (!Number.isNaN(max) && priceRange.max !== '') result = result.filter((p) => p.price <= max);

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
    setSelectedSize(null);
    setSort('newest');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedSize || priceRange.min || priceRange.max || search,
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Shop Catalog' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-4">
        {/* Page Header */}
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-navy text-white relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-orange">
              Premium Fashion
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mt-1">
              Explore Navya Collection
            </h1>
            <p className="mt-2 text-xs md:text-sm text-white/80">
              Browse our complete range of Gents & Kids clothing. Affordable luxury delivered
              pan-India.
            </p>
          </div>
        </div>

        {/* Mobile filter bar */}
        <div className="mb-6 flex items-center justify-between lg:hidden gap-3">
          <Button
            variant="outline"
            className="rounded-full flex-1"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4 text-orange" /> Filters {hasActiveFilters && '(Active)'}
          </Button>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-heading text-lg font-bold text-navy">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-orange hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-between w-full text-left text-xs font-semibold py-1.5 px-3 rounded-xl transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-navy text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                    className={`h-9 w-9 rounded-full text-xs font-bold border transition-all ${
                      selectedSize === sz
                        ? 'border-navy bg-navy text-white'
                        : 'border-slate-200 text-slate-700 hover:border-navy'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Price (₹)
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                  className="rounded-xl text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {/* Header controls & active filter badges */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-600">
                  Showing {filtered.length} products
                </p>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 bg-navy/10 text-navy text-xs font-semibold px-2.5 py-1 rounded-full">
                    {categories.find((c) => c.slug === selectedCategory)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedCategory(null)}
                    />
                  </span>
                )}
                {selectedSize && (
                  <span className="inline-flex items-center gap-1 bg-orange/10 text-orange text-xs font-semibold px-2.5 py-1 rounded-full">
                    Size: {selectedSize}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSize(null)} />
                  </span>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
                <p className="text-base font-semibold text-slate-700">
                  No products match your filters.
                </p>
                <Button className="mt-4 rounded-full bg-navy" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                <ProductGrid products={paginated} />
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
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

      {/* Mobile Drawer */}
      <Drawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Products"
        side="left"
      >
        <div className="space-y-6 p-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
              Categories
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug);
                    setCurrentPage(1);
                  }}
                  className={`block w-full text-left text-xs font-semibold py-2 px-3 rounded-xl ${
                    selectedCategory === cat.slug
                      ? 'bg-navy text-white'
                      : 'text-slate-700 bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 rounded-full bg-orange"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply Filters
            </Button>
            <Button className="flex-1 rounded-full" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
