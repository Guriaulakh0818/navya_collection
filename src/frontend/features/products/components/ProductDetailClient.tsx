'use client';

import {
  Building2,
  Check,
  Heart,
  HelpCircle,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Drawer } from '@/components/ui/drawer';
import { HorizontalCarousel } from '@/frontend/components/ui/HorizontalCarousel';
import { useCartStore, useWishlistStore } from '@/stores';

import { ProductImageGallery } from './ProductImageGallery';
import { ProductRating } from './ProductRating';

interface ProductDetailClientProps {
  product: any;
  relatedProducts?: any[];
}

function getCleanVariantLabel(v: any, productName?: string): { main: string; sub?: string } {
  if (!v) return { main: 'Standard' };

  const size = v.size?.trim();
  const color = (v.color || v.colorName)?.trim();

  if (size && color && size !== color) {
    return { main: `${color} (${size})`, sub: size };
  }
  if (size) {
    return { main: size, sub: size };
  }
  if (color) {
    return { main: color, sub: color };
  }

  let name = (v.name || '').trim();
  if (productName && name.toLowerCase().startsWith(productName.toLowerCase())) {
    name = name
      .slice(productName.length)
      .replace(/^[\s\-–—:]+/, '')
      .trim();
  } else if (name.includes(' - ')) {
    name = name.split(' - ').pop()?.trim() || name;
  } else if (name.includes(' – ')) {
    name = name.split(' – ').pop()?.trim() || name;
  }

  return { main: name || 'Option' };
}

export function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();

  const [selectedVariant, setSelectedVariant] = useState<string>(product?.variants?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [reviewsList, setReviewsList] = useState(product?.reviews || []);

  const activeVariant = useMemo(
    () => product?.variants?.find((v: any) => v.id === selectedVariant) || product?.variants?.[0],
    [selectedVariant, product],
  );

  const isWishlisted = isInWishlist(product.id);

  const stockStatus = useMemo(() => {
    if (!activeVariant && (product.stock || 0) <= 0) {
      return { label: 'Out of Stock', color: 'bg-rose-500' };
    }
    const currentStock = activeVariant?.stock ?? product.stock ?? 0;
    if (currentStock <= 0) return { label: 'Out of Stock', color: 'bg-rose-500' };
    if (currentStock <= (product.lowStockThreshold || 5)) {
      return { label: `Only ${currentStock} left in stock!`, color: 'bg-amber-500' };
    }
    return { label: 'In Stock', color: 'bg-emerald-600' };
  }, [activeVariant, product]);

  const price = Number(activeVariant?.price ?? product.price ?? 0);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addItem({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: quantity,
      image: product.images?.[0]?.url || product.images?.[0]?.imageUrl || '',
      shopId: product.shop?.id || product.shopId || 'independent-shop',
      shopName: product.shop?.name || 'Independent Boutique',
      shopSlug: product.shop?.slug || 'shop',
      shopLogo: product.shop?.logo,
      variantId: activeVariant?.id,
    });
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev = {
      id: String(Date.now()),
      userName: newName.trim() || 'Valued Customer',
      rating: newRating,
      comment: newComment.trim(),
      createdAt: new Date(),
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewComment('');
    setNewName('');
  };

  const activeVariantImageUrl =
    activeVariant?.attributes?.imageUrl || activeVariant?.imageUrl || activeVariant?.image;

  const displayImages = useMemo(() => {
    const base = [...(product.images || [])];
    if (
      activeVariantImageUrl &&
      !base.some((img: any) => (img.url || img.imageUrl) === activeVariantImageUrl)
    ) {
      base.unshift({
        id: `variant-img-${activeVariant?.id || 'active'}`,
        url: activeVariantImageUrl,
        imageUrl: activeVariantImageUrl,
        alt: `${product.name} - ${activeVariant?.color || 'Variant'}`,
      });
    }
    return base;
  }, [product.images, activeVariantImageUrl, product.name, activeVariant]);

  // Extract all dynamic specifications
  const specifications = useMemo(() => {
    const specs: { label: string; value: string }[] = [];

    if (product.brand) specs.push({ label: 'Brand', value: product.brand });
    if (product.category?.name) specs.push({ label: 'Category', value: product.category.name });
    if (product.fabric || activeVariant?.attributes?.fabric) {
      specs.push({
        label: 'Fabric / Material',
        value: product.fabric || activeVariant?.attributes?.fabric,
      });
    }
    if (product.fit || activeVariant?.attributes?.fit) {
      specs.push({ label: 'Fit Type', value: product.fit || activeVariant?.attributes?.fit });
    }
    if (product.occasion || activeVariant?.attributes?.occasion) {
      specs.push({
        label: 'Occasion',
        value: product.occasion || activeVariant?.attributes?.occasion,
      });
    }
    if (activeVariant?.color || product.color) {
      specs.push({ label: 'Color', value: activeVariant?.color || product.color });
    }
    if (activeVariant?.size) {
      specs.push({ label: 'Size', value: activeVariant.size });
    }

    // Dynamic attributes dictionary
    const dynamicAttrs = {
      ...(typeof product.attributes === 'object' ? product.attributes : {}),
      ...(typeof activeVariant?.attributes === 'object' ? activeVariant.attributes : {}),
    };

    Object.entries(dynamicAttrs).forEach(([key, val]) => {
      if (!val || typeof val !== 'string' || key === 'imageUrl') return;
      const formattedLabel = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      if (!specs.some((s) => s.label.toLowerCase() === formattedLabel.toLowerCase())) {
        specs.push({ label: formattedLabel, value: String(val) });
      }
    });

    specs.push({ label: 'Country of Origin', value: product.countryOfOrigin || 'India 🇮🇳' });
    specs.push({ label: 'Assurance', value: '100% Quality Checked & Verified Artisan Boutique' });

    return specs;
  }, [product, activeVariant]);

  // Determine Category size chart type
  const isBottomwear = useMemo(() => {
    const cat = (product.category?.name || '').toLowerCase();
    return (
      cat.includes('jean') ||
      cat.includes('trouser') ||
      cat.includes('bottom') ||
      cat.includes('pant')
    );
  }, [product.category]);

  const isKids = useMemo(() => {
    const cat = (product.category?.name || '').toLowerCase();
    return (
      cat.includes('kid') || cat.includes('boy') || cat.includes('girl') || cat.includes('baby')
    );
  }, [product.category]);

  return (
    <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          {
            label: product.category?.name || 'Couture',
            href: `/category/${product.category?.slug || 'women-sarees'}`,
          },
          { label: product.name },
        ]}
      />

      {/* Main Product Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7">
          <ProductImageGallery images={displayImages} activeImageUrl={activeVariantImageUrl} />
        </div>

        {/* Right Column: Product Info & Purchase Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider rounded-full border border-amber-500/20">
                  {product.brand}
                </span>
              )}
              {product.category?.name && (
                <span className="px-3 py-1 bg-navy/5 text-navy font-extrabold text-[11px] uppercase tracking-wider rounded-full border border-navy/10">
                  {product.category.name}
                </span>
              )}
              {discountPercent && (
                <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
              <span
                className={`px-3 py-1 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-full ${stockStatus.color}`}
              >
                {stockStatus.label}
              </span>
            </div>

            <h1 className="font-extrabold text-navy text-2xl sm:text-3xl tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="font-mono">
                SKU: {activeVariant?.sku || product.sku || 'NC-PROD'}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{product.rating || 4.8}</span>
                <span className="text-slate-500 font-normal">
                  ({reviewsList.length} verified ratings)
                </span>
              </div>
            </div>

            {/* Merchant Shop Card Pill */}
            {product.shop && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-extrabold shadow-xs mt-1">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Boutique: <strong className="text-navy">{product.shop.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy font-mono">
                ₹{Number(price).toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <>
                  <span className="text-sm sm:text-base text-slate-400 line-through font-mono">
                    ₹{Number(compareAtPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Save ₹{(compareAtPrice - price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Inclusive of all taxes & free shipping</p>
          </div>

          {/* Product Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Color & Size Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Select Variant:
                  </h3>
                  <span className="text-xs font-bold text-amber-950 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                    {getCleanVariantLabel(activeVariant, product.name).main}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 gap-1.5 cursor-pointer transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Size Chart Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {product.variants.map((v: any, idx: number) => {
                  const { main: variantLabel } = getCleanVariantLabel(v, product.name);
                  const variantStock = v.stock !== undefined && v.stock !== null ? v.stock : 10;
                  const isOut = variantStock <= 0;
                  const isSelected = selectedVariant === v.id;

                  return (
                    <button
                      key={v.id || idx}
                      type="button"
                      onClick={() => setSelectedVariant(v.id)}
                      disabled={isOut}
                      className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all text-left cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-navy bg-navy text-white shadow-sm ring-2 ring-navy/20'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-amber-500 hover:bg-amber-50/40'
                      } ${isOut ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      <span className="font-extrabold text-xs sm:text-sm tracking-tight whitespace-nowrap">
                        {variantLabel}
                      </span>
                      {v.price && Number(v.price) !== Number(product.price) && (
                        <span
                          className={`text-xs font-semibold font-mono ${
                            isSelected ? 'text-amber-300' : 'text-slate-500'
                          }`}
                        >
                          ₹{Number(v.price).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : isOut
                              ? 'bg-rose-100 text-rose-700'
                              : variantStock <= 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'Sold Out' : `${variantStock} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Quantity
            </h3>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold active:scale-95 transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-extrabold text-sm text-navy">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="pt-4 flex flex-row items-center gap-1.5 xs:gap-2 sm:gap-3 w-full flex-nowrap">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 min-w-0 py-3 xs:py-3.5 px-2 xs:px-3 sm:px-6 rounded-2xl font-extrabold text-[11px] xs:text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1 sm:gap-2 cursor-pointer active:scale-98 shrink-0 ${
                isAdding ? 'bg-emerald-600 text-white' : 'bg-orange hover:bg-amber-600 text-white'
              }`}
            >
              {isAdding ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Added!</span>
                </>
              ) : (
                <span className="truncate">Add to Cart</span>
              )}
            </button>

            <Link
              href="/checkout"
              onClick={handleAddToCart}
              className="flex-1 min-w-0 py-3 xs:py-3.5 px-2 xs:px-3 sm:px-6 bg-navy hover:bg-navy-hover text-white rounded-2xl font-extrabold text-[11px] xs:text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center active:scale-98 shrink-0"
            >
              <span className="truncate">Buy Now</span>
            </Link>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`p-2.5 xs:p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                isWishlisted
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 xs:p-3 sm:p-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shrink-0"
              title="Share Link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Value Props & Assurance Cards */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-navy font-bold text-[11px]">Free Delivery</strong>
                <span className="text-[10px] text-slate-500">Pan-India express</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-navy font-bold text-[11px]">N-Assured Quality</strong>
                <span className="text-[10px] text-slate-500">Verified boutique</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC PRODUCT SPECIFICATIONS ACCORDION / TABLE */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-extrabold text-navy flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" /> Product Specifications & Details
          </h2>
          <span className="text-xs text-slate-400 font-bold">100% Authentic Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs">
          {specifications.map((spec, idx) => (
            <div key={idx} className="flex flex-col py-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {spec.label}
              </span>
              <span className="font-extrabold text-navy mt-0.5 text-sm">{spec.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-navy">
            Customer Reviews ({reviewsList.length})
          </h2>
          <ProductRating rating={product.rating || 4.8} reviewCount={reviewsList.length} />
        </div>

        {/* Add Review Form */}
        <form
          onSubmit={handleAddReview}
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <h3 className="font-extrabold text-navy text-sm">Write a Customer Review</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Ananya Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Rating</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-extrabold focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
                <option value={4}>⭐⭐⭐⭐ 4 - Very Good</option>
                <option value={3}>⭐⭐⭐ 3 - Good</option>
                <option value={2}>⭐⭐ 2 - Average</option>
                <option value={1}>⭐ 1 - Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              Your Review & Feedback
            </label>
            <textarea
              placeholder="Share details of your experience with fabric, fitting, and delivery..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-navy hover:bg-navy-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Submit Verified Review
          </button>
        </form>

        {/* Reviews Feed */}
        <div className="space-y-4">
          {reviewsList.map((r: any) => (
            <div
              key={r.id}
              className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-navy text-sm">{r.userName}</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(r.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DYNAMIC CATEGORY SIZE GUIDE DRAWER */}
      <Drawer
        open={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Chart & Fit Guide"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Standard Indian sizing measurements in inches for this product category:
          </p>

          {isBottomwear ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-navy font-extrabold">
                  <tr>
                    <th className="p-2.5 border-r border-b border-slate-200">Waist (Inches)</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Hip (Inches)</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Thigh (Inches)</th>
                    <th className="p-2.5 border-b border-slate-200">Length (Inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">28</td>
                    <td className="p-2.5 border-r border-slate-200">36 in</td>
                    <td className="p-2.5 border-r border-slate-200">21 in</td>
                    <td className="p-2.5">39 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">30</td>
                    <td className="p-2.5 border-r border-slate-200">38 in</td>
                    <td className="p-2.5 border-r border-slate-200">22 in</td>
                    <td className="p-2.5">40 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">32</td>
                    <td className="p-2.5 border-r border-slate-200">40 in</td>
                    <td className="p-2.5 border-r border-slate-200">23 in</td>
                    <td className="p-2.5">40 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">34</td>
                    <td className="p-2.5 border-r border-slate-200">42 in</td>
                    <td className="p-2.5 border-r border-slate-200">24 in</td>
                    <td className="p-2.5">41 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">36</td>
                    <td className="p-2.5 border-r border-slate-200">44 in</td>
                    <td className="p-2.5 border-r border-slate-200">25 in</td>
                    <td className="p-2.5">41 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">38</td>
                    <td className="p-2.5 border-r border-slate-200">46 in</td>
                    <td className="p-2.5 border-r border-slate-200">26 in</td>
                    <td className="p-2.5">42 in</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : isKids ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-navy font-extrabold">
                  <tr>
                    <th className="p-2.5 border-r border-b border-slate-200">Age Group</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Chest</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Height (cm)</th>
                    <th className="p-2.5 border-b border-slate-200">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">0-6 Months</td>
                    <td className="p-2.5 border-r border-slate-200">18 in</td>
                    <td className="p-2.5 border-r border-slate-200">60-68 cm</td>
                    <td className="p-2.5">4-7 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">1-2 Years</td>
                    <td className="p-2.5 border-r border-slate-200">20 in</td>
                    <td className="p-2.5 border-r border-slate-200">80-90 cm</td>
                    <td className="p-2.5">10-13 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">3-4 Years</td>
                    <td className="p-2.5 border-r border-slate-200">22 in</td>
                    <td className="p-2.5 border-r border-slate-200">98-104 cm</td>
                    <td className="p-2.5">15-18 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">5-6 Years</td>
                    <td className="p-2.5 border-r border-slate-200">24 in</td>
                    <td className="p-2.5 border-r border-slate-200">110-116 cm</td>
                    <td className="p-2.5">19-22 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">7-8 Years</td>
                    <td className="p-2.5 border-r border-slate-200">26 in</td>
                    <td className="p-2.5 border-r border-slate-200">122-128 cm</td>
                    <td className="p-2.5">23-27 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-navy font-extrabold">
                  <tr>
                    <th className="p-2.5 border-r border-b border-slate-200">Size</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Chest / Bust</th>
                    <th className="p-2.5 border-r border-b border-slate-200">Waist</th>
                    <th className="p-2.5 border-b border-slate-200">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">XS</td>
                    <td className="p-2.5 border-r border-slate-200">34-36 in</td>
                    <td className="p-2.5 border-r border-slate-200">28-30 in</td>
                    <td className="p-2.5">27 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">S</td>
                    <td className="p-2.5 border-r border-slate-200">36-38 in</td>
                    <td className="p-2.5 border-r border-slate-200">30-32 in</td>
                    <td className="p-2.5">28 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">M</td>
                    <td className="p-2.5 border-r border-slate-200">38-40 in</td>
                    <td className="p-2.5 border-r border-slate-200">32-34 in</td>
                    <td className="p-2.5">29 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">L</td>
                    <td className="p-2.5 border-r border-slate-200">40-42 in</td>
                    <td className="p-2.5 border-r border-slate-200">34-36 in</td>
                    <td className="p-2.5">30 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">XL</td>
                    <td className="p-2.5 border-r border-slate-200">42-44 in</td>
                    <td className="p-2.5 border-r border-slate-200">36-38 in</td>
                    <td className="p-2.5">31 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">XXL</td>
                    <td className="p-2.5 border-r border-slate-200">44-46 in</td>
                    <td className="p-2.5 border-r border-slate-200">38-40 in</td>
                    <td className="p-2.5">32 in</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">3XL</td>
                    <td className="p-2.5 border-r border-slate-200">46-48 in</td>
                    <td className="p-2.5 border-r border-slate-200">40-42 in</td>
                    <td className="p-2.5">32 in</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
