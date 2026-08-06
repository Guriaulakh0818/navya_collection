'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function MarketplaceSearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'products' | 'shops'>('all');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [minRating, setMinRating] = useState(0);
  const [sortOption, setSortOption] = useState('relevance');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/search', window.location.origin);
      if (query) url.searchParams.set('q', query);
      url.searchParams.set('type', activeType);
      if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);
      if (minPrice > 0) url.searchParams.set('minPrice', String(minPrice));
      if (maxPrice < 50000) url.searchParams.set('maxPrice', String(maxPrice));
      if (minRating > 0) url.searchParams.set('minRating', String(minRating));
      url.searchParams.set('sort', sortOption);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '12');

      const res = await fetch(url.toString());
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Search execution failed:', err);
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

  const products = data?.products || [];
  const shops = data?.shops || [];
  const categories = data?.categories || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* 1. BREADCRUMBS */}
      <div className="bg-slate-900/80 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-semibold">Marketplace Search</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. SEARCH HEADER & INPUT BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search products, boutiques, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              Search
            </button>
          </form>

          {/* Entity Tabs */}
          <div className="flex border-b border-slate-800 gap-4 text-xs font-bold pt-2">
            <button
              onClick={() => {
                setActiveType('all');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all ${
                activeType === 'all'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => {
                setActiveType('products');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all ${
                activeType === 'products'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Products ({pagination.total})
            </button>
            <button
              onClick={() => {
                setActiveType('shops');
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all ${
                activeType === 'shops'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Shops & Stores ({shops.length})
            </button>
          </div>
        </div>

        {/* 3. MAIN LAYOUT: SIDEBAR FILTERS + RESULTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR FILTERS */}
          <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" /> Filter Results
              </h3>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setMinPrice(0);
                  setMaxPrice(50000);
                  setMinRating(0);
                  setSortOption('relevance');
                }}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Price Filter */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Price Range (₹)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice === 50000 ? '' : maxPrice}
                  onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 50000)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                />
              </div>
              <button
                onClick={executeSearch}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-[11px] transition-all"
              >
                Apply Price Filter
              </button>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
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
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border ${
                    minRating === r.value
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.value > 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Sort Order
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold focus:border-amber-500 focus:outline-none"
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
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-3xl">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Executing unified search...
              </div>
            ) : products.length === 0 && shops.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-sm">
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
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" /> Boutique Stores (
                      {shops.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {shops.map((shop: any) => (
                        <Link
                          key={shop.id}
                          href={`/shop/${shop.slug}`}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-500/40 transition-all flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-amber-400 relative">
                            {shop.logo ? (
                              <Image
                                src={shop.logo}
                                alt={shop.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Building2 className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors truncate">
                              {shop.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 block">
                              {shop.city || 'Hisar'}, {shop.state || 'HR'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRODUCTS RESULTS */}
                {products.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-400" /> Products (
                      {pagination.total})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col shadow-lg"
                        >
                          <div className="aspect-[3/4] bg-slate-950 relative overflow-hidden">
                            {p.images?.[0]?.imageUrl ? (
                              <Image
                                src={p.images[0].imageUrl}
                                alt={p.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-700">
                                <Tag className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-400 border border-slate-800">
                              {p.shop?.name || 'Boutique'}
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                                {p.name}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {p.category?.name || 'Couture'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                              <span className="text-base font-extrabold text-amber-400 font-mono">
                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition-transform">
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
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Page <strong>{page}</strong> of <strong>{pagination.pages}</strong> (
                      {pagination.total} Total Results)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg disabled:opacity-50 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg disabled:opacity-50 flex items-center gap-1"
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
