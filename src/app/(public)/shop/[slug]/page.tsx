'use client';

import {
  Building2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PhoneCall,
  Search,
  Send,
  Share2,
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

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BoutiqueShopStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [resolvedSlug, setResolvedSlug] = useState<string>('');
  const [shopData, setShopData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Contact Modal State & Validation
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryErrors, setInquiryErrors] = useState<{
    name?: string;
    phone?: string;
    message?: string;
  }>({});
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Resolved Contact Info (Guaranteed Active Options for All Merchants)
  const contactPhone = shopData?.phone || shopData?.owner?.mobile || '+919991983125';
  const contactEmail = shopData?.email || shopData?.owner?.email || 'gurvinderaulakh497@gmail.com';
  const contactAddress = shopData?.fullAddress || 'Chandigarh University, NH-05, Ludhiana';
  const contactCity = shopData?.city || 'Chandigarh';
  const contactState = shopData?.state || 'Punjab';
  const contactLocationDisplay = `${contactCity}, ${contactState}`;

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string; message?: string } = {};

    if (!inquiryName.trim() || inquiryName.trim().length < 2) {
      errors.name = 'Please enter your name (min 2 characters).';
    }

    const cleanPhone = inquiryPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!inquiryMessage.trim() || inquiryMessage.trim().length < 5) {
      errors.message = 'Please type your inquiry (min 5 characters).';
    }

    if (Object.keys(errors).length > 0) {
      setInquiryErrors(errors);
      return;
    }

    setInquiryErrors({});
    setIsSubmittingInquiry(true);

    try {
      const res = await fetch('/api/v1/shop/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryName.trim(),
          phone: cleanPhone,
          message: inquiryMessage.trim(),
          shopSlug: resolvedSlug,
          shopId: shopData?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInquirySent(true);
      } else {
        setInquiryErrors({
          message: data.message || 'Failed to submit inquiry. Please check fields.',
        });
      }
    } catch {
      setInquiryErrors({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // 1. Resolve Params safely
  useEffect(() => {
    let isMounted = true;
    Promise.resolve(params).then((p: any) => {
      if (isMounted && p?.slug) setResolvedSlug(p.slug);
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  // 2. Fetch Shop Details & Products by Slug
  useEffect(() => {
    if (!resolvedSlug) return;

    setIsLoading(true);
    fetch(`/api/v1/shop/${resolvedSlug}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setShopData(resData.data.shop);
          setProducts(resData.data.products || []);
          setCategories(resData.data.categories || []);
        } else {
          setShopData({
            id: 'fallback_shop',
            name: resolvedSlug.replace(/-/g, ' ').toUpperCase(),
            slug: resolvedSlug,
            description:
              'Verified shop store showcasing handcrafted ethnic wear and designer garments.',
            logo: null,
            banner: '/images/default-shop-banner.png',
            rating: 4.8,
            reviewCount: 24,
            fullAddress: 'Chandigarh University, NH-05, Ludhiana',
            city: 'Ludhiana',
            state: 'Punjab',
            pincode: '140413',
            phone: '+919991983125',
            email: 'gurvinderaulakh497@gmail.com',
            verificationBadge: 'VERIFIED SHOP',
          });
          setProducts([]);
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load shop storefront:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [resolvedSlug]);

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' ||
      p.categoryId === selectedCategory ||
      p.category?.slug === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const rawShopName =
    shopData?.name ||
    resolvedSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  const displayShopName = rawShopName.replace(/\s+Alt$/i, '').trim();
  const shopName = displayShopName;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Marketplace Shops', href: '/shop' },
          { label: displayShopName },
        ]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. STOREFRONT HERO HEADER */}
        <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Cover Banner Image */}
          <div className="h-40 sm:h-52 bg-slate-900 relative overflow-hidden">
            <Image
              src={shopData?.banner || '/images/default-shop-banner.png'}
              alt={displayShopName}
              fill
              priority
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Shop Profile Info Container */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-5">
              {/* Clean Logo Avatar Container */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-amber-50 border-4 border-white shadow-xl overflow-hidden relative shrink-0 flex items-center justify-center -mt-12 sm:-mt-16">
                {shopData?.logo ? (
                  <Image
                    src={shopData.logo}
                    alt={displayShopName}
                    fill
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-amber-700" />
                )}
              </div>

              {/* Title, Metadata & Action Buttons Row */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 sm:pt-3">
                {/* Title & Metadata */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {displayShopName}
                    </h1>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED SHOP
                    </Badge>
                  </div>

                  {/* Clean Horizontal Metadata Line */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1 text-amber-600 font-extrabold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {shopData?.rating || 4.8} ({shopData?.reviewCount || 120} Verified Buyer
                      Reviews)
                    </span>

                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {contactLocationDisplay}
                    </span>

                    <span className="flex items-center gap-1 text-navy font-bold">
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      {filteredProducts.length} Products
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 pt-1 md:pt-0">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs font-bold px-5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer h-10"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Shop link copied to clipboard!');
                      }
                    }}
                  >
                    Share Shop
                  </Button>

                  <Button
                    onClick={() => setShowContactModal(true)}
                    className="rounded-full text-xs font-bold px-6 bg-navy text-white hover:bg-navy/90 shadow-md cursor-pointer flex items-center gap-1.5 h-10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Contact Seller
                  </Button>
                </div>
              </div>
            </div>

            {/* Boutique Bio / Description */}
            {shopData?.description && (
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-4xl">
                  {shopData.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TEMPORARY VACATION / CLOSURE BANNER */}
        {shopData?.isClosed && (
          <div className="bg-amber-50 border-2 border-amber-400/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow-xs text-xl">
                🌴
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-navy text-base">
                    Store Temporarily Closed — {shopData.closedReason || 'Vacation Mode'}
                  </h3>
                  {shopData.closedUntil && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                      Reopening{' '}
                      {new Date(shopData.closedUntil).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 font-semibold mt-1 max-w-2xl leading-relaxed">
                  {shopData.vacationMessage ||
                    'Our boutique is currently on vacation. Browsing catalog is enabled, but new orders are temporarily paused.'}
                </p>
              </div>
            </div>

            <div className="px-4 py-2 bg-amber-200/80 border border-amber-300 rounded-xl text-amber-900 text-xs font-extrabold whitespace-nowrap">
              🔒 Orders Temporarily Paused
            </div>
          </div>
        )}

        {/* 2. STORE SEARCH & CATEGORY FILTER BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={`Search in ${shopName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:bg-white"
              />
            </div>

            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap hidden sm:inline">
                Filter Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-64 bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-xl px-4 py-2.5 focus:border-navy focus:bg-white focus:outline-none transition-all cursor-pointer shadow-xs"
              >
                <option value="all">All Categories ({products.length} Items)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. STOREFRONT PRODUCTS CATALOG */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-navy" /> Collection Catalog (
              {filteredProducts.length} Items)
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-200 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
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
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                        {p.name}
                      </div>
                    )}

                    {p.category?.name && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-navy shadow-xs">
                        {p.category.name}
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
              <Store className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No products found in this category
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for another item or clear your active filters.
              </p>
              <Button
                variant="outline"
                className="rounded-full text-xs font-bold border-slate-300"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* CONTACT SELLER MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
            {/* Modal Header - Navy & Gold Luxury Palette */}
            <div className="bg-navy text-white p-6 flex items-start justify-between relative border-b border-navy-hover">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
                  Direct Boutique Contact
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-400" /> {displayShopName}
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {contactLocationDisplay} • Verified Merchant
                </p>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setInquirySent(false);
                  setInquiryErrors({});
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions & Details */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center gap-2 text-amber-900 font-extrabold text-xs transition-all shadow-xs"
                >
                  <PhoneCall className="w-4 h-4 text-amber-600" /> Call Seller
                </a>

                <a
                  href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(displayShopName)},%20I%20saw%20your%20boutique%20on%20Navya%20Collection%20and%20want%20to%20inquire.`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Chat
                </a>
              </div>

              {/* Support Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-navy">Support Email:</span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-amber-700 font-bold hover:underline truncate"
                  >
                    {contactEmail}
                  </a>
                </div>

                <div className="flex items-start gap-2 text-slate-700 pt-2 border-t border-slate-200/80">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy block">Full Boutique Address:</span>
                    <p className="text-slate-600 font-medium text-[11px] leading-relaxed mt-0.5">
                      {contactAddress}, {contactCity} - {shopData?.pincode || '140413'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-600" /> Send Direct Inquiry Message
                </h4>

                {inquirySent ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center space-y-1 shadow-xs">
                    <p className="text-sm font-extrabold">✓ Inquiry Sent to {displayShopName}!</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      The merchant has received your message and will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="text"
                          placeholder="Your Name *"
                          value={inquiryName}
                          onChange={(e) => {
                            setInquiryName(e.target.value);
                            if (inquiryErrors.name)
                              setInquiryErrors({ ...inquiryErrors, name: undefined });
                          }}
                          className={`rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold ${
                            inquiryErrors.name ? 'border-red-500 bg-red-50/50' : ''
                          }`}
                        />
                        {inquiryErrors.name && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {inquiryErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          type="tel"
                          placeholder="Your Mobile No. *"
                          value={inquiryPhone}
                          onChange={(e) => {
                            setInquiryPhone(e.target.value);
                            if (inquiryErrors.phone)
                              setInquiryErrors({ ...inquiryErrors, phone: undefined });
                          }}
                          className={`rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold ${
                            inquiryErrors.phone ? 'border-red-500 bg-red-50/50' : ''
                          }`}
                        />
                        {inquiryErrors.phone && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {inquiryErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        placeholder="Type your inquiry regarding custom sizing, bulk orders, or product details *"
                        value={inquiryMessage}
                        onChange={(e) => {
                          setInquiryMessage(e.target.value);
                          if (inquiryErrors.message)
                            setInquiryErrors({ ...inquiryErrors, message: undefined });
                        }}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition-all font-medium shadow-xs ${
                          inquiryErrors.message ? 'border-red-500 bg-red-50/50' : ''
                        }`}
                      />
                      {inquiryErrors.message && (
                        <p className="text-[10px] text-red-600 font-bold mt-1">
                          {inquiryErrors.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      className="w-full rounded-xl py-3.5 text-xs font-extrabold bg-navy hover:bg-navy-hover text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSubmittingInquiry
                        ? 'Sending Inquiry...'
                        : `Submit Inquiry to ${displayShopName}`}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
