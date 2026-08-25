import { Building2, MapPin, ShieldCheck, ShoppingBag, Star, Store } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { HorizontalCarousel } from '@/frontend/components/ui/HorizontalCarousel';

interface FeaturedShopsGridProps {
  shops: any[];
}

export const FeaturedShopsGrid = React.memo(function FeaturedShopsGrid({
  shops,
}: FeaturedShopsGridProps) {
  if (!shops || shops.length === 0) return null;

  return (
    <HorizontalCarousel
      title="Featured Shops"
      subtitle="Handpicked, verified shops showcasing exclusive collections."
      icon={<Store className="w-5 h-5 text-amber-600" />}
      actionLink="/shop?view=shops"
      actionText="View All Shops"
      className="my-6 md:my-8"
    >
      {shops.map((shop, index) => {
        if (process.env.NODE_ENV !== 'production' && (!shop?.id || !shop?.name)) {
          console.error('⚠️ FeaturedShopCard rendered without valid shopId or name:', shop);
        }

        const productCount = shop._count?.products || 0;
        const bannerUrl = shop.banner || '/images/default-shop-banner.png';

        return (
          <Link
            key={shop.id}
            href={`/shop/${shop.slug}`}
            className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-amber-500/50 hover:shadow-xl transition-all shadow-xs flex flex-col justify-between w-[260px] xs:w-[285px] sm:w-[320px] shrink-0 snap-start"
          >
            {/* Cover Banner */}
            <div className="h-28 sm:h-32 bg-slate-900 relative overflow-hidden select-none">
              <Image
                src={bannerUrl}
                alt={shop.name || 'Vendor Shop'}
                fill
                priority={index < 2}
                sizes="(max-width: 640px) 280px, 320px"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none overflow-hidden [text-indent:-9999px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>

            {/* Profile Overlay & Info */}
            <div className="p-4 sm:p-5 -mt-8 relative z-10 space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-amber-500/40 overflow-hidden shrink-0 relative flex items-center justify-center shadow-md select-none">
                  {shop.logo ? (
                    <Image
                      src={shop.logo}
                      alt={shop.name}
                      fill
                      sizes="56px"
                      className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-amber-600" />
                  )}
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {shop.verificationBadge || 'VERIFIED'}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-navy text-sm sm:text-base group-hover:text-amber-600 transition-colors line-clamp-1">
                  {shop.name}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {shop.rating || 4.9}
                </span>

                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {shop.city || 'Hisar'}
                </span>

                <span className="flex items-center gap-1 font-extrabold text-slate-800">
                  <ShoppingBag className="w-3 h-3 text-amber-600" />
                  {productCount} Items
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </HorizontalCarousel>
  );
});
