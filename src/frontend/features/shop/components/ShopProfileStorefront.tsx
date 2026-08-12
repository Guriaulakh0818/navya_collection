'use client';

import {
  Building2,
  ChevronRight,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function ShopProfileStorefront({
  shop,
  products: initialProducts,
  categories,
  relatedProducts,
}: {
  shop: any;
  products: any[];
  categories: any[];
  relatedProducts: any[];
}) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [activeTab, setActiveTab] = useState<'catalog' | 'policies' | 'contact'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  const owner = shop.owner || {};
  const profile = shop.sellerProfile || {};

  // Filter Catalog Fetcher
  const filterCatalog = async (q: string, cat: string, sort: string) => {
    setIsLoadingCatalog(true);
    try {
      const url = new URL('/api/v1/products', window.location.origin);
      url.searchParams.set('shopId', shop.id);
      if (q) url.searchParams.set('q', q);
      if (cat && cat !== 'all') url.searchParams.set('category', cat);
      if (sort) url.searchParams.set('sort', sort);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error('Failed to filter shop catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    filterCatalog(searchQuery, selectedCategory, sortOption);
  };

  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategory(catSlug);
    filterCatalog(searchQuery, catSlug, sortOption);
  };

  const handleSortChange = (newSort: string) => {
    setSortOption(newSort);
    filterCatalog(searchQuery, selectedCategory, newSort);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* 1. BREADCRUMBS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-navy flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/shop" className="hover:text-navy transition-colors">
            Marketplace Shops
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-amber-800 font-bold truncate">{shop.name}</span>
        </div>
      </div>

      {/* 2. STORE COVER BANNER */}
      <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-slate-100 border-b border-slate-200 overflow-hidden select-none">
        {shop.banner ? (
          <img
            src={shop.banner}
            alt={shop.name}
            className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-amber-500/10 via-orange/10 to-amber-500/10 flex items-center justify-center">
            <Store className="w-16 h-16 text-amber-600/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
      </div>

      {/* 3. STORE PROFILE HEADER OVERLAY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 border-2 border-amber-300 overflow-hidden shrink-0 flex items-center justify-center shadow-md select-none">
                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={shop.name}
                    className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-amber-600" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                    {shop.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {shop.verificationBadge || 'VERIFIED MERCHANT'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl line-clamp-2">
                  {shop.description ||
                    'Exclusive luxury Indian ethnic wear boutique partner on Navya Collection.'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-extrabold text-amber-700">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {shop.rating || 4.9} ({shop.reviewCount || 38} Reviews)
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {shop.city || profile.city || 'Hisar'},{' '}
                    {shop.state || profile.state || 'Haryana'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-mono font-bold">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    {products.length} Products Available
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <a
                href={`tel:${shop.phone || owner.mobile || ''}`}
                className="px-4 py-2.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-400" /> Call Boutique
              </a>
              <a
                href={`mailto:${shop.email || owner.email || ''}`}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" /> Inquiry Email
              </a>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex border-b border-slate-200 pt-2 gap-4 text-xs font-extrabold max-w-full overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'catalog'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Shop Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'policies'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              <Truck className="w-4 h-4" /> Shipping & Return Policies
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'contact'
                  ? 'border-amber-500 text-amber-800 font-black'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              <Building2 className="w-4 h-4" /> Contact & Warehouse Info
            </button>
          </div>
        </div>

        {/* 4. TAB CONTENT: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={`Search products in ${shop.name}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-navy focus:outline-none font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Category Pills & Sort */}
              <div className="flex items-center gap-3 overflow-x-auto">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-navy focus:outline-none font-extrabold cursor-pointer"
                >
                  <option value="newest">Sort: Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Category Filter Chips */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-navy text-white border-navy shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'bg-navy text-white border-navy shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {isLoadingCatalog ? (
              <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2 font-semibold text-xs">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                Filtering shop products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 bg-white rounded-3xl space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-sm text-slate-700">
                  No products found matching your search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden select-none">
                      {product.images?.[0]?.imageUrl ? (
                        <img
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none overflow-hidden [text-indent:-9999px]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Tag className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold text-navy shadow-xs border border-slate-100">
                        {product.category?.name || 'Couture'}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-navy transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{shop.name}</p>
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
            )}
          </div>
        )}

        {/* 5. TAB CONTENT: POLICIES */}
        {activeTab === 'policies' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              Boutique Shipping & Return Guarantee
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" /> Express Shipping Policy
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {shop.shippingPolicy ||
                    'Standard Express Pan-India Delivery via Shiprocket within 3-5 business days.'}
                </p>
              </div>

              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> 7-Day Return & Exchange Policy
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {shop.returnPolicy ||
                    '7-day easy return policy for unworn items with original boutique tags intact.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB CONTENT: CONTACT & WAREHOUSE */}
        {activeTab === 'contact' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Primary Warehouse Location & Contact Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Pickup Warehouse Address</h3>
                <p className="text-slate-700 font-semibold">
                  {shop.fullAddress || profile.businessAddress || 'Hisar, Haryana, India'}
                </p>
                <div className="flex gap-4 text-slate-500 pt-2 border-t border-slate-200">
                  <span>
                    City: <strong className="text-slate-900">{shop.city || profile.city}</strong>
                  </span>
                  <span>
                    State: <strong className="text-slate-900">{shop.state || profile.state}</strong>
                  </span>
                  <span>
                    Pincode:{' '}
                    <strong className="text-amber-800 font-mono font-bold">
                      {shop.pincode || profile.pincode}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Merchant Direct Support</h3>
                <div className="space-y-2 text-slate-600 font-medium">
                  <div>
                    Primary Phone:{' '}
                    <strong className="text-slate-900">
                      {shop.phone || owner.mobile || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    Support Email:{' '}
                    <strong className="text-slate-900">{shop.email || owner.email || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. RELATED MARKETPLACE RECOMMENDATIONS */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Explore Recommended Items From Other Boutiques
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.slug}`}
                  className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-navy hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {rel.images?.[0]?.imageUrl ? (
                      <img
                        src={rel.images[0].imageUrl}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold text-navy shadow-xs border border-slate-100">
                      {rel.shop?.name || 'Boutique'}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-navy transition-colors">
                        {rel.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rel.category?.name || 'Couture'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base font-black text-navy font-mono">
                        ₹{Number(rel.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-amber-700 font-extrabold group-hover:translate-x-1 transition-transform">
                        View Item →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
