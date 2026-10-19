'use client';

import {
  Building2,
  ChevronRight,
  Heart,
  Layers,
  LogIn,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
} from 'lucide-react';
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
    toast(
      `Moved "${item.name}"${variantLabel ? ` (${variantLabel})` : ''} to your bag! 🛍️`,
      'success',
    );
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-10 w-72 bg-slate-200 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-slate-200 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state (both guest and logged-in)
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: user ? 'Account' : 'Explore', href: user ? '/account' : '/shop' },
            { label: 'My Wishlist' },
          ]}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
        />
        <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-sm">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Your Wishlist is Empty</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Discover verified boutique stores across India on JiivaaKart and save your favorite
            designer ethnic outfits, sarees, and handcrafted garments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              className="w-full sm:w-auto rounded-2xl bg-orange hover:bg-orange/90 text-white font-extrabold px-6 py-2.5 text-xs shadow-md shadow-orange/20 cursor-pointer"
              asChild
            >
              <Link href="/shop">Browse Marketplace Stores</Link>
            </Button>
            {!user && (
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-2xl border-slate-300 bg-white hover:bg-slate-100 text-navy font-bold px-6 py-2.5 text-xs cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: user ? 'Account' : 'Store', href: user ? '/account' : '/shop' },
          { label: 'My Wishlist' },
        ]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Guest Sync Banner if browsing without an account */}
        {!user && (
          <div className="rounded-2xl border border-orange/20 bg-gradient-to-r from-orange/10 via-amber-50 to-white p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-navy">
                  Guest Wishlist Active ({items.length} item{items.length === 1 ? '' : 's'})
                </p>
                <p className="text-[11px] text-slate-600">
                  Log in to save your wishlist permanently and access it across your phone and
                  laptop.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-navy hover:bg-navy-700 text-white font-extrabold text-xs px-4 py-2 shrink-0 cursor-pointer shadow-xs"
              asChild
            >
              <Link href="/login" className="flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                <span>Login to Sync</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Header Title & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-2.5">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500 fill-rose-500 shrink-0" />
              <span>Saved Boutique Favorites</span>
              <span className="text-xs sm:text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full">
                {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your saved favorites and selected variants across verified designer boutique stores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
              onClick={handleClear}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-orange hover:bg-orange/90 text-white text-xs font-extrabold shadow-xs cursor-pointer"
              asChild
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        {/* WISHLIST ITEMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, idx) => {
            const hasVariant = Boolean(item.selectedSize || item.selectedColor || item.variantName);
            const productHref = `/product/${item.slug || item.productId}`;

            return (
              <div
                key={`${item.productId}-${item.variantId || idx}`}
                className="group bg-white border border-slate-200 hover:border-orange rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-2xs"
              >
                {/* Image Container with Badges */}
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  <Link href={productHref} className="block w-full h-full cursor-pointer">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 bg-gradient-to-br from-slate-100 to-orange-50/20">
                        <Tag className="w-10 h-10 text-slate-300 mb-1" />
                        <span className="text-xs font-bold text-slate-400 text-center">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Shop Badge Pill (Top-Left) */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-navy border border-slate-200/80 flex items-center gap-1 shadow-2xs pointer-events-none">
                    <Building2 className="w-3 h-3 text-orange shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {item.shopName || 'Boutique Partner'}
                    </span>
                  </div>

                  {/* Remove Button (Top-Right) */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-rose-500 text-slate-600 hover:text-white rounded-full transition-all duration-150 shadow-xs cursor-pointer active:scale-90"
                    title="Remove from Wishlist"
                    aria-label="Remove from Wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Variant Badge overlay on image bottom */}
                  {hasVariant && (
                    <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-navy/85 backdrop-blur-md rounded-xl text-[10px] text-white font-extrabold flex items-center justify-between pointer-events-none shadow-xs">
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
                </div>

                {/* Product Info & Action */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <Link href={productHref} className="block group/link">
                      <h3 className="font-extrabold text-navy text-xs sm:text-sm line-clamp-2 group-hover/link:text-orange transition-colors">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-extrabold text-navy font-mono">
                          {formatPrice(item.price)}
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono">
                            {formatPrice(item.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.inStock !== false
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Move to Bag Button */}
                  <Button
                    type="button"
                    onClick={() => handleMoveToCart(item)}
                    disabled={item.inStock === false}
                    className="w-full py-2.5 sm:py-3 bg-orange hover:bg-orange/90 text-white font-extrabold text-xs rounded-xl sm:rounded-2xl transition-all shadow-md shadow-orange/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Move to Bag</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
