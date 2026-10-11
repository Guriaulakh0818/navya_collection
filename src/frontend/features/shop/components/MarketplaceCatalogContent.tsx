'use client';

import {
  Building2,
  Filter,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MarketplaceCatalogContent() {
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
    const maxP = searchParams.get('maxPrice') || '';
    const minP = searchParams.get('minPrice') || '';
    const sort = searchParams.get('sort') || '';

    if (q) setSearchQuery(q);
    if (cat !== 'all') setSelectedCategory(cat);
    if (maxP) setMaxPrice(maxP);
    if (minP) setMinPrice(minP);
    if (sort) setSortBy(sort === 'rating' ? 'popular' : sort);
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
      !q ||
      prod.name.toLowerCase().includes(q) ||
      (prod.description && prod.description.toLowerCase().includes(q)) ||
      (prod.shop?.name && prod.shop.name.toLowerCase().includes(q));

    const catSlug = prod.category?.slug || '';
    const parentCatSlug = prod.category?.parent?.slug || '';
    const grandParentCatSlug = prod.category?.parent?.parent?.slug || '';
    const parentId = prod.category?.parentId || '';
    const grandParentId = prod.category?.parent?.parentId || '';

    const matchesCategory =
      selectedCategory === 'all' ||
      catSlug === selectedCategory ||
      prod.categoryId === selectedCategory ||
      parentCatSlug === selectedCategory ||
      parentId === selectedCategory ||
      grandParentCatSlug === selectedCategory ||
      grandParentId === selectedCategory ||
      (selectedCategory === 'men' &&
        (prod.gender?.toLowerCase() === 'men' ||
          catSlug.startsWith('men-') ||
          parentCatSlug === 'men' ||
          parentId === 'group_men')) ||
      (selectedCategory === 'women' &&
        (prod.gender?.toLowerCase() === 'women' ||
          catSlug.startsWith('women-') ||
          parentCatSlug === 'women' ||
          parentId === 'group_women')) ||
      (selectedCategory === 'kids' &&
        (prod.gender?.toLowerCase() === 'kids' ||
          catSlug.startsWith('kids-') ||
          catSlug.startsWith('baby-') ||
          catSlug.startsWith('boys-') ||
          catSlug.startsWith('girls-') ||
          parentCatSlug === 'kids' ||
          parentId === 'group_kids')) ||
      ((selectedCategory === 'men-kurtas' || selectedCategory === 'men-kurta-sets') &&
        (catSlug.includes('kurta') || prod.name?.toLowerCase().includes('kurta'))) ||
      ((selectedCategory === 'women-kurtas' || selectedCategory === 'women-kurta-sets') &&
        (catSlug.includes('kurt') || prod.name?.toLowerCase().includes('kurt'))) ||
      (selectedCategory === 'activewear' &&
        (catSlug.includes('active') ||
          catSlug.includes('track') ||
          prod.name?.toLowerCase().includes('track')));

    // Support URL search parameter filters (gender, occasion, style, filter)
    const genderParam = (searchParams.get('gender') || '').toLowerCase();
    const occasionParam = (searchParams.get('occasion') || '').toLowerCase();
    const styleParam = (searchParams.get('style') || '').toLowerCase();
    const filterParam = (searchParams.get('filter') || '').toLowerCase();

    let matchesGender = true;
    if (genderParam === 'men') {
      matchesGender =
        prod.gender?.toLowerCase() === 'men' ||
        prod.gender?.toLowerCase() === 'unisex' ||
        catSlug.startsWith('men-') ||
        parentCatSlug === 'men' ||
        parentId === 'group_men';
    } else if (genderParam === 'women') {
      matchesGender =
        prod.gender?.toLowerCase() === 'women' ||
        prod.gender?.toLowerCase() === 'unisex' ||
        catSlug.startsWith('women-') ||
        parentCatSlug === 'women' ||
        parentId === 'group_women';
    } else if (genderParam === 'kids') {
      matchesGender =
        prod.gender?.toLowerCase() === 'kids' ||
        catSlug.startsWith('kids-') ||
        catSlug.startsWith('baby-') ||
        catSlug.startsWith('boys-') ||
        catSlug.startsWith('girls-') ||
        parentId === 'group_kids';
    }

    let matchesCurated = true;
    if (occasionParam === 'festive' || occasionParam === 'wedding') {
      const pName = prod.name.toLowerCase();
      matchesCurated =
        pName.includes('saree') ||
        pName.includes('lehenga') ||
        pName.includes('kurta') ||
        pName.includes('kurti') ||
        pName.includes('suit') ||
        pName.includes('sherwani') ||
        catSlug.includes('ethnic') ||
        catSlug.includes('saree') ||
        catSlug.includes('lehenga');
    } else if (styleParam === 'streetwear' || styleParam === 'gen-z') {
      const pName = prod.name.toLowerCase();
      matchesCurated =
        pName.includes('t-shirt') ||
        pName.includes('oversized') ||
        pName.includes('jeans') ||
        pName.includes('cargo') ||
        pName.includes('hoodie') ||
        pName.includes('track') ||
        catSlug.includes('t-shirt') ||
        catSlug.includes('jeans');
    } else if (styleParam === 'korean') {
      const pName = prod.name.toLowerCase();
      matchesCurated =
        pName.includes('shirt') ||
        pName.includes('dress') ||
        pName.includes('top') ||
        pName.includes('denim');
    } else if (filterParam === 'best_seller') {
      matchesCurated = (prod.rating || 0) >= 4.0 || prod.isFeatured || (prod.reviewCount || 0) > 0;
    }

    const matchesShop =
      selectedShop === 'all' || prod.shopId === selectedShop || prod.shop?.slug === selectedShop;

    const matchesCity = selectedCity === 'all' || prod.shop?.city === selectedCity;

    const price = Number(prod.price || 0);
    const matchesMinPrice = !minPrice || price >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || price <= Number(maxPrice);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesGender &&
      matchesCurated &&
      matchesShop &&
      matchesCity &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  // Sort Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'popular') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Filter Shops
  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.state && s.state.toLowerCase().includes(q));

    const matchesCity = selectedCity === 'all' || s.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const availableCities = Array.from(new Set(shops.map((s) => s.city).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* 1. BREADCRUMBS & HERO BANNER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Marketplace Shops' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 space-y-4">
        <div className="bg-gradient-to-r from-navy via-navy/90 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg border border-navy/20">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Verified Boutique Marketplace
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Explore Boutique Shops & Designers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Discover authentic fashion creators and verified artisan shops across India. Shop
              exclusive collections directly from trusted partner storefronts.
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* 2. SEARCH & VIEW SWITCHER BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search products, boutiques, or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-navy focus:outline-none font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                onClick={() => setActiveView('products')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'products'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                All Products ({products.length})
              </button>
              <button
                onClick={() => setActiveView('shops')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'shops'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Partner Shops ({shops.length})
              </button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-navy focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* City Filter */}
            {availableCities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-navy focus:outline-none cursor-pointer"
              >
                <option value="all">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Filter (Products View Only) */}
            {activeView === 'products' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-navy focus:outline-none cursor-pointer ml-auto"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Customer Rating</option>
              </select>
            )}
          </div>
        </div>

        {/* 3. CATALOG CONTENT: PRODUCTS VIEW */}
        {activeView === 'products' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-80 bg-slate-200 rounded-3xl animate-pulse border border-slate-300/60"
                  />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {sortedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden select-none">
                      {product.images?.[0]?.imageUrl ? (
                        <Image
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-12 h-12" />
                        </div>
                      )}

                      {product.category?.name && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold text-navy shadow-xs border border-slate-100">
                          {product.category.name}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-navy transition-colors">
                          {product.name}
                        </h3>
                        {product.shop?.name && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{product.shop.name}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-base font-black text-navy font-mono">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-amber-700 font-extrabold group-hover:translate-x-1 transition-transform">
                          Buy Now →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No products found matching your filters
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search filters or selecting another category.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. CATALOG CONTENT: SHOPS VIEW */}
        {activeView === 'shops' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-slate-200 rounded-3xl animate-pulse border border-slate-300/60"
                  />
                ))}
              </div>
            ) : filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop, index) => {
                  const productCount =
                    shop._count?.products ||
                    products.filter((p) => p.shopId === shop.id).length ||
                    0;

                  const isNavya =
                    shop.slug === 'navya-collection' || shop.name?.toLowerCase().includes('navya');
                  const shopLogo = isNavya ? '/images/navya-logo.png' : shop.logo;

                  return (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.slug}`}
                      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-amber-500 hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      {/* Cover Banner - Permanently Style That Speaks */}
                      <div className="h-32 bg-slate-100 relative overflow-hidden">
                        <Image
                          src="/images/default-shop-banner.png"
                          alt="Style That Speaks - Navya Collection"
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
                            {shopLogo ? (
                              <Image
                                src={shopLogo}
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
                          {shop.rating &&
                          shop.rating > 0 &&
                          shop.reviewCount &&
                          shop.reviewCount > 0 ? (
                            <span className="flex items-center gap-1 font-semibold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {Number(shop.rating).toFixed(1)} ({shop.reviewCount})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">New Store</span>
                          )}

                          {shop.city || shop.state ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {[shop.city, shop.state].filter(Boolean).join(', ')}
                            </span>
                          ) : null}

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
