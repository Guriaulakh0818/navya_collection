'use client';

import {
  Building2,
  ChevronRight,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useCartStore, useWishlistStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

export default function MultiVendorWishlistPage() {
  const { user } = useAuth();
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const addItemToCart = useCartStore((s) => s.addItem);

  const handleMoveToCart = async (item: any) => {
    await addItemToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      shopId: item.shopId || 'navya-boutique',
      shopName: item.shopName || 'Navya Collection Boutique',
      shopSlug: item.shopSlug || 'navya-collection',
      shopLogo: item.shopLogo,
    });

    await removeItem(item.productId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'My Wishlist' }]}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
        />
        <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Heart className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Login Required for Wishlist</h1>
          <p className="text-xs text-slate-500">
            Please log in to view and sync your saved boutique favorites across devices.
          </p>
          <Button
            className="mt-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 text-xs shadow-md"
            asChild
          >
            <Link href="/login">Login / Register →</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account', href: '/account' },
            { label: 'My Wishlist' },
          ]}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
        />
        <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Heart className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Your Wishlist is Empty</h1>
          <p className="text-xs text-slate-500">
            Explore luxury ethnic couture and save your favorite outfits from verified boutique
            stores.
          </p>
          <Button
            className="mt-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 text-xs shadow-md"
            asChild
          >
            <Link href="/shop">Browse Marketplace Stores</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'My Wishlist' },
        ]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
              <Heart className="w-7 h-7 text-amber-600 fill-amber-600" />
              Saved Boutique Favorites ({items.length})
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Items saved across verified partner boutique stores.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs"
            onClick={clearWishlist}
          >
            Clear Wishlist
          </Button>
        </div>

        {/* WISHLIST ITEMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-amber-500/50 hover:shadow-xl transition-all flex flex-col justify-between shadow-sm"
            >
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Tag className="w-12 h-12" />
                  </div>
                )}

                {/* Shop Badge Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-700 border border-slate-200 flex items-center gap-1 shadow-xs">
                  <Building2 className="w-3 h-3 text-amber-600" />
                  {item.shopName || 'Boutique Partner'}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white rounded-full transition-all shadow-xs"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-navy text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-extrabold text-amber-600 font-mono">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      In Stock
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleMoveToCart(item)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Move to Bag →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
