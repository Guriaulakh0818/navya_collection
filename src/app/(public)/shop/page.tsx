'use client';

import {
  Building2,
  Filter,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  X,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function MarketplaceCatalogContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<'products' | 'shops'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Prevent hydration mismatch by confirming client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Sync search query & view state from URL parameters
  useEffect(() => {
    if (!isMounted) return;
    const q = searchParams.get('q') || searchParams.get('search') || '';
    const cat = searchParams.get('category') || 'all';
    const view = searchParams.get('view') || searchParams.get('tab');
    if (q) setSearchQuery(q);
    if (cat !== 'all') setSelectedCategory(cat);
    if (view === 'shops' || view === 'shops-grid' || view === 'shops_grid') {
      setActiveView('shops');
    } else if (view === 'products') {
      setActiveView('products');
    }
  }, [searchParams, isMounted]);

  // 3. Fetch Marketplace Shops, Products & Categories
  useEffect(() => {
    if (!isMounted) return;
    setIsLoading(true);
    fetch('/api/v1/marketplace/catalog')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          const fetchedShops = resData.data.shops || [];
          const fetchedProducts = resData.data.products || [];

          setShops(fetchedShops);
          setProducts(fetchedProducts);
          setCategories(resData.data.categories || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load marketplace catalog data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Filter Products
  const filteredProducts = products.filter((prod) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      prod.name.toLowerCase().includes(q) ||
      (prod.shop?.name && prod.shop.name.toLowerCase().includes(q)) ||
      (prod.category?.name && prod.category.name.toLowerCase().includes(q));

    const matchesCat =
      selectedCategory === 'all' ||
      prod.categoryId === selectedCategory ||
      prod.category?.id === selectedCategory ||
      prod.category?.slug === selectedCategory;

    const matchesShop =
      selectedShop === 'all' ||
      prod.shopId === selectedShop ||
      prod.shop?.id === selectedShop ||
      prod.shop?.slug === selectedShop;

    const pPrice = Number(prod.price || 0);
    const minP = minPrice !== '' ? Number(minPrice) : 0;
    const maxP = maxPrice !== '' ? Number(maxPrice) : Infinity;
    const matchesPrice = pPrice >= minP && pPrice <= maxP;

    return matchesSearch && matchesCat && matchesShop && matchesPrice;
  });

  // Sort Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
    return 0; // Default newest
  });

  // Filter Shops
  const filteredShops = shops.filter((shop) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      shop.name.toLowerCase().includes(q) ||
      (shop.city && shop.city.toLowerCase().includes(q)) ||
      (shop.state && shop.state.toLowerCase().includes(q));

    const matchesCity =
      selectedCity === 'all' ||
      (shop.city && shop.city.toLowerCase() === selectedCity.toLowerCase());

    return matchesSearch && matchesCity;
  });

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedShop('all');
    setSelectedCity('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedShop !== 'all' ||
    selectedCity !== 'all' ||
    minPrice ||
    maxPrice,
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: activeView === 'shops' ? 'Featured & Verified Shops' : 'Marketplace Catalogue' },
        ]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HERO HEADER */}
        <div className="relative rounded-3xl bg-gradient-to-r from-navy via-slate-900 to-navy text-white p-8 sm:p-10 shadow-xl overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Pan-India Multi-Vendor Marketplace
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {activeView === 'shops'
                ? 'Featured & Verified Merchant Shops'
                : 'Marketplace Store Catalogue'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {activeView === 'shops'
                ? 'Discover handcrafted luxury boutiques, verified merchant stores, and exclusive fashion collections.'
                : 'Explore thousands of designer sarees, bridal lehengas, suits, gents & kids wear from verified local shops and boutiques across India.'}
            </p>
          </div>

          <Store className="w-64 h-64 text-white/5 absolute -right-10 -bottom-10 pointer-events-none" />
        </div>

        {/* TOP CONTROL BAR: SEARCH, VIEW SWITCHER & SORT */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
              <button
                onClick={() => setActiveView('products')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'products'
                    ? 'bg-navy text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products Catalogue ({sortedProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveView('shops')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'shops'
                    ? 'bg-navy text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Verified Shops ({filteredShops.length})</span>
              </button>
            </div>

            {/* Live Search */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={
                  activeView === 'products'
                    ? 'Search products by title, category or shop...'
                    : 'Search shops by store name or city...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-2xl bg-slate-50 border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>
        </div>

        {/* MAIN CATALOGUE CONTENT WITH SIDEBAR */}
        {activeView === 'products' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* SIDEBAR FILTERS */}
            <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-navy text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-600" /> Catalog Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Filter 1: Shop / Seller */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Filter By Shop
                </label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-2.5 focus:border-navy focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Verified Shops ({shops.length})</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Category */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-2.5 focus:border-navy focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Price Range */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Price Range (₹)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="bg-slate-50 text-xs rounded-xl h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="bg-slate-50 text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              {/* Filter 4: Sort */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-2.5 focus:border-navy focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Catalogue Items ({sortedProducts.length})
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-slate-200 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {sortedProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                        {p.images && p.images[0]?.imageUrl ? (
                          <Image
                            src={p.images[0].imageUrl}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs p-4 text-center">
                            {p.name}
                          </div>
                        )}

                        {p.shop?.name && (
                          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-navy shadow-xs border border-slate-100">
                            by {p.shop.name}
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-navy transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-navy">
                              ₹{Number(p.price).toLocaleString('en-IN')}
                            </span>
                            {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{Number(p.compareAtPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            In Stock
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">
                    No products match active filters
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your category, price range, or shop filters.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs font-bold border-slate-300"
                    onClick={resetAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SHOPS GRID VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-navy tracking-tight flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                Verified Merchant Shops ({filteredShops.length})
              </h2>
            </div>

            {filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop, index) => {
                  const productCount = shop._count?.products || 0;

                  return (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.slug}`}
                      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-2xl transition-all shadow-sm flex flex-col justify-between"
                    >
                      {/* Cover Banner */}
                      <div className="h-32 bg-slate-900 relative overflow-hidden">
                        <Image
                          src="/images/default-shop-banner.png"
                          alt={shop.name}
                          fill
                          priority={index < 2}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                      </div>

                      {/* Profile Overlay & Info */}
                      <div className="p-6 -mt-10 relative z-10 space-y-4">
                        <div className="flex items-end justify-between gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-500/40 overflow-hidden shrink-0 relative flex items-center justify-center shadow-lg">
                            {shop.logo ? (
                              <Image
                                src={shop.logo}
                                alt={shop.name}
                                fill
                                sizes="64px"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-8 h-8 text-amber-600" />
                            )}
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            VERIFIED SHOP
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-navy text-base group-hover:text-amber-600 transition-colors line-clamp-1">
                            {shop.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {shop.rating || 4.9} ({shop.reviewCount || 38})
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {shop.city || 'Hisar'}, {shop.state || 'HR'}
                          </span>

                          <span className="flex items-center gap-1 font-bold text-slate-900">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                            {productCount} Items
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                <Store className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No shops found matching your search
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching for another store or city.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceShopsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-12 text-center text-slate-500 font-bold text-xs">
          Loading Marketplace Stores...
        </div>
      }
    >
      <MarketplaceCatalogContent />
    </Suspense>
  );
}
