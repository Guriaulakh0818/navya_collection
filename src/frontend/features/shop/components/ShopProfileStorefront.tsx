'use client';

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  Filter,
  Globe,
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

interface ShopProfileStorefrontProps {
  initialData: any;
  slug: string;
}

export function ShopProfileStorefront({ initialData, slug }: ShopProfileStorefrontProps) {
  const [data, setData] = useState<any>(initialData);
  const [activeTab, setActiveTab] = useState<'catalog' | 'policies' | 'contact'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const shop = data?.shop || initialData?.shop || {};
  const profile = shop.sellerProfile || {};
  const owner = shop.owner || {};
  const products = data?.products || [];
  const categories = data?.categories || [];
  const relatedProducts = data?.relatedProducts || [];

  // Filter Catalog Fetcher
  const filterCatalog = async (q: string, cat: string, sort: string) => {
    setIsLoadingCatalog(true);
    try {
      const url = new URL(`/api/v1/shop/${slug}`, window.location.origin);
      if (q) url.searchParams.set('q', q);
      if (cat !== 'all') url.searchParams.set('category', cat);
      if (sort) url.searchParams.set('sort', sort);

      const res = await fetch(url.toString());
      const result = await res.json();
      if (result.success) {
        setData(result.data);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* 1. BREADCRUMBS NAVIGATION */}
      <div className="bg-slate-900/80 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link href="/shop" className="hover:text-amber-400 transition-colors">
            Marketplace Shops
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-semibold truncate">{shop.name}</span>
        </div>
      </div>

      {/* 2. STORE COVER BANNER */}
      <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-slate-900 border-b border-slate-800 overflow-hidden">
        {shop.banner ? (
          <img src={shop.banner} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
            <Store className="w-16 h-16 text-amber-500/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* 3. STORE PROFILE HEADER OVERLAY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10 space-y-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border-2 border-amber-500/40 overflow-hidden shrink-0 flex items-center justify-center shadow-xl">
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-amber-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {shop.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {shop.verificationBadge || 'VERIFIED MERCHANT'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl line-clamp-2">
                  {shop.description ||
                    'Exclusive luxury Indian ethnic wear boutique partner on Navya Collection.'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {shop.rating || 4.9} ({shop.reviewCount || 38} Reviews)
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {shop.city || profile.city || 'Hisar'},{' '}
                    {shop.state || profile.state || 'Haryana'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-mono">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    {products.length} Products Available
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <a
                href={`tel:${shop.phone || owner.mobile || ''}`}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4 text-amber-400" /> Call Boutique
              </a>
              <a
                href={`mailto:${shop.email || owner.email || ''}`}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" /> Inquiry Email
              </a>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex border-b border-slate-800 pt-2 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Shop Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'policies'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> Shipping & Return Policies
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'contact'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white'
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={`Search products in ${shop.name}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                >
                  Search
                </button>
              </form>

              {/* Category Pills & Sort */}
              <div className="flex items-center gap-3 overflow-x-auto">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      selectedCategory === cat.slug
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {isLoadingCatalog ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Filtering shop products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-sm">
                  No products found matching your search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col shadow-lg"
                  >
                    <div className="aspect-[3/4] bg-slate-950 relative overflow-hidden">
                      {product.images?.[0]?.imageUrl ? (
                        <img
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Tag className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-400 border border-slate-800">
                        {product.category?.name || 'Couture'}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{shop.name}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-base font-extrabold text-amber-400 font-mono">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition-transform">
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Boutique Shipping & Return Guarantee
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" /> Express Shipping Policy
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {shop.shippingPolicy ||
                    'Standard Express Pan-India Delivery via Shiprocket within 3-5 business days.'}
                </p>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> 7-Day Return & Exchange Policy
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {shop.returnPolicy ||
                    '7-day easy return policy for unworn items with original boutique tags intact.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB CONTENT: CONTACT & WAREHOUSE */}
        {activeTab === 'contact' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Primary Warehouse Location & Contact Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">Pickup Warehouse Address</h3>
                <p className="text-slate-300">
                  {shop.fullAddress || profile.businessAddress || 'Hisar, Haryana, India'}
                </p>
                <div className="flex gap-4 text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    City: <strong className="text-white">{shop.city || profile.city}</strong>
                  </span>
                  <span>
                    State: <strong className="text-white">{shop.state || profile.state}</strong>
                  </span>
                  <span>
                    Pincode:{' '}
                    <strong className="text-amber-300 font-mono">
                      {shop.pincode || profile.pincode}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">Merchant Direct Support</h3>
                <div className="space-y-2 text-slate-300">
                  <div>
                    Primary Phone:{' '}
                    <strong className="text-white">{shop.phone || owner.mobile || 'N/A'}</strong>
                  </div>
                  <div>
                    Support Email:{' '}
                    <strong className="text-white">{shop.email || owner.email || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. RELATED MARKETPLACE RECOMMENDATIONS */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Explore Recommended Items From Other Boutiques
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.slug}`}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col shadow-lg"
                >
                  <div className="aspect-[3/4] bg-slate-950 relative overflow-hidden">
                    {rel.images?.[0]?.imageUrl ? (
                      <img
                        src={rel.images[0].imageUrl}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-400 border border-slate-800">
                      {rel.shop?.name || 'Boutique'}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {rel.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {rel.category?.name || 'Couture'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-base font-extrabold text-amber-400 font-mono">
                        ₹{Number(rel.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-amber-300 font-semibold">View Item →</span>
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
