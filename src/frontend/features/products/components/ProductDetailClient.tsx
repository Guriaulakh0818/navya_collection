/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Building2,
  Check,
  ChevronRight,
  Heart,
  HelpCircle,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Drawer } from '@/components/ui/drawer';
import { HorizontalCarousel } from '@/frontend/components/ui/HorizontalCarousel';
import { useCartStore, useWishlistStore } from '@/stores';

import { ProductCard } from './ProductCard';
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

const COLOR_HEX_MAP: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Black: '#1e293b',
  White: '#f8fafc',
  Green: '#22c55e',
  Yellow: '#eab308',
  Pink: '#ec4899',
  Maroon: '#881337',
  Gold: '#d97706',
  Purple: '#a855f7',
  'Navy Blue': '#1e3a8a',
  Beige: '#d4b996',
  Grey: '#64748b',
  Orange: '#f97316',
  Brown: '#78350f',
  Multicolor: '#6366f1',
};

export function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedVariant, setSelectedVariant] = useState<string>(product?.variants?.[0]?.id || '');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper to extract variant color safely
  const getVColor = (v: any) =>
    (
      v?.color ||
      v?.colorName ||
      (typeof v?.attributes === 'object' && v?.attributes !== null ? v.attributes?.color : '')
    )?.trim() || '';

  // Helper to extract variant size safely
  const getVSize = (v: any) =>
    (
      v?.size ||
      v?.sizeName ||
      (typeof v?.attributes === 'object' && v?.attributes !== null ? v.attributes?.size : '')
    )?.trim() || '';

  // Extract all unique colors present across variants
  const availableColors = useMemo(() => {
    if (!product?.variants || product.variants.length <= 1) return [];
    const colors: string[] = [];
    product.variants.forEach((v: any) => {
      const clr = getVColor(v);
      if (clr && !colors.some((c) => c.toLowerCase() === clr.toLowerCase())) {
        colors.push(clr);
      }
    });
    return colors;
  }, [product?.variants]);

  // Extract all unique sizes present across variants
  const availableSizes = useMemo(() => {
    if (!product?.variants || product.variants.length <= 1) return [];
    const sizes: string[] = [];
    product.variants.forEach((v: any) => {
      const sz = getVSize(v);
      if (sz && !sizes.some((s) => s.toLowerCase() === sz.toLowerCase())) {
        sizes.push(sz);
      }
    });
    return sizes;
  }, [product?.variants]);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [reviewsList, setReviewsList] = useState(product?.reviews || []);

  const activeVariant = useMemo(() => {
    return (
      product?.variants?.find((v: any) => v.id === selectedVariant) ||
      product?.variants?.[0] ||
      null
    );
  }, [selectedVariant, product]);

  const activeColor = useMemo(() => {
    const raw = getVColor(activeVariant);
    return raw || availableColors[0] || '';
  }, [activeVariant, availableColors]);

  const activeSize = useMemo(() => {
    const raw = getVSize(activeVariant);
    return raw || availableSizes[0] || '';
  }, [activeVariant, availableSizes]);

  const handleSelectColor = (clr: string) => {
    const targetClr = clr.trim().toLowerCase();
    const currentSize = activeSize.trim().toLowerCase();

    // 1. Match same size with new color
    const matchSameSize = product?.variants?.find((v: any) => {
      const c = getVColor(v).toLowerCase();
      const s = getVSize(v).toLowerCase();
      return c === targetClr && s === currentSize;
    });
    if (matchSameSize) {
      setSelectedVariant(matchSameSize.id);
      return;
    }

    // 2. Match in-stock variant with new color
    const matchInStock = product?.variants?.find((v: any) => {
      const c = getVColor(v).toLowerCase();
      return c === targetClr && (v.stock ?? 1) > 0;
    });
    if (matchInStock) {
      setSelectedVariant(matchInStock.id);
      return;
    }

    // 3. Fallback to any variant of that color
    const matchAny = product?.variants?.find((v: any) => {
      const c = getVColor(v).toLowerCase();
      return c === targetClr;
    });
    if (matchAny) {
      setSelectedVariant(matchAny.id);
    }
  };

  const handleSelectSize = (sz: string) => {
    const targetSz = sz.trim().toLowerCase();
    const currentColor = activeColor.trim().toLowerCase();

    // 1. Match same color with new size
    const matchSameColor = product?.variants?.find((v: any) => {
      const c = getVColor(v).toLowerCase();
      const s = getVSize(v).toLowerCase();
      return c === currentColor && s === targetSz;
    });
    if (matchSameColor) {
      setSelectedVariant(matchSameColor.id);
      return;
    }

    // 2. Match in-stock variant with new size
    const matchInStock = product?.variants?.find((v: any) => {
      const s = getVSize(v).toLowerCase();
      return s === targetSz && (v.stock ?? 1) > 0;
    });
    if (matchInStock) {
      setSelectedVariant(matchInStock.id);
      return;
    }

    // 3. Fallback to any variant of that size
    const matchAny = product?.variants?.find((v: any) => {
      const s = getVSize(v).toLowerCase();
      return s === targetSz;
    });
    if (matchAny) {
      setSelectedVariant(matchAny.id);
    }
  };

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
  const compareAtPrice = activeVariant?.compareAtPrice
    ? Number(activeVariant.compareAtPrice)
    : product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null;
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Find cart item for the currently selected variant (or base product if no variants)
  const currentCartItem = useMemo(() => {
    if (!mounted) return undefined;
    const currentVariantId = activeVariant?.id || null;
    return cartItems.find((item) => {
      if (item.productId !== product.id) return false;
      if (currentVariantId) {
        return item.variantId === currentVariantId;
      }
      return !item.variantId;
    });
  }, [cartItems, product.id, activeVariant?.id, mounted]);

  const currentVariantQuantity = currentCartItem?.quantity || 0;

  const handleAddToCart = async () => {
    const { main: variantLabel } = getCleanVariantLabel(activeVariant, product.name);
    const hasAttributes = Boolean(
      activeColor ||
      activeSize ||
      (variantLabel && variantLabel !== 'Standard' && variantLabel !== 'Option'),
    );

    const variantTitle =
      hasAttributes && variantLabel && variantLabel !== 'Standard' && variantLabel !== 'Option'
        ? `${product.name} - ${variantLabel}`
        : product.name;

    await addItem({
      productId: product.id,
      variantId: activeVariant?.id || null,
      name: variantTitle,
      productName: product.name,
      productSlug: product.slug,
      variantName: hasAttributes ? variantLabel || `${activeColor} ${activeSize}`.trim() : null,
      size: activeSize || null,
      color: activeColor || null,
      sku: activeVariant?.sku || product.sku,
      price: price,
      compareAtPrice: compareAtPrice,
      quantity: 1,
      availableStock: activeVariant?.stock ?? product.stock ?? 99,
      image:
        activeVariantImageUrl || product.images?.[0]?.url || product.images?.[0]?.imageUrl || '',
      shopId: product.shop?.id || product.shopId || 'independent-shop',
      shopName: product.shop?.name || 'Independent Boutique',
      shopSlug: product.shop?.slug || 'shop',
      shopLogo: product.shop?.logo,
    });
  };

  const handleIncreaseVariantQty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentCartItem) return;
    const maxStock = activeVariant?.stock ?? product.stock ?? 99;
    if (currentVariantQuantity >= maxStock) return;
    await updateQuantity(currentCartItem.id, currentVariantQuantity + 1);
  };

  const handleDecreaseVariantQty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentCartItem) return;
    if (currentVariantQuantity <= 1) {
      await removeItem(currentCartItem.id, activeVariant?.id || null);
    } else {
      await updateQuantity(currentCartItem.id, currentVariantQuantity - 1);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentCartItem) {
      await handleAddToCart();
    }
    router.push('/checkout');
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
    activeVariant?.imageUrl ||
    activeVariant?.image ||
    (typeof activeVariant?.attributes === 'object' && activeVariant?.attributes !== null
      ? activeVariant.attributes.imageUrl
      : null);

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
    const addedKeys = new Set<string>();

    const addSpec = (label: string, value: any, keyAlias?: string) => {
      if (!value || typeof value !== 'string' || !value.trim()) return;
      const key = (keyAlias || label).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (addedKeys.has(key)) return;
      addedKeys.add(key);
      specs.push({ label, value: value.trim() });
    };

    if (product.brand) addSpec('Brand', product.brand, 'brand');
    if (product.category?.name) addSpec('Category', product.category.name, 'category');
    if (product.fabric || activeVariant?.attributes?.fabric) {
      addSpec('Fabric', product.fabric || activeVariant?.attributes?.fabric, 'fabric');
    }
    if (product.fit || activeVariant?.attributes?.fit) {
      addSpec('Fit', product.fit || activeVariant?.attributes?.fit, 'fit');
    }
    if (product.occasion || activeVariant?.attributes?.occasion) {
      addSpec('Occasion', product.occasion || activeVariant?.attributes?.occasion, 'occasion');
    }
    if (activeColor) {
      addSpec('Color', activeColor, 'color');
    }
    if (activeSize) {
      addSpec('Size', activeSize, 'size');
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
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      addSpec(formattedLabel, String(val), key);
    });

    addSpec('Country of Origin', product.countryOfOrigin || 'India 🇮🇳', 'countryoforigin');

    return specs;
  }, [product, activeVariant, activeColor, activeSize]);

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
          {/* Header & Badges with Title & Price Side-by-Side (Mobile Space Optimization) */}
          <div className="space-y-2.5 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {product.brand && (
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 text-amber-900 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-full border border-amber-500/20">
                  {product.brand}
                </span>
              )}
              {product.category?.name && (
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-navy/5 text-navy font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-full border border-navy/10">
                  {product.category.name}
                </span>
              )}
              {discountPercent && (
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider rounded-full shadow-2xs">
                  {discountPercent}% OFF
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-full ${stockStatus.color}`}
              >
                {stockStatus.label}
              </span>
            </div>

            {/* Product Name & Price Side-by-Side */}
            <div className="flex items-start justify-between gap-3 pt-0.5">
              <div className="space-y-1.5 min-w-0 flex-1">
                <h1 className="font-extrabold text-navy text-xl sm:text-2xl md:text-3xl tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Boutique Pills in 1 compact line */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {product.shop && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-bold shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Boutique: <strong className="text-navy">{product.shop.name}</strong>
                      </span>
                    </div>
                  )}

                  {reviewsList.length > 0 && product.rating ? (
                    <div className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50/60 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{Number(product.rating).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({reviewsList.length})</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Price on right side (Compact & prominent) */}
              <div className="text-right shrink-0 flex flex-col items-end pl-2">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-navy font-mono">
                    ₹{Number(price).toLocaleString('en-IN')}
                  </span>
                  {compareAtPrice && compareAtPrice > price && (
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-mono">
                      ₹{Number(compareAtPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-[10px] sm:text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-0.5">
                    Save ₹{(compareAtPrice - price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Color & Size Variant Selection (Amazon / Myntra / Flipkart 1-line style) */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-3 pt-2">
              {/* Color Row (1-line) */}
              {availableColors.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Color:{' '}
                      <strong className="text-navy font-extrabold">
                        {activeColor || 'Default'}
                      </strong>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {availableColors.length} Colors
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
                    {availableColors.map((clr) => {
                      const isSelected =
                        activeColor.trim().toLowerCase() === clr.trim().toLowerCase();
                      const hex = COLOR_HEX_MAP[clr] || '#94a3b8';
                      const targetClr = clr.trim().toLowerCase();
                      const sampleVariant =
                        product.variants.find((v: any) => {
                          const c = getVColor(v).toLowerCase();
                          return c === targetClr && v.imageUrl;
                        }) ||
                        product.variants.find((v: any) => {
                          const c = getVColor(v).toLowerCase();
                          return c === targetClr;
                        });
                      const swatchImg = sampleVariant?.imageUrl;

                      return (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => handleSelectColor(clr)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border-navy bg-navy text-white shadow-xs ring-2 ring-navy/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {swatchImg ? (
                            <img
                              src={swatchImg}
                              alt={clr}
                              className="w-4 h-4 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span>{clr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Row (1-line) */}
              {availableSizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">
                        Select Size:{' '}
                        <strong className="text-navy font-extrabold">
                          {activeSize || 'Free Size'}
                        </strong>
                      </span>
                      {activeVariant?.stock !== undefined &&
                        activeVariant.stock <= (product.lowStockThreshold || 5) &&
                        activeVariant.stock > 0 && (
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                            Only {activeVariant.stock} left!
                          </span>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Size Chart Guide
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
                    {availableSizes.map((sz) => {
                      const targetSz = sz.trim().toLowerCase();
                      const currentColor = activeColor.trim().toLowerCase();
                      const match =
                        product.variants.find((v: any) => {
                          const c = getVColor(v).toLowerCase();
                          const s = getVSize(v).toLowerCase();
                          return c === currentColor && s === targetSz;
                        }) ||
                        product.variants.find((v: any) => {
                          const s = getVSize(v).toLowerCase();
                          return s === targetSz;
                        });
                      const isSelected = activeSize.trim().toLowerCase() === targetSz;
                      const isOut = match ? (match.stock ?? 1) <= 0 : false;

                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={isOut}
                          onClick={() => handleSelectSize(sz)}
                          className={`min-w-10 h-9 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border-navy bg-navy text-white shadow-xs ring-2 ring-navy/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          } ${isOut ? 'opacity-35 line-through cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fallback Single-Row Chips if variants have neither clean colors nor sizes */}
              {availableColors.length <= 1 && availableSizes.length <= 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Select Option:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
                    {product.variants.map((v: any) => {
                      const isSelected = selectedVariant === v.id;
                      const isOut = (v.stock ?? 1) <= 0;
                      const { main: label } = getCleanVariantLabel(v, product.name);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={isOut}
                          onClick={() => setSelectedVariant(v.id)}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border-navy bg-navy text-white shadow-xs ring-2 ring-navy/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          } ${isOut ? 'opacity-35 line-through cursor-not-allowed bg-slate-50' : ''}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Action Buttons: Dynamic Add to Cart / Quantity Controller & Buy Now */}
          <div className="pt-2 flex flex-row items-center gap-1.5 xs:gap-2 sm:gap-3 w-full flex-nowrap">
            {currentVariantQuantity > 0 ? (
              <div className="flex-1 min-w-0 h-[46px] xs:h-[48px] rounded-2xl bg-navy text-white flex items-center justify-between px-2 sm:px-3 shadow-md shrink-0 border border-navy-700">
                <button
                  type="button"
                  onClick={handleDecreaseVariantQty}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="flex flex-col items-center justify-center px-2 select-none">
                  <span className="font-mono text-base sm:text-lg font-black text-white leading-none">
                    {currentVariantQuantity}
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                    in cart
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncreaseVariantQty}
                  disabled={currentVariantQuantity >= (activeVariant?.stock ?? product.stock ?? 99)}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-orange hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  aria-label="Increase quantity"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stockStatus.label === 'Out of Stock'}
                className="flex-1 min-w-0 h-[46px] xs:h-[48px] px-2 xs:px-3 sm:px-6 rounded-2xl font-extrabold text-[11px] xs:text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-98 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-orange hover:bg-amber-600 text-white"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="truncate">Add to Cart</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={stockStatus.label === 'Out of Stock'}
              className="flex-1 min-w-0 h-[46px] xs:h-[48px] px-2 xs:px-3 sm:px-6 bg-navy hover:bg-navy-hover text-white rounded-2xl font-extrabold text-[11px] xs:text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center active:scale-98 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">Buy Now</span>
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`h-[46px] xs:h-[48px] w-[46px] xs:w-[48px] rounded-2xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isWishlisted
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Add to Wishlist"
              aria-label="Add to Wishlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-[46px] xs:h-[48px] w-[46px] xs:w-[48px] rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Share Link"
              aria-label="Share Link"
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

      {/* COMPACT PRODUCT SPECIFICATIONS (2-Cols on Mobile, 3-Cols Tablet, 4-Cols Desktop) */}
      <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-sm sm:text-base font-extrabold text-navy flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" /> Product Specifications &amp; Details
          </h2>
          <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
            100% Authentic Details
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
          {specifications.map((spec, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center"
            >
              <span className="text-[9.5px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                {spec.label}
              </span>
              <span
                className="font-bold text-navy mt-0.5 text-[11px] sm:text-xs truncate"
                title={spec.value}
              >
                {spec.value}
              </span>
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
          <ProductRating rating={product.rating} reviewCount={reviewsList.length} />
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

      {/* Related Products / More to Explore (Amazon / Flipkart / Myntra style) */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange/10 border border-orange/20 rounded-full text-orange font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Handpicked Recommendations</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Similar Products You May Like
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Popular styles and customer favorites in {product.category?.name || 'fashion'}
              </p>
            </div>
            {product.category?.slug && (
              <Link
                href={`/category/${product.category.slug}`}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors self-start sm:self-auto"
              >
                <span>View All In {product.category.name}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            {relatedProducts.map((relProd: any) => (
              <ProductCard key={relProd.id} product={relProd} />
            ))}
          </div>
        </section>
      )}

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
