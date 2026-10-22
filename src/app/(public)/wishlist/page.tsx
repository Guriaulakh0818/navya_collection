'use client';

import { Building2, Heart, LogIn, ShoppingBag, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useCartStore, useWishlistStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

export default function MultiVendorWishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMoveToCart = async (item: any) => {
    const selectedSize = item.selectedSize || item.size || null;
    const selectedColor = item.selectedColor || item.color || null;
    const variantName = item.variantName || null;

    const variantLabel = [selectedColor, selectedSize].filter(Boolean).join(', ');
    const displayName =
      variantLabel && !item.name.includes(variantLabel)
        ? `${item.name} (${variantLabel})`
        : item.name;

    await addItemToCart({
      productId: item.productId,
      variantId: item.variantId || undefined,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variantName: variantName || undefined,
      name: displayName,
      productName: item.name,
      productSlug: item.slug,
      price: item.price,
      quantity: 1,
      image: item.image,
      shopId: item.shopId || 'default-boutique',
      shopName: item.shopName || 'JiivaaKart Boutique',
      shopSlug: item.shopSlug || 'default-boutique',
      shopLogo: item.shopLogo,
    });

    await removeItem(item.productId, item.variantId);
    toast(`Moved "${item.name}"${variantLabel ? ` (${variantLabel})` : ''} to bag!`, 'success');
  };

  const handleRemove = async (item: any) => {
    await removeItem(item.productId, item.variantId);
    toast(`Removed "${item.name}" from your wishlist.`, 'info');
  };

  const handleClear = async () => {
    if (items.length === 0) return;
    await clearWishlist();
    toast('Your wishlist has been cleared.', 'info');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 animate-pulse space-y-6">
          <div className="h-5 w-44 bg-slate-200 rounded-md" />
          <div className="h-8 w-64 bg-slate-200 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: user ? 'Account' : 'Explore', href: user ? '/account' : '/shop' },
            { label: 'My Wishlist' },
          ]}
          className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4"
        />
        <div className="mx-auto max-w-md px-4 py-16 sm:py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-sm">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy">YOUR WISHLIST IS EMPTY</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Explore verified designer ethnic fashion & luxury boutique stores on JiivaaKart and save
            your favorites.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Button
              className="w-full sm:w-auto rounded-xl bg-orange hover:bg-orange/90 text-white font-extrabold px-6 py-2.5 text-xs shadow-md shadow-orange/20 cursor-pointer uppercase tracking-wider"
              asChild
            >
              <Link href="/shop">Start Shopping</Link>
            </Button>
            {!user && (
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-slate-300 bg-white hover:bg-slate-100 text-navy font-bold px-6 py-2.5 text-xs cursor-pointer"
                asChild
              >
                <Link href="/login">Login to View Saved Items</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-20 font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: user ? 'Account' : 'Store', href: user ? '/account' : '/shop' },
          { label: 'My Wishlist' },
        ]}
        className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-4 sm:space-y-6">
        {/* Guest Sync Banner if browsing without an account */}
        {!user && (
          <div className="rounded-xl sm:rounded-2xl border border-orange/25 bg-gradient-to-r from-orange/10 via-amber-50/60 to-white p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-navy">
                  Guest Wishlist ({items.length} item{items.length === 1 ? '' : 's'})
                </p>
                <p className="text-[11px] text-slate-500">
                  Log in to permanently sync your favorites across phone & desktop.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-lg sm:rounded-xl bg-navy hover:bg-navy-700 text-white font-extrabold text-xs px-3.5 py-1.5 shrink-0 cursor-pointer shadow-xs"
              asChild
            >
              <Link href="/login" className="flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                <span>Login Now</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Header Title & Counter */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-navy uppercase tracking-wider flex items-center gap-2">
              <span>My Wishlist</span>
            </h1>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
            >
              Clear All
            </button>
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex rounded-xl border-slate-200 bg-white hover:bg-slate-100 text-navy text-xs font-extrabold shadow-2xs"
              asChild
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        {/* WISHLIST ITEMS GRID - Professional 2-column mobile layout like Myntra, Ajio, Amazon, Flipkart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
          {items.map((item, idx) => {
            const hasVariant = Boolean(item.selectedSize || item.selectedColor || item.variantName);
            const productHref = `/product/${item.slug || item.productId}`;
            const discount =
              item.compareAtPrice && item.compareAtPrice > item.price
                ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
                : null;

            return (
              <div
                key={`${item.productId}-${item.variantId || idx}`}
                className="group relative bg-white border border-slate-200/90 hover:border-orange/60 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between shadow-2xs"
              >
                {/* Close / Cross Button (Myntra / Ajio Top-Right Floating Style) */}
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="absolute top-2 right-2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 backdrop-blur-xs flex items-center justify-center transition-all duration-150 shadow-2xs hover:scale-105 active:scale-90 cursor-pointer border border-slate-200/60"
                  title="Remove from Wishlist"
                  aria-label="Remove from Wishlist"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>

                {/* Boutique Partner Badge (Top-Left) */}
                {item.shopName && (
                  <div className="absolute top-2 left-2 z-10 max-w-[65%] px-1.5 sm:px-2 py-0.5 bg-white/90 backdrop-blur-xs rounded-md text-[8.5px] sm:text-[9.5px] font-extrabold text-navy border border-slate-200/60 flex items-center gap-1 shadow-2xs pointer-events-none truncate">
                    <Building2 className="w-2.5 h-2.5 text-orange shrink-0" />
                    <span className="truncate">{item.shopName}</span>
                  </div>
                )}

                {/* Image Container with Fashion Aspect Ratio */}
                <Link
                  href={productHref}
                  className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden block select-none cursor-pointer"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 bg-gradient-to-br from-slate-100 to-orange-50/20">
                      <Tag className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 text-center line-clamp-1">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* Variant info pill overlay on image bottom */}
                  {hasVariant && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs rounded-md text-[9px] text-white font-extrabold flex items-center justify-center pointer-events-none shadow-xs truncate">
                      <span className="truncate">
                        {[
                          item.selectedColor ? `Color: ${item.selectedColor}` : null,
                          item.selectedSize ? `Size: ${item.selectedSize}` : null,
                        ]
                          .filter(Boolean)
                          .join(' • ') || item.variantName}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Product Info Section (Compact, Clean, Professional Typography) */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1 bg-white">
                  <div>
                    {item.categoryName && (
                      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate leading-tight">
                        {item.categoryName}
                      </p>
                    )}
                    <Link href={productHref} className="block group/link">
                      <h2 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-1 group-hover/link:text-orange transition-colors leading-snug">
                        {item.name}
                      </h2>
                    </Link>

                    {/* Price row with discount badge */}
                    <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5 pt-0.5">
                      <span className="text-xs sm:text-sm font-black text-navy font-mono">
                        {formatPrice(item.price)}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-mono">
                          {formatPrice(item.compareAtPrice)}
                        </span>
                      )}
                      {discount && (
                        <span className="text-[9.5px] sm:text-[10px] font-black text-orange">
                          ({discount}% OFF)
                        </span>
                      )}
                    </div>
                  </div>

                  {item.inStock === false && (
                    <span className="text-[8.5px] font-black text-rose-600 uppercase tracking-tight">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Move to Bag Action Bar (Myntra/Ajio 1-click full-width bottom bar) */}
                <button
                  type="button"
                  onClick={() => handleMoveToCart(item)}
                  disabled={item.inStock === false}
                  className="w-full py-2 sm:py-2.5 bg-white hover:bg-orange text-orange hover:text-white border-t border-slate-100 font-black text-[10.5px] sm:text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/btn:scale-110" />
                  <span>Move to Bag</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
