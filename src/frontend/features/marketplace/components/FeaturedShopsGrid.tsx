import {
  Building2,
  ChevronRight,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedShopsGridProps {
  shops: any[];
}

export const FeaturedShopsGrid = React.memo(function FeaturedShopsGrid({
  shops,
}: FeaturedShopsGridProps) {
  if (!shops || shops.length === 0) return null;

  return (
    <section className="space-y-6 my-12">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
              Featured Shops
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Handpicked, verified shops showcasing exclusive collections.
          </p>
        </div>

        <Link
          href="/shop?view=shops"
          className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 group"
        >
          View All Shops{' '}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop, index) => {
          const productCount = shop._count?.products || 0;

          return (
            <Link
              key={shop.id}
              href={`/shop/${shop.slug}`}
              className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-amber-500/50 hover:shadow-2xl transition-all shadow-sm flex flex-col justify-between"
            >
              {/* Cover Banner (Permanent Brand Image) */}
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
                    {shop.verificationBadge || 'VERIFIED'}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-navy text-base group-hover:text-amber-600 transition-colors line-clamp-1">
                    {shop.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
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
    </section>
  );
});
