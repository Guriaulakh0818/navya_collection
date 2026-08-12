'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Home,
  Search,
  ShoppingBag,
  Star,
  Tag,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function MarketplaceSearchResults({
  initialQuery = '',
  initialCategory = 'all',
}: {
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'products' | 'shops'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>('relevance');
  const [page, setPage] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/search', window.location.origin);
      if (query) url.searchParams.set('q', query);
      url.searchParams.set('type', activeType);
      if (selectedCategory && selectedCategory !== 'all') {
        url.searchParams.set('category', selectedCategory);
      }
      if (minPrice > 0) url.searchParams.set('minPrice', String(minPrice));
      if (maxPrice < 50000) url.searchParams.set('maxPrice', String(maxPrice));
      if (minRating > 0) url.searchParams.set('minRating', String(minRating));
      if (sortOption) url.searchParams.set('sort', sortOption);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '12');

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setShops(json.data.shops || []);
        if (json.data.pagination) setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error('Unified search fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeType, selectedCategory, minPrice, maxPrice, minRating, sortOption, page]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    executeSearch();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* 1. BREADCRUMBS */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-navy flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-amber-800 font-extrabold">Marketplace Search</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. SEARCH HEADER & INPUT BAR */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search products, boutiques, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-navy focus:outline-none font-medium shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Entity Tabs */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-extrabold pt-2">
            <button
              onClick={() => {
                setActiveType('all');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeType === 'all'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => {
                setActiveType('products');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeType === 'products'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              Products ({pagination.total})
            </button>
            <button
              onClick={() => {
                setActiveType('shops');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeType === 'shops'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              Shops & Stores ({shops.length})
            </button>
          </div>
        </div>

        {/* 3. MAIN LAYOUT: SIDEBAR FILTERS + RESULTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR FILTERS */}
          <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-navy text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600 shrink-0" /> Filter Results
              </h3>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setMinPrice(0);
                  setMaxPrice(50000);
                  setMinRating(0);
                  setSortOption('relevance');
                }}
                className="text-[11px] font-extrabold text-rose-600 hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Price Filter */}
            <div className="space-y-3 text-xs">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                Price Range (₹)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono font-bold text-xs focus:border-navy focus:outline-none"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice === 50000 ? '' : maxPrice}
                  onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 50000)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono font-bold text-xs focus:border-navy focus:outline-none"
                />
              </div>
              <button
                onClick={executeSearch}
                className="w-full py-2 bg-navy hover:bg-navy/90 text-white rounded-xl font-extrabold text-[11px] transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Apply Price Filter
              </button>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                Customer Rating
              </span>
              {[
                { label: 'All Ratings', value: 0 },
                { label: '4.0★ & Above', value: 4 },
                { label: '3.0★ & Above', value: 3 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setMinRating(r.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                    minRating === r.value
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.value > 0 && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                Sort Order
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-extrabold focus:border-navy focus:outline-none cursor-pointer"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* RESULTS GRID AREA */}
          <div className="lg:col-span-3 space-y-8">
            {isLoading ? (
              <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-3xl font-semibold text-xs">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                Executing unified search...
              </div>
            ) : products.length === 0 && shops.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl space-y-2">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-extrabold text-slate-800 text-sm">
                  No products or boutiques found matching &quot;{query}&quot;.
                </p>
                <p className="text-xs text-slate-500">
                  Try adjusting your keyword, price range, or category filter.
                </p>
              </div>
            ) : (
              <>
                {/* SHOPS RESULTS */}
                {shops.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-navy text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0" /> Boutique Stores (
                      {shops.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {shops.map((shop: any) => (
                        <Link
                          key={shop.id}
                          href={`/shop/${shop.slug}`}
                          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-navy hover:shadow-md transition-all flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 overflow-hidden shrink-0 flex items-center justify-center text-amber-700 relative">
                            {shop.logo ? (
                              <Image
                                src={shop.logo}
                                alt={shop.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-navy transition-colors truncate">
                              {shop.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 block font-medium">
                              {shop.city || 'Hisar'}, {shop.state || 'HR'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRODUCTS RESULTS */}
                {products.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-navy text-base flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" /> Products (
                      {pagination.total})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-xl transition-all flex flex-col justify-between"
                        >
                          <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                            {p.images?.[0]?.imageUrl ? (
                              <Image
                                src={p.images[0].imageUrl}
                                alt={p.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Tag className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold text-navy shadow-xs border border-slate-100">
                              {p.shop?.name || 'Boutique'}
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-navy transition-colors">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {p.category?.name || 'Couture'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-base font-black text-navy font-mono">
                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-amber-700 font-extrabold group-hover:translate-x-1 transition-transform">
                                View Item →
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGINATION */}
                {pagination.pages > 1 && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-xs">
                    <span>
                      Page <strong>{page}</strong> of <strong>{pagination.pages}</strong> (
                      {pagination.total} Total Results)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 rounded-xl disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 rounded-xl disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
